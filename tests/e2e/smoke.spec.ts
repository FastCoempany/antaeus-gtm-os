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

        const returnPath = encodeURIComponent("/app/dashboard/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/app\/dashboard\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        // Dashboard must not have thrown any runtime errors during boot.
        expect(errors, `page errors during boot:\n${errors.join("\n")}`).toEqual([]);
    });

    test("discovery-studio loads with seeded demo data", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        const returnPath = encodeURIComponent("/app/discovery-studio/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/app\/discovery-studio\//, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");

        // Core Discovery Studio contract rails must be present in the DOM.
        // These are the invariants Waves 1-4 established; smoke test ensures
        // they don't silently disappear as other refactors happen.
        await expect(page.locator(".dsj-framework-btn").first()).toBeVisible();
        await expect(page.locator(".dsj-jump-btn").first()).toBeVisible();
        await expect(page.locator("#dsjNextStepDocket")).toBeVisible();
        await expect(page.locator("#dsjLedgerStrip")).toBeVisible();

        expect(errors, `page errors during boot:\n${errors.join("\n")}`).toEqual([]);
    });

    test("deal-workspace loads with seeded demo data", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        const returnPath = encodeURIComponent("/app/deal-workspace/?demo=1&qa=1");
        await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`);

        await page.waitForURL(/\/app\/deal-workspace\//, { timeout: 20_000 });
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
        await expect(page.locator(".dw-bridge")).toBeAttached();
        await expect(page.locator(".dw-recovery")).toBeAttached();
        await expect(page.locator(".dw-filter-bar")).toBeAttached();
        await expect(page.locator(".dw-intervention")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 2 Wave 1 — /dashboard/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact Dashboard at /dashboard/ (distinct from the
        // legacy /app/dashboard/). Wave 1 ships the structural shell
        // — placeholder mode views, working ModeSwitcher, default
        // mode = spotlight. Smoke test asserts: page loads without
        // runtime errors, the topbar kicker reads DASHBOARD, the
        // mode switcher attaches with all three buttons, and the
        // default Spotlight view renders.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/dashboard/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".db-topbar__kicker")).toContainText(
            "DASHBOARD"
        );
        await expect(page.locator(".db-mode-switcher")).toBeAttached();
        await expect(page.locator(".db-mode-switcher__btn")).toHaveCount(3);
        await expect(page.locator(".db-spotlight")).toBeAttached();

        expect(
            errors,
            `page errors during boot:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("Phase 4 / Room 3 Wave 1 — /signal-console/ Preact rebuild boots cleanly", async ({
        page
    }) => {
        // The new Preact Signal Console at /signal-console/ (distinct
        // from the legacy /app/signal-console/). Wave 1 ships the
        // structural shell — empty account list shows the empty-state
        // copy, all sections render. Smoke test asserts: page loads
        // without runtime errors, the topbar kicker reads SIGNAL CONSOLE,
        // grid controls + grid attach to the DOM.
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/signal-console/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".sc-topbar__kicker")).toContainText(
            "SIGNAL CONSOLE"
        );
        await expect(page.locator(".sc-grid-controls")).toBeAttached();
        await expect(page.locator(".sc-grid")).toBeAttached();

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

        await expect(page.locator(".cc-topbar__kicker")).toContainText(
            "CALLS FAMILY"
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
            "OUTBOUND CHANNEL"
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
            "CALLS FAMILY"
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
            "Advisor Deploy"
        );
        await expect(page.locator(".ad-desk")).toBeAttached();
        await expect(page.locator(".ad-secondary")).toBeAttached();

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

        await expect(page.locator(".wel-hero__kicker")).toContainText(
            "Threshold"
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
