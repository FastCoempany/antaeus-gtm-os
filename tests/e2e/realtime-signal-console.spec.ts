import { test, expect, type BrowserContext } from "@playwright/test";
import {
    createAdminClient,
    hasRealtimeFixturesEnv
} from "./helpers/realtime-supabase";
import {
    setupRealtimeFixtures,
    type RealtimeFixtures
} from "./helpers/realtime-fixtures";
import { createSignedInContext } from "./helpers/realtime-auth-context";

/**
 * Realtime end-to-end walk (Step 4 / Tier 1 / Signal Console).
 *
 * Verifies the full realtime path:
 *   1. Test user + workspace + account are seeded via Auth Admin +
 *      service-role writes
 *   2. Browser context boots /signal-console/ with the test user's
 *      JWT pre-injected into localStorage
 *   3. cloud-persistence subscribes to `signals` table realtime
 *   4. Direct INSERT into `signals` via the service-role client
 *      (simulates "another tab" / heartbeat / external write)
 *   5. The subscribed page's DOM updates within 5 seconds — proving
 *      the realtime channel + applySignalsRealtimePayload + state
 *      mutators + render path all work end-to-end
 *
 * Skips cleanly when the realtime env vars aren't set (local dev
 * without Supabase, or any branch where SUPABASE_SERVICE_ROLE_KEY
 * hasn't been wired). The data-parity CI workflow sets all three
 * required env vars from the ephemeral branch's connection details.
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Step 4"
 * Ref: .github/workflows/data-parity-ci.yml §"Realtime cross-tab tests"
 * Ref: PR #147 (Step 4 — the code path this test exercises)
 */

const HAS_ENV = hasRealtimeFixturesEnv();

test.describe("Signal Console — realtime @realtime", () => {
    let fixtures: RealtimeFixtures | null = null;
    let ctx: BrowserContext | null = null;

    test.skip(!HAS_ENV, "realtime env vars not set (skipping)");

    test.beforeAll(async ({ browser }) => {
        if (!HAS_ENV) return;
        fixtures = await setupRealtimeFixtures();
        ctx = await createSignedInContext(browser, fixtures.user);
    });

    test.afterAll(async () => {
        if (ctx) {
            await ctx.close();
            ctx = null;
        }
        if (fixtures) {
            await fixtures.cleanup();
            fixtures = null;
        }
    });

    test("signal inserted via service-role appears in the room within 5s", async () => {
        if (!fixtures || !ctx) {
            throw new Error("fixtures not initialized");
        }

        const page = await ctx.newPage();
        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        // Boot the room. Flag-redirect for room_signal_console_v2 is
        // honored — if your test branch hasn't enabled it, the legacy
        // path renders. Either way, the realtime subscriptions are
        // wired by main.tsx → bootCloudPersistence.
        await page.goto("/signal-console/?qa=1");
        await page.waitForLoadState("networkidle");

        // Give the cloud-persistence boot a moment to:
        //   - list signal_console_accounts (sees the seeded account)
        //   - subscribe to signals realtime
        // bootCloudPersistence is fire-and-forget after render, so we
        // wait for the seeded account name to appear in the DOM as the
        // proxy signal that boot completed.
        await expect(page.getByText(fixtures.accountName)).toBeVisible({
            timeout: 15_000
        });

        // Insert a signal directly via service-role. This simulates a
        // mutation from another tab / from the heartbeat generator —
        // anything that's NOT the local client's own dual-write. The
        // realtime channel should deliver it.
        const admin = createAdminClient(fixtures.env);
        const uniqueHeadline = `Realtime probe ${Date.now()}`;
        const { error: insertErr } = await admin.from("signals").insert({
            account_id: fixtures.accountId,
            workspace_id: fixtures.workspaceId,
            headline: uniqueHeadline,
            signal_type: "trigger_event",
            confidence: 0.85,
            is_ai: false,
            flagged: false,
            published_date: new Date().toISOString(),
            fetched_at: new Date().toISOString()
        });
        expect(insertErr, `signals insert failed: ${insertErr?.message}`).toBeNull();

        // The cloud-persistence subscriber listens on
        // client.signals.subscribe(...). The INSERT payload routes
        // through applySignalsRealtimePayload → addSignalToAccount →
        // allAccounts signal updates → preact re-renders the account
        // card. The signal headline shows up in the DOM.
        await expect(page.getByText(uniqueHeadline)).toBeVisible({
            timeout: 5_000
        });

        expect(
            pageErrors,
            `page errors during realtime walk:\n${pageErrors.join("\n")}`
        ).toEqual([]);

        await page.close();
    });
});
