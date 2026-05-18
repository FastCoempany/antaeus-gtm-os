import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 9 — Outbound Studio refacing walk.
 *
 * Verifies the Switchboard Loft V03 structural additions:
 *   - 3-col ob-loft layout (laws | center | reads)
 *   - SwitchLaws cards mount (Input law + Recovery law)
 *   - SwitchReads cards mount (Board read + Operator move)
 *   - Board read tone updates as the rack fills
 *   - Center (Switchboard + OutputPanel) still mounts unchanged
 *   - Mobile width collapses the 3-col layout
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-outbound-studio-2026-05-18.md
 */

test.describe("Program 6 / PR 9 — Outbound Studio refacing (Switchboard Loft V03)", () => {
    test("3-col loft layout: laws | center | reads", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ob-loft")).toBeAttached();
            await expect(page.locator(".ob-loft__laws")).toBeAttached();
            await expect(page.locator(".ob-loft__center")).toBeAttached();
            await expect(page.locator(".ob-loft__reads")).toBeAttached();

            // The center column wraps the existing stage.
            await expect(
                page.locator(".ob-loft__center .ob-stage")
            ).toBeAttached();
            await expect(
                page.locator(".ob-loft__center .ob-switchboard")
            ).toBeAttached();
            await expect(
                page.locator(".ob-loft__center .ob-output")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("SwitchLaws renders both operating laws", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const laws = page.locator(".ob-loft__laws .ob-law");
            expect(await laws.count()).toBe(2);

            const kickers = await page
                .locator(".ob-loft__laws .ob-law__kicker")
                .allTextContents();
            expect(kickers).toContain("INPUT LAW");
            expect(kickers).toContain("RECOVERY LAW");

            const inputLawTitle = await laws
                .nth(0)
                .locator(".ob-law__title")
                .textContent();
            expect(inputLawTitle?.toLowerCase()).toContain(
                "no send path without a named strain"
            );
        } finally {
            await ctx.close();
        }
    });

    test("SwitchReads renders Board read + Operator move", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const reads = page.locator(".ob-loft__reads .ob-read");
            expect(await reads.count()).toBe(2);

            const kickers = await page
                .locator(".ob-loft__reads .ob-read__kicker")
                .allTextContents();
            expect(kickers).toContain("BOARD READ");
            expect(kickers).toContain("OPERATOR MOVE");
        } finally {
            await ctx.close();
        }
    });

    test("Board read starts on the 'loose' tone with no inputs", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            // First read card is BOARD READ; with an empty rack it
            // should carry the loose tone variant.
            const firstRead = page.locator(".ob-loft__reads .ob-read").first();
            const cls = await firstRead.getAttribute("class");
            expect(cls).toContain("ob-read--loose");
        } finally {
            await ctx.close();
        }
    });

    test("Board read tone lifts as the rack fills", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            // Type an account name → tone should leave 'loose'.
            const accountInput = page
                .locator(".ob-switchboard .ob-field input")
                .first();
            await accountInput.fill("Acme Robotics");
            await page.waitForTimeout(200);

            const firstRead = page.locator(".ob-loft__reads .ob-read").first();
            const cls = await firstRead.getAttribute("class");
            expect(cls).not.toContain("ob-read--loose");
        } finally {
            await ctx.close();
        }
    });

    test("Center stage (Switchboard + OutputPanel) still mounts", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ob-switchboard")).toBeAttached();
            await expect(page.locator(".ob-output")).toBeAttached();
            // The switchboard form fields are still present.
            const fieldCount = await page
                .locator(".ob-switchboard .ob-field")
                .count();
            expect(fieldCount).toBeGreaterThanOrEqual(4);
        } finally {
            await ctx.close();
        }
    });

    test("TouchLog + HandoffStrip still mount below the loft", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ob-log")).toBeAttached();
            await expect(page.locator(".ob-handoff")).toBeAttached();
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
                "/outbound-studio/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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

    test("Mobile width collapses the 3-col loft to a single column", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 900, height: 1000 }
        });
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const gridCols = await page
                .locator(".ob-loft")
                .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
            const cols = gridCols
                .split(" ")
                .filter((c) => c.trim().length > 0);
            expect(cols.length).toBeLessThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });
});
