import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database-helpers";

/**
 * Realtime-test Supabase utilities.
 *
 * The full cross-tab / direct-write realtime tests need three things
 * that the rest of the Playwright suite doesn't:
 *
 *   1. A signed-in user (RLS on signals + signal_console_accounts
 *      requires `is_workspace_member(workspace_id)` to be true; that
 *      requires `auth.uid()` to be set)
 *   2. A workspace + membership for that user
 *   3. The ability to insert rows on behalf of that user (or via the
 *      service role) without bouncing through the UI
 *
 * This module owns the lifecycle of a per-test "ephemeral user" — created
 * via Supabase Auth Admin (service-role JWT), torn down in afterAll.
 *
 * Env vars required:
 *   VITE_SUPABASE_URL          (already set in workflow + local dev)
 *   VITE_SUPABASE_ANON_KEY     (already set; used by the signed-in
 *                                browser context for normal user ops)
 *   SUPABASE_SERVICE_ROLE_KEY  (NEW; extracted in the data-parity-ci
 *                                workflow from `supabase branches get`
 *                                JSON output; locally pulled from
 *                                Supabase dashboard if you want to run
 *                                the @realtime suite against a dev branch)
 *
 * When any env var is missing, hasRealtimeFixturesEnv() returns false
 * and the @realtime tests skip cleanly (no surprise failures on local
 * dev without Supabase).
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Step 4"
 */

export interface RealtimeFixtureEnv {
    readonly supabaseUrl: string;
    readonly anonKey: string;
    readonly serviceRoleKey: string;
}

/**
 * Read realtime-fixture env vars. Returns null when any required var
 * is missing — callers should `test.skip()` in that case.
 */
export function readRealtimeFixtureEnv(): RealtimeFixtureEnv | null {
    const supabaseUrl =
        process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anonKey =
        process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return null;
    return { supabaseUrl, anonKey, serviceRoleKey };
}

export function hasRealtimeFixturesEnv(): boolean {
    return readRealtimeFixtureEnv() !== null;
}

/**
 * Create a service-role client that BYPASSES RLS. Use exclusively for
 * test-fixture setup (user creation, workspace seeding, signal inserts
 * that simulate "another tab"). NEVER use this in production code.
 */
export function createAdminClient(env: RealtimeFixtureEnv): SupabaseClient<Database> {
    return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

/**
 * Create an anon-key client that follows RLS as the signed-in user.
 * Used by the test to verify what the in-browser room would see.
 */
export function createAnonClient(env: RealtimeFixtureEnv): SupabaseClient<Database> {
    return createClient<Database>(env.supabaseUrl, env.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

// ─── Test-user lifecycle ───────────────────────────────────────────────

export interface TestUser {
    readonly id: string;
    readonly email: string;
    readonly password: string;
    readonly accessToken: string;
    readonly refreshToken: string;
}

/**
 * Create a fresh ephemeral user via Supabase Auth Admin, then sign in
 * to get a JWT. Returns the user record + credentials + tokens so the
 * test can inject them into a Playwright context's localStorage.
 *
 * Email is uniquified per call to avoid collisions across parallel
 * test runs / retries.
 */
export async function createTestUser(
    env: RealtimeFixtureEnv,
    opts: { emailPrefix?: string } = {}
): Promise<TestUser> {
    const admin = createAdminClient(env);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `${opts.emailPrefix ?? "realtime-test"}+${suffix}@antaeus.test`;
    const password = `Pw${suffix}!aB`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    if (createErr) {
        throw new Error(`createUser failed: ${createErr.message}`);
    }
    const userId = created.user?.id;
    if (!userId) throw new Error("createUser returned no user id");

    // Sign in via password to get JWT for browser context injection.
    const anon = createAnonClient(env);
    const { data: session, error: signInErr } =
        await anon.auth.signInWithPassword({ email, password });
    if (signInErr || !session.session) {
        throw new Error(
            `signIn failed for ${email}: ${signInErr?.message ?? "no session"}`
        );
    }
    return {
        id: userId,
        email,
        password,
        accessToken: session.session.access_token,
        refreshToken: session.session.refresh_token
    };
}

/**
 * Delete a test user via Auth Admin. Best-effort — failures are
 * logged but never thrown so afterAll cleanup doesn't fail the
 * suite.
 */
export async function deleteTestUser(
    env: RealtimeFixtureEnv,
    userId: string
): Promise<void> {
    const admin = createAdminClient(env);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
        // eslint-disable-next-line no-console
        console.warn(
            `[realtime-fixtures] deleteTestUser(${userId}) failed:`,
            error.message
        );
    }
}
