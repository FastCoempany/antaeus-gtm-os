import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 12 — Territory Architect refacing walk.
 *
 * Verifies the Signal Field V02 structural addition:
 *   - 2-col hero grid with ta-hero__lead + ta-field-read aside
 *   - Field Read aside renders score + band + 3 interpretive lines
 *     (Main risk / Replacement pressure / Operator move)
 *   - Field read updates when the operator adds a thesis
 *   - Operator move line carries the orange-accent variant
 *   - HeroBand stats (theses + 4 tiers + accounts) still render
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-territory-architect-2026-05-18.md
 */

test.describe("Program 6 / PR 12 — Territory Architect refacing (Signal Field V02)", () => {
    test("Hero is a 2-col grid: lead + Field Read aside", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ta-hero__grid")).toBeAttached();
            await expect(page.locator(".ta-hero__lead")).toBeAttached();
            await expect(page.locator(".ta-field-read")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Field Read aside surfaces score + band + 3 interpretive lines", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ta-field-read__score")).toBeAttached();
            await expect(page.locator(".ta-field-read__band")).toBeAttached();

            const labels = await page
                .locator(".ta-field-read__line-label")
                .allTextContents();
            const lower = labels.map((l) => l.trim().toLowerCase());
            expect(lower).toContain("main risk");
            expect(lower).toContain("replacement pressure");
            expect(lower).toContain("operator move");
        } finally {
            await ctx.close();
        }
    });

    test("Empty board reads as 'Empty' band with no-theses risk copy", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Fresh storage — no theses, no accounts.
            await page.addInitScript(() => {
                try {
                    localStorage.clear();
                } catch {
                    /* noop */
                }
            });
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const aside = page.locator(".ta-field-read");
            const cls = await aside.getAttribute("class");
            expect(cls).toContain("ta-field-read--empty");

            const band = await page
                .locator(".ta-field-read__band")
                .textContent();
            expect(band?.trim().toLowerCase()).toContain("empty");
        } finally {
            await ctx.close();
        }
    });

    test("Field Read updates after a thesis is saved", async ({
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
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            // Save one thesis via the form.
            const thesisTitle = page
                .locator(".ta-form--thesis .ta-input")
                .first();
            await thesisTitle.fill("Procurement consolidation Q2");
            await page
                .locator(".ta-form--thesis .ta-save-btn")
                .click();
            await page.waitForTimeout(250);

            // Risk copy should no longer say "no theses" — the
            // priority chain advances to single-thesis monoculture.
            const risk = await page
                .locator(".ta-field-read__line")
                .filter({ hasText: /main risk/i })
                .locator(".ta-field-read__line-copy")
                .textContent();
            expect(risk?.toLowerCase()).not.toContain("no theses");
            expect(risk?.toLowerCase()).toContain("single thesis");
        } finally {
            await ctx.close();
        }
    });

    test("Operator move line carries the orange-accent variant", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const moveLine = page.locator(".ta-field-read__line--move");
            await expect(moveLine).toBeAttached();
            // The move-line should NOT be the same node as a plain
            // .ta-field-read__line; the variant class is required.
            const cls = await moveLine.getAttribute("class");
            expect(cls).toContain("ta-field-read__line--move");
        } finally {
            await ctx.close();
        }
    });

    test("HeroBand stats (theses + tiers + ceiling) still render", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const statCount = await page.locator(".ta-hero__stats .ta-stat").count();
            // 1 theses stat + 4 tier stats + 1 ceiling stat = 6.
            expect(statCount).toBeGreaterThanOrEqual(6);
        } finally {
            await ctx.close();
        }
    });

    test("Mobile width collapses the 2-col hero to a single column", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 900, height: 1000 }
        });
        const page = await ctx.newPage();
        try {
            await page.goto("/territory-architect/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const gridCols = await page
                .locator(".ta-hero__grid")
                .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
            const cols = gridCols
                .split(" ")
                .filter((c) => c.trim().length > 0);
            expect(cols.length).toBeLessThanOrEqual(1);
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
                "/territory-architect/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
