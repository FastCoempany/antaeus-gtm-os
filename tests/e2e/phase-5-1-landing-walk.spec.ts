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

            // What — hero title must mention "inherit" (the operator-
            // facing thesis from canon §1).
            const heroTitle = await page.locator(".hero__title").textContent();
            expect(heroTitle?.toLowerCase()).toContain("inherit");

            // Who — kicker addresses the founder persona explicitly.
            const heroKicker = await page
                .locator(".hero__kicker")
                .textContent();
            expect(heroKicker?.toLowerCase()).toContain("founder");

            // Next — there is exactly one primary CTA in the hero CTA
            // cluster. Secondary (sign-in) is allowed but visually
            // distinct.
            const primaryCtas = page.locator(".hero__ctas .btn--primary");
            expect(await primaryCtas.count()).toBe(1);
            expect(await primaryCtas.textContent()).toMatch(
                /create your workspace/i
            );
        } finally {
            await ctx.close();
        }
    });

    test("Walk B — 90s scan: 3 anchor cards exist, each with a distinct kicker", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            const anchors = page.locator(".anchor");
            expect(await anchors.count()).toBe(3);

            const kickers = await page.locator(".anchor__kicker").allTextContents();
            // Three distinct kickers, no repeats.
            expect(new Set(kickers).size).toBe(3);
            // Each kicker captures a distinct operator promise.
            expect(kickers.join(" · ")).toContain("SEES WHAT'S REAL");
            expect(kickers.join(" · ")).toContain("HARDER TO FOOL");
            expect(kickers.join(" · ")).toContain("BUILT FOR HANDOFF");
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

            // Hero CTAs: exactly 2 buttons (signup + signin), no third.
            const ctaButtons = page.locator(".hero__ctas .btn");
            expect(await ctaButtons.count()).toBe(2);

            // Primary CTA is signup (visually weighted with orange).
            const primary = page.locator(".hero__ctas .btn--primary");
            const primaryHref = await primary.getAttribute("href");
            expect(primaryHref).toBe("/signup.html");

            // Secondary (ghost) CTA is sign-in.
            const ghost = page.locator(".hero__ctas .btn--ghost");
            const ghostHref = await ghost.getAttribute("href");
            expect(ghostHref).toBe("/login.html");

            // The "no card / free during preview" trust note is present.
            const note = await page.locator(".hero__cta-note").textContent();
            expect(note?.toLowerCase()).toContain("no card");
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

    test("Test 5 — trust test: no unattributed quotes or stock-style superlatives in anchors", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            const anchorsCopy =
                (await page.locator(".anchors").textContent()) ?? "";

            // Trust-test failure signals.
            expect(anchorsCopy).not.toMatch(/"/); // no decorative quote marks
            expect(anchorsCopy).not.toMatch(/world-class/i);
            expect(anchorsCopy).not.toMatch(/best-in-class/i);
            expect(anchorsCopy).not.toMatch(/trusted by/i);
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

    test("Chrome wordmark renders + sign-in path in topbar is reachable", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // Wordmark anchor present + linked to /start.html.
            const wordmark = page.locator(".wordmark");
            expect(await wordmark.count()).toBe(1);
            expect(await wordmark.getAttribute("href")).toBe("/start.html");
            const wordmarkText = await wordmark.textContent();
            expect(wordmarkText).toContain("ANTAEUS");
            expect(wordmarkText?.toLowerCase()).toContain("operator preview");

            // Topbar sign-in link (separate from hero CTA).
            const topbarSignin = page
                .locator(".chrome__aux a", { hasText: "Sign in" })
                .first();
            expect(await topbarSignin.getAttribute("href")).toBe("/login.html");

            // Footer legal links present.
            expect(
                await page
                    .locator('.foot__links a[href="/privacy.html"]')
                    .count()
            ).toBe(1);
            expect(
                await page.locator('.foot__links a[href="/terms.html"]').count()
            ).toBe(1);
        } finally {
            await ctx.close();
        }
    });
});
