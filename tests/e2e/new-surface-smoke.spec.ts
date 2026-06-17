import { test, expect } from "@playwright/test";

/**
 * New-surface boot smoke tests.
 *
 * As of PR #271 the design-system surface is the PRODUCTION default for
 * every room. The e2e build forces the legacy safety-net surfaces
 * (VITE_E2E_FORCE_LEGACY) so the legacy walk suite keeps validating real,
 * still-shipped code — so these tests force the NEW surface explicitly via
 * `?ds=1` (`?today=1` for the Dashboard), which overrides the force-legacy
 * gate. That gives CI direct coverage of every new production surface:
 * does it boot, and does it boot cleanly.
 *
 * Uniform contract: the WayfinderBar (`.ds-wayfinder`) renders on every DS
 * surface (it is the un-nav that travels every room), and no runtime error
 * fires during boot. Pre-validated headless across all 22 rooms against
 * both the production build and the force-legacy build (zero pageerrors,
 * `.ds-wayfinder` universal, `?ds=1` overrides force-legacy).
 *
 * This is the new-surface counterpart to smoke.spec.ts, which boots the
 * same rooms on their legacy surfaces under force-legacy.
 */

const NEW_SURFACE_ROOMS: ReadonlyArray<{ slug: string; param: string }> = [
    { slug: "discovery-studio", param: "ds=1" },
    { slug: "dashboard", param: "today=1" },
    { slug: "deal-workspace", param: "ds=1" },
    { slug: "signal-console", param: "ds=1" },
    { slug: "future-autopsy", param: "ds=1" },
    { slug: "poc-framework", param: "ds=1" },
    { slug: "outbound-studio", param: "ds=1" },
    { slug: "cold-call-studio", param: "ds=1" },
    { slug: "linkedin-playbook", param: "ds=1" },
    { slug: "call-planner", param: "ds=1" },
    { slug: "advisor-deploy", param: "ds=1" },
    { slug: "icp-studio", param: "ds=1" },
    { slug: "territory-architect", param: "ds=1" },
    { slug: "sourcing-workbench", param: "ds=1" },
    { slug: "quota-workback", param: "ds=1" },
    { slug: "negotiation", param: "ds=1" },
    { slug: "founding-gtm", param: "ds=1" },
    { slug: "briefing", param: "ds=1" },
    { slug: "outdoors-events", param: "ds=1" },
    { slug: "settings", param: "ds=1" },
    { slug: "welcome", param: "ds=1" },
    { slug: "onboarding", param: "ds=1" }
];

test.describe("new-surface boot smoke tests", () => {
    for (const { slug, param } of NEW_SURFACE_ROOMS) {
        test(`/${slug}/ new design-system surface boots cleanly`, async ({
            page
        }) => {
            const errors: string[] = [];
            page.on("pageerror", (err) => errors.push(err.message));

            // `?ds=1` (`?today=1` for the Dashboard) forces the new surface
            // even under the force-legacy e2e build; demo seed gives the
            // room real data to render.
            const returnPath = encodeURIComponent(
                `/${slug}/?${param}&demo=1&qa=1`
            );
            await page.goto(
                `/demo-seed.html?demo=1&autoseed=mm&return=${returnPath}`
            );

            await page.waitForURL(new RegExp(`/${slug}/`), { timeout: 20_000 });
            await page.waitForLoadState("networkidle");

            // The new DS surface rendered — the WayfinderBar is universal to
            // every design-system surface.
            await expect(page.locator(".ds-wayfinder")).toBeAttached();

            // And it booted without throwing.
            expect(
                errors,
                `page errors during ${slug} new-surface boot:\n${errors.join("\n")}`
            ).toEqual([]);
        });
    }
});
