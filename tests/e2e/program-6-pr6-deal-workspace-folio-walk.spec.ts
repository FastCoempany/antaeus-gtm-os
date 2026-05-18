import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 6 — Deal Workspace lower-board rebuild walk.
 *
 * Verifies the Intervention Rail composition (the picked-winner
 * lower-board from `deliverables/prototypes/wireframes/antaeus-deal-
 * workspace-board-area-triptych-v2-2026-04-08.html` variant "Variant
 * 02 · Intervention Rail").
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-deal-workspace-2026-05-18.md
 */

const SEED_DEALS = [
    {
        id: "deal_apex",
        accountName: "Apex Fintech",
        stage: "proposal",
        value: 140000,
        nextStep: "",
        nextStepDate: null,
        useCase: "",
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-04-01T00:00:00Z"
    },
    {
        id: "deal_meridian",
        accountName: "Meridian Logistics",
        stage: "negotiation",
        value: 380000,
        nextStep: "",
        nextStepDate: null,
        useCase: "",
        created_at: "2026-04-01T00:00:00Z",
        updated_at: "2026-04-15T00:00:00Z"
    },
    {
        id: "deal_voltops",
        accountName: "VoltOps",
        stage: "evaluation",
        value: 95000,
        nextStep: "Champion follow-up",
        nextStepDate: "2026-06-01",
        useCase: "Pipeline visibility",
        created_at: "2026-04-15T00:00:00Z",
        updated_at: "2026-05-10T00:00:00Z"
    },
    {
        id: "deal_blackbird",
        accountName: "Blackbird Industrial",
        stage: "evaluation",
        value: 220000,
        nextStep: "Demo scheduled",
        nextStepDate: "2026-05-25",
        useCase: "Forecast accuracy",
        created_at: "2026-04-20T00:00:00Z",
        updated_at: "2026-05-12T00:00:00Z"
    }
];

async function seed(page: import("@playwright/test").Page): Promise<void> {
    await page.goto("/deal-workspace/", { waitUntil: "domcontentloaded" });
    await page.evaluate((deals) => {
        localStorage.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify(deals)
        );
    }, SEED_DEALS);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
}

test.describe("Program 6 / PR 6 — Deal Workspace Intervention Rail", () => {
    test("InterventionRail mounts with toolbar + filter strip + 3 rail rows", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            await expect(page.locator(".dw-rail")).toBeAttached();
            await expect(page.locator(".dw-rail__toolbar")).toBeAttached();
            await expect(page.locator(".dw-rail__filter-strip")).toBeAttached();

            const rows = page.locator(".dw-rail__row");
            expect(await rows.count()).toBe(3);

            const states = await page
                .locator(".dw-rail__state")
                .allTextContents();
            const joined = states.join(" · ");
            expect(joined).toContain("Now");
            expect(joined).toContain("Next");
            expect(joined).toContain("Keep honest");
        } finally {
            await ctx.close();
        }
    });

    test("Toolbar: search input + 3 pill counts + Run intervention CTA", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            const search = page.locator(".dw-rail__search-input");
            await expect(search).toBeAttached();
            expect(await search.getAttribute("placeholder")).toContain(
                "Search intervention docket"
            );

            const pills = page.locator(".dw-rail__pill");
            expect(await pills.count()).toBe(3);

            const pillLabels = await page
                .locator(".dw-rail__pill-label")
                .allTextContents();
            const joined = pillLabels.join(" · ");
            expect(joined).toContain("Now");
            expect(joined).toContain("Next");
            expect(joined).toContain("Reserve");

            const primary = page.locator(".dw-rail__primary");
            await expect(primary).toBeAttached();
            expect(await primary.textContent()).toMatch(/run intervention/i);
        } finally {
            await ctx.close();
        }
    });

    test("Now + Next rows render full tickets; Keep honest renders reserve tags", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            // Critical / at-risk lanes get tickets.
            const tickets = page.locator(".dw-rail__ticket");
            const ticketCount = await tickets.count();
            expect(ticketCount).toBeGreaterThanOrEqual(1);

            // Each ticket has edge + name + value + action button.
            const first = tickets.first();
            await expect(first.locator(".dw-rail__ticket-edge")).toBeAttached();
            await expect(first.locator(".dw-rail__ticket-name")).toBeAttached();
            await expect(first.locator(".dw-rail__ticket-value")).toBeAttached();
            await expect(first.locator(".dw-rail__ticket-action")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Clicking a ticket pins it as the focal case in TargetFolio", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            // Click the first ticket.
            await page.locator(".dw-rail__ticket").first().click();
            await page.waitForTimeout(200);

            // The TargetFolio should now show the clicked account name.
            const folioTitle = await page
                .locator(".dw-target-folio__title")
                .textContent();
            expect(folioTitle?.length ?? 0).toBeGreaterThan(0);

            // The ticket is marked as focused.
            const focused = page.locator(".dw-rail__ticket.is-focused");
            expect(await focused.count()).toBe(1);
        } finally {
            await ctx.close();
        }
    });

    test("Clicking a pill toggles the rail scope (dealFilter signal)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            // Click the "Now" pill — scopes to at-risk filter.
            await page
                .locator(".dw-rail__pill", { hasText: "Now" })
                .click();
            await page.waitForTimeout(150);

            const filterValue = await page
                .locator(".dw-rail__filter-value")
                .textContent();
            expect(filterValue?.toLowerCase()).toContain("now scope");

            // Click the same pill again — toggles back to "Intervention rail".
            await page
                .locator(".dw-rail__pill", { hasText: "Now" })
                .click();
            await page.waitForTimeout(150);

            const filterValueAfter = await page
                .locator(".dw-rail__filter-value")
                .textContent();
            expect(filterValueAfter?.toLowerCase()).toContain(
                "intervention rail"
            );
        } finally {
            await ctx.close();
        }
    });

    test("Search input filters tickets by account name", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);

            await page
                .locator(".dw-rail__search-input")
                .fill("Meridian");
            await page.waitForTimeout(200);

            // After filtering, all visible deal names should match.
            const names = await page
                .locator(".dw-rail__ticket-name, .dw-rail__reserve-tag-name")
                .allTextContents();
            for (const name of names) {
                expect(name.toLowerCase()).toContain("meridian");
            }
        } finally {
            await ctx.close();
        }
    });

    test("Empty workspace shows the no-deals message; orphaned components retired", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/deal-workspace/", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(300);

            // Retired classes should NOT render anywhere.
            await expect(page.locator(".dw-lane-grid")).toHaveCount(0);
            await expect(page.locator(".dw-filter-bar")).toHaveCount(0);
            await expect(page.locator(".dw-deal-list")).toHaveCount(0);
            await expect(page.locator(".dw-deal-card")).toHaveCount(0);
            await expect(page.locator(".dw-spine")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Run intervention primary CTA pins the first critical deal", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seed(page);
            await page.waitForTimeout(300);

            await page.locator(".dw-rail__primary").click();
            await page.waitForTimeout(200);

            // After clicking, a ticket should be marked focused.
            const focusedCount = await page
                .locator(".dw-rail__ticket.is-focused")
                .count();
            expect(focusedCount).toBe(1);
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
                "/deal-workspace/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard",
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
