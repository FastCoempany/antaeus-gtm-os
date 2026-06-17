import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 17 — Quota Workback refacing walk.
 *
 * Verifies the Variant 01 (AI-selected) refacing additions:
 *   - Topbar surfaces 4 plan-input anchors (Annual quota / Avg ACV /
 *     Win rate / Cycle)
 *   - Each stat carries a sub-note context line
 *   - Inputs feed through to the stat values
 *   - Empty-state inputs degrade gracefully
 *   - "Make the math feel daily." H1 still renders verbatim
 *   - Hero touches/day + posture pill + downstream surfaces preserved
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-quota-workback-2026-05-19.md
 */

const POPULATED_INPUTS = JSON.stringify({
    quota: 6_000_000,
    acv: 80_000,
    win: 22,
    m2o: 35,
    t2m: 0.7,
    show: 80,
    days: 20,
    tpa: 8,
    cycle: 62
});

test.describe("Program 6 / PR 17 — Quota Workback refacing (Variant 01 AI-selected)", () => {
    test("Topbar surfaces 4 plan-input anchor stats", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const labels = await page
                .locator(".qw-topbar__stats .qw-stat__label")
                .allTextContents();
            const lower = labels.map((l) => l.trim().toLowerCase());

            expect(lower).toContain("annual quota");
            expect(lower).toContain("avg acv");
            expect(lower).toContain("win rate");
            expect(lower).toContain("cycle");
            // Retired duplicate-output stats should not be present.
            expect(lower).not.toContain("monthly target");
            expect(lower).not.toContain("touches / week");
            expect(lower).not.toContain("coverage goal");
        } finally {
            await ctx.close();
        }
    });

    test("Each stat carries a sub-note context line", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const subCount = await page
                .locator(".qw-topbar__stats .qw-stat__sub")
                .count();
            expect(subCount).toBeGreaterThanOrEqual(4);
        } finally {
            await ctx.close();
        }
    });

    test("Populated inputs flow into stat values + interpretive subs", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript((inputs) => {
                localStorage.setItem("gtmos_qw_inputs", inputs);
            }, POPULATED_INPUTS);
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // Pick stats by their .qw-stat__label child to avoid
            // matching against the value + sub copy that also lives
            // inside .qw-stat. "Cycle" in particular is a substring of
            // other words; the strict-label filter avoids ambiguity.
            const statByLabel = (label: RegExp) =>
                page
                    .locator(".qw-topbar__stats .qw-stat")
                    .filter({
                        has: page.locator(".qw-stat__label", { hasText: label })
                    });
            const quotaStat = statByLabel(/^annual quota$/i);
            const acvStat = statByLabel(/^avg acv$/i);
            const winStat = statByLabel(/^win rate$/i);
            const cycleStat = statByLabel(/^cycle$/i);

            const quotaValue = await quotaStat
                .locator(".qw-stat__value")
                .textContent();
            expect(quotaValue).toContain("$6M");

            const acvValue = await acvStat
                .locator(".qw-stat__value")
                .textContent();
            expect(acvValue).toContain("$80K");

            const winValue = await winStat
                .locator(".qw-stat__value")
                .textContent();
            expect(winValue).toContain("22%");

            const cycleValue = await cycleStat
                .locator(".qw-stat__value")
                .textContent();
            expect(cycleValue).toContain("62d");

            // Sub-note context: acv stat should name "deals to hit number"
            // and win-rate stat should name "opps needed".
            const acvSub = await acvStat
                .locator(".qw-stat__sub")
                .textContent();
            expect(acvSub?.toLowerCase()).toContain("deals");

            const winSub = await winStat
                .locator(".qw-stat__sub")
                .textContent();
            expect(winSub?.toLowerCase()).toContain("opps");
        } finally {
            await ctx.close();
        }
    });

    test("Empty inputs render the empty-state placeholder + sub", async ({
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
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const quotaStat = page
                .locator(".qw-topbar__stats .qw-stat")
                .filter({ hasText: /annual quota/i });
            const quotaValue = await quotaStat
                .locator(".qw-stat__value")
                .textContent();
            // Default quota is 0 → renders the "—" placeholder.
            expect(quotaValue?.trim()).toBe("—");

            const quotaSub = await quotaStat
                .locator(".qw-stat__sub")
                .textContent();
            expect(quotaSub?.toLowerCase()).toContain("not set");
        } finally {
            await ctx.close();
        }
    });

    test("H1 + hero touches/day + posture pill still render", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const h1 = await page
                .locator(".qw-topbar__title")
                .textContent();
            expect(h1?.toLowerCase()).toContain("make the math feel daily");

            await expect(page.locator(".qw-hero__value")).toBeAttached();
            await expect(page.locator(".qw-band")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Downstream surfaces still mount", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".qw-cov")).toBeAttached();
            await expect(page.locator(".qw-plan")).toBeAttached();
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
                "/quota-workback/?ds=0&returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
