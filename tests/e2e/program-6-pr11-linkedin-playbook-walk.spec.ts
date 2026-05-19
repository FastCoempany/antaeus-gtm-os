import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 11 — LinkedIn Playbook refacing walk.
 *
 * Verifies the Cue Booth V02 structural addition:
 *   - Recovery cue rule renders in the booth-read aside between
 *     Current cue and One-session win
 *   - Recovery rule carries the orange-accent recovery variant class
 *   - The 5-cue ladder (canon §4.10, not wireframe's 4) still renders
 *   - The dark stage + 3-cell cue console still mount
 *   - The cross-room handoff CTAs still mount
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-linkedin-playbook-2026-05-18.md
 */

test.describe("Program 6 / PR 11 — LinkedIn Playbook refacing (Cue Booth V02)", () => {
    test("Booth-read shows an if-they-push-back rule with the recovery variant", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const recovery = page.locator(".lp-read__rule--recovery");
            await expect(recovery).toBeAttached();
            await expect(
                recovery.locator(".lp-read__rule-kicker")
            ).toContainText(/if they push back/i);
            await expect(recovery.locator("strong")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Booth-read rule order: Current cue → If they push back → One-session win → Channel standard", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const kickers = await page
                .locator(".lp-read .lp-read__rule-kicker")
                .allTextContents();
            const lower = kickers.map((k) => k.trim().toLowerCase());

            const currentIdx = lower.indexOf("current cue");
            const recoveryIdx = lower.indexOf("if they push back");
            const oneSessionIdx = lower.indexOf("one-session win");
            const channelIdx = lower.indexOf("channel standard");

            expect(currentIdx).toBeGreaterThanOrEqual(0);
            expect(recoveryIdx).toBeGreaterThan(currentIdx);
            expect(oneSessionIdx).toBeGreaterThan(recoveryIdx);
            expect(channelIdx).toBeGreaterThan(oneSessionIdx);
        } finally {
            await ctx.close();
        }
    });

    test("5-cue ladder still renders (canon §4.10 — not wireframe's 4)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const cues = page.locator(".lp-booth__strip .lp-cue");
            expect(await cues.count()).toBe(5);
        } finally {
            await ctx.close();
        }
    });

    test("Dark stage + 3-cell cue console still mount", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".lp-stage")).toBeAttached();
            await expect(page.locator(".lp-stage__script")).toBeAttached();
            const consoleCells = await page
                .locator(".lp-stage__console > div")
                .count();
            expect(consoleCells).toBe(3);
        } finally {
            await ctx.close();
        }
    });

    test("Cross-room handoff CTAs still mount in booth-read", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(
                page.locator(".lp-read [data-lp-handoff='signal-console']")
            ).toBeAttached();
            await expect(
                page.locator(".lp-read [data-lp-handoff='outbound-studio']")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Recovery rule has non-empty motion-engine-derived copy", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            const copy = await page
                .locator(".lp-read__rule--recovery strong")
                .textContent();
            expect(copy?.trim().length ?? 0).toBeGreaterThan(15);
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
                "/linkedin-playbook/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
