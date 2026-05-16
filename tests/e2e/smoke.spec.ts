import { test, expect } from "@playwright/test";

/**
 * Phase 1.2 smoke tests.
 *
 * Purpose: verify that rooms load successfully through the bootstrap flow
 * without runtime errors. These are NOT functional tests — they assert the
 * app boots cleanly, not that any specific feature works. Functional E2E
 * tests land per-room starting in Phase 3 (Discovery Studio migration).
 *
 * The bootstrap flow uses the existing demo-seed mechanism:
 *   /demo-seed.html?autoseed=mm&return=<roomPath>
 * which seeds localStorage with mid-market demo data and redirects to the
 * requested room. Identical to what tools/qa/capture-demo-room.js uses.
 */
test.describe("room boot smoke tests", () => {
    test("dashboard loads with seeded demo data", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        // Phase 4 deletion sweep retired /app/dashboard/ in PR #45 —
        // legacy path now redirects to /dashboard/. Demo seed flows
        // through the redirect stub, then the new Preact Dashboard
        // boots from /dashboard/.
        const returnPath = encodeURIComponent("/dashboard/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/dashboard\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        // Dashboard must not have thrown any runtime errors during boot.
        expect(errors, `page errors during boot:\n${errors.join("\n")}`).toEqual([]);
    });

    test("discovery-studio loads with seeded demo data", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        const returnPath = encodeURIComponent("/discovery-studio/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/discovery-studio\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        // Core Discovery Studio contract rails must be present in the DOM.
        // These are the invariants the Phase 3 rebuild established; smoke
        // test ensures they don't silently disappear as other refactors
        // happen. PR #45 retired the legacy `/app/discovery-studio/` (which
        // exposed `dsj-*` markers) and routes through the new Preact room
        // at `/discovery-studio/` whose markers use the `ds-*` prefix.
        await expect(page.locator(".ds-framework-rail__btn").first()).toBeVisible();
        await expect(page.locator(".ds-segment-rail")).toBeVisible();
        await expect(page.locator(".ds-next-step-docket")).toBeVisible();
        await expect(page.locator(".ds-learned-truth-ledger")).toBeVisible();

        expect(errors, `page errors during boot:\n${errors.join("\n")}`).toEqual([]);
    });

    test("deal-workspace loads with seeded demo data", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        const returnPath = encodeURIComponent("/deal-workspace/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/deal-workspace\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        expect(errors, `page errors during boot:\n${errors.join("\n")}`).toEqual([]);
    });

    test("Phase 4 Wave 1 — /deal-workspace/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact room at /deal-workspace/ (distinct from the
        // legacy /app/deal-workspace/). Wave 1 ships the structural
        // shell — empty deal list shows the empty-state copy, all
        // sections render. Smoke test asserts: page loads without
        // runtime errors, the topbar kicker reads WAVE 1, all sections
        // attach to the DOM.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/deal-workspace/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".dw-topbar__kicker")).toContainText(
            "DEAL WORKSPACE"
        );
        // Deal Workspace audit (2026-05) retired the Spine left rail
        // (pure decoration). Room is now single-column: chrome
        // (wordmark) + topbar + stage-grid (Hero + TargetFolio) +
        // MicroGrid + LaneGrid + FilterBar. DealList renders below
        // FilterBar when there are deals.
        await expect(page.locator(".dw-stage-grid")).toBeAttached();
        await expect(page.locator(".dw-hero")).toBeAttached();
        await expect(page.locator(".dw-target-folio")).toBeAttached();
        await expect(page.locator(".dw-micro-grid")).toBeAttached();
        await expect(page.locator(".dw-lane-grid")).toBeAttached();
        await expect(page.locator(".dw-filter-bar")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 2 Wave 1 — /dashboard/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // Dashboard audit (2026-05) changed this surface materially:
        //   - First-time default mode is now "brief" (was "spotlight").
        //   - On a truly empty workspace, every mode view is replaced
        //     by the EmptyDashboard orientation surface (3 paths into
        //     Sourcing / Signal Console / Deal Workspace).
        // Smoke test asserts: page loads cleanly, topbar kicker reads
        // DASHBOARD, the mode switcher mounts with all 3 buttons, and
        // the empty-state orientation surface attaches.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/dashboard/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".db-topbar__kicker")).toContainText(
            "DASHBOARD"
        );
        await expect(page.locator(".db-mode-switcher")).toBeAttached();
        await expect(page.locator(".db-mode-switcher__btn")).toHaveCount(3);
        await expect(page.locator(".db-empty")).toBeAttached();
        await expect(page.locator(".db-empty__path")).toHaveCount(3);

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 3 Wave 1 — /signal-console/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // Signal Console audit (2026-05) reshaped the empty state:
        //   - Empty workspace hides WorkspaceHealth + GridControls
        //   - Empty-state hero card (.sc-empty) mounts with embedded
        //     AddAccountForm as dominant CTA
        //   - BackButton + subtitle retired
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/signal-console/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".sc-topbar__kicker")).toContainText(
            "SIGNAL CONSOLE"
        );
        await expect(page.locator(".sc-grid")).toBeAttached();
        await expect(page.locator(".sc-empty")).toBeAttached();
        await expect(page.locator(".sc-add-form--embedded")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 4 Wave 1 — /future-autopsy/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact Future Autopsy at /future-autopsy/ (distinct
        // from the legacy /app/future-autopsy/). Wave 1 ships the
        // structural shell — empty deal universe shows the empty state,
        // all sections render. Smoke test asserts: page loads without
        // runtime errors, the topbar kicker reads FUTURE AUTOPSY, the
        // pinned-case panel + ledger attach to the DOM.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/future-autopsy/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".fa-topbar__kicker")).toContainText(
            "FUTURE AUTOPSY"
        );
        await expect(page.locator(".fa-pinned")).toBeAttached();
        await expect(page.locator(".fa-ledger")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 5 Wave 1 — /poc-framework/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact PoC Framework at /poc-framework/ (distinct
        // from the legacy /app/poc-framework/). Wave 1 ships the
        // structural shell — empty proof list, dark forge / cream cast
        // split stage. Smoke test asserts: page loads without runtime
        // errors, the topbar kicker reads POC FRAMEWORK, both forge
        // and cast panels attach to the DOM.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/poc-framework/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".poc-topbar__kicker")).toContainText(
            "POC FRAMEWORK"
        );
        await expect(page.locator(".poc-forge")).toBeAttached();
        await expect(page.locator(".poc-cast")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 6 Wave 1 — /outbound-studio/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/outbound-studio/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ob-topbar__kicker")).toContainText(
            "OUTBOUND STUDIO"
        );
        await expect(page.locator(".ob-switchboard")).toBeAttached();
        await expect(page.locator(".ob-output")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 7 Wave 1 — /cold-call-studio/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/cold-call-studio/");
        await page.waitForLoadState("networkidle");

        // Cold Call Studio audit (2026-05): kicker copy changed
        // from "Calls family · Live instrument" (internal arch
        // language) to the standard "COLD CALL STUDIO · N calls
        // logged" pattern.
        await expect(page.locator(".cc-topbar__kicker")).toContainText(
            "COLD CALL STUDIO"
        );
        await expect(page.locator(".cc-account-row")).toBeAttached();
        await expect(page.locator(".cc-loom")).toBeAttached();
        await expect(page.locator(".cc-memory")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 8 Wave 1 — /linkedin-playbook/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/linkedin-playbook/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".lp-topbar__kicker")).toContainText(
            "Outbound channel"
        );
        await expect(page.locator(".lp-booth")).toBeAttached();
        await expect(page.locator(".lp-ledger")).toBeAttached();
        await expect(page.locator(".lp-method")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 9 Wave 1 — /call-planner/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/call-planner/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".cp-topbar__kicker")).toContainText(
            "Calls family"
        );
        await expect(page.locator(".cp-witness")).toBeAttached();
        await expect(page.locator(".cp-spine")).toBeAttached();
        await expect(page.locator(".cp-quality")).toBeAttached();
        await expect(page.locator(".cp-handoff")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 10 Wave 1 — /advisor-deploy/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/advisor-deploy/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ad-topbar__kicker")).toContainText(
            "Backchannel desk"
        );
        await expect(page.locator(".ad-desk")).toBeAttached();
        await expect(page.locator(".ad-secondary")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 11 Wave 1 — /icp-studio/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/icp-studio/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".icp-hero__kicker")).toContainText(
            "ICP STUDIO"
        );
        await expect(page.locator(".icp-hero")).toBeAttached();
        await expect(page.locator(".icp-work")).toBeAttached();
        await expect(page.locator(".icp-analytics")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 13 Wave 1 — /sourcing-workbench/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/sourcing-workbench/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".sw-topbar__kicker")).toContainText(
            "Research loom"
        );
        await expect(page.locator(".sw-querystudio")).toBeAttached();
        await expect(page.locator(".sw-prospect-composer")).toBeAttached();
        await expect(page.locator(".sw-kanban")).toBeAttached();
        await expect(page.locator(".sw-handoff")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 14 Wave 1 — /quota-workback/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/quota-workback/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".qw-topbar__kicker")).toContainText(
            "Planning board"
        );
        await expect(page.locator(".qw-cov")).toBeAttached();
        await expect(page.locator(".qw-health")).toBeAttached();
        await expect(page.locator(".qw-form")).toBeAttached();
        await expect(page.locator(".qw-plan")).toBeAttached();
        await expect(page.locator(".qw-handoff")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 15 Wave 1 — /settings/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/settings/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".st-topbar__kicker")).toContainText(
            "SETTINGS"
        );
        await expect(page.locator(".st-grid")).toBeAttached();
        // Six cards: CloudSync (PR #43) + Backup + Category + Demo + Role
        // + DeleteCloudData (PR #69, 2026-05-15).
        await expect(page.locator(".st-card")).toHaveCount(6);

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 16 Wave 1 — /welcome/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/welcome/");
        await page.waitForLoadState("networkidle");

        // First-90-seconds audit retired the "Threshold" kicker
        // (internal architecture language). Wordmark chrome replaces
        // it; assert the brand mark is mounted instead.
        await expect(page.locator(".ant-wordmark__mark")).toContainText(
            "ANTAEUS"
        );
        await expect(page.locator(".wel-ladder")).toBeAttached();
        await expect(page.locator(".wel-actions")).toBeAttached();
        await expect(page.locator(".wel-ms")).toHaveCount(4);

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 17 Wave 1 — /onboarding/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/onboarding/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ob-progress__kicker")).toBeAttached();
        await expect(page.locator(".ob-step__title")).toBeVisible();
        await expect(page.locator(".ob-step__kicker")).toContainText("Welcome");

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 3 Wave 2 — /discovery-studio/ Preact rebuild boots and loads frameworks", async ({
        page
    }) => {
        // The new Preact room at /discovery-studio/ (distinct from the
        // legacy /app/discovery-studio/). Wave 2 loads the 9 legacy
        // framework runtimes via <script> tags + projects them into the
        // typed registry. Smoke test asserts: page loads without runtime
        // errors, all 7 rail roots render, and the framework rail
        // displays at least one button (proves loadFrameworks() ran).
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/discovery-studio/");
        await page.waitForLoadState("networkidle");

        // Wave 2 markers
        await expect(page.locator(".ds-topbar__kicker")).toContainText(
            "DISCOVERY STUDIO · WAVE"
        );
        await expect(page.locator(".ds-framework-rail")).toBeAttached();
        await expect(page.locator(".ds-segment-rail")).toBeAttached();
        await expect(page.locator(".ds-recover-rail")).toBeAttached();
        await expect(page.locator(".ds-learned-truth-ledger")).toBeAttached();
        await expect(page.locator(".ds-worked-memory")).toBeAttached();
        await expect(page.locator(".ds-next-step-docket")).toBeAttached();
        await expect(page.locator(".ds-support-dossier")).toBeAttached();

        // Wave 2: at least one framework button rendered (proves the
        // legacy <script> tags loaded + loadFrameworks() projected the
        // global into the typed registry). Expect 9 frameworks in prod.
        await expect(page.locator(".ds-framework-rail__btn").first()).toBeVisible();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 3 of ADR-003 — /negotiation/ Preact greenfield boots cleanly", async ({
        page
    }) => {
        // The new Negotiation room (canon §4.16b → live room). Greenfield
        // from rewritten mind. Smoke test asserts: page loads without
        // runtime errors, the topbar kicker reads "Negotiation desk",
        // route rack + position rack + ladder + pushback sheet + outcome
        // rack all attach.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/negotiation/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ng-topbar__kicker")).toContainText(
            "Negotiation desk"
        );
        await expect(page.locator(".ng-route-rack")).toBeAttached();
        await expect(page.locator(".ng-positions")).toBeAttached();
        await expect(page.locator(".ng-ladder")).toBeAttached();
        await expect(page.locator(".ng-pushbacks")).toBeAttached();
        await expect(page.locator(".ng-outcome")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 5.B Wave 1 — /founding-gtm/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact Founding GTM at /founding-gtm/ (distinct from
        // the legacy /app/founding-gtm/ aggregator). Wave 1 ships the
        // structural shell — seven section frames with canonical
        // titles + empty-state copy. Smoke test asserts: page loads
        // without runtime errors, the topbar kicker reads FOUNDING GTM,
        // the maturity band attaches, and all 7 sections render.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/founding-gtm/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".fg-topbar__kicker")).toContainText(
            "FOUNDING GTM"
        );
        await expect(page.locator(".fg-maturity")).toBeAttached();
        await expect(page.locator(".fg-section")).toHaveCount(7);

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 12 Wave 1 — /territory-architect/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/territory-architect/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ta-hero__kicker")).toContainText(
            "TERRITORY ARCHITECT"
        );
        await expect(page.locator(".ta-hero")).toBeAttached();
        await expect(page.locator(".ta-block").first()).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });
});
