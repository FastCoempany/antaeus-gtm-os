import { test, expect } from "@playwright/test";

/**
 * First @realtime-tagged Playwright walk (Step 4 / Tier 1 / Signal
 * Console flip-read per ADR-005).
 *
 * The data-parity CI workflow (`.github/workflows/data-parity-ci.yml`)
 * runs `npm run test:realtime` against a per-PR ephemeral Supabase
 * branch with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set in
 * the workflow env. Tests tagged `@realtime` get picked up by the
 * `playwright test --grep @realtime` filter.
 *
 * Until this PR, no `@realtime` tests existed — the workflow ran
 * `--pass-with-no-tests` and skipped silently. This file is the
 * first occupant of that surface.
 *
 * What this test does today (Step 4 minimum):
 *   - Boot the Signal Console room with demo data
 *   - Assert the room renders without runtime errors
 *   - Assert no errors fire during the 5-second realtime-window grace
 *     period (a regression on subscribe wiring would surface as a
 *     console error or pageerror during this window)
 *
 * What this test will do later (Step 4 / Wave 2 follow-up):
 *   - Spin up two browser contexts authenticated as the same user
 *   - Insert a row into `signals` table via the data-client in tab A
 *   - Assert the new signal appears in tab B's DOM within 5 seconds
 *
 * The auth + per-PR-branch row-seeding scaffolding for the full
 * cross-tab walk is its own follow-up — gathering credentials, RLS
 * policies on the ephemeral branch, etc. Tracked as a follow-up
 * issue. The skeleton here greens out the CI workflow and proves the
 * `@realtime` tag picks up tests so subsequent retrofit rooms can
 * copy the pattern.
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Step 4"
 * Ref: .github/workflows/data-parity-ci.yml §"Realtime cross-tab tests"
 */

test.describe("Signal Console — realtime cross-tab @realtime", () => {
    test("@realtime signal-console boots without subscribe-time errors", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));
        page.on("console", (msg) => {
            if (msg.type() === "error") errors.push(msg.text());
        });

        const returnPath = encodeURIComponent("/signal-console/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/signal-console\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        // Give the realtime subscriptions a 5-second window to fail. If
        // `subscribeSignalsRealtime` or the accounts channel throws on
        // subscribe (RLS misconfiguration, missing publication, env-var
        // mismatch), the error surfaces inside this window — typically
        // as an unhandled rejection from the @supabase/supabase-js
        // realtime channel state machine.
        await page.waitForTimeout(5_000);

        // Filter known noise from the demo-seed boot flow. In CI's
        // ephemeral-branch environment with no rows + no auth, some
        // expected warnings fire (no Supabase session, no workspace) —
        // those are not realtime failures.
        const realtimeErrors = errors.filter(
            (e) =>
                !e.includes("VITE_SUPABASE") &&
                !e.includes("Failed to load resource") &&
                !e.includes("[signal-console] Cloud sync disabled")
        );
        expect(
            realtimeErrors,
            `realtime-window errors during boot:\n${realtimeErrors.join("\n")}`
        ).toEqual([]);
    });
});
