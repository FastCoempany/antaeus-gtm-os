import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 8 — Call Planner refacing walk.
 *
 * Verifies the Pressure Script Variant 01 structural additions:
 *   - 2-col cp-board layout (main column wide + handoff aside 320px)
 *   - Credibility chip in the Witness head (cp-witness__credibility)
 *   - Scripted-quote lines in each agenda strip (cp-strip__quote)
 *   - Existing components still mount (Witness form, AgendaSpine 4
 *     strips, Quality breakdown, Handoff routes)
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-call-planner-2026-05-18.md
 */

test.describe("Program 6 / PR 8 — Call Planner refacing (Pressure Script V01)", () => {
    test("2-col board layout: main column + handoff aside", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            await expect(page.locator(".cp-board")).toBeAttached();
            await expect(page.locator(".cp-board__main")).toBeAttached();
            await expect(page.locator(".cp-board__aside")).toBeAttached();

            // Aside contains the Handoff (cross-room route cards live
            // on the right, not in a footer band).
            const asideHandoff = page.locator(".cp-board__aside .cp-handoff");
            await expect(asideHandoff).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Witness head carries the credibility chip", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            const chip = page.locator(".cp-witness__credibility");
            await expect(chip).toBeAttached();
            // Chip has both a label and a score number.
            await expect(
                chip.locator(".cp-witness__credibility-label")
            ).toBeAttached();
            await expect(
                chip.locator(".cp-witness__credibility-score")
            ).toBeAttached();

            // On cold start (no inputs) the band is "thin"; chip carries
            // the thin variant class.
            const variantClass = await chip.getAttribute("class");
            expect(variantClass).toContain("cp-witness__credibility--thin");
        } finally {
            await ctx.close();
        }
    });

    test("Credibility chip updates as quality lifts", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Fill contact + persona + LinkedIn (context gate) +
            // why-now notes. Without a linked deal the max score
            // is 75; with these 4 gates met the band lifts to
            // "workable" (>= 65). Chip drops the --thin variant.
            const contactInput = page
                .locator(".cp-witness .cp-field__input")
                .nth(0);
            const linkedinInput = page
                .locator(".cp-witness .cp-field__input")
                .nth(1);
            await contactInput.fill("Jane Smith");
            await page.locator(".cp-persona-btn").first().click();
            await linkedinInput.fill("https://linkedin.com/in/jane-smith");
            await page.fill(
                ".cp-witness .cp-field__textarea",
                "Their CSAT data shows the support handoff breaks during enterprise renewals — leadership flagged it for the next QBR."
            );
            await page.waitForTimeout(250);

            // The chip's variant class should reflect the lift (no
            // longer thin).
            const variantClass = await page
                .locator(".cp-witness__credibility")
                .getAttribute("class");
            expect(variantClass).not.toContain(
                "cp-witness__credibility--thin"
            );
        } finally {
            await ctx.close();
        }
    });

    test("AgendaSpine renders 4 strips, each with a scripted-quote line", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            const strips = page.locator(".cp-spine .cp-strip");
            expect(await strips.count()).toBe(4);

            // Each strip has a scripted-quote line.
            const quotes = page.locator(".cp-strip__quote");
            expect(await quotes.count()).toBe(4);

            // Quotes are wrapped in actual quote characters.
            const firstQuote = await quotes.first().textContent();
            expect(firstQuote?.startsWith('"')).toBe(true);
            expect(firstQuote?.endsWith('"')).toBe(true);
            expect(firstQuote?.length).toBeGreaterThan(10);
        } finally {
            await ctx.close();
        }
    });

    test("Quality breakdown still renders inline (canon-aligned evolution)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Quality block stays — it's the analytical 5-gate
            // breakdown; the chip is just a glanceable summary.
            await expect(page.locator(".cp-quality")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Handoff route cards live in the aside (not below the board)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Handoff inside the aside.
            const asideHandoff = page.locator(".cp-board__aside .cp-handoff");
            await expect(asideHandoff).toBeAttached();

            // Handoff has its 3 cross-room CTAs (Discovery / Deal /
            // Copy brief) — exact selectors depend on the component
            // but at minimum the aside has clickable links/buttons.
            const asideCtaCount = await page
                .locator(".cp-board__aside a, .cp-board__aside button")
                .count();
            expect(asideCtaCount).toBeGreaterThanOrEqual(3);
        } finally {
            await ctx.close();
        }
    });

    test("Form inputs in Witness still drive live agenda recompute", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Type a contact name; the cp-witness__name should reflect it.
            await page.fill(".cp-witness .cp-field__input", "Jane Smith");
            await page.waitForTimeout(150);
            const witnessName = await page
                .locator(".cp-witness__name")
                .textContent();
            expect(witnessName?.toLowerCase()).toContain("jane smith");
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
                "/call-planner/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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

    test("Mobile width drops 2-col board to single column", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 800, height: 900 }
        });
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // At < 1100px the board becomes single-column.
            const gridCols = await page
                .locator(".cp-board")
                .evaluate(
                    (el) => getComputedStyle(el).gridTemplateColumns
                );
            // Single column = no second value with px > 0.
            const cols = gridCols.split(" ").filter((c) => c.trim().length > 0);
            expect(cols.length).toBeLessThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });
});
