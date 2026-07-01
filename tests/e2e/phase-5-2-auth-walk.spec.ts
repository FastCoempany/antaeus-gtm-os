import { test, expect } from "@playwright/test";

/**
 * Phase 5.2 — Static public face: auth pages.
 *
 * Full bright re-skin of login.html / signup.html / forgot-password.html
 * / reset-password.html / auth/callback/index.html. The JS layer was
 * hardened in Phase 3 (PR #108, src/lib/auth-ui.ts canonical). This
 * phase aligns the visual layer + the copy with canon Part II §1
 * (bright field) + the Sarah Chen returning-user persona.
 *
 * Per the audit method (deliverables/audit/navigation-rubric-2026-05.md):
 *   - bright body bg on every auth page (no dark holdouts)
 *   - wordmark chrome + back-pill present on every page (Phase 2.9
 *     continuity pattern carried into the static layer)
 *   - signup CTA on landing leads here; sign-in path consistent
 */

const AUTH_PAGES = [
    { path: "/login.html", title: /sign in/i, back: "/start.html" },
    { path: "/signup.html", title: /create your workspace/i, back: "/start.html" },
    { path: "/forgot-password.html", title: /password|recovery/i, back: "/login.html" },
    { path: "/reset-password.html", title: /reset|new password/i, back: "/login.html" },
    { path: "/auth/callback/", title: /finishing|sign-in/i, back: "/login.html" }
];

test.describe("Phase 5.2 — Auth pages (bright re-skin)", () => {
    for (const { path, back } of AUTH_PAGES) {
        test(`${path} renders bright (canon Part II §1)`, async ({ browser }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                await page.goto(path, { waitUntil: "domcontentloaded" });
                const bgColor = await page.evaluate(() => {
                    return getComputedStyle(document.body).backgroundColor;
                });
                // Canon bright field is rgb(246, 248, 252) = #f6f8fc.
                // The legacy dark surface was rgb(10, 14, 26) or similar
                // dark navy — that family is rejected.
                expect(bgColor).not.toMatch(/^rgba?\(10,\s*14,\s*26/);
                expect(bgColor).not.toMatch(/^rgba?\(15,\s*23,\s*42/);
                expect(bgColor).toMatch(/^rgba?\(246,\s*248,\s*252/);
            } finally {
                await ctx.close();
            }
        });

        test(`${path} has wordmark chrome + back-pill to ${back}`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            try {
                await page.goto(path, { waitUntil: "domcontentloaded" });

                // Wordmark must be present and link to /start.html.
                const wordmark = page.locator(".auth-chrome__wordmark");
                expect(await wordmark.count()).toBe(1);
                expect(await wordmark.getAttribute("href")).toBe(
                    "/start.html"
                );
                const wordmarkText = await wordmark.textContent();
                expect(wordmarkText).toContain("ANTAEUS");

                // Back-pill must point at the right destination per
                // the page's place in the auth corridor.
                const backPill = page.locator(".auth-chrome__back");
                expect(await backPill.count()).toBe(1);
                expect(await backPill.getAttribute("href")).toBe(back);
            } finally {
                await ctx.close();
            }
        });
    }

    test("login.html — Sarah returning: copy is operator-voice, no insider jargon", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/login.html", { waitUntil: "domcontentloaded" });
            const title = await page.locator(".auth-title").textContent();
            // Sarah-returning copy hint: "operating thread" + "your
            // place" rather than form-ish "without losing context".
            expect(title?.toLowerCase()).toContain("operating thread");
            expect(title?.toLowerCase()).toContain("your place");

            // The corridor copy should mention the Brief (the operator
            // surface Sarah comes back for).
            const copy =
                (await page.locator(".auth-corridor").textContent()) ?? "";
            expect(copy.toLowerCase()).toContain("brief");
        } finally {
            await ctx.close();
        }
    });

    test("signup.html — first-five-minutes copy lights up the activation arc", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/signup.html", { waitUntil: "domcontentloaded" });
            const corridor =
                (await page.locator(".auth-corridor").textContent()) ?? "";
            // The "first five minutes" frame replaces the generic
            // "Path" kicker — names the actual operator arc.
            expect(corridor.toLowerCase()).toContain("first five minutes");
            expect(corridor.toLowerCase()).toContain("brief");
            // Trust note for the visitor-to-operator boundary.
            expect(corridor.toLowerCase()).toContain("no card");
        } finally {
            await ctx.close();
        }
    });

    test("forgot-password.html — privacy posture in copy (no enumeration)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/forgot-password.html", {
                waitUntil: "domcontentloaded"
            });
            const corridor =
                (await page.locator(".auth-corridor").textContent()) ?? "";
            // Per Trust Annex laws — recovery copy should explicitly
            // note we don't confirm account existence out loud.
            expect(corridor.toLowerCase()).toContain(
                "won't say so out loud"
            );
        } finally {
            await ctx.close();
        }
    });

    test("reset-password.html — valid vs expired-link corridor copy", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/reset-password.html", {
                waitUntil: "domcontentloaded"
            });
            const corridor =
                (await page.locator(".auth-corridor").textContent()) ?? "";
            // Both states have explicit copy in the corridor.
            expect(corridor.toLowerCase()).toContain("if the link is valid");
            expect(corridor.toLowerCase()).toContain("if the link expired");
        } finally {
            await ctx.close();
        }
    });

    test("auth callback — uses /css/auth.css (was /css/app.css; dark)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            const response = await page.goto("/auth/callback/", {
                waitUntil: "domcontentloaded"
            });
            expect(response?.status()).toBe(200);
            // Stylesheets loaded should include /css/auth.css and NOT
            // /css/app.css for this page.
            const stylesheets = await page.evaluate(() => {
                return Array.from(document.styleSheets)
                    .map((s) => s.href || "")
                    .filter(Boolean);
            });
            expect(stylesheets.some((s) => s.endsWith("/css/auth.css"))).toBe(
                true
            );
            expect(stylesheets.some((s) => s.endsWith("/css/app.css"))).toBe(
                false
            );
        } finally {
            await ctx.close();
        }
    });

    test("Landing → signup seam continuity (Walk C from Phase 5.1)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            // The primary (non-ghost) hero CTA should land on signup.html.
            const ctaHref = await page
                .locator(".hero .cta .btn:not(.btn--ghost)")
                .first()
                .getAttribute("href");
            expect(ctaHref).toBe("/signup.html");

            await page.goto(ctaHref!, { waitUntil: "domcontentloaded" });
            // Sarah-returning is the auth-page persona, but the back-
            // pill on signup must always return to /start.html (the
            // visitor face) — that's the visitor↔operator boundary.
            const backHref = await page
                .locator(".auth-chrome__back")
                .getAttribute("href");
            expect(backHref).toBe("/start.html");
        } finally {
            await ctx.close();
        }
    });
});
