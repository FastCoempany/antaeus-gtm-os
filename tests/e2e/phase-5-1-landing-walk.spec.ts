import { test, expect } from "@playwright/test";

/**
 * Phase 5.1 — Static public face: landing.
 *
 * Tests against the Marcus Reed visitor persona + walks A / B / C
 * documented in deliverables/audit/visitor-persona-2026-05.md.
 *
 * Walk A — First 30 seconds: hero answers what/who/next without scroll.
 * Walk B — 90-second scan: 3 anchor cards land 3 distinct signals.
 * Walk C — Signup decision: one dominant CTA, no third path.
 *
 * Also covers the canon Part II §1 bright-direction re-skin (the
 * landing was the last big dark holdout — Phase 5.1 retires it).
 */

test.describe("Phase 5.1 — Landing (start.html)", () => {
    test("Walk A — first-30s: what / who / next without scroll", async ({
        browser
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // What — the hero states the ranking promise without scroll.
            const heroTitle = await page.locator(".hero h1").textContent();
            expect(heroTitle?.toLowerCase()).toContain("monday");

            // Who / why — the hero frames the operator's problem and what
            // the system does about it (rank + name the one move).
            const heroText =
                (await page.locator(".hero").textContent())?.toLowerCase() ?? "";
            expect(heroText).toMatch(/ranks|one move|where to start/);

            // Next — exactly one primary (non-ghost, orange) CTA in the
            // hero cluster, and it leads to signup.
            const primaryCtas = page.locator(".hero .cta .btn:not(.btn--ghost)");
            expect(await primaryCtas.count()).toBe(1);
            expect(await primaryCtas.getAttribute("href")).toBe("/signup.html");
        } finally {
            await ctx.close();
        }
    });

    test("Walk B — 90s scan: distinct value sections, each with its own kicker", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // The 90-second scan is carried by the value sections, each
            // with its own mono kicker — at least three, all distinct.
            const kickers = (
                await page.locator(".blk .kick").allTextContents()
            ).map((k) => k.trim());
            expect(kickers.length).toBeGreaterThanOrEqual(3);
            expect(new Set(kickers).size).toBe(kickers.length);

            // The weekly rhythm is the scannable spine — five named days.
            expect(await page.locator(".rhythm .day").count()).toBe(5);
        } finally {
            await ctx.close();
        }
    });

    test("Walk C — signup decision: one dominant CTA, signup is primary", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // Hero CTAs: exactly 2 buttons, and only one is the orange
            // primary — the dominant move, no competing third path.
            const ctaButtons = page.locator(".hero .cta .btn");
            expect(await ctaButtons.count()).toBe(2);

            const primary = page.locator(".hero .cta .btn:not(.btn--ghost)");
            expect(await primary.count()).toBe(1);
            expect(await primary.getAttribute("href")).toBe("/signup.html");

            // Sign-in lives in the nav, not competing in the hero.
            expect(
                await page.locator('nav .nlinks a[href="/login.html"]').count()
            ).toBe(1);

            // The "no card / free during preview" trust note is present.
            const body =
                (await page.locator("body").textContent())?.toLowerCase() ?? "";
            expect(body).toContain("no card");
        } finally {
            await ctx.close();
        }
    });

    test("Test 4 — category test: hero copy avoids generic SaaS jargon", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            const heroCopy = (await page.locator(".hero").textContent()) ?? "";

            // Phrases Marcus would close the tab over (rubric test 4).
            const failurePhrases = [
                /AI-powered/i,
                /\bplatform\b/i,
                /next-generation/i,
                /revolutionary/i,
                /supercharge/i,
                /unlock your/i
            ];
            for (const phrase of failurePhrases) {
                expect(heroCopy).not.toMatch(phrase);
            }
        } finally {
            await ctx.close();
        }
    });

    test("Test 5 — trust test: no fabricated testimonials or stock superlatives", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            const copy = (await page.locator("body").textContent()) ?? "";

            // Trust-test failure signals: fake social proof + stock
            // superlatives. (Decorative-quote check is intentionally not
            // here — the page legitimately quotes a buyer objection as a
            // demo of the product, which is honest, not marketing fluff.)
            expect(copy).not.toMatch(/world-class/i);
            expect(copy).not.toMatch(/best-in-class/i);
            expect(copy).not.toMatch(/trusted by/i);
        } finally {
            await ctx.close();
        }
    });

    test("Canon Part II §1 bright direction — body bg is bright, not dark navy", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            const bgColor = await page.evaluate(() => {
                return getComputedStyle(document.body).backgroundColor;
            });
            // The legacy dark page used rgb(10, 14, 26). The bright
            // direction uses #f6f8fc = rgb(246, 248, 252).
            expect(bgColor).not.toBe("rgb(10, 14, 26)");
            expect(bgColor).toMatch(/^rgba?\(246,\s*248,\s*252/);
        } finally {
            await ctx.close();
        }
    });

    test("Chrome wordmark renders + sign-in path in nav is reachable", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // Wordmark present in the nav brand.
            const wordmark = page.locator("nav .brand .wm");
            expect(await wordmark.count()).toBe(1);
            expect(await wordmark.textContent()).toContain("ANTAEUS");

            // Nav sign-in link → /login.html (separate from the hero CTA).
            expect(
                await page.locator('nav .nlinks a[href="/login.html"]').count()
            ).toBe(1);

            // Footer legal links present.
            expect(
                await page
                    .locator('footer .flinks a[href="/privacy.html"]')
                    .count()
            ).toBe(1);
            expect(
                await page
                    .locator('footer .flinks a[href="/terms.html"]')
                    .count()
            ).toBe(1);
        } finally {
            await ctx.close();
        }
    });
});
