import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 2.10 — Integration walk (Phase 2 closeout gate).
 *
 * Scripts Sarah Chen's full operating day end-to-end:
 *   1. First 90 seconds — cold signup → Onboarding completion →
 *      Welcome → first real move
 *   2. Tuesday morning — return to a live workspace, scan ranked
 *      pressure, click into the dominant move
 *   3. Strategy flow — sharpen ICP, hand off into Territory with
 *      the wedge propagating
 *   4. Outbound flow — Signal Console → Outbound Studio with focus
 *      preserved
 *   5. Discovery flow — Discovery Studio handoff exists (was missing
 *      entirely pre-2.5)
 *   6. Recovery flow — Deal Workspace HandoffStrip exists (was
 *      missing entirely pre-2.6)
 *   7. Synthesis flow — Quota Workback → Founding GTM (new seam in
 *      2.7)
 *   8. Readiness slice — Anchor + Drawer + behavior-shape blockers
 *   9. Trust flow — Settings back-affordance from Dashboard
 *
 * The walk is the proof that the seams hold ACROSS flow PR
 * boundaries. Each individual flow has its own walk PR (2.1 - 2.9);
 * this one tests they compose. Per
 * deliverables/audit/navigation-rubric-2026-05.md §"What 'done'
 * looks like."
 *
 * Reference: deliverables/audit/sarah-persona-2026-05.md (the
 * three calibrated walks).
 */

function seedTuesdayMorning(): void {
    // Mid-market workspace state Sarah would have at week 4. Seeds
    // enough to make Dashboard's snapshot aggregator + Readiness
    // aggregator come alive without needing a Supabase round-trip.
    const now = new Date().toISOString();
    localStorage.setItem(
        "gtmos_icp_analytics",
        JSON.stringify({
            icps: [
                {
                    id: "icp_1",
                    industry: "Mid-market freight forwarders",
                    buyer: "VP Operations",
                    pain: "Compliance prep is a manual scramble",
                    qualityScore: 78,
                    updatedAt: now
                }
            ]
        })
    );
    localStorage.setItem(
        "gtmos_sc_v4",
        JSON.stringify({
            accounts: [
                {
                    id: "acc_meridian",
                    name: "Meridian Logistics",
                    heat: 88,
                    signals: [
                        {
                            id: "sig_1",
                            headline: "Executive change in EU",
                            confidence: 0.9,
                            published_date: now,
                            fetched_at: now,
                            ai: true,
                            status: "active"
                        }
                    ]
                },
                {
                    id: "acc_apex",
                    name: "Apex Manufacturing",
                    heat: 72,
                    signals: [
                        {
                            id: "sig_2",
                            headline: "Compliance audit",
                            confidence: 0.7,
                            published_date: now,
                            fetched_at: now,
                            ai: false,
                            status: "active"
                        }
                    ]
                }
            ]
        })
    );
    localStorage.setItem(
        "gtmos_signal_room_health",
        JSON.stringify({
            capturedAt: now,
            accountCount: 2,
            signalCount: 2,
            readyCount: 2,
            topName: "Meridian Logistics",
            topHeat: 88,
            hot_accounts: [
                {
                    id: "acc_meridian",
                    name: "Meridian Logistics",
                    heat: 88,
                    recentSignals: 1,
                    highConfidenceSignals: 1,
                    cause: "executive_change"
                },
                {
                    id: "acc_apex",
                    name: "Apex Manufacturing",
                    heat: 72,
                    recentSignals: 1,
                    highConfidenceSignals: 0
                }
            ]
        })
    );
    localStorage.setItem(
        "gtmos_deal_workspaces",
        JSON.stringify([
            {
                id: "deal_meridian",
                accountName: "Meridian Logistics",
                stage: "negotiation",
                value: 380000,
                nextStep: "",
                nextStepDate: null,
                created_at: "2026-04-01T00:00:00Z",
                updated_at: now
            },
            {
                id: "deal_apex",
                accountName: "Apex Manufacturing",
                stage: "poc",
                value: 195000,
                nextStep: "Pilot kickoff",
                nextStepDate: "2026-06-01",
                created_at: "2026-04-15T00:00:00Z",
                updated_at: now
            }
        ])
    );
    localStorage.setItem("gtmos_readiness_last_verdict", "building");
}

async function expectContinuity(
    page: Page,
    expected: {
        returnTo?: string;
        focusObject?: string;
        fromSurface?: string;
    }
): Promise<void> {
    const search = new URL(page.url()).searchParams;
    if (expected.returnTo) {
        expect(search.get("returnTo")).toBe(expected.returnTo);
    }
    if (expected.focusObject) {
        expect(search.get("focusObject")).toBe(expected.focusObject);
    }
    if (expected.fromSurface) {
        expect(search.get("fromSurface")).toBe(expected.fromSurface);
    }
}

test.describe("Phase 2.10 — Integration walk (Sarah's full day)", () => {
    test("Sarah's first-90-seconds path: Onboarding → Welcome → first action", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 1440, height: 2400 }
        });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            // Step 1 — cold landing on Onboarding
            await page.goto("/onboarding/", { waitUntil: "networkidle" });
            await expect(page.locator(".ob-step__kicker")).toContainText(
                "STEP 1 OF 7"
            );
            await page.locator(".ob-btn--primary").click();

            // Steps 2–7 — fill with viable inputs
            await page.locator(".ob-input").fill("Antaeus GTM");
            await page.locator(".ob-btn--primary").click();
            await page.locator(".ob-option").first().click();
            await page.locator(".ob-btn--primary").click();
            await page.locator(".ob-option").first().click();
            await page.locator(".ob-btn--primary").click();
            await page
                .locator("textarea.ob-input")
                .first()
                .fill("Mid-market freight forwarders in EU.");
            await page.locator(".ob-btn--primary").click();
            await page.locator(".ob-input").first().fill("Meridian Logistics");
            await page.locator(".ob-btn--primary").click();
            await page.locator(".ob-input").first().fill("1,200,000");
            await page.locator(".ob-btn--primary").click();

            // CompleteStep — Phase 2.1 collapsed 4 CTAs into 1 dominant
            // primary + tertiary "or" line.
            await expect(page.locator(".ob-complete__primary")).toContainText(
                "Start the first move"
            );

            // Cross the seam → Welcome with continuity intact
            await page.locator(".ob-complete__primary").click();
            await page.waitForLoadState("networkidle");
            await expectContinuity(page, {
                returnTo: "/onboarding/",
                fromSurface: "onboarding-complete"
            });

            // Welcome's dominant CTA → next destination room with
            // continuity carrying through (Phase 2.1).
            const dominantHref = await page
                .locator(".wel-action.is-dominant .wel-btn--primary")
                .getAttribute("href");
            expect(dominantHref).not.toBeNull();
            const dominantUrl = new URL(dominantHref!, "http://x");
            expect(dominantUrl.searchParams.get("returnTo")).toBe("/welcome/");
            expect(dominantUrl.searchParams.get("fromSurface")).toBe("welcome");

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's Tuesday-morning loop: Dashboard ranked move → Outbound focused", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 1440, height: 2400 }
        });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedTuesdayMorning);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // Phase 2.2 — Topbar kicker contextual tail
            const kicker = await page
                .locator(".db-topbar__kicker")
                .textContent();
            expect(kicker).toContain("DASHBOARD");

            // Switch to Focus mode + verify dominant CTA routes to
            // the right room (Outbound for move cards, Deal
            // Workspace for risk cards), per Phase 2.2 seam fix.
            await page
                .locator(".db-mode-switcher__btn")
                .filter({ hasText: "Focus" })
                .click();
            await page.waitForTimeout(150);

            // Program 6 / PR 2 (Slice 01 Soft Cut): focal card is in
            // the right rail as .db-slice--focal. Title + primary
            // CTA selectors moved from .db-focal__* to .db-slice__*.
            const focalSlice = page.locator(".db-slice--focal");
            const focalTitle = await focalSlice
                .locator(".db-slice__title")
                .first()
                .textContent();
            const focalHref = await focalSlice
                .locator(".db-slice__cta")
                .first()
                .getAttribute("href");
            expect(focalHref).not.toBeNull();
            const focalUrl = new URL(focalHref!, "http://x");

            if (focalTitle?.includes("Outbound to")) {
                expect(focalUrl.pathname).toBe("/outbound-studio/");
            } else {
                expect(focalUrl.pathname).toBe("/deal-workspace/");
            }
            // Continuity intact across the seam.
            expect(focalUrl.searchParams.get("returnTo")).toBe("/dashboard/");
            expect(focalUrl.searchParams.get("focusObject")).toBeTruthy();
            expect(focalUrl.searchParams.get("fromSurface")).toBe("dashboard");

            await focalSlice.locator(".db-slice__cta").first().click();
            await page.waitForLoadState("networkidle");
            // Destination loaded with continuity preserved.
            const destSearch = new URL(page.url()).searchParams;
            expect(destSearch.get("returnTo")).toBe("/dashboard/");

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's strategy → outbound chain: focusObject propagates through 3 rooms", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            // Seed an ICP so the AnalyticsPanel renders handoffs.
            await page.goto("/icp-studio/", { waitUntil: "domcontentloaded" });
            await page.evaluate(() => {
                localStorage.setItem(
                    "gtmos_icp_analytics",
                    JSON.stringify({
                        icps: [
                            {
                                id: "icp_demo",
                                industry: "Mid-market freight forwarders",
                                buyer: "VP Operations",
                                pain: "Compliance prep is manual",
                                qualityScore: 78,
                                updatedAt: new Date().toISOString()
                            }
                        ]
                    })
                );
            });
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Hop 1: ICP Studio → Territory (Phase 2.3)
            const buildHref = await page
                .locator(".icp-handoff--primary")
                .getAttribute("href");
            expect(buildHref).not.toBeNull();
            const buildUrl = new URL(buildHref!, "http://x");
            expect(buildUrl.pathname).toBe("/territory-architect/");
            expect(buildUrl.searchParams.get("focusObject")).toBe(
                "Mid-market freight forwarders"
            );

            // Land on Territory and confirm kicker tail
            await page.locator(".icp-handoff--primary").click();
            await page.waitForLoadState("networkidle");
            await expect(page.locator(".ta-hero__kicker")).toContainText(
                "building around"
            );

            // Hop 2: Territory → Sourcing — focusObject re-propagates
            // through Territory's outbound handoff (Phase 2.3).
            const sourcingHref = await page
                .locator(".ta-handoff--primary")
                .getAttribute("href");
            expect(sourcingHref).not.toBeNull();
            const sourcingUrl = new URL(sourcingHref!, "http://x");
            expect(sourcingUrl.pathname).toBe("/sourcing-workbench/");
            expect(sourcingUrl.searchParams.get("focusObject")).toBe(
                "Mid-market freight forwarders"
            );
            expect(sourcingUrl.searchParams.get("returnTo")).toBe(
                "/territory-architect/"
            );

            // Hop 3: Sourcing → Signal — focus re-re-propagates
            await page.locator(".ta-handoff--primary").click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(200);

            // Sourcing's primary outbound handoff = Signal Console
            // (handoff strip has its own primary class).
            const sigHref = await page
                .locator(".sw-handoff__row .sw-btn--primary")
                .getAttribute("href");
            expect(sigHref).not.toBeNull();
            const sigUrl = new URL(sigHref!, "http://x");
            expect(sigUrl.pathname).toBe("/signal-console/");
            expect(sigUrl.searchParams.get("account")).toBe(
                "Mid-market freight forwarders"
            );

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's intervention chain: Deal Workspace → Future Autopsy (Phase 2.5 + 2.6 seams)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            // Phase 2.6 — Deal Workspace HandoffStrip exists (was zero).
            await page.goto("/deal-workspace/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedTuesdayMorning);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            await expect(page.locator(".dw-handoff")).toBeAttached();
            const labels = await page
                .locator(".dw-handoff__cta")
                .allTextContents();
            expect(labels).toContain("Pre-mortem this deal");

            // Phase 2.5 — Discovery Studio has its own HandoffStrip
            // with verb-shape CTAs.
            await page.goto("/discovery-studio/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);
            await expect(page.locator(".ds-handoff")).toBeAttached();
            const dsLabels = await page
                .locator(".ds-handoff__cta")
                .allTextContents();
            expect(dsLabels).toContain("Push to the deal");

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's synthesis chain: Quota Workback → Founding GTM (Phase 2.7 seam)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            await page.goto("/quota-workback/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.7 — QW's 5th handoff card points at Founding GTM.
            const titles = await page
                .locator(".qw-handoff-card__title")
                .allTextContents();
            expect(titles).toContain("Founding GTM");

            const fgCta = page
                .locator(".qw-handoff-card")
                .filter({ hasText: "Founding GTM" })
                .locator(".qw-btn");
            const fgHref = await fgCta.getAttribute("href");
            expect(fgHref).not.toBeNull();
            const fgUrl = new URL(fgHref!, "http://x");
            expect(fgUrl.pathname).toBe("/founding-gtm/");
            // No placeholder leakage (Phase 2.7 Invariant 8 sweep).
            expect(fgUrl.searchParams.get("focusObject")).toBeNull();

            // Land on FG and confirm the back-affordance + readiness
            // tag wiring (Phase 2.8 readiness slice).
            await page.evaluate(() => {
                localStorage.setItem(
                    "gtmos_readiness_last_verdict",
                    "building"
                );
            });
            await fgCta.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            // FG's HandoffStrip exists (Phase 2.7).
            await expect(page.locator(".fg-handoff")).toBeAttached();
            // FG's readiness tag exists when verdict is known (Phase 2.8).
            await expect(page.locator(".fg-readiness-tag")).toBeAttached();

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's readiness slice: Anchor → Drawer → behavior-shape blockers (Phase 2.8)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedTuesdayMorning);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // Phase 2.8 — Anchor renders when readiness has data.
            await expect(page.locator(".db-readiness-anchor")).toBeAttached();
            await page.locator(".db-readiness-anchor").click();
            await page.waitForTimeout(200);

            // Drawer kicker is "READINESS" alone (no totalScore leak).
            const drawerKicker = await page
                .locator(".db-readiness-drawer__kicker")
                .textContent();
            expect(drawerKicker?.trim()).toBe("READINESS");

            // Gate-blockers are behavior-shape (verb-led).
            const blockers = await page
                .locator(".db-readiness-blocker")
                .allTextContents();
            const hasVerbShape = blockers.some((b) =>
                /\b(start|cast|run|deploy|close|tighten|strengthen|fill|make|bring|log|get)\b/i.test(
                    b
                )
            );
            expect(hasVerbShape).toBe(true);

            // Escape closes the drawer.
            await page.keyboard.press("Escape");
            await page.waitForTimeout(200);
            await expect(page.locator(".db-readiness-drawer")).toHaveCount(0);

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });

    test("Sarah's trust check: Dashboard → Settings → back affordance (Phase 2.9)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        try {
            // Simulate Sarah opening Settings from Dashboard with the
            // canonical Dashboard handoff continuity wrap.
            await page.goto(
                "/settings/?returnTo=%2Fdashboard%2F&returnLabel=Back+to+Dashboard&fromMode=command&fromSurface=dashboard",
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(300);

            // Phase 2.9 — Back-pill renders when inbound continuity present.
            await expect(page.locator(".c-back")).toBeAttached();
            const backText = await page
                .locator(".c-back")
                .textContent();
            expect(backText).toContain("Back to Dashboard");

            // Phase 2.9 — Click the back-pill, land on Dashboard.
            await page.locator(".c-back").click();
            await page.waitForLoadState("networkidle");
            expect(new URL(page.url()).pathname).toBe("/dashboard/");

            expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
        } finally {
            await ctx.close();
        }
    });
});
