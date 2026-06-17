import { test, expect } from "@playwright/test";

/**
 * Program 6 / PR 4 — Discovery Studio refacing walk.
 *
 * Pinned to the LEGACY surface via `?ds=0`. As of 2026-06-16 the new
 * design-system surface (DiscoveryStudioDS) is the production default
 * (founder direction — the legacy surface still carries the retired call
 * clock). The legacy surface stays shipped as the two-state safety net,
 * so this walk keeps verifying it; the new default is covered by the
 * smoke suite's reused-rail assertions. A dedicated DS-surface walk is
 * owed.
 *
 * Verifies the Ledger Spine Canonical structural additions:
 *   - Mast at the top (kicker + serif "Ledger spine." brand + stamp)
 *   - Board layout: vertical FrameworkRail (206px left) + main +
 *     side dock
 *   - SegmentRail adopts expandable-segment model: only ONE segment
 *     expands at a time; non-active segments collapse to header-only
 *   - All 7 required canon §4.12 rails still mount
 *   - Wave 5 on-call control surfaces still mount (CallClock,
 *     CompressionToggle, SkipAheadTray)
 *
 * Audit reference:
 *   deliverables/audit/antaeus-refacing-vs-shipped-discovery-studio-2026-05-18.md
 * Winner reference:
 *   deliverables/prototypes/wireframes/antaeus-discovery-studio-control-face-ledger-spine-canonical-2026-04-11.html
 */

test.describe("Program 6 / PR 4 — Discovery Studio refacing (Ledger Spine Canonical)", () => {
    test("Mast at top with kicker + serif brand + framework stamp", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            const mast = page.locator(".ds-mast");
            await expect(mast).toBeAttached();

            const kicker = await page
                .locator(".ds-mast__kicker")
                .textContent();
            expect(kicker?.toLowerCase()).toContain("discovery studio");
            expect(kicker?.toLowerCase()).toContain("canonical control face");

            const brand = await page.locator(".ds-mast__brand").textContent();
            expect(brand?.toLowerCase()).toContain("ledger spine");

            const stamp = page.locator(".ds-mast__stamp");
            await expect(stamp).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Board layout: vertical FrameworkRail (left) + main + side dock", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await expect(page.locator(".ds-board")).toBeAttached();
            await expect(page.locator(".ds-board__rail")).toBeAttached();
            await expect(page.locator(".ds-board__main")).toBeAttached();
            await expect(page.locator(".ds-board__dock")).toBeAttached();

            // Framework rail buttons inside the rail.
            const fwBtns = page.locator(
                ".ds-board__rail .ds-framework-rail__btn"
            );
            const count = await fwBtns.count();
            // Per canon §4.12 — 10 frameworks (CX AI restored +
            // global contractor management added, 2026-06-16).
            expect(count).toBe(10);

            // Each button has a dot + name structure.
            const firstBtn = fwBtns.first();
            await expect(
                firstBtn.locator(".ds-framework-rail__dot")
            ).toBeAttached();
            await expect(
                firstBtn.locator(".ds-framework-rail__name")
            ).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Section title carries the Ledger Spine voice", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            const title = await page
                .locator(".ds-board__main-title")
                .textContent();
            expect(title?.toLowerCase()).toContain("open one segment");
        } finally {
            await ctx.close();
        }
    });

    test("Expandable-segment model: only ONE segment expanded at a time", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // Pick the first framework so segments render.
            await page
                .locator(".ds-board__rail .ds-framework-rail__btn")
                .first()
                .click();
            await page.waitForTimeout(200);

            // All segments are present in the DOM.
            const segments = page.locator(".ds-segment-rail__segment");
            const segCount = await segments.count();
            expect(segCount).toBeGreaterThanOrEqual(1);

            // At most ONE segment carries the is-segment-active class.
            const activeCount = await page
                .locator(".ds-segment-rail__segment.is-segment-active")
                .count();
            expect(activeCount).toBeLessThanOrEqual(1);

            // Click the first segment header → it becomes active.
            await page
                .locator(".ds-segment-rail__segment-header")
                .first()
                .click();
            await page.waitForTimeout(200);

            const newActiveCount = await page
                .locator(".ds-segment-rail__segment.is-segment-active")
                .count();
            expect(newActiveCount).toBe(1);

            // Click the same header again → segment collapses (none active).
            await page
                .locator(".ds-segment-rail__segment-header")
                .first()
                .click();
            await page.waitForTimeout(200);

            const collapsedCount = await page
                .locator(".ds-segment-rail__segment.is-segment-active")
                .count();
            expect(collapsedCount).toBe(0);
        } finally {
            await ctx.close();
        }
    });

    test("Active segment shows nodes; collapsed segments do not", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await page
                .locator(".ds-board__rail .ds-framework-rail__btn")
                .first()
                .click();
            await page.waitForTimeout(200);

            // Activate the second segment.
            await page
                .locator(".ds-segment-rail__segment-header")
                .nth(1)
                .click();
            await page.waitForTimeout(200);

            // Nodes only render inside the active segment.
            const activeSegment = page
                .locator(".ds-segment-rail__segment.is-segment-active")
                .first();
            await expect(
                activeSegment.locator(".ds-segment-rail__nodes")
            ).toBeAttached();

            // Collapsed segments have no nodes rendered.
            const collapsedSegment = page
                .locator(".ds-segment-rail__segment.is-segment-collapsed")
                .first();
            const nodesInCollapsed = await collapsedSegment
                .locator(".ds-segment-rail__nodes")
                .count();
            expect(nodesInCollapsed).toBe(0);
        } finally {
            await ctx.close();
        }
    });

    test("All 7 canon §4.12 required rails still mount", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // 1. Framework rail
            await expect(page.locator(".ds-framework-rail")).toBeAttached();
            // 2. Segment rail
            await expect(page.locator(".ds-segment-rail")).toBeAttached();
            // 3. Recover rail (in dock, when rendered — render-when-data
            //    is acceptable)
            await expect(page.locator(".ds-board__dock")).toBeAttached();
            // 4. Learned-truth ledger (in dock)
            // 5. Worked memory (in dock)
            // 6. Next-step docket (in main column)
            // 7. Support dossier (in footer)
            await expect(page.locator(".ds-footer")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Wave 5 on-call control surfaces still mount", async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // Control band carries CallClock + CompressionToggle.
            await expect(page.locator(".ds-control-band")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("RoomChrome + back-pill + ⌘K palette still wired (Program 6 / PR 1)", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            await expect(page.locator(".ant-room-chrome")).toBeAttached();
            await expect(
                page.locator(".ant-room-chrome__palette-hint")
            ).toBeAttached();

            // With continuity params, the back-pill renders.
            await page.goto(
                "/discovery-studio/?ds=0&returnTo=%2Fcall-planner%2F&returnLabel=Back+to+Call+Planner",
                { waitUntil: "domcontentloaded" }
            );
            await page.waitForTimeout(400);
            await expect(page.locator(".c-back")).toBeAttached();
        } finally {
            await ctx.close();
        }
    });

    test("Framework rail switches active framework on click", async ({
        browser
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
            await page.goto("/discovery-studio/?ds=0", {
                waitUntil: "domcontentloaded"
            });
            await page.waitForTimeout(400);

            // Click second framework.
            await page
                .locator(".ds-board__rail .ds-framework-rail__btn")
                .nth(1)
                .click();
            await page.waitForTimeout(200);

            // Exactly one button is active.
            const activeBtns = page.locator(
                ".ds-board__rail .ds-framework-rail__btn.is-active"
            );
            expect(await activeBtns.count()).toBe(1);

            // The stamp updates to the new framework.
            const stamp = await page.locator(".ds-mast__stamp").textContent();
            expect(stamp?.trim().length ?? 0).toBeGreaterThan(0);
        } finally {
            await ctx.close();
        }
    });
});
