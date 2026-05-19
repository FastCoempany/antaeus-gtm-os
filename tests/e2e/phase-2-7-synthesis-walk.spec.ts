import { test, expect } from "@playwright/test";

/**
 * Phase 2.7 — Synthesis flow Playwright walk.
 *
 * Sarah Chen tightens her quota math in Quota Workback, then walks
 * into Founding GTM to see how the day-one weekly rhythm reads
 * for her first AE. Two rooms; synthesis is the cluster Phase 2.7
 * owns. (Readiness Score gets its own 2.8 slice.)
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

test.describe("Phase 2.7 — Synthesis flow", () => {
    test("Quota Workback handoff cards include Founding GTM (synthesis seam)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.7 finding: Synthesis flow used to dead-end at
            // QW — handoff cards routed to Outbound / Cold Call /
            // Dashboard / Deal Workspace but never to Founding GTM
            // (the synthesis culmination room). Now 5 cards.
            const titles = await page
                .locator(".qw-handoff-card__title")
                .allTextContents();
            expect(titles).toContain("Founding GTM");

            const foundingCta = page
                .locator(".qw-handoff-card")
                .filter({ hasText: "Founding GTM" })
                .locator(".qw-btn");
            await expect(foundingCta).toContainText("Open the kit");
            const foundingHref = await foundingCta.getAttribute("href");
            expect(foundingHref).not.toBeNull();
            const u = new URL(foundingHref!, "http://x");
            expect(u.pathname).toBe("/founding-gtm/");
            expect(u.searchParams.get("returnTo")).toBe("/quota-workback/");
            expect(u.searchParams.get("focusRoom")).toBe("Founding GTM");
        } finally {
            await ctx.close();
        }
    });

    test("Quota Workback handoffs no longer carry placeholder focus", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/", { waitUntil: "networkidle" });
            await page.waitForTimeout(200);

            // Phase 2.7 finding: 4 handoff hrefs used to set
            // focusObject="Quota pressure plan" (placeholder string,
            // Invariant 8 violation). Now omitted entirely.
            const hrefs = await page
                .locator(".qw-handoff-card .qw-btn")
                .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
            for (const h of hrefs) {
                expect(h).not.toContain("Quota+pressure+plan");
                expect(h).not.toContain("Quota%20pressure%20plan");
            }
        } finally {
            await ctx.close();
        }
    });

    test("Quota Workback Dashboard CTA no longer leaks mode=spotlight", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/quota-workback/", { waitUntil: "networkidle" });
            await page.waitForTimeout(200);

            // Phase 2.7 finding: Dashboard handoff used to set
            // ?mode=spotlight + focusRoom="Spotlight" (internal
            // mode vocab + wrong roomLabel). Now plain.
            const dashHref = await page
                .locator(".qw-handoff-card")
                .filter({ hasText: "Dashboard" })
                .locator(".qw-btn")
                .getAttribute("href");
            expect(dashHref).not.toBeNull();
            const u = new URL(dashHref!, "http://x");
            expect(u.searchParams.get("mode")).toBeNull();
            expect(u.searchParams.get("focusRoom")).toBe("Dashboard");
        } finally {
            await ctx.close();
        }
    });

    test("Founding GTM HandoffStrip exists with 3 destinations (was missing)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/founding-gtm/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.7 finding: FG had ZERO outbound affordance
            // before this PR. Now HandoffStrip surfaces 3 paths.
            await expect(page.locator(".fg-handoff")).toBeAttached();
            const labels = await page
                .locator(".fg-handoff__cta")
                .allTextContents();
            expect(labels).toContain("Open the Dashboard");
            expect(labels).toContain("Refine the quota math");
            expect(labels).toContain("Re-run onboarding");
        } finally {
            await ctx.close();
        }
    });
});
