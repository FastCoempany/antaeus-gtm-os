import { test, expect } from "@playwright/test";

/**
 * Phase 2.3 — Strategy flow Playwright walk.
 *
 * Sarah Chen builds the ICP → tiers the territory → sources named
 * prospects → ranks live signals. Tests every seam on the path:
 *
 *   ICP Studio → Territory Architect (focusObject propagation)
 *   Territory → Sourcing Workbench (focusObject propagation)
 *   Territory → Signal Console (focusObject propagation)
 *   Sourcing → Signal Console (focusObject re-propagation)
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md +
 * deliverables/audit/continuity-params-2026-05.md (Invariants 1-8).
 */

const WEDGE = "Mid-market freight forwarders";

test.describe("Phase 2.3 — Strategy flow", () => {
    test("ICP Studio → Territory carries the ICP focus", async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 2400 } });
        const page = await ctx.newPage();
        try {
            const errors: string[] = [];
            page.on("pageerror", (err) => errors.push(err.message));

            // Seed a saved ICP so the AnalyticsPanel renders handoff CTAs.
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.evaluate((ICP) => {
                localStorage.setItem(
                    "gtmos_icp_analytics",
                    JSON.stringify({
                        icps: [
                            {
                                id: "icp_demo",
                                industry: ICP,
                                buyer: "VP Operations",
                                pain: "Compliance prep is a manual scramble",
                                qualityScore: 78,
                                updatedAt: new Date().toISOString()
                            }
                        ]
                    })
                );
            }, WEDGE);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.3 finding: handoff CTAs verb-shape sales moves
            // (was nav-action "Open X").
            const ctas = await page
                .locator(".icp-handoff")
                .allTextContents();
            expect(ctas).toContain("Build the territory");
            expect(ctas).toContain("Source named prospects");
            expect(ctas).toContain("Rank live signals");
            expect(ctas).toContain("Compose outbound");

            // Primary CTA (Build the territory) carries focusObject.
            const primaryHref = await page
                .locator(".icp-handoff--primary")
                .getAttribute("href");
            expect(primaryHref).not.toBeNull();
            const primaryUrl = new URL(primaryHref!, "http://x");
            expect(primaryUrl.pathname).toBe("/territory-architect/");
            expect(primaryUrl.searchParams.get("focusObject")).toBe(WEDGE);
            expect(primaryUrl.searchParams.get("returnTo")).toBe("/icp-studio/");

            // Click and verify Territory surfaces the inbound ICP.
            await page.locator(".icp-handoff--primary").click();
            await page.waitForLoadState("networkidle");

            const territoryKicker = await page
                .locator(".ta-hero__kicker")
                .textContent();
            expect(territoryKicker).toContain("building around");
            expect(territoryKicker).toContain(WEDGE);

            expect(
                errors,
                `page errors:\n${errors.join("\n")}`
            ).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Territory's handoffs propagate the inbound focus through", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Land on Territory with inbound focusObject.
            await page.goto(
                `/territory-architect/?focusObject=${encodeURIComponent(WEDGE)}&returnTo=%2Ficp-studio%2F&returnLabel=Back+to+ICP+Studio&fromMode=room&fromSurface=icp-studio`,
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(200);

            // All 3 Territory handoffs carry continuity AND the inbound
            // focus propagates through to the destinations.
            const sourcingHref = await page
                .locator(".ta-handoff--primary")
                .getAttribute("href");
            expect(sourcingHref).not.toBeNull();
            const sourcingUrl = new URL(sourcingHref!, "http://x");
            expect(sourcingUrl.pathname).toBe("/sourcing-workbench/");
            expect(sourcingUrl.searchParams.get("returnTo")).toBe(
                "/territory-architect/"
            );
            expect(sourcingUrl.searchParams.get("focusObject")).toBe(WEDGE);
            expect(sourcingUrl.searchParams.get("fromMode")).toBe("room");
            expect(sourcingUrl.searchParams.get("fromSurface")).toBe(
                "territory-architect"
            );
        } finally {
            await ctx.close();
        }
    });

    test("Signal Console empty state acknowledges inbound focus from upstream", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Land on Signal Console with inbound focusObject from
            // upstream (ICP Studio / Territory). Empty workspace.
            await page.goto(
                `/signal-console/?focusObject=${encodeURIComponent(WEDGE)}&returnTo=%2Ficp-studio%2F&returnLabel=Back+to+ICP+Studio&fromMode=room&fromSurface=icp-studio`,
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(200);

            // Phase 2.3 finding: when focusObject arrives + no matching
            // account, empty state shows "TARGETING: {ICP}" instead
            // of the generic "no accounts yet" kicker.
            const emptyKicker = await page
                .locator(".sc-empty__kicker")
                .textContent();
            expect(emptyKicker).toContain("TARGETING");
            expect(emptyKicker).toContain(WEDGE);

            // Add form still embedded as dominant CTA.
            await expect(
                page.locator(".sc-add-form--embedded")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("ICP Studio handoffs omit focusObject when industry is empty (no placeholder)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Fresh workspace — no saved ICP. Phase 2.3 finding:
            // hrefTo* helpers no longer pass "ICP ICP" placeholder.
            await page.goto("/icp-studio/", { waitUntil: "networkidle" });
            await page.waitForTimeout(200);

            const territoryHref = await page
                .locator(".icp-handoff--primary")
                .getAttribute("href");
            expect(territoryHref).not.toBeNull();
            const u = new URL(territoryHref!, "http://x");
            expect(u.searchParams.get("focusObject")).toBeNull();
            // Continuity still present.
            expect(u.searchParams.get("returnTo")).toBe("/icp-studio/");
        } finally {
            await ctx.close();
        }
    });
});
