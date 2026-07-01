import { test, expect } from "@playwright/test";

/**
 * Phase 5.4 — Public-facing positioning page (/why-antaeus/).
 *
 * Closes Phase 5 under rigid ordering. The visitor surface for
 * someone who wants more than /start.html provides but isn't yet
 * ready to sign up. Per the founder lock 2026-05-18, this is the
 * "category framing" surface.
 *
 * Tested against the Marcus Reed visitor persona + walks A/B/C +
 * Test 4 (category test) + Test 5 (trust test) — same rubric the
 * landing was tested against, but with category-framing depth.
 *
 * Reference:
 *   - deliverables/audit/visitor-persona-2026-05.md
 *   - CLAUDE.md §1 (What Antaeus is + Buyer lock)
 */

test.describe("Phase 5.4 — /why-antaeus/", () => {
    test("renders bright (canon Part II §1)", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const bg = await page.evaluate(
                () => getComputedStyle(document.body).backgroundColor
            );
            expect(bg).toMatch(/^rgba?\(246,\s*248,\s*252/);
        } finally {
            await ctx.close();
        }
    });

    test("canon chrome present — wordmark + back-pill + primary CTA", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });

            const wordmark = page.locator(".wordmark");
            expect(await wordmark.count()).toBe(1);
            expect(await wordmark.getAttribute("href")).toBe("/start.html");

            const back = page.locator(".chrome__back");
            expect(await back.count()).toBe(1);
            expect(await back.getAttribute("href")).toBe("/start.html");

            // The chrome carries a primary "Create your workspace" CTA so
            // Marcus can sign up directly from any scroll position.
            const chromeBtn = page.locator(".chrome .btn--primary");
            expect(await chromeBtn.count()).toBe(1);
            expect(await chromeBtn.getAttribute("href")).toBe("/signup.html");
        } finally {
            await ctx.close();
        }
    });

    test("hero answers the category question explicitly", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });

            // Hero kicker names the page's job out loud.
            const kicker = await page.locator(".hero__kicker").textContent();
            expect(kicker).toMatch(/CATEGORY/);
            expect(kicker?.toLowerCase()).toContain("what this actually is");

            // Hero title contains "operating system" (canon §1 product
            // sentence) and "inherit" / "hire" (the buyer-lock anchor).
            const title = await page.locator(".hero__title").textContent();
            expect(title?.toLowerCase()).toContain("operating system");

            // Hero sub names the existing-CRM-objection directly (the
            // category boundary Marcus arrives with).
            const sub = await page.locator(".hero__sub").textContent();
            expect(sub?.toLowerCase()).toContain("crm");
        } finally {
            await ctx.close();
        }
    });

    test("category boundary — IS vs IS NOT panels both present + balanced", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });

            const isList = page.locator(".boundary__col--is .boundary__list li");
            const isNotList = page.locator(
                ".boundary__col--is-not .boundary__list li"
            );

            // Both panels must carry substantive lists (canon §1 has 7 IS +
            // 7 IS NOT items — page preserves this balance).
            expect(await isList.count()).toBe(7);
            expect(await isNotList.count()).toBe(7);

            // The IS NOT panel explicitly disclaims the categories Marcus
            // arrives with.
            const isNotText = await isNotList.allTextContents();
            const joined = isNotText.join(" · ");
            expect(joined.toLowerCase()).toContain("crm");
            expect(joined.toLowerCase()).toContain("ai copilot");
            expect(joined.toLowerCase()).toContain("dashboard");
        } finally {
            await ctx.close();
        }
    });

    test("loop rail names the four sacred nouns (signal → motion → deal+proof → handoff)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const loopSteps = page.locator(".loop__step");
            expect(await loopSteps.count()).toBe(4);
            const names = await page.locator(".loop__name").allTextContents();
            expect(names.join(" · ")).toContain("Signal");
            expect(names.join(" · ")).toContain("Motion");
            expect(names.join(" · ").toLowerCase()).toContain("deal");
            expect(names.join(" · ")).toContain("Handoff");
        } finally {
            await ctx.close();
        }
    });

    test("buyer-lock panel carries 3 cells (buyer / fear / aspiration)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const labels = await page
                .locator(".buyer__cell-label")
                .allTextContents();
            expect(labels.length).toBe(3);
            expect(labels.join(" · ")).toContain("PRIMARY BUYER");
            expect(labels.join(" · ")).toContain("PRIMARY FEAR");
            expect(labels.join(" · ")).toContain("PRIMARY ASPIRATION");
        } finally {
            await ctx.close();
        }
    });

    test("closing CTA — one dominant move (Create workspace), sign-in secondary", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const primaryCta = page.locator(".closing .btn--primary");
            expect(await primaryCta.count()).toBe(1);
            expect(await primaryCta.getAttribute("href")).toBe("/signup.html");
            expect(await primaryCta.textContent()).toMatch(
                /create your workspace/i
            );

            const ghost = page.locator(".closing .btn--ghost");
            expect(await ghost.count()).toBe(1);
            expect(await ghost.getAttribute("href")).toBe("/login.html");

            // Same "no card" trust note pattern as Phase 5.1.
            const note = await page.locator(".closing__note").textContent();
            expect(note?.toLowerCase()).toContain("no card");
        } finally {
            await ctx.close();
        }
    });

    test("Test 4 — category test — no SaaS jargon leaks through", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const body = (await page.locator("main.page").textContent()) ?? "";
            expect(body).not.toMatch(/AI-powered/i);
            expect(body).not.toMatch(/next-generation/i);
            expect(body).not.toMatch(/revolutionary/i);
            expect(body).not.toMatch(/supercharge/i);
            expect(body).not.toMatch(/unlock your/i);
        } finally {
            await ctx.close();
        }
    });

    test("Test 5 — trust test — no unattributed superlatives", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/why-antaeus/", { waitUntil: "domcontentloaded" });
            const body = (await page.locator("main.page").textContent()) ?? "";
            expect(body).not.toMatch(/world-class/i);
            expect(body).not.toMatch(/best-in-class/i);
            expect(body).not.toMatch(/trusted by/i);
        } finally {
            await ctx.close();
        }
    });

    test("Landing → /why-antaeus/ seam (Phase 5.1 + 5.4 cross-link)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });

            // The nav carries a "Why Antaeus" link to /why-antaeus/.
            const navLink = page.locator(
                'nav .nlinks a[href="/why-antaeus/"]'
            );
            expect(await navLink.count()).toBe(1);

            // The footer also leads here — the progressive-disclosure path.
            const footLink = page.locator(
                'footer .flinks a[href="/why-antaeus/"]'
            );
            expect(await footLink.count()).toBe(1);

            // Click the nav link → land on /why-antaeus/.
            await navLink.click();
            await page.waitForURL("**/why-antaeus/**");
            expect(await page.locator(".hero__title").count()).toBe(1);
        } finally {
            await ctx.close();
        }
    });

    test("Walk-C compliance (still one dominant CTA in hero on /start.html)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            // The nav "Why Antaeus" link must not break Phase 5.1's Walk C
            // guarantee (exactly one dominant primary CTA in the hero).
            await page.goto("/start.html", { waitUntil: "domcontentloaded" });
            const heroCtas = page.locator(".hero .cta .btn");
            expect(await heroCtas.count()).toBe(2); // primary + ghost only

            const primaryCount = await page
                .locator(".hero .cta .btn:not(.btn--ghost)")
                .count();
            expect(primaryCount).toBe(1);
        } finally {
            await ctx.close();
        }
    });
});
