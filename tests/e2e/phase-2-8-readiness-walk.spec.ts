import { test, expect } from "@playwright/test";

/**
 * Phase 2.8 — Readiness Score slice Playwright walk.
 *
 * The Readiness Score is the §4.17 maturity assessment surfaced as
 * a Dashboard topbar Anchor + a Drawer overlay (no separate route).
 * Plus the verdict-transition ceremony that fires inside Founding
 * GTM on first upward transition into "inheritable_with_guardrails."
 *
 * This walk verifies:
 *   - The Anchor renders when readiness has data, opens the Drawer
 *   - Drawer hero no longer surfaces totalScore (per canon §4.17
 *     "verdict is the value")
 *   - Drawer's gate-blocker copy reads in behavior-shape verbs, not
 *     internal math vocab ("X below 14/20")
 *   - Founding GTM topbar surfaces the readiness verdict tag when
 *     a verdict has been computed
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

function seedLight(): void {
    // Seed enough room data to push aggregator > 0 on multiple
    // dimensions. Verdict will land at "you_are_the_system" with
    // Building gate blockers (since most dimensions stay at 0).
    localStorage.setItem(
        "gtmos_icp_analytics",
        JSON.stringify({
            icps: [
                {
                    id: "icp_1",
                    industry: "Mid-market freight",
                    buyer: "VP Operations",
                    pain: "compliance scramble",
                    qualityScore: 78,
                    updatedAt: new Date().toISOString()
                }
            ]
        })
    );
    localStorage.setItem(
        "gtmos_sc_v4",
        JSON.stringify({
            accounts: [
                {
                    id: "acc_1",
                    name: "Meridian Logistics",
                    heat: 88,
                    signals: [
                        {
                            id: "sig_1",
                            headline: "EU expansion",
                            confidence: 0.9,
                            published_date: new Date().toISOString(),
                            fetched_at: new Date().toISOString(),
                            ai: true,
                            status: "active"
                        }
                    ]
                }
            ]
        })
    );
    localStorage.setItem(
        "gtmos_deal_workspaces",
        JSON.stringify([
            {
                id: "deal_1",
                accountName: "Meridian Logistics",
                stage: "negotiation",
                value: 380000,
                nextStep: "Locked next step",
                nextStepDate: "2026-06-01",
                created_at: "2026-04-01T00:00:00Z",
                updated_at: new Date().toISOString()
            }
        ])
    );
}

test.describe("Phase 2.8 — Readiness slice", () => {
    test("Drawer hero kicker reads 'READINESS' alone (no totalScore leak)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedLight);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            await expect(page.locator(".db-readiness-anchor")).toBeAttached();
            await page.locator(".db-readiness-anchor").click();
            await page.waitForTimeout(200);

            // Phase 2.8 finding: drawer hero kicker no longer surfaces
            // the totalScore. Per canon §4.17 the verdict is the value.
            const kicker = await page
                .locator(".db-readiness-drawer__kicker")
                .textContent();
            expect(kicker?.trim()).toBe("READINESS");
            expect(kicker).not.toMatch(/\d+\/100/);
        } finally {
            await ctx.close();
        }
    });

    test("Drawer gate-blockers read behavior-shape, not 'X below 14/20'", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedLight);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            await page.locator(".db-readiness-anchor").click();
            await page.waitForTimeout(200);

            const blockerTexts = await page
                .locator(".db-readiness-blocker")
                .allTextContents();
            // Phase 2.8 finding: copy rewritten in behavior-shape.
            // Should not match the old internal-math patterns.
            for (const b of blockerTexts) {
                expect(b).not.toMatch(/below \d+\/20/);
                expect(b).not.toMatch(/^Need \d+\+ dimensions above/);
                expect(b).not.toBe("No cast proofs");
                expect(b).not.toBe("No closed-won deals yet");
            }
            // At least one blocker should describe a behavior (start
            // with a verb or include a recognizable verb).
            const hasVerb = blockerTexts.some((b) =>
                /\b(start|cast|run|deploy|close|tighten|strengthen|fill|make|bring|log)\b/i.test(
                    b
                )
            );
            expect(hasVerb).toBe(true);
        } finally {
            await ctx.close();
        }
    });

    test("Drawer closes via Escape and via backdrop click", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });
            await page.evaluate(seedLight);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // Open + Escape
            await page.locator(".db-readiness-anchor").click();
            await expect(page.locator(".db-readiness-drawer")).toBeAttached();
            await page.keyboard.press("Escape");
            await page.waitForTimeout(200);
            await expect(page.locator(".db-readiness-drawer")).toHaveCount(0);

            // Open + backdrop click
            await page.locator(".db-readiness-anchor").click();
            await expect(page.locator(".db-readiness-drawer")).toBeAttached();
            await page
                .locator(".db-readiness-drawer__backdrop")
                .click({ force: true });
            await page.waitForTimeout(200);
            await expect(page.locator(".db-readiness-drawer")).toHaveCount(0);
        } finally {
            await ctx.close();
        }
    });

    test("Founding GTM surfaces readiness verdict tag when verdict is known", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/founding-gtm/", { waitUntil: "domcontentloaded" });
            // Seed the last-verdict key that Dashboard's readiness-
            // history publisher writes.
            await page.evaluate(() => {
                localStorage.setItem(
                    "gtmos_readiness_last_verdict",
                    "building"
                );
            });
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.8 finding: FG topbar used to never render the
            // readiness rail (verdictLabel was hard-coded null in
            // FoundingGtm.tsx). Now reads gtmos_readiness_last_verdict
            // on boot + storage events.
            await expect(page.locator(".fg-readiness-tag")).toBeAttached();
            const text = await page
                .locator(".fg-readiness-tag")
                .textContent();
            expect(text).toMatch(/READINESS/i);
            expect(text).toMatch(/Building/i);
        } finally {
            await ctx.close();
        }
    });
});
