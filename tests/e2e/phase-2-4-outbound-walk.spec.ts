import { test, expect } from "@playwright/test";

/**
 * Phase 2.4 — Outbound flow Playwright walk.
 *
 * Sarah Chen runs the outbound motion: scans Signal Console for hot
 * accounts → composes outbound in Outbound Studio → warms with
 * LinkedIn air cover → runs the cold call → prep the meeting that
 * gets booked in Call Planner.
 *
 * Reference: deliverables/audit/navigation-rubric-2026-05.md
 */

const ACCOUNT = "Meridian Logistics";

test.describe("Phase 2.4 — Outbound flow", () => {
    test("Outbound HandoffStrip always navigates (not href=#) and uses verb-shape CTAs", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/outbound-studio/", { waitUntil: "networkidle" });
            await page.waitForTimeout(200);

            // Phase 2.4 finding: cold landing used to render href="#"
            // on the handoff CTAs. Now always navigates, just omits
            // focusObject when no account is in the rack.
            const ctas = await page
                .locator(".ob-handoff__cta")
                .evaluateAll((els) =>
                    els.map((e) => ({
                        text: e.textContent?.trim(),
                        href: e.getAttribute("href")
                    }))
                );
            expect(ctas.length).toBeGreaterThanOrEqual(3);
            for (const c of ctas) {
                expect(c.href).not.toBe("#");
                expect(c.href).toMatch(/^\/[a-z-]+\//);
            }
            // Verb-shape sales moves.
            const labels = ctas.map((c) => c.text);
            expect(labels).toContain("Check the signals");
            expect(labels).toContain("Send LinkedIn air cover");
            expect(labels).toContain("Run a cold call");

            // Kicker rewritten from "RECOVERY CABLES" → "CARRY THE WORK FORWARD".
            const kicker = await page
                .locator(".ob-handoff__kicker")
                .textContent();
            expect(kicker).toBe("CARRY THE WORK FORWARD");
        } finally {
            await ctx.close();
        }
    });

    test("Outbound carries inbound account into its handoffs as focus", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto(
                `/outbound-studio/?account=${encodeURIComponent(ACCOUNT)}&focusObject=${encodeURIComponent(ACCOUNT)}&returnTo=%2Fsignal-console%2F&returnLabel=Back+to+Signal+Console&fromMode=room&fromSurface=signal-console`,
                { waitUntil: "networkidle" }
            );
            await page.waitForTimeout(300);

            // All 3 handoffs carry the focused account through.
            const hrefs = await page
                .locator(".ob-handoff__cta")
                .evaluateAll((els) =>
                    els.map((e) => e.getAttribute("href"))
                );
            for (const h of hrefs) {
                expect(h).not.toBeNull();
                const u = new URL(h!, "http://x");
                expect(u.searchParams.get("focusObject")).toBe(ACCOUNT);
                expect(u.searchParams.get("returnTo")).toBe("/outbound-studio/");
            }
        } finally {
            await ctx.close();
        }
    });

    test("LinkedIn handoffs verb-shape + Invariant-8 (no LinkedIn-cue placeholder)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/linkedin-playbook/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            const ctas = await page
                .locator(".lp-handoff")
                .evaluateAll((els) =>
                    els.map((e) => ({
                        text: e.textContent?.trim(),
                        href: e.getAttribute("href")
                    }))
                );
            const labels = ctas.map((c) => c.text);
            // Phase 2.4 finding: "Open Signal" / "Open Outbound"
            // → "Check the signals" / "Compose outbound" verb-shape.
            expect(labels).toContain("Check the signals");
            expect(labels).toContain("Compose outbound");

            // Phase 2.4 finding: no "LinkedIn cue" placeholder string.
            for (const c of ctas) {
                expect(c.href).not.toContain("LinkedIn+cue");
                expect(c.href).not.toContain("LinkedIn%20cue");
            }
        } finally {
            await ctx.close();
        }
    });

    test("Cold Call handoffs verb-shape + Invariant-8 (no Cold-call placeholder)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/cold-call-studio/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            const ctas = await page
                .locator(".cc-handoff")
                .evaluateAll((els) =>
                    els.map((e) => ({
                        text: e.textContent?.trim(),
                        href: e.getAttribute("href")
                    }))
                );
            const labels = ctas.map((c) => c.text);
            // Phase 2.4 finding: "Open Call Planner" / "Open Deal
            // Workspace" → "Plan the next call" / "Open the deal".
            expect(labels).toContain("Plan the next call");
            expect(labels).toContain("Open the deal");

            // Phase 2.4 finding: no "Cold call" / "Cold call prep"
            // placeholders.
            for (const c of ctas) {
                expect(c.href).not.toContain("Cold+call");
                expect(c.href).not.toContain("Cold%20call");
            }
        } finally {
            await ctx.close();
        }
    });

    test("Call Planner Handoff verb-shape CTAs + contextual kicker", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/call-planner/", { waitUntil: "networkidle" });
            await page.waitForTimeout(300);

            // Phase 2.4 finding: "Open Discovery" → "Run the discovery
            // call"; "Open Deal Workspace" / "Open linked deal" → "Open
            // the deal" when linked.
            const routes = await page
                .locator(".cp-route")
                .evaluateAll((els) =>
                    els.map((e) => e.textContent?.trim())
                );
            expect(routes).toContain("Run the discovery call");
            expect(routes).toContain("Copy agenda brief");
        } finally {
            await ctx.close();
        }
    });
});
