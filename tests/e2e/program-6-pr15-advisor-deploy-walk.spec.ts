import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 15 — Advisor Deploy refacing walk.
 *
 * Verifies the Backchannel Desk V01 structural addition:
 *   - Rolodex carries a "Do not use" anti-tab when a cost-flagged
 *     advisor is in the registry for the current ask moment
 *   - Anti-tab is NOT a clickable button
 *   - Anti-tab kicker reads "DO NOT USE"
 *   - All existing desk surfaces still mount
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-advisor-deploy-2026-05-18.md
 */

const T1_ADVISOR_REGISTRY = JSON.stringify({
    advisors: [
        {
            id: "adv-t1",
            name: "Priya Board",
            title: "Board member",
            tier: "t1",
            expertise: "fintech, ai",
            equity: "",
            companies: ["Acme Robotics"],
            notes: "",
            relationship: "active",
            createdAt: "2026-05-19T00:00:00Z"
        },
        {
            id: "adv-t3",
            name: "Maya Angel",
            title: "Angel investor",
            tier: "t3",
            expertise: "",
            equity: "",
            companies: ["Acme Robotics"],
            notes: "",
            relationship: "active",
            createdAt: "2026-05-19T00:00:00Z"
        }
    ]
});

const DEAL_REGISTRY = JSON.stringify([
    {
        id: "deal-a",
        accountName: "Acme Robotics",
        contactName: "Sarah Chen",
        contactTitle: "VP Eng",
        value: 80000,
        stage: "discovery",
        nextStep: "",
        nextStepDate: "",
        notes: "",
        createdAt: "2026-05-19T00:00:00Z"
    }
]);

test.describe("Program 6 / PR 15 — Advisor Deploy refacing (Backchannel Desk V01)", () => {
    test("Anti-tab renders when a T1 advisor exists for a low-stakes intro", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript(
                ({ advisors, deals }) => {
                    localStorage.setItem("gtmos_advisor_registry", advisors);
                    localStorage.setItem("gtmos_deal_workspaces", deals);
                },
                { advisors: T1_ADVISOR_REGISTRY, deals: DEAL_REGISTRY }
            );
            await page.goto("/advisor-deploy/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // Default moment is "intro" — T1 should be too-expensive.
            await expect(
                page.locator(".ad-rolodex__antitab")
            ).toBeAttached();
            const kicker = await page
                .locator(".ad-rolodex__antitab-kicker")
                .textContent();
            expect(kicker?.toLowerCase()).toContain("don't use yet");
        } finally {
            await ctx.close();
        }
    });

    test("Anti-tab is not a clickable button", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript(
                ({ advisors, deals }) => {
                    localStorage.setItem("gtmos_advisor_registry", advisors);
                    localStorage.setItem("gtmos_deal_workspaces", deals);
                },
                { advisors: T1_ADVISOR_REGISTRY, deals: DEAL_REGISTRY }
            );
            await page.goto("/advisor-deploy/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            const tagName = await page
                .locator(".ad-rolodex__antitab")
                .evaluate((el) => el.tagName.toLowerCase());
            expect(tagName).toBe("article");
        } finally {
            await ctx.close();
        }
    });

    test("Anti-tab disappears when the moment makes the T1 carrier appropriate", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.addInitScript(
                ({ advisors, deals }) => {
                    localStorage.setItem("gtmos_advisor_registry", advisors);
                    localStorage.setItem("gtmos_deal_workspaces", deals);
                },
                { advisors: T1_ADVISOR_REGISTRY, deals: DEAL_REGISTRY }
            );
            await page.goto("/advisor-deploy/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await expect(
                page.locator(".ad-rolodex__antitab")
            ).toBeAttached();

            // Switch the ask moment to board_decision (high-stakes).
            // T1 advisor is no longer too-expensive; T3 is fine; no
            // T4 in the registry means underpowered branch can't
            // fire either → anti-tab disappears.
            const momentSelect = page
                .locator(".ad-desk__route select")
                .nth(2);
            await momentSelect.selectOption("board_decision");
            await page.waitForTimeout(200);

            await expect(
                page.locator(".ad-rolodex__antitab")
            ).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Existing desk surfaces still mount", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/advisor-deploy/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            await expect(page.locator(".ad-desk")).toBeAttached();
            await expect(page.locator(".ad-desk__hero")).toBeAttached();
            await expect(page.locator(".ad-desk__route")).toBeAttached();
            await expect(page.locator(".ad-blotter")).toBeAttached();
            await expect(page.locator(".ad-rolodex")).toBeAttached();
            await expect(page.locator(".ad-asksheet")).toBeAttached();
            const stampCount = await page.locator(".ad-stamps .ad-stamp").count();
            expect(stampCount).toBeGreaterThanOrEqual(3);
            await expect(page.locator(".ad-desk__edge")).toBeAttached();
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
                "/advisor-deploy/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
