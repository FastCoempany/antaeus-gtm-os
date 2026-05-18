import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 2 — Dashboard refacing walk.
 *
 * Verifies the Slice 01 Soft Cut structural shape landed:
 *
 *   - 2-column layout (.db-grid with .db-main + .db-rail)
 *   - SignalLine chip row above mode content
 *   - SliceRail with stacked .db-slice cards
 *   - Mode-specific main column content
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-dashboard-2026-05-18.md
 * Winner reference:
 *   deliverables/prototypes/wireframes/dashboard-softcut-canonical.html
 */

const SEED_DEALS = [
    {
        id: "deal_meridian",
        accountName: "Meridian Logistics",
        stage: "negotiation",
        value: 380000,
        nextStep: "",
        nextStepDate: null,
        created_at: "2026-04-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z"
    },
    {
        id: "deal_blackbird",
        accountName: "Blackbird Industrial",
        stage: "evaluation",
        value: 220000,
        nextStep: "Champion follow-up",
        nextStepDate: "2026-05-25",
        created_at: "2026-04-15T00:00:00Z",
        updated_at: "2026-05-08T00:00:00Z"
    },
    {
        id: "deal_voltops",
        accountName: "VoltOps",
        stage: "proposal",
        value: 95000,
        nextStep: "",
        nextStepDate: null,
        created_at: "2026-03-20T00:00:00Z",
        updated_at: "2026-05-02T00:00:00Z"
    }
];

const DEAL_HEALTH = {
    capturedAt: "2026-05-13T08:00:00Z",
    summary: {
        active: 3,
        won: 0,
        lost: 0,
        pipelineValue: 695000,
        atRisk: 2,
        stalled: 1,
        thisQuarter: 3
    },
    top_pressure: [
        {
            id: "deal_meridian",
            accountName: "Meridian Logistics",
            stage: "negotiation",
            value: 380000,
            risk: 78,
            staleDays: 22,
            causeText: "Champion overdue + no next step",
            causeId: "champion_weak"
        }
    ]
};

async function seedDashboard(page: import("@playwright/test").Page): Promise<void> {
    await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
    await page.evaluate(
        ({ deals, health }) => {
            localStorage.setItem(
                "gtmos_deal_workspaces",
                JSON.stringify(deals)
            );
            localStorage.setItem(
                "gtmos_deal_workspace_health",
                JSON.stringify(health)
            );
        },
        { deals: SEED_DEALS, health: DEAL_HEALTH }
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
}

test.describe("Program 6 / PR 2 — Dashboard refacing (Slice 01 Soft Cut)", () => {
    test("renders the 2-column layout (.db-grid → .db-main + .db-rail)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            await expect(page.locator(".db-grid")).toBeAttached();
            await expect(page.locator(".db-main")).toBeAttached();
            await expect(page.locator(".db-rail")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("SignalLine chip row renders 4 tone chips", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            const chips = page.locator(".db-signal-chip");
            expect(await chips.count()).toBe(4);

            const tones = ["hot", "warm", "live", "cold"];
            for (const tone of tones) {
                await expect(
                    page.locator(`.db-signal-chip--${tone}`)
                ).toBeAttached();
            }
        } finally {
            await ctx.close();
        }
    });

    test("SliceRail renders stacked Slice cards for ranked items", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            const slices = page.locator(".db-slice");
            const sliceCount = await slices.count();
            expect(sliceCount).toBeGreaterThanOrEqual(1);

            // Each slice has the left/right split + family + title.
            const firstSlice = slices.first();
            await expect(firstSlice.locator(".db-slice__left")).toBeAttached();
            await expect(firstSlice.locator(".db-slice__dock")).toBeAttached();
            await expect(firstSlice.locator(".db-slice__family")).toBeAttached();
            await expect(firstSlice.locator(".db-slice__title")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("spotlight mode renders a focal Slice (.db-slice--focal)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            await page
                .locator(".db-mode-switcher__btn")
                .filter({ hasText: "Focus" })
                .click();
            await page.waitForTimeout(150);

            await expect(page.locator(".db-slice--focal")).toBeAttached();
            const focalCount = await page.locator(".db-slice--focal").count();
            expect(focalCount).toBe(1);
        } finally {
            await ctx.close();
        }
    });

    test("brief mode renders the narrative in MainColumn", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            await page
                .locator(".db-mode-switcher__btn")
                .filter({ hasText: "Read" })
                .click();
            await page.waitForTimeout(150);

            await expect(page.locator(".db-main__brief")).toBeAttached();
            // Brief should NOT add a focal class — all slices equal weight.
            const focalCount = await page.locator(".db-slice--focal").count();
            expect(focalCount).toBe(0);
        } finally {
            await ctx.close();
        }
    });

    test("queue mode renders all slices equal-weight + meta read", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            await page
                .locator(".db-mode-switcher__btn")
                .filter({ hasText: "Triage" })
                .click();
            await page.waitForTimeout(150);

            await expect(page.locator(".db-main__queue-meta")).toBeAttached();
            // Queue mode: no focal Slice — all equal weight.
            const focalCount = await page.locator(".db-slice--focal").count();
            expect(focalCount).toBe(0);
        } finally {
            await ctx.close();
        }
    });

    test("Slice tone is derived from commandFamily (risk → hot left rule)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);
            // The deal health top_pressure entry is a risk-family item;
            // at least one Slice should render with the hot tone variant.
            const hotSlices = page.locator(".db-slice--hot");
            const hotCount = await hotSlices.count();
            expect(hotCount).toBeGreaterThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });

    test("Slice click + continuity preserved across seam", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await seedDashboard(page);

            const firstCta = page.locator(".db-slice__cta").first();
            const href = await firstCta.getAttribute("href");
            expect(href).not.toBeNull();
            const url = new URL(href!, "http://x");
            expect(url.searchParams.get("returnTo")).toBe("/dashboard/");
            expect(url.searchParams.get("fromSurface")).toBe("dashboard");
        } finally {
            await ctx.close();
        }
    });

    test("empty workspace still routes through EmptyDashboard, not the grid", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Cold landing, no seeded data.
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // EmptyDashboard renders, NOT the grid.
            await expect(page.locator(".db-empty")).toBeAttached();
            await expect(page.locator(".db-grid")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });
});
