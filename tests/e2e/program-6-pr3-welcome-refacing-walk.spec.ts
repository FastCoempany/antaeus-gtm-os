import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 3 — Welcome refacing walk.
 *
 * Verifies the Launch Folio · Commission Lock structural additions:
 *   - Hero gained the Week N · Day N stamp affordance
 *   - LaunchFolio panel mounts between Hero and the 2-col grid
 *   - 2×2 mandate panel renders 4 cells
 *   - "What is missing" cell carries the locked variant on cold-start
 *   - Existing MilestoneLadder + ActionStack still render (canon-aligned
 *     evolution preserved)
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-welcome-2026-05-18.md
 * Winner reference:
 *   deliverables/prototypes/wireframes/antaeus-welcome-launch-folio-triptych-2026-04-08.html
 */

test.describe("Program 6 / PR 3 — Welcome refacing (Launch Folio · Commission Lock)", () => {
    test("Hero carries the Week N · Day N stamp", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            const stamp = page.locator(".wel-hero__stamp");
            await expect(stamp).toBeAttached();
            const stampText = await stamp.textContent();
            expect(stampText).toMatch(/Week \d+ · Day \d+/);
        } finally {
            await ctx.close();
        }
    });

    test("LaunchFolio panel renders with all 4 mandate cells", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            const folio = page.locator(".wel-folio");
            await expect(folio).toBeAttached();

            const kicker = await folio
                .locator(".wel-folio__kicker")
                .textContent();
            expect(kicker).toContain("LAUNCH FOLIO");
            expect(kicker).toContain("COMMISSION LOCK");

            const title = await folio.locator(".wel-folio__title").textContent();
            expect(title?.toLowerCase()).toContain("open the live mandate");

            const cells = page.locator(".wel-folio__cell");
            expect(await cells.count()).toBe(4);

            const labels = await page
                .locator(".wel-folio__cell-label")
                .allTextContents();
            const joined = labels.join(" · ");
            expect(joined).toContain("Where you are");
            expect(joined).toContain("What is missing");
            expect(joined).toContain("What unlocks next");
            expect(joined).toContain("Return behavior");
        } finally {
            await ctx.close();
        }
    });

    test("cold-start shows the locked variant on 'What is missing'", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Default cold-start (no anchors live) → the locked variant
            // marks the "What is missing" cell.
            const lockedCells = page.locator(".wel-folio__cell--locked");
            expect(await lockedCells.count()).toBe(1);
        } finally {
            await ctx.close();
        }
    });

    test("all-anchors-live state relaxes the lock", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Seed all four milestone sources so completed === total.
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.evaluate(() => {
                localStorage.setItem(
                    "gtmos_icp_analytics",
                    JSON.stringify({ icps: [{ id: "icp_1" }] })
                );
                localStorage.setItem(
                    "gtmos_sc_v4",
                    JSON.stringify({
                        accounts: [{ id: "a_1", signals: [{ id: "s_1" }] }]
                    })
                );
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify([{ id: "d_1", accountName: "Acme" }])
                );
                localStorage.setItem(
                    "gtmos_outbound_touches",
                    JSON.stringify({ touches: [{ id: "t_1" }] })
                );
            });
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            // When every anchor is live, the lock relaxes — NO cell
            // renders with the locked variant.
            const lockedCells = page.locator(".wel-folio__cell--locked");
            expect(await lockedCells.count()).toBe(0);

            // The "What is missing" cell now reads as 'Nothing — the
            // file is live.' or similar reassuring copy.
            const missingValue = await page
                .locator(".wel-folio__cell")
                .nth(1)
                .locator(".wel-folio__cell-value")
                .textContent();
            expect(missingValue?.toLowerCase()).toMatch(
                /nothing|file is live/
            );
        } finally {
            await ctx.close();
        }
    });

    test("MilestoneLadder + ActionStack still render below the LaunchFolio (canon-aligned evolution preserved)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            await expect(page.locator(".wel-ladder")).toBeAttached();
            await expect(page.locator(".wel-actions")).toBeAttached();
            // The grid container still wraps them.
            await expect(page.locator(".wel-grid")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("LaunchFolio sits between Hero and the grid (composition order)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // DOM order: Hero → LaunchFolio → grid (Ladder + ActionStack).
            const order = await page.evaluate(() => {
                const all = Array.from(
                    document.querySelectorAll(
                        ".wel-hero, .wel-folio, .wel-grid"
                    )
                );
                return all.map((el) => el.className.split(" ")[0]);
            });
            expect(order).toEqual([
                "wel-hero",
                "wel-folio",
                "wel-grid"
            ]);
        } finally {
            await ctx.close();
        }
    });

    test("RoomChrome still mounts (Program 6 / PR 1 chrome) — back-pill, palette hint still there", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/welcome/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            await expect(page.locator(".ant-room-chrome")).toBeAttached();
            await expect(page.locator(".wordmark, .ant-wordmark")).toBeAttached();
            await expect(
                page.locator(".ant-room-chrome__palette-hint")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });
});
