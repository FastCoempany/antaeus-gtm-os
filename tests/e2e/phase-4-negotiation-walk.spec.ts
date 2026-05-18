import { test, expect } from "@playwright/test";

/**
 * Phase 4 — Negotiation room rebuild Playwright walk.
 *
 * Sarah Chen lands in Deal Workspace, sees a negotiation-stage deal
 * → uses the new "Rehearse the negotiation" HandoffStrip CTA →
 * lands in the Negotiation desk with the deal auto-selected →
 * picks a counterparty + an ask-moment → logs an outcome → uses
 * the "Update the deal" handoff to return to Deal Workspace.
 *
 * Reference:
 *   - canon §4.16b (Negotiation room mind)
 *   - deliverables/audit/navigation-rubric-2026-05.md (rubric)
 *   - deliverables/audit/continuity-params-2026-05.md (invariants)
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
    }
];

test.describe("Phase 4 — Negotiation room rebuild", () => {
    test("Negotiation desk renders with 6 counterparties + 10 ask-moments", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/negotiation/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            // Topbar present with thesis.
            const title = await page.locator(".ng-topbar__title").textContent();
            expect(title).toContain("deliberate move");

            // 6 counterparty buttons (Phase 4 added VP Finance + InfoSec).
            const counterpartyBtns = page.locator(".ng-role-strip__btn");
            expect(await counterpartyBtns.count()).toBe(6);

            // 10 ask-moment options in the selector.
            const askMomentOptions = page
                .locator(".ng-route-rack__cell--full select option");
            expect(await askMomentOptions.count()).toBe(10);
        } finally {
            await ctx.close();
        }
    });

    test("Topbar contextual kicker carries deal · counterparty · ask-moment", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/negotiation/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            const kicker = await page
                .locator(".ng-topbar__kicker")
                .textContent();
            expect(kicker).toContain("Negotiation desk");
            // No deal selected on cold landing → no account in kicker.
            expect(kicker).toContain("CFO / Finance");
            expect(kicker).toContain("Pricing position");
        } finally {
            await ctx.close();
        }
    });

    test("HandoffStrip exists with 4 verb-shape CTAs (Phase 4 addition)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/negotiation/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(400);

            const handoffCtas = page.locator(".ng-handoff__cta");
            expect(await handoffCtas.count()).toBe(4);

            const ctaTexts = await handoffCtas.allTextContents();
            const joined = ctaTexts.join(" · ");
            expect(joined).toContain("Update the deal");
            expect(joined).toContain("Pre-mortem this deal");
            expect(joined).toContain("Carry to an advisor");
            expect(joined).toContain("Sharpen the proof");

            // Primary CTA = "Update the deal" (orange variant).
            const primary = page.locator(".ng-handoff__cta--primary");
            expect(await primary.count()).toBe(1);
            expect(await primary.textContent()).toContain("Update the deal");
        } finally {
            await ctx.close();
        }
    });

    test("Deal Workspace → Negotiation seam: focusObject + ?deal= thread through", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Seed deals on Deal Workspace.
            await page.goto("/deal-workspace/", { waitUntil: "domcontentloaded" });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(600);

            // Click into Meridian to make it the focal deal.
            const meridianRow = page
                .locator(".dw-deal-row", { hasText: "Meridian Logistics" })
                .first();
            await meridianRow.click();
            await page.waitForTimeout(200);

            // The Deal Workspace HandoffStrip should now have a
            // "Rehearse the negotiation" CTA threading deal + account.
            const negotiationCta = page.locator(
                '[data-dw-handoff="negotiation"]'
            );
            expect(await negotiationCta.count()).toBe(1);

            const href = await negotiationCta.getAttribute("href");
            expect(href).toContain("/negotiation/");
            expect(href).toContain("deal=deal_meridian");
            expect(href).toContain("focusObject=Meridian");
            expect(href).toContain("returnTo=%2Fdeal-workspace%2F");
        } finally {
            await ctx.close();
        }
    });

    test("Negotiation desk auto-selects the inbound deal via `?deal=`", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/negotiation/?deal=deal_meridian", {
                waitUntil: "domcontentloaded"
            });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // The Deal dropdown should be pre-selected.
            const dealSelect = page.locator(".ng-route-rack__cell select").first();
            const selectedValue = await dealSelect.inputValue();
            expect(selectedValue).toBe("deal_meridian");

            // Topbar kicker should now carry the account name.
            const kicker = await page
                .locator(".ng-topbar__kicker")
                .textContent();
            expect(kicker).toContain("Meridian Logistics");
        } finally {
            await ctx.close();
        }
    });

    test("Counterparty switch → pushback content updates (CFO vs InfoSec)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/negotiation/", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(300);

            // Default counterparty is CFO — pushbacks should mention
            // discount / procurement.
            const initialPushback = await page
                .locator(".ng-pushback")
                .first()
                .textContent();
            expect(initialPushback?.toLowerCase()).toContain("discount");

            // Switch to InfoSec.
            await page.locator(".ng-role-strip__btn", { hasText: "InfoSec" }).click();
            await page.waitForTimeout(150);

            // Pushbacks should now mention SOC 2 / pen test / security.
            const updatedPushback = await page
                .locator(".ng-pushback")
                .first()
                .textContent();
            expect(updatedPushback).toMatch(/SOC 2|pen|security/i);
        } finally {
            await ctx.close();
        }
    });

    test("Sibling rooms all carry Negotiation CTAs (Phase 4 cross-room wiring)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // Deal Workspace already covered above. Check PoC Framework.
            await page.goto("/poc-framework/?deal=deal_meridian", {
                waitUntil: "domcontentloaded"
            });
            await page.evaluate((deals) => {
                localStorage.setItem(
                    "gtmos_deal_workspaces",
                    JSON.stringify(deals)
                );
            }, SEED_DEALS);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            // PoC RouteRack should have a "Rehearse the negotiation" CTA.
            const pocText = await page.textContent("body");
            expect(pocText).toContain("Rehearse the negotiation");

            // Advisor Deploy: check it has the same CTA in SecondaryStack.
            await page.goto("/advisor-deploy/?deal=deal_meridian", {
                waitUntil: "networkidle"
            });
            await page.waitForTimeout(500);
            const advisorCta = page.locator(
                '[data-ad-handoff="negotiation"]'
            );
            expect(await advisorCta.count()).toBeGreaterThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });
});
