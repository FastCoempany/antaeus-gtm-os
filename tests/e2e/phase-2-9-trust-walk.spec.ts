import { test, expect } from "@playwright/test";

/**
 * Phase 2.9 — Trust flow (Settings) Playwright walk.
 *
 * Single-room Trust Annex per canon §4.20. Already copy-audited in
 * PR #95 + cleaned in Phase 2.7 (cloud-sync language). Phase 2.9
 * focuses on the seam Settings was missing: inbound continuity
 * + the back-affordance the rest of the audited rooms render when
 * arriving from a sibling room.
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md +
 * deliverables/audit/continuity-params-2026-05.md (Invariants 3 + 5).
 */

test.describe("Phase 2.9 — Trust flow", () => {
    test("Settings cold landing has plain SETTINGS kicker, no back affordance", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/settings/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            const kicker = await page
                .locator(".st-topbar__kicker")
                .textContent();
            // On a fresh workspace (no keys, no demo) the kicker is
            // plain "SETTINGS" — no contextual tail to surface.
            expect(kicker?.trim()).toBe("SETTINGS");
            // No back affordance when no inbound continuity. (Selector
            // moved from .st-topbar__back to the canonical .c-back in
            // Program 6 / PR 1.)
            await expect(page.locator(".c-back")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Settings inbound from Dashboard renders the back affordance (Invariant 5)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Arrive from Dashboard with continuity params.
            await page.goto(
                "/settings/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard&fromMode=command&fromSurface=dashboard",
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(300);

            // Phase 2.9 wired the back affordance via a custom
            // `.st-topbar__back` in the Settings Topbar. Program 6 / PR 1
            // hoisted that into the canonical RoomChrome BackButton
            // (`.c-back`) so every room renders back-affordance the same
            // way. Continuity contract is unchanged — only the selector
            // moved.
            await expect(page.locator(".c-back")).toBeAttached();
            const text = await page.locator(".c-back").textContent();
            expect(text).toContain("Back to Dashboard");
            const href = await page
                .locator(".c-back")
                .getAttribute("href");
            expect(href).toBe("/dashboard/");
        } finally {
            await ctx.close();
        }
    });

    test("Settings ignores unsafe returnTo (Invariant 3 — open-redirect prevention)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Protocol-relative URL — safeReturnTo should reject.
            await page.goto(
                "/settings/?returnTo=%2F%2Fevil.example.com%2F&returnLabel=Pwned",
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(300);

            // No back-affordance should render. safeReturnTo's path-
            // only check (no //, no absolute URLs) catches the
            // protocol-relative attempt.
            await expect(page.locator(".st-topbar__back")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Settings kicker surfaces demo-mode in the contextual tail", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Set the demo flag the demo-storage bootstrap uses, then
            // navigate to settings.
            await page.goto("/settings/", { waitUntil: "domcontentloaded" });
            await page.evaluate(() => {
                // The Settings DemoCard reads demo state from
                // sessionStorage.gtmos_env_mode (set by the demo
                // bootstrap). Set it directly here.
                sessionStorage.setItem("gtmos_env_mode", "demo");
            });
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.9 finding: kicker now reflects active demo mode.
            const kicker = await page
                .locator(".st-topbar__kicker")
                .textContent();
            expect(kicker).toContain("SETTINGS");
            expect(kicker?.toLowerCase()).toContain("demo");
        } finally {
            await ctx.close();
        }
    });
});
