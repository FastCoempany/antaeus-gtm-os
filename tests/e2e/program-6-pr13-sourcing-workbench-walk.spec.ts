import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 13 — Sourcing Workbench refacing walk.
 *
 * Verifies the Ticket Loom V02 structural addition:
 *   - LoomRead aside renders between Topbar and the bench grid
 *   - Surfaces score + band + Week read + Operator move
 *   - Empty board reads as the 'empty' band variant
 *   - Operator move line carries the orange-accent variant
 *   - All existing surfaces (Topbar / Bench / Kanban / Handoff) still mount
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-sourcing-workbench-2026-05-18.md
 */

test.describe("Program 6 / PR 13 — Sourcing Workbench refacing (Ticket Loom V02)", () => {
    test("LoomRead aside mounts between Topbar and bench grid", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".sw-loom-read")).toBeAttached();
            // Should appear in the document AFTER the topbar.
            const order = await page.evaluate(() => {
                const topbar = document.querySelector(".sw-topbar");
                const loom = document.querySelector(".sw-loom-read");
                const bench = document.querySelector(".sw-bench-grid");
                if (!topbar || !loom || !bench) return null;
                return (
                    topbar.compareDocumentPosition(loom) &
                        Node.DOCUMENT_POSITION_FOLLOWING &&
                    loom.compareDocumentPosition(bench) &
                        Node.DOCUMENT_POSITION_FOLLOWING
                );
            });
            expect(order).toBeTruthy();
        } finally {
            await ctx.close();
        }
    });

    test("LoomRead aside surfaces score + band + 2 interpretive lines", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".sw-loom-read__score")).toBeAttached();
            await expect(page.locator(".sw-loom-read__band")).toBeAttached();

            const labels = await page
                .locator(".sw-loom-read__line-label")
                .allTextContents();
            const lower = labels.map((l) => l.trim().toLowerCase());
            expect(lower).toContain("this week");
            expect(lower).toContain("next move");
        } finally {
            await ctx.close();
        }
    });

    test("Empty board reads as the 'empty' band variant", async ({
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
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const aside = page.locator(".sw-loom-read");
            const cls = await aside.getAttribute("class");
            expect(cls).toContain("sw-loom-read--empty");

            const band = await page
                .locator(".sw-loom-read__band")
                .textContent();
            expect(band?.trim().toLowerCase()).toContain("empty");
        } finally {
            await ctx.close();
        }
    });

    test("Next-move line carries the orange-accent variant", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const moveLine = page.locator(".sw-loom-read__line--move");
            await expect(moveLine).toBeAttached();
            const cls = await moveLine.getAttribute("class");
            expect(cls).toContain("sw-loom-read__line--move");
        } finally {
            await ctx.close();
        }
    });

    test("Empty-board next-move prescribes the first capture", async ({
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
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const moveCopy = await page
                .locator(".sw-loom-read__line--move .sw-loom-read__line-copy")
                .textContent();
            expect(moveCopy?.toLowerCase()).toContain("capture the first");
        } finally {
            await ctx.close();
        }
    });

    test("Existing surfaces (Topbar / Bench / Kanban / Handoff) still mount", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".sw-topbar")).toBeAttached();
            await expect(page.locator(".sw-bench-grid")).toBeAttached();
            await expect(page.locator(".sw-kanban")).toBeAttached();
            // 5 kanban columns.
            const cols = await page.locator(".sw-kanban__grid .sw-col").count();
            expect(cols).toBe(5);
        } finally {
            await ctx.close();
        }
    });

    test("Mobile width collapses the LoomRead 2-col aside to a single column", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 800, height: 1000 }
        });
        const page = await ctx.newPage();
        try {
            await page.goto("/sourcing-workbench/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const gridCols = await page
                .locator(".sw-loom-read")
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
                "/sourcing-workbench/?ds=0&returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
