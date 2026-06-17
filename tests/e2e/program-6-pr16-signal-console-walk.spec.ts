import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 16 — Signal Console refacing walk.
 *
 * Verifies the Variant 01 (AI-selected) refacing additions:
 *   - Italic headline line renders below the H1
 *   - WorkspaceHealth posture row has 4 cells: verdict + Active +
 *     Hot ≥ 75 + Top heat
 *   - Top heat cell shows the snapshot's max heat score
 *   - All existing card surfaces still render
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-signal-console-2026-05-19.md
 */

const ACCOUNT_REGISTRY = JSON.stringify({
    accounts: [
        {
            id: "acc-a",
            name: "Northstar Health",
            ticker: "NHX",
            industry: "Healthcare",
            hq: "Boston",
            employees: "1200",
            tier: "1",
            signals: [
                {
                    id: "sig-1",
                    headline: "CFO churn announced",
                    confidence: 0.9,
                    published_date: "2026-05-15T00:00:00Z",
                    is_ai: true
                },
                {
                    id: "sig-2",
                    headline: "Procurement reorg in motion",
                    confidence: 0.85,
                    published_date: "2026-05-16T00:00:00Z",
                    is_ai: true
                }
            ]
        },
        {
            id: "acc-b",
            name: "Apex Fintech",
            ticker: "APX",
            industry: "Fintech",
            hq: "NYC",
            employees: "400",
            tier: "2",
            signals: [
                {
                    id: "sig-3",
                    headline: "Series-B announcement",
                    confidence: 0.92,
                    published_date: "2026-05-14T00:00:00Z",
                    is_ai: true
                }
            ]
        }
    ]
});

test.describe("Program 6 / PR 16 — Signal Console refacing (Variant 01 AI-selected)", () => {
    test("Italic headline line renders below the H1", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/signal-console/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".sc-topbar__headline")).toBeAttached();
            const text = await page
                .locator(".sc-topbar__headline")
                .textContent();
            expect(text?.toLowerCase()).toContain("heat");
            expect(text?.toLowerCase()).toContain("ledger");

            // Confirm it's italic.
            const fontStyle = await page
                .locator(".sc-topbar__headline")
                .evaluate((el) => getComputedStyle(el).fontStyle);
            expect(fontStyle).toBe("italic");
        } finally {
            await ctx.close();
        }
    });

    test("Workspace-health posture row surfaces Hot ≥ 75 + Top heat cells", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript((accounts) => {
                localStorage.setItem("gtmos_sc_v4", accounts);
            }, ACCOUNT_REGISTRY);
            await page.goto("/signal-console/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await expect(page.locator(".sc-health")).toBeAttached();
            const labels = await page
                .locator(".sc-health__cell .sc-health__label")
                .allTextContents();
            const lower = labels.map((l) => l.trim().toLowerCase());

            expect(lower).toContain("active accounts");
            // The wireframe's "Hot ≥ 75" framing wins over the prior
            // "Ready (heat ≥75)" label.
            expect(lower.some((l) => l.includes("hot"))).toBe(true);
            // Top heat replaces the prior Total signals cell.
            expect(lower.some((l) => l.includes("top heat"))).toBe(true);
            expect(lower.some((l) => l.includes("total signals"))).toBe(false);
        } finally {
            await ctx.close();
        }
    });

    test("Top heat cell shows a numeric value with the seeded accounts", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript((accounts) => {
                localStorage.setItem("gtmos_sc_v4", accounts);
            }, ACCOUNT_REGISTRY);
            await page.goto("/signal-console/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            const topHeatCell = page
                .locator(".sc-health__cell")
                .filter({ hasText: /top heat/i });
            await expect(topHeatCell).toBeAttached();
            const value = await topHeatCell
                .locator(".sc-health__value")
                .textContent();
            const n = Number(value);
            expect(Number.isFinite(n)).toBe(true);
            expect(n).toBeGreaterThan(0);
        } finally {
            await ctx.close();
        }
    });

    test("WorkspaceHealth still hides on an empty workspace", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript(() => {
                try {
                    localStorage.clear();
                } catch {
                    /* noop */
                }
            });
            await page.goto("/signal-console/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".sc-health")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Existing grid surfaces still render", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript((accounts) => {
                localStorage.setItem("gtmos_sc_v4", accounts);
            }, ACCOUNT_REGISTRY);
            await page.goto("/signal-console/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await expect(page.locator(".sc-topbar")).toBeAttached();
            await expect(page.locator(".sc-grid-controls")).toBeAttached();
            const cardCount = await page.locator(".sc-card").count();
            expect(cardCount).toBeGreaterThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });

    test("RoomChrome + back-pill + ⌘K palette still wired (Program 6 / PR 1)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto(
                "/signal-console/?ds=0&returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
                { waitUntil: "domcontentloaded" }
            );
            await page.waitForTimeout(300);
            await expect(page.locator(".ant-room-chrome")).toBeAttached();
            await expect(page.locator(".c-back")).toBeAttached();
            await expect(
                page.locator(".ant-room-chrome__palette-hint")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });
});
