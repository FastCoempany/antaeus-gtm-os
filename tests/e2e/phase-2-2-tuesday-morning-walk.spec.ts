import { test, expect } from "@playwright/test";

/**
 * Phase 2.2 — Foundation: Tuesday-morning Dashboard walk.
 *
 * Sarah Chen opens her laptop at 8:47 AM on a Tuesday in week 4.
 * Workspace is live (12 accounts on the radar, 3 hot; 18 deals
 * open, 5 at risk, 3 stalled; quota plan in; readiness at "Building"
 * verdict). She lands on /dashboard/ and the system is supposed to
 * triage her morning + push the answer forward.
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

const TUESDAY_ISO = new Date("2026-05-19T13:47:00Z").toISOString();

const SEED = {
    gtmos_signal_room_health: {
        capturedAt: TUESDAY_ISO,
        accountCount: 12,
        signalCount: 28,
        readyCount: 3,
        topName: "Meridian Logistics",
        topHeat: 88,
        hot_accounts: [
            {
                id: "acc_meridian",
                name: "Meridian Logistics",
                heat: 88,
                recentSignals: 4,
                highConfidenceSignals: 2,
                cause: "executive_change"
            },
            {
                id: "acc_northstar",
                name: "Northstar Financial",
                heat: 72,
                recentSignals: 2,
                highConfidenceSignals: 1
            },
            {
                id: "acc_apex",
                name: "Apex Manufacturing",
                heat: 68,
                recentSignals: 3,
                highConfidenceSignals: 0
            }
        ]
    },
    gtmos_deal_workspace_health: {
        capturedAt: TUESDAY_ISO,
        active_count: 18,
        won: 2,
        lost: 1,
        pipeline_value: 4_200_000,
        critical_count: 2,
        at_risk_count: 5,
        top_pressure: [
            {
                id: "deal_meridian",
                accountName: "Meridian Logistics",
                stage: "negotiation",
                score: 78,
                cause: "no_nextstep"
            },
            {
                id: "deal_blackbird",
                accountName: "Blackbird Industrial",
                stage: "poc",
                score: 64,
                cause: "champion_weak"
            }
        ]
    }
};

test.describe("Phase 2.2 — Tuesday-morning Dashboard", () => {
    test("Sarah's Dashboard ranks her morning and routes her first click correctly", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 1440, height: 2400 }
        });
        const page = await ctx.newPage();
        try {
            const errors: string[] = [];
            page.on("pageerror", (err) => errors.push(err.message));

            // Seed Sarah's Tuesday-morning workspace state.
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate((seed) => {
                for (const [k, v] of Object.entries(seed)) {
                    localStorage.setItem(k, JSON.stringify(v));
                }
            }, SEED);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // ─── Topbar inevitability test ──────────────────────────
            // Phase 2.2 finding: kicker now carries contextual tail
            // (was just "DASHBOARD" — duplicated wordmark).
            const topbarKicker = await page
                .locator(".db-topbar__kicker")
                .textContent();
            expect(topbarKicker).toMatch(/DASHBOARD/);
            expect(topbarKicker).toMatch(/ranked|deal|move/i);

            // Mode hint caption retired.
            await expect(page.locator(".db-mode__hint")).toHaveCount(0);

            // ─── Read mode (default) ────────────────────────────────
            // Phase 2.2 finding: narrative copy rewritten without
            // canon-doc voice. Brief narrative moved to MainColumn
            // .db-main__brief block in Program 6 / PR 2 (Slice 01 Soft
            // Cut layout).
            const briefText = await page
                .locator(".db-main__brief")
                .textContent();
            expect(briefText).toMatch(/morning's top move/i);
            // Designer phrases retired.
            expect(briefText).not.toMatch(/pressure is leading/i);
            expect(briefText).not.toMatch(/in the light/i);
            expect(briefText).not.toMatch(/signal density makes/i);

            // ─── Focus mode hand-reach test ─────────────────────────
            await page
                .locator(".db-mode-switcher__btn")
                .filter({ hasText: "Focus" })
                .click();
            await page.waitForTimeout(150);

            // Program 6 / PR 2 (Slice 01 Soft Cut): focal card is now
            // .db-slice--focal in the right rail. Family is shown as
            // .db-slice__family (no raw "score {n}" tail; Phase 2.2
            // dropped that). Primary CTA is .db-slice__cta on the
            // focal slice.
            const focalSlice = page.locator(".db-slice--focal");
            const focalFamily = await focalSlice
                .locator(".db-slice__family")
                .first()
                .textContent();
            expect(focalFamily).not.toMatch(/score \d+/i);

            const focalTitle = await focalSlice
                .locator(".db-slice__title")
                .first()
                .textContent();
            const focalPrimaryHref = await focalSlice
                .locator(".db-slice__cta")
                .first()
                .getAttribute("href");
            expect(focalPrimaryHref).not.toBeNull();
            const focalPrimaryUrl = new URL(focalPrimaryHref!, "http://x");
            if (focalTitle?.includes("Outbound to")) {
                // Move card — routes to Outbound Studio with focus.
                expect(focalPrimaryUrl.pathname).toBe("/outbound-studio/");
                expect(
                    focalPrimaryUrl.searchParams.get("focusObject")
                ).toBeTruthy();
                expect(
                    focalPrimaryUrl.searchParams.get("account")
                ).toBeTruthy();
            } else {
                // Risk card (deal name as title) — routes to Deal
                // Workspace with focus.
                expect(focalPrimaryUrl.pathname).toBe("/deal-workspace/");
                expect(
                    focalPrimaryUrl.searchParams.get("focusObject")
                ).toBeTruthy();
            }
            // Continuity always intact.
            expect(focalPrimaryUrl.searchParams.get("returnTo")).toBe(
                "/dashboard/"
            );
            expect(focalPrimaryUrl.searchParams.get("returnLabel")).toBe(
                "Back to Dashboard"
            );
            expect(focalPrimaryUrl.searchParams.get("fromMode")).toBe(
                "command"
            );
            expect(focalPrimaryUrl.searchParams.get("fromSurface")).toBe(
                "dashboard"
            );

            // ─── Seam test — click and verify destination loads with focus
            await focalSlice.locator(".db-slice__cta").first().click();
            await page.waitForLoadState("networkidle");
            const destSearch = new URL(page.url()).searchParams;
            expect(destSearch.get("returnTo")).toBe("/dashboard/");
            expect(destSearch.get("focusObject")).toBeTruthy();

            expect(
                errors,
                `page errors during Tuesday morning:\n${errors.join("\n")}`
            ).toEqual([]);
        } finally {
            await ctx.close();
        }
    });
});
