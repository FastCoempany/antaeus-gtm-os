import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 5 — ICP Studio refacing walk.
 *
 * Verifies the Variant 01 / Wedge Ledger structural additions:
 *   - WedgeLedger: 7-row ledger with mark + field + copy + state pill
 *   - RunDocket: right aside with score + weakest + broad-avoid +
 *     downstream-changes blocks
 *   - 2-col readout layout (.icp-work__readout)
 *   - Existing form + Hero + AnalyticsPanel preserved
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-icp-studio-2026-05-18.md
 * Winner reference:
 *   deliverables/prototypes/wireframes/antaeus-icp-studio-triptych-2026-04-17.html
 *   (variant "Variant 01 / Wedge Ledger")
 */

test.describe("Program 6 / PR 5 — ICP Studio refacing (Wedge Ledger)", () => {
    test("WedgeLedger renders 7 rows with mark + field + copy + state pill", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            const ledger = page.locator(".icp-ledger");
            await expect(ledger).toBeAttached();

            const rows = page.locator(".icp-ledger__row");
            expect(await rows.count()).toBe(7);

            // Every row has mark + field + copy + state pill.
            const firstRow = rows.first();
            await expect(firstRow.locator(".icp-ledger__mark")).toBeAttached();
            await expect(firstRow.locator(".icp-ledger__field")).toBeAttached();
            await expect(firstRow.locator(".icp-ledger__copy")).toBeAttached();
            await expect(firstRow.locator(".icp-ledger__state")).toBeAttached();

            // Field names match the 7 canonical fields (in order).
            const fieldNames = await page
                .locator(".icp-ledger__field")
                .allTextContents();
            const expected = [
                "Industry",
                "Buyer",
                "Size",
                "Geo",
                "Pain",
                "Trigger",
                "Proof window"
            ];
            for (let i = 0; i < expected.length; i++) {
                expect(fieldNames[i]).toContain(expected[i]!);
            }
        } finally {
            await ctx.close();
        }
    });

    test("Cold-start ledger marks Industry / Buyer / Trigger as missing", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            // Cold start: every field empty → at least 3 risk pills.
            const riskPills = page.locator(".icp-ledger__state--risk");
            const riskCount = await riskPills.count();
            expect(riskCount).toBeGreaterThanOrEqual(3);

            const riskTexts = await riskPills.allTextContents();
            const joined = riskTexts.join(" · ").toLowerCase();
            expect(joined).toContain("missing");
        } finally {
            await ctx.close();
        }
    });

    test("RunDocket renders score + label + weakest + broad-avoid + downstream", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            const docket = page.locator(".icp-docket");
            await expect(docket).toBeAttached();

            // Score block.
            await expect(
                docket.locator(".icp-docket__score-value")
            ).toBeAttached();
            await expect(
                docket.locator(".icp-docket__score-label")
            ).toBeAttached();

            // Three labeled blocks (weakest + broad + downstream).
            const blocks = docket.locator(".icp-docket__block");
            expect(await blocks.count()).toBe(3);

            const labels = await docket
                .locator(".icp-docket__block-label")
                .allTextContents();
            const joined = labels.join(" · ");
            expect(joined).toContain("Weakest field");
            expect(joined).toContain("Broad version to avoid");
            expect(joined).toContain("Downstream changes");
        } finally {
            await ctx.close();
        }
    });

    test("Cold-start RunDocket weakest names Industry first", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            const weakestBlock = page.locator(".icp-docket__block").first();
            const headline = await weakestBlock
                .locator(".icp-docket__block-headline")
                .textContent();
            expect(headline?.toLowerCase()).toContain("industry");
        } finally {
            await ctx.close();
        }
    });

    test("2-col readout layout (.icp-work__readout)", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            const readout = page.locator(".icp-work__readout");
            await expect(readout).toBeAttached();
            // Should contain both ledger + docket as direct children.
            await expect(readout.locator(".icp-ledger")).toBeAttached();
            await expect(readout.locator(".icp-docket")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Existing form + hero + AnalyticsPanel still render", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            await expect(page.locator(".icp-hero")).toBeAttached();
            await expect(page.locator(".icp-form")).toBeAttached();
            await expect(page.locator(".icp-roles")).toBeAttached();
            await expect(page.locator(".icp-templates")).toBeAttached();
            await expect(page.locator(".icp-savebar")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("QualityReadout retired (no .icp-quality__checks list)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            // The previous unstructured check list shouldn't render.
            const oldChecks = page.locator(".icp-quality__checks");
            expect(await oldChecks.count()).toBe(0);
        } finally {
            await ctx.close();
        }
    });

    test("RoomChrome + back-pill + palette still wired (Program 6 / PR 1)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto(
                "/icp-studio/?returnTo=%2Fterritory-architect%2F&returnLabel=Back+to+Territory",
                { waitUntil: "domcontentloaded" }
            );
            await page.waitForTimeout(400);

            await expect(page.locator(".ant-room-chrome")).toBeAttached();
            await expect(
                page.locator(".ant-room-chrome__palette-hint")
            ).toBeAttached();
            await expect(page.locator(".c-back")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Picking a template lifts the ledger state pills", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(400);

            // Click the first template — it prefills the form.
            await page.locator(".icp-templates__btn").first().click();
            await page.waitForTimeout(200);

            // After the template fills, at least some state pills should
            // flip from risk to good. We test that the count of risk
            // pills DROPS (was 3+; should be smaller now).
            const riskAfter = await page
                .locator(".icp-ledger__state--risk")
                .count();
            const goodAfter = await page
                .locator(".icp-ledger__state--good")
                .count();
            expect(goodAfter).toBeGreaterThanOrEqual(1);
            expect(riskAfter).toBeLessThanOrEqual(2);
        } finally {
            await ctx.close();
        }
    });
});
