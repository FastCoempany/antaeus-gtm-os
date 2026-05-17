import { test, expect } from "@playwright/test";

/**
 * Phase 2.5 — Discovery flow Playwright walk.
 *
 * Sarah Chen prepped the call in Call Planner, walks into Discovery
 * Studio, runs the live call (or simulates one), then pushes the
 * deal forward into Deal Workspace.
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

const ACCOUNT = "Meridian Logistics";

test.describe("Phase 2.5 — Discovery flow", () => {
    test("Discovery surfaces inbound focused account in the kicker tail", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto(
                `/discovery-studio/?account=${encodeURIComponent(ACCOUNT)}&focusObject=${encodeURIComponent(ACCOUNT)}&returnTo=%2Fcall-planner%2F&returnLabel=Back+to+Call+Planner&fromMode=room&fromSurface=call-planner`,
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(400);

            // Phase 2.5 finding: kicker now reads
            // "DISCOVERY STUDIO · with Meridian Logistics · {framework?}"
            // instead of bare "DISCOVERY STUDIO".
            const kicker = await page
                .locator(".ds-topbar__kicker")
                .textContent();
            expect(kicker).toContain("DISCOVERY STUDIO");
            expect(kicker).toContain(ACCOUNT);
        } finally {
            await ctx.close();
        }
    });

    test("Discovery has a Handoff strip with 3 verb-shape CTAs (was missing entirely)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/", { waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            // Phase 2.5 finding: Discovery had ZERO outbound handoff
            // CTAs before this PR. Now has a HandoffStrip with 3
            // verb-shape sales moves.
            await expect(page.locator(".ds-handoff")).toBeAttached();
            const ctas = await page
                .locator(".ds-handoff__cta")
                .evaluateAll((els) =>
                    els.map((e) => ({
                        text: e.textContent?.trim(),
                        href: e.getAttribute("href")
                    }))
                );
            expect(ctas).toHaveLength(3);
            const labels = ctas.map((c) => c.text);
            expect(labels).toContain("Push to the deal");
            expect(labels).toContain("Pre-mortem this deal");
            expect(labels).toContain("Plan the next call");

            // Continuity wrap on all three.
            for (const c of ctas) {
                const u = new URL(c.href!, "http://x");
                expect(u.searchParams.get("returnTo")).toBe(
                    "/discovery-studio/"
                );
                expect(u.searchParams.get("returnLabel")).toBe(
                    "Back to Discovery"
                );
                expect(u.searchParams.get("fromMode")).toBe("room");
                expect(u.searchParams.get("fromSurface")).toBe(
                    "discovery-studio"
                );
            }
        } finally {
            await ctx.close();
        }
    });

    test("Discovery → Deal Workspace handoff carries focused account through", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto(
                `/discovery-studio/?account=${encodeURIComponent(ACCOUNT)}&focusObject=${encodeURIComponent(ACCOUNT)}`,
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(400);

            const primaryHref = await page
                .locator(".ds-handoff__cta--primary")
                .getAttribute("href");
            expect(primaryHref).not.toBeNull();
            const u = new URL(primaryHref!, "http://x");
            expect(u.pathname).toBe("/deal-workspace/");
            expect(u.searchParams.get("focusObject")).toBe(ACCOUNT);
        } finally {
            await ctx.close();
        }
    });
});
