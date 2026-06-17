import { test, expect } from "@playwright/test";
import { ALL_ROOMS } from "@/lib/palette/registry";

// Phase C (ADR-010, 2026-05-31): the palette now surfaces skills
// alongside rooms. Each skill registered in src/skills/lib/registry.ts
// adds a row + bumps the count. We hardcode the count rather than
// import it because the registry uses Vite's `?raw` for .md files,
// which Playwright's plain Node test loader can't resolve. The five
// starter skills are locked in ADR-010 §"Five starter skills"; if a
// sixth ships, bump this number + the ADR together.
const SKILLS_COUNT = 5;

/**
 * Program 6 / PR 1 — palette + back-pill end-to-end walk.
 *
 * Verifies the two birdseye-navigation primitives this PR shipped:
 *
 *   1. The cmd+K palette opens from any room, lists every room,
 *      filters, and navigates on Enter.
 *   2. The canonical RoomChrome BackButton renders across every
 *      destination room when continuity params arrive (closes the
 *      back-pill regression where 18 of 20 rooms silently dropped
 *      the back-affordance).
 *
 * Reference:
 *   - CLAUDE.md Part II §5 ("the command palette is a force
 *     multiplier, not a dependency")
 *   - CLAUDE.md Part III §6 ("room access as a secondary, summoned
 *     action")
 */

const SAMPLE_ROOMS_FOR_BACKBUTTON: ReadonlyArray<{
    readonly path: string;
    readonly returnTo: string;
    readonly returnLabel: string;
}> = [
    // Sample one room per composition family that previously had no
    // back-affordance. If RoomChrome wired correctly, every one of
    // these renders the .c-back pill when continuity is set.
    {
        path: "/discovery-studio/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/future-autopsy/",
        returnTo: "/deal-workspace/",
        returnLabel: "Back to Deal Workspace"
    },
    {
        path: "/poc-framework/",
        returnTo: "/deal-workspace/",
        returnLabel: "Back to Deal Workspace"
    },
    {
        path: "/advisor-deploy/",
        returnTo: "/deal-workspace/",
        returnLabel: "Back to Deal Workspace"
    },
    {
        path: "/icp-studio/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/territory-architect/",
        returnTo: "/icp-studio/",
        returnLabel: "Back to ICP Studio"
    },
    {
        path: "/sourcing-workbench/",
        returnTo: "/territory-architect/",
        returnLabel: "Back to Territory Architect"
    },
    {
        path: "/call-planner/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/quota-workback/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/founding-gtm/",
        returnTo: "/quota-workback/",
        returnLabel: "Back to Quota Workback"
    },
    {
        path: "/outbound-studio/",
        returnTo: "/signal-console/",
        returnLabel: "Back to Signal Console"
    },
    {
        path: "/cold-call-studio/",
        returnTo: "/signal-console/",
        returnLabel: "Back to Signal Console"
    },
    {
        path: "/linkedin-playbook/",
        returnTo: "/signal-console/",
        returnLabel: "Back to Signal Console"
    },
    {
        path: "/signal-console/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/deal-workspace/",
        returnTo: "/dashboard/",
        returnLabel: "Back to Dashboard"
    },
    {
        path: "/dashboard/",
        returnTo: "/welcome/",
        returnLabel: "Back to Welcome"
    },
    {
        path: "/welcome/",
        returnTo: "/onboarding/",
        returnLabel: "Back to Onboarding"
    },
    {
        path: "/onboarding/",
        returnTo: "/start.html",
        returnLabel: "Back to preview"
    }
];

test.describe("Program 6 / PR 1 — back-pill regression closed", () => {
    for (const { path, returnTo, returnLabel } of SAMPLE_ROOMS_FOR_BACKBUTTON) {
        test(`${path} renders .c-back when continuity is set`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                const url = `${path}?returnTo=${encodeURIComponent(returnTo)}&returnLabel=${encodeURIComponent(returnLabel)}&fromMode=test&fromSurface=program-6`;
                await page.goto(url, { waitUntil: "domcontentloaded" });
                await page.waitForTimeout(300);

                // The canonical back-pill renders.
                const back = page.locator(".c-back");
                await expect(back).toBeAttached();

                const href = await back.getAttribute("href");
                expect(href).toBe(returnTo);

                const text = await back.textContent();
                expect(text).toContain(returnLabel);
            } finally {
                await ctx.close();
            }
        });
    }

    test("cold landing (no continuity) → .c-back is not rendered", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // A handful of rooms — same conditional-render contract.
            for (const path of [
                "/dashboard/",
                "/signal-console/",
                "/future-autopsy/",
                "/negotiation/"
            ]) {
                await page.goto(path, { waitUntil: "domcontentloaded" });
                await page.waitForTimeout(200);
                await expect(page.locator(".c-back")).toHaveCount(0);
            }
        } finally {
            await ctx.close();
        }
    });
});

test.describe("Program 6 / PR 1 — cmd+K palette", () => {
    test("palette opens via cmd+K, lists every registered room, filters, navigates", async ({
        browser
    }) => {
        // Total derives from the palette registry — bumps automatically
        // when a new room lands (e.g. Briefing B.0b: 20 → 21). Keeps the
        // count assertion in lockstep with registry.ts so each new room
        // doesn't have to remember to bump this file.
        // ADR-010 (Phase C, 2026-05-31): the palette now surfaces skills
        // alongside rooms — total = rooms + SKILLS_COUNT (declared above).
        const totalRooms = ALL_ROOMS.length;
        const totalItems = ALL_ROOMS.length + SKILLS_COUNT;

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/?today=0", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Palette is NOT mounted on cold landing.
            await expect(page.locator(".ant-palette")).toHaveCount(0);

            // Press cmd+K (Meta+K on mac, Ctrl+K elsewhere — Playwright
            // accepts the Meta key uniformly).
            await page.keyboard.press("Meta+k");
            await page.waitForTimeout(150);
            await expect(page.locator(".ant-palette")).toBeAttached();

            // Count shows every registered item (rooms + skills) initially.
            const count = await page.locator(".ant-palette__count").textContent();
            expect(count).toContain(`${totalItems} / ${totalItems}`);

            // Result rows render — one per registered room + one per skill.
            const results = page.locator(".ant-palette__result");
            expect(await results.count()).toBe(totalItems);

            // Of those, exactly the room count are room-kind.
            const roomRows = page.locator('[data-palette-kind="room"]');
            expect(await roomRows.count()).toBe(totalRooms);

            // Filter to "negotiation" — single result (no skill matches it).
            await page.fill(".ant-palette__input", "negotiation");
            await page.waitForTimeout(120);
            const filtered = page.locator(".ant-palette__result");
            expect(await filtered.count()).toBe(1);
            const filteredText = await filtered.first().textContent();
            expect(filteredText?.toLowerCase()).toContain("negotiation");
        } finally {
            await ctx.close();
        }
    });

    test("palette filters by keyword (e.g. 'indemnification' → Negotiation)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/?today=0", { waitUntil: "domcontentloaded" });
            await page.keyboard.press("Meta+k");
            await page.waitForTimeout(120);

            await page.fill(".ant-palette__input", "indemnification");
            await page.waitForTimeout(120);

            const result = page.locator(".ant-palette__result").first();
            const text = await result.textContent();
            expect(text?.toLowerCase()).toContain("negotiation");
        } finally {
            await ctx.close();
        }
    });

    test("palette Enter navigates to focused result", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/?today=0", { waitUntil: "domcontentloaded" });
            await page.keyboard.press("Meta+k");
            await page.waitForTimeout(120);

            // Filter to deal workspace — first result is the deal workspace.
            await page.fill(".ant-palette__input", "deal workspace");
            await page.waitForTimeout(120);
            await page.keyboard.press("Enter");
            await page.waitForURL("**/deal-workspace/**", { timeout: 5000 });
            expect(page.url()).toContain("/deal-workspace/");
        } finally {
            await ctx.close();
        }
    });

    test("palette Escape closes", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/?today=0", { waitUntil: "domcontentloaded" });
            await page.keyboard.press("Meta+k");
            await page.waitForTimeout(120);
            await expect(page.locator(".ant-palette")).toBeAttached();
            await page.keyboard.press("Escape");
            await page.waitForTimeout(120);
            await expect(page.locator(".ant-palette")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("palette hint button is visible + clickable on every room (mouse path)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Sample 3 rooms — same chrome on all.
            for (const path of [
                "/dashboard/",
                "/discovery-studio/",
                "/settings/"
            ]) {
                await page.goto(path, { waitUntil: "domcontentloaded" });
                await page.waitForTimeout(200);
                const hint = page.locator(".ant-room-chrome__palette-hint");
                await expect(hint).toBeAttached();
                const text = await hint.textContent();
                expect(text?.toLowerCase()).toContain("jump");

                // Clicking the hint opens the palette.
                await hint.click();
                await page.waitForTimeout(200);
                await expect(page.locator(".ant-palette")).toBeAttached();
                await page.keyboard.press("Escape");
                await page.waitForTimeout(120);
            }
        } finally {
            await ctx.close();
        }
    });
});
