import {
    createAdminClient,
    createTestUser,
    deleteTestUser,
    readRealtimeFixtureEnv,
    type RealtimeFixtureEnv,
    type TestUser
} from "./realtime-supabase";

/**
 * Per-test fixtures for the @realtime suite. Composes the user-lifecycle
 * helpers with workspace + membership + account seeding so a single
 * `setupRealtimeFixtures()` call returns everything a test needs to
 * exercise the realtime path end-to-end:
 *
 *   - A signed-in ephemeral user
 *   - A workspace owned by that user
 *   - One account in that workspace (provides a valid FK target for
 *     subsequent signals inserts)
 *   - Cleanup function that tears down EVERYTHING (cascade-deletes
 *     the workspace, kills the user)
 *
 * Service-role bypass: all setup writes go through the admin client,
 * so RLS doesn't gate the seed step. The test itself runs as the
 * user via the browser context's session.
 *
 * Idempotency: each call uniquifies emails + account names with a
 * timestamp+random suffix. Parallel test runs don't collide.
 */

export interface RealtimeFixtures {
    readonly env: RealtimeFixtureEnv;
    readonly user: TestUser;
    readonly workspaceId: string;
    readonly accountId: string;
    readonly accountName: string;
    /** Tear down everything created by this fixture. Idempotent + safe. */
    readonly cleanup: () => Promise<void>;
}

/**
 * Create an isolated test environment: user + workspace + account.
 * Throws if env vars are missing — caller should `test.skip()` first
 * via hasRealtimeFixturesEnv().
 */
export async function setupRealtimeFixtures(): Promise<RealtimeFixtures> {
    const env = readRealtimeFixtureEnv();
    if (!env) {
        throw new Error(
            "setupRealtimeFixtures called without env vars set. " +
                "Use hasRealtimeFixturesEnv() to gate."
        );
    }
    const user = await createTestUser(env, { emailPrefix: "realtime-sc" });
    const admin = createAdminClient(env);

    // 1. Create a workspace owned by the test user.
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const workspaceName = `realtime-test-${suffix}`;
    const { data: ws, error: wsErr } = await admin
        .from("workspaces")
        .insert({
            name: workspaceName,
            owner_id: user.id
        })
        .select("id")
        .single();
    if (wsErr || !ws) {
        await deleteTestUser(env, user.id);
        throw new Error(`workspace insert failed: ${wsErr?.message}`);
    }
    const workspaceId = ws.id;

    // 2. Add the test user as a workspace member (owner role).
    const { error: memberErr } = await admin.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: "owner"
    });
    if (memberErr) {
        await admin.from("workspaces").delete().eq("id", workspaceId);
        await deleteTestUser(env, user.id);
        throw new Error(`workspace_members insert failed: ${memberErr.message}`);
    }

    // 3. Create one account in the workspace (FK target for signals).
    const accountName = `Acme Realtime ${suffix}`;
    const { data: acc, error: accErr } = await admin
        .from("signal_console_accounts")
        .insert({
            account_key: `acme-realtime-${suffix}`,
            account_name: accountName,
            workspace_id: workspaceId,
            user_id: user.id,
            data: {}
        })
        .select("id")
        .single();
    if (accErr || !acc) {
        await admin.from("workspaces").delete().eq("id", workspaceId);
        await deleteTestUser(env, user.id);
        throw new Error(
            `signal_console_accounts insert failed: ${accErr?.message}`
        );
    }
    const accountId = acc.id;

    // Compose cleanup. Order matters: signals FK to accounts, accounts
    // FK to workspace, workspace_members FK to both. Cascade-delete from
    // workspaces handles all the dependents; user_delete cleans auth.
    const cleanup = async (): Promise<void> => {
        try {
            await admin.from("workspaces").delete().eq("id", workspaceId);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(
                `[realtime-fixtures] workspace cleanup failed: ${(e as Error).message}`
            );
        }
        await deleteTestUser(env, user.id);
    };

    return {
        env,
        user,
        workspaceId,
        accountId,
        accountName,
        cleanup
    };
}
