import { test, expect } from "@playwright/test";

/**
 * Phase 5.3 — Privacy + Terms re-skin.
 *
 * The trust-test surface (visitor-face rubric Test 5). Marcus Reed
 * (visitor persona) clicks "Privacy" or "Terms" in the footer + must
 * land on a page that reinforces trust:
 *   - bright field per canon Part II §1 (no dark holdouts)
 *   - same chrome as /start.html (wordmark + back-pill)
 *   - legal content preserved verbatim
 *   - no marketing language leaking into legal copy
 */

const LEGAL_PAGES = [
    {
        path: "/privacy.html",
        h1: /privacy policy/i,
        kicker: /LEGAL · PRIVACY/,
        sectionCount: 17
    },
    {
        path: "/terms.html",
        h1: /terms of use/i,
        kicker: /LEGAL · TERMS/,
        sectionCount: 19
    }
];

test.describe("Phase 5.3 — Privacy + Terms (bright re-skin)", () => {
    for (const { path, h1, kicker, sectionCount } of LEGAL_PAGES) {
        test(`${path} renders bright (canon Part II §1)`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                await page.goto(path, { waitUntil: "domcontentloaded" });
                const bg = await page.evaluate(
                    () => getComputedStyle(document.body).backgroundColor
                );
                // Legacy dark page had bg #06080d = rgb(6, 8, 13).
                // Canon bright field = rgb(246, 248, 252).
                expect(bg).not.toMatch(/^rgba?\(6,\s*8,\s*13/);
                expect(bg).not.toMatch(/^rgba?\(10,\s*14,\s*26/);
                expect(bg).toMatch(/^rgba?\(246,\s*248,\s*252/);
            } finally {
                await ctx.close();
            }
        });

        test(`${path} carries the canon chrome (wordmark + back-pill)`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                await page.goto(path, { waitUntil: "domcontentloaded" });

                const wordmark = page.locator(".wordmark");
                expect(await wordmark.count()).toBe(1);
                expect(await wordmark.getAttribute("href")).toBe(
                    "/start.html"
                );
                expect(await wordmark.textContent()).toContain("ANTAEUS");

                const back = page.locator(".chrome__back");
                expect(await back.count()).toBe(1);
                expect(await back.getAttribute("href")).toBe("/start.html");
            } finally {
                await ctx.close();
            }
        });

        test(`${path} preserves legal hero + section count`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                await page.goto(path, { waitUntil: "domcontentloaded" });

                // Hero kicker carries the legal classification.
                expect(
                    await page.locator(".hero__kicker").textContent()
                ).toMatch(kicker);
                // Hero h1 matches.
                expect(await page.locator(".hero h1").textContent()).toMatch(
                    h1
                );
                // Last-updated meta present.
                expect(
                    (await page.locator(".hero-meta").textContent()) ?? ""
                ).toMatch(/LAST UPDATED/);

                // Section count preserved (no legal content dropped).
                expect(await page.locator(".section").count()).toBe(
                    sectionCount
                );
            } finally {
                await ctx.close();
            }
        });
    }

    test("trust test — privacy + terms carry no marketing superlatives", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            for (const { path } of LEGAL_PAGES) {
                await page.goto(path, { waitUntil: "domcontentloaded" });
                const body =
                    (await page.locator(".panel").textContent()) ?? "";
                // Legal-page trust signals: plain language, no marketing
                // language leaking through.
                expect(body).not.toMatch(/world-class/i);
                expect(body).not.toMatch(/best-in-class/i);
                expect(body).not.toMatch(/AI-powered/i);
                expect(body).not.toMatch(/revolutionary/i);
                expect(body).not.toMatch(/supercharge/i);
            }
        } finally {
            await ctx.close();
        }
    });

    test("footer cross-links — privacy → terms and back, both → /start.html", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/privacy.html", {
                waitUntil: "domcontentloaded"
            });
            // Privacy footer must link to /terms.html + /start.html.
            const privacyLinks = await page
                .locator(".footer-links a")
                .evaluateAll((els) =>
                    els.map((e) => e.getAttribute("href"))
                );
            expect(privacyLinks).toContain("/terms.html");
            expect(privacyLinks).toContain("/start.html");

            // Reverse for terms.
            await page.goto("/terms.html", { waitUntil: "domcontentloaded" });
            const termsLinks = await page
                .locator(".footer-links a")
                .evaluateAll((els) =>
                    els.map((e) => e.getAttribute("href"))
                );
            expect(termsLinks).toContain("/privacy.html");
            expect(termsLinks).toContain("/start.html");
        } finally {
            await ctx.close();
        }
    });

    test("Landing footer → privacy/terms seam works", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            // Footer links on /start.html point at /privacy.html + /terms.html
            // (Phase 5.1 already wired this; this test guards against
            // regressions when the legal pages were rewritten in 5.3).
            const privacyLink = page.locator(
                '.foot__links a[href="/privacy.html"]'
            );
            const termsLink = page.locator(
                '.foot__links a[href="/terms.html"]'
            );
            expect(await privacyLink.count()).toBe(1);
            expect(await termsLink.count()).toBe(1);

            // Click privacy → land on privacy bright page.
            await privacyLink.click();
            await page.waitForURL("**/privacy.html");
            const bg = await page.evaluate(
                () => getComputedStyle(document.body).backgroundColor
            );
            expect(bg).toMatch(/^rgba?\(246,\s*248,\s*252/);
        } finally {
            await ctx.close();
        }
    });
});
