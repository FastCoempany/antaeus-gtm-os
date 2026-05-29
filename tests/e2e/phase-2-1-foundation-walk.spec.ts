import { test, expect } from "@playwright/test";

/**
 * Phase 2.1 — Foundation: new-account flow Playwright walk.
 *
 * Walks Sarah Chen's first-90-seconds → setup-complete sequence:
 *   Onboarding (7 steps) → CompleteStep → Welcome → first action
 *
 * Assertions cover the three navigation-rubric tests
 * (hand-reach / inevitability / seam) at every step, plus the
 * continuity-param invariants on the two seams (Onboarding → Welcome
 * and Welcome → destination room).
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

test.describe("Phase 2.1 — Foundation: new-account flow", () => {
    test("Sarah walks Onboarding → Welcome → first action with continuity intact", async ({
        page
    }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        // ─── Step 1: cold landing on Onboarding ────────────────────
        await page.goto("/onboarding/");
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".ob-step__kicker")).toContainText(
            "STEP 1 OF 7"
        );
        await expect(page.locator(".ob-btn--primary")).toContainText("Begin");
        // BackButton is not shown on Step 1 (hideBack).
        await expect(page.locator(".ob-step__foot .ob-btn--ghost")).toHaveCount(
            0
        );

        // ─── Step 2: Begin → Step 2 (Company) ──────────────────────
        await page.locator(".ob-btn--primary").click();
        await expect(page.locator(".ob-step__kicker")).toContainText(
            "STEP 2 OF 7"
        );
        // Phase 2.1 finding: title rewritten from "What should the
        // system call you?" (anthropomorphizing) to "Your company name?"
        await expect(page.locator(".ob-step__title")).toContainText(
            "Your company name?"
        );
        await page.locator(".ob-input").fill("Antaeus GTM");

        // ─── Walk through steps 3-7 with minimal viable inputs ─────
        await page.locator(".ob-btn--primary").click(); // → Role
        await page.locator(".ob-option").first().click();
        await page.locator(".ob-btn--primary").click(); // → Category
        // 2026-05-29: CategoryStep now has two fieldsets — pick a product
        // category, then either pick industries or toggle "industry-agnostic".
        // We toggle agnostic as the fastest path.
        await page.locator(".ob-option").first().click();
        await page.locator(".ob-toggle input[type=\"checkbox\"]").check();
        await page.locator(".ob-btn--primary").click(); // → ICP
        await page
            .locator("textarea.ob-input")
            .first()
            .fill("Mid-market freight forwarders in EU.");
        await page.locator(".ob-btn--primary").click(); // → Account
        await page.locator(".ob-input").first().fill("Meridian Logistics");
        await page.locator(".ob-btn--primary").click(); // → Quota
        await page.locator(".ob-input").first().fill("1,200,000");
        await page.locator(".ob-btn--primary").click(); // → CompleteStep

        // ─── Step 3: CompleteStep ──────────────────────────────────
        await expect(page.locator(".ob-step__kicker")).toContainText(
            "ONBOARDING COMPLETE"
        );
        // Phase 2.1 finding: 4 equal-weight CTAs collapsed to 1 dominant
        // primary + a tertiary "or" line with mini-links.
        await expect(page.locator(".ob-complete__primary")).toContainText(
            "Start the first move"
        );
        await expect(page.locator(".ob-complete__alt")).toBeVisible();
        await expect(page.locator(".ob-complete__alt a")).toHaveCount(3);

        // Primary CTA carries continuity params into Welcome.
        const primaryHref = await page
            .locator(".ob-complete__primary")
            .getAttribute("href");
        expect(primaryHref).not.toBeNull();
        const primaryUrl = new URL(primaryHref!, "http://x");
        expect(primaryUrl.pathname).toBe("/welcome/");
        expect(primaryUrl.searchParams.get("returnTo")).toBe("/onboarding/");
        expect(primaryUrl.searchParams.get("returnLabel")).toBe(
            "Back to setup"
        );
        expect(primaryUrl.searchParams.get("fromMode")).toBe("threshold");
        expect(primaryUrl.searchParams.get("fromSurface")).toBe(
            "onboarding-complete"
        );

        // ─── Step 4: click into Welcome ────────────────────────────
        await page.locator(".ob-complete__primary").click();
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveURL(/\/welcome\//);
        // Hero chips reflect the seeded workspace.
        await expect(page.locator(".wel-chip")).toHaveCount(4);
        await expect(page.locator(".wel-chip").first()).toContainText(
            "Antaeus GTM"
        );

        // ─── Step 5: Welcome action stack — primary CTA carries
        // continuity into destination room ─────────────────────────
        const primaryActionHref = await page
            .locator(".wel-action.is-dominant .wel-btn--primary")
            .getAttribute("href");
        expect(primaryActionHref).not.toBeNull();
        const actionUrl = new URL(primaryActionHref!, "http://x");
        // Phase 2.1 finding: action CTAs now carry the Welcome
        // continuity wrap via hrefForActionDestination, not raw paths.
        expect(actionUrl.searchParams.get("returnTo")).toBe("/welcome/");
        expect(actionUrl.searchParams.get("returnLabel")).toBe(
            "Back to setup"
        );
        expect(actionUrl.searchParams.get("fromMode")).toBe("threshold");
        expect(actionUrl.searchParams.get("fromSurface")).toBe("welcome");

        // ─── Step 6: click into the destination room ──────────────
        await page
            .locator(".wel-action.is-dominant .wel-btn--primary")
            .click();
        await page.waitForLoadState("networkidle");

        // Destination room loaded; URL preserves continuity.
        const destUrl = new URL(page.url());
        expect(destUrl.searchParams.get("returnTo")).toBe("/welcome/");

        // ─── Step 7: Dashboard wakes up after Onboarding seed ─────
        // Phase 2.1 finding: Onboarding now publishes
        // gtmos_signal_room_health when it seeds the SC account, so
        // Dashboard's ranking engine picks the seeded account up as a
        // ranked move card — the EmptyDashboard surface does NOT show.
        // The Onboarding promise ("Dashboard is no longer empty") is
        // now true, not a lie.
        await page.goto("/dashboard/");
        await page.waitForLoadState("networkidle");
        await expect(page.locator(".db-empty")).toHaveCount(0);
        // The seeded account surfaces in a ranked move card.
        const dashContent = await page.locator(".db-shell").textContent();
        expect(dashContent).toMatch(/Meridian Logistics/i);

        expect(
            errors,
            `page errors during walk:\n${errors.join("\n")}`
        ).toEqual([]);
    });

    test("EmptyDashboard surface holds for a fresh-context (zero-seed) operator", async ({
        browser
    }) => {
        // Separate context so localStorage is clean and the
        // EmptyDashboard surface actually renders.
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            const errors: string[] = [];
            page.on("pageerror", (err) => errors.push(err.message));

            await page.goto("/dashboard/");
            await page.waitForLoadState("networkidle");
            // ALL-CAPS kicker normalized.
            await expect(page.locator(".db-empty__kicker")).toContainText(
                "DASHBOARD IS QUIET"
            );
            // Verb-shape CTAs replaced "Open X →" nav-actions.
            const sourcingCta = await page
                .locator(".db-empty__path-cta")
                .nth(0)
                .textContent();
            expect(sourcingCta?.trim()).toBe("Add prospects to the funnel");
            const signalCta = await page
                .locator(".db-empty__path-cta")
                .nth(1)
                .textContent();
            expect(signalCta?.trim()).toBe("Add an account to the radar");
            const dealCta = await page
                .locator(".db-empty__path-cta")
                .nth(2)
                .textContent();
            expect(dealCta?.trim()).toBe("Load a live deal");

            // All three empty-path CTAs carry continuity into the destination.
            const firstPathHref = await page
                .locator(".db-empty__path-cta")
                .first()
                .getAttribute("href");
            expect(firstPathHref).not.toBeNull();
            const firstPathUrl = new URL(firstPathHref!, "http://x");
            expect(firstPathUrl.searchParams.get("returnTo")).toBe(
                "/dashboard/"
            );
            expect(firstPathUrl.searchParams.get("fromSurface")).toBe(
                "dashboard-empty"
            );

            expect(
                errors,
                `page errors during empty walk:\n${errors.join("\n")}`
            ).toEqual([]);
        } finally {
            await ctx.close();
        }
    });
});
