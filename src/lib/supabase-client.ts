import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Antaeus Supabase client factory.
 *
 * One client per page load, memoized. The client carries auth state in
 * localStorage (Supabase's default) so a navigation or reload preserves
 * the session. Tests inject a mock via `__setSupabaseClientForTests`.
 *
 * Environment:
 *   VITE_SUPABASE_URL       — Full project URL, e.g. https://wjdqmgxwulqxxxnyuzyl.supabase.co
 *   VITE_SUPABASE_ANON_KEY  — Public anon key. Safe for the client bundle
 *                             because RLS policies (Phase 2.1) gate actual
 *                             data access on workspace membership.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.2
 */

export type AntaeusSupabaseClient = SupabaseClient<Database>;

let cachedClient: AntaeusSupabaseClient | null = null;

export function getSupabaseClient(): AntaeusSupabaseClient {
    if (cachedClient) return cachedClient;

    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Supabase client requested but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. " +
            "Set both in your .env.local (dev) or in Cloudflare Workers Builds env vars (prod). " +
            "See .env.example."
        );
    }

    cachedClient = createClient<Database>(url, anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Supabase's default storage is window.localStorage. Kept explicit
            // so anyone reading this knows where the session lives.
            storageKey: "antaeus-supabase-auth"
        },
        // Realtime is used by data-client subscribe(). Phase 2.2 turns it on.
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        },
        // Global fetch options: keep defaults. Per-query retries are cheaper
        // at the data-client layer where we know the semantic intent.
        global: {
            headers: {
                "x-antaeus-client": "web"
            }
        }
    });

    return cachedClient;
}

/**
 * Tests inject a mock client here. Production code MUST NOT call this.
 * The leading __ is a convention signaling "test-only; do not use."
 */
export function __setSupabaseClientForTests(mock: AntaeusSupabaseClient | null): void {
    cachedClient = mock;
}

/**
 * Reset the cached client. Called by tests between cases.
 */
export function __resetSupabaseClientForTests(): void {
    cachedClient = null;
}
