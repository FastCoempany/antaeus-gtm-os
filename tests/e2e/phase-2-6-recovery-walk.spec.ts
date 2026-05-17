import { test, expect } from "@playwright/test";

/**
 * Phase 2.6 — Recovery flow Playwright walk.
 *
 * Sarah Chen browses the recovery board → opens the weakest deal →
 * pre-mortems it in Future Autopsy → casts a proof in PoC Framework
 * → routes through Advisor Deploy to deploy backchannel air cover.
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

const SEED_DEALS = [
    {
        id: "deal_meridian",
        accountName: "Meridian Logistics",
        stage: "negotiation",
        value: 380000,
        nextStep: "",
        nextStepDate: null,
        created_at: "2026-04-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z"
    },
    {
        id: "deal_blackbird",
        accountName: "Blackbird Industrial",
        stage: "poc",
        value: 220000,
        nextStep: "Champion follow-up",
        nextStepDate: "2026-05-25",
        created_at: "2026-04-15T00:00:00Z",
        updated_at: "2026-05-08T00:00:00Z"
    }
];

test.describe("Phase 2.6 — Recovery flow", () => {
    test("Deal Workspace reads legacy localStorage fallback when Supabase unavailable", async ({
        browser
    }) => {
        // Phase 2.6 finding: room used to render empty grid whenever
        // Supabase auth was missing (demo seed couldn't populate the
        // live workspace). Now falls back to `gtmos_deal_workspaces`
        // legacy mirror so demo + dev walks show the seeded deals.
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/deal-workspace/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // Kicker should reflect the seeded count + recovery state.
            const kicker = await page
                .locator(".dw-topbar__kicker")
                .textContent();
            expect(kicker).toContain("DEAL WORKSPACE");
            expect(kicker).toContain("2 deals");
        } finally {
            await ctx.close();
        }
    });

    test("Deal Workspace HandoffStrip exists with 3 verb-shape CTAs (was missing)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/deal-workspace/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // Phase 2.6 finding: room had ZERO outbound handoff
            // before this PR. Now HandoffStrip surfaces 3 intervention
            // routes.
            await expect(page.locator(".dw-handoff")).toBeAttached();
            const labels = await page
                .locator(".dw-handoff__cta")
                .allTextContents();
            expect(labels).toContain("Pre-mortem this deal");
            expect(labels).toContain("Forge a proof");
            expect(labels).toContain("Deploy an advisor");

            // All carry continuity wrap.
            const hrefs = await page
                .locator(".dw-handoff__cta")
                .evaluateAll((els) =>
                    els.map((e) => e.getAttribute("href"))
                );
            for (const h of hrefs) {
                expect(h).not.toBeNull();
                const u = new URL(h!, "http://x");
                expect(u.searchParams.get("returnTo")).toBe(
                    "/deal-workspace/"
                );
                expect(u.searchParams.get("fromSurface")).toBe(
                    "deal-workspace"
                );
            }
        } finally {
            await ctx.close();
        }
    });

    test("Deal Workspace HandoffStrip is hidden on empty workspace", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/deal-workspace/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // With no deals, the HandoffStrip should not render —
            // empty grid already directs Sarah to load a deal.
            await expect(page.locator(".dw-handoff")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("PoC Framework RouteRack labels verb-shape sales moves", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/poc-framework/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.6 finding: labels rewritten parity with Cold
            // Call / Advisor audits.
            const labels = await page
                .locator(".poc-route-rack__label")
                .allTextContents();
            expect(labels).toContain("Open the deal");
            expect(labels).toContain("Pre-mortem this deal");
            expect(labels).toContain("Carry to an advisor");
            // Old nav-action labels retired.
            expect(labels).not.toContain("Open in Deal Workspace");
            expect(labels).not.toContain("Pre-mortem in Future Autopsy");
            expect(labels).not.toContain("Carry to Advisor Deploy");
        } finally {
            await ctx.close();
        }
    });
});
