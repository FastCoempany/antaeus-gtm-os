import { test, expect } from "@playwright/test";

/**
 * /should-we-hire-an-ae/ — AE Hiring Brief landing page.
 *
 * Acceptance tests from the master spec §2.9
 * (deliverables/plans/ae_hiring_underwriting_master_spec.md).
 */

const PATH = "/should-we-hire-an-ae/";

test.describe("AE Hiring Brief landing — /should-we-hire-an-ae/", () => {
    test("has the spec title, meta description and exactly one H1", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveTitle("Should We Hire the Next AE? | Antaeus");
        const description = await page.locator('meta[name="description"]').getAttribute("content");
        expect(description).toContain("Get an AE Hiring Brief for $149.");
        expect(await page.locator("h1").count()).toBe(1);
        await expect(page.locator("h1")).toHaveText(
            "Before you hire the next AE, prove there’s a sales system for them to inherit."
        );
    });

    test("renders on the bright command surface", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const classes = await page.locator("body").getAttribute("class");
        expect(classes).toContain("command-surface-page");
        expect(classes).toContain("service-page");
        expect(classes).toContain("ae-hire-page");
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
        expect(bg).toContain("linear-gradient");
    });

    test("sections appear in the spec order with the anchors the nav uses", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        for (const id of ["top", "how-it-works", "sample", "pricing"]) {
            expect(await page.locator(`#${id}`).count(), id).toBe(1);
        }
        const headings = await page.locator("main h1, main h2").allTextContents();
        expect(headings.map(h => h.trim())).toEqual([
            "Before you hire the next AE, prove there’s a sales system for them to inherit.",
            "A revenue target does not prove you need another salesperson.",
            "Four things have to survive the math.",
            "Start with the revenue. Work backward until the seat either holds or breaks.",
            "A decision brief, not a dashboard.",
            "The answer can be “yes” to the economics and “not yet” to the hire.",
            "You probably already know most of what we need.",
            "Built for an actual headcount decision.",
            "Before you buy.",
            "Know what has to be true before you put another quota on payroll."
        ]);
    });

    test("the sample anchor works", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await page.locator(".service-actions a[href='#sample']").click();
        await expect(page).toHaveURL(/#sample$/);
        await expect(page.locator("#sample")).toBeInViewport();
    });

    test("every sample is labeled SAMPLE or illustrative", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await expect(page.locator(".decision-sheet")).toContainText("SAMPLE · AE CAPACITY DECISION");
        await expect(page.locator(".decision-sheet")).toContainText("Illustrative sample.");
        await expect(page.locator(".sample-case")).toContainText("FICTIONAL EXAMPLE");
        await expect(page.locator(".sample-case")).toContainText("Illustrative sample. Not a benchmark and not a customer result.");
        await expect(page.locator(".equation-stack")).toContainText("SAMPLE");
    });

    test("price is consistently $149 and no app subscription pricing leaks in", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const text = await page.locator("body").innerText();
        const prices = text.match(/\$\d[\d,]*(?:\.\d+)?(?:\/\w+)?/g) || [];
        const priceMentions = prices.filter(p => /^\$1\d\d$|\/(year|yr|month|mo)$/.test(p));
        expect(priceMentions.length).toBeGreaterThan(0);
        for (const p of priceMentions) expect(p).toBe("$149");
        expect(text).not.toMatch(/\$299/);
        expect(text.toLowerCase()).not.toMatch(/per year|\/year|annual plan|free trial|start your trial|sign up for antaeus/);
        expect(text).toContain("No subscription.");
    });

    test("missing checkout config is explicit and the CTA never charges", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await expect(page.locator("[data-checkout-unconfigured]")).toBeVisible();
        const notice = page.locator("[data-checkout-notice]");
        await expect(notice).toBeHidden();
        await page.locator(".service-hero [data-ae-checkout]").click();
        await expect(notice).toBeVisible();
        await expect(notice).toContainText("Nothing was charged.");
        await expect(page).toHaveURL(new RegExp(PATH.replace(/\//g, "\\/")));
    });

    test("a configured checkout posts the product code and follows the returned URL", async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, "AE_HIRE_COMMERCE", {
                configurable: true,
                set(value) {
                    Object.defineProperty(window, "AE_HIRE_COMMERCE", {
                        value: { ...value, checkoutEndpoint: "/api/ae-hire/create-checkout" },
                        writable: true,
                        configurable: true
                    });
                }
            });
        });
        let posted: Record<string, unknown> | null = null;
        await page.route("**/api/ae-hire/create-checkout", async route => {
            posted = route.request().postDataJSON();
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "/ae-hire/checkout-test/" }) });
        });
        await page.route("**/ae-hire/checkout-test/", route => route.fulfill({ status: 200, contentType: "text/html", body: "<p>checkout</p>" }));
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await expect(page.locator("[data-checkout-unconfigured]")).toBeHidden();
        await page.locator("#pricing [data-ae-checkout]").click();
        await page.waitForURL(/\/ae-hire\/checkout-test\/$/);
        expect(posted).not.toBeNull();
        expect((posted as unknown as { product_code: string }).product_code).toBe("ae-hiring-brief-v1");
    });

    test("a slow checkout cannot be started twice from any CTA", async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, "AE_HIRE_COMMERCE", {
                configurable: true,
                set(value) {
                    Object.defineProperty(window, "AE_HIRE_COMMERCE", {
                        value: { ...value, checkoutEndpoint: "/api/ae-hire/create-checkout" },
                        writable: true,
                        configurable: true
                    });
                }
            });
        });
        let posts = 0;
        let release: () => void = () => {};
        const held = new Promise<void>(resolve => { release = resolve; });
        await page.route("**/api/ae-hire/create-checkout", async route => {
            posts += 1;
            await held;
            await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
        });
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const hero = page.locator(".service-hero [data-ae-checkout]");
        await hero.click();
        await expect(hero).toHaveAttribute("aria-busy", "true");
        await hero.click({ force: true });
        await page.locator(".service-final [data-ae-checkout]").click({ force: true });
        await page.locator("#pricing [data-ae-checkout]").click({ force: true });
        expect(posts).toBe(1);
        release();
        // A failed request clears the guard so the buyer can retry.
        await expect(page.locator("[data-checkout-notice]")).toContainText("Checkout could not start.");
        await expect(hero).not.toHaveAttribute("aria-busy", "true");
    });

    test("analytics failure never blocks checkout", async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, "gtmAnalytics", {
                configurable: true,
                get() { return { track() { throw new Error("analytics down"); } }; },
                set() { /* keep the throwing stub */ }
            });
        });
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(String(error)));
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        await page.locator(".service-final [data-ae-checkout]").click();
        await expect(page.locator("[data-checkout-notice]")).toBeVisible();
        expect(errors).toEqual([]);
    });

    test("FAQ is keyboard accessible", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const first = page.locator(".faq-row").first();
        expect(await page.locator(".faq-row").count()).toBe(8);
        await first.locator("summary").focus();
        await page.keyboard.press("Enter");
        await expect(first).toHaveAttribute("open", "");
        await expect(first.locator("p")).toBeVisible();
    });

    test("no horizontal overflow at 320px and the CTA still works", async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
        const page = await ctx.newPage();
        try {
            await page.goto(PATH, { waitUntil: "domcontentloaded" });
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(0);
            await page.locator(".service-hero [data-ae-checkout]").click();
            await expect(page.locator("[data-checkout-notice]")).toBeVisible();
        } finally {
            await ctx.close();
        }
    });

    test("content stays readable with JavaScript disabled", async ({ browser }) => {
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const page = await ctx.newPage();
        try {
            await page.goto(PATH, { waitUntil: "domcontentloaded" });
            await expect(page.locator("h1")).toBeVisible();
            await expect(page.locator("#sample")).toContainText("CONDITIONAL");
            await expect(page.locator(".faq-row").first()).toBeVisible();
            // Missing checkout must be explicit even without JavaScript.
            await expect(page.locator("[data-checkout-unconfigured]")).toBeVisible();
            const href = await page.locator(".service-hero [data-ae-checkout]").getAttribute("href");
            expect(href).toBe("#pricing");
        } finally {
            await ctx.close();
        }
    });

    test("states carry a text label, not color alone", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const tags = await page.locator(".decision-tag, .decision-state").allTextContents();
        expect(tags.length).toBeGreaterThan(0);
        for (const tag of tags) expect(tag.trim()).toMatch(/^(SUPPORTED|THIN|CONDITIONAL)$/);
    });

    test("no fabricated proof: no reviews, ratings or customer counts", async ({ page }) => {
        await page.goto(PATH, { waitUntil: "domcontentloaded" });
        const text = (await page.locator("body").innerText()).toLowerCase();
        expect(text).not.toMatch(/testimonial|★|rated \d|\d+\+? (customers|companies|teams) (use|trust)|trusted by/);
        expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
    });
});
