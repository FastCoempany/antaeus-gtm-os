import { test, expect, type Page } from "@playwright/test";
import { forceNewSurfaces } from "./helpers/force-new-surfaces";

/**
 * New-surface cross-room seam walk.
 *
 * Ground-up replacement for the legacy phase-2 walks, built for the
 * design-system surfaces that are now the production default. It verifies
 * the cross-room SEAMS on the real new surfaces: each room's HandoffStrip
 * (`.ds-handoff`) renders the right routes to the right rooms, every route
 * carries the continuity params (`returnTo` / `fromSurface` / focus), and
 * clicking a handoff actually lands on the destination's new surface.
 *
 * The walks navigate room-to-room by click, so a `?ds=1` URL param can't
 * follow them. Instead `forceNewSurfaces(ctx)` sets a localStorage flag
 * (honored by `isFeatureEnabled`) that resolves every room's gate to the
 * new surface even inside the force-legacy e2e build.
 *
 * The expected routes were captured by driving the real new surfaces with
 * seeded `mm` demo data (zero pageerrors, `.ds-handoff` + full continuity
 * params present).
 */

interface Route {
    readonly dest: string; // destination path, e.g. "/future-autopsy/"
    readonly label: string; // a substring of the route's verb-shape CTA
    readonly primary?: boolean;
}
interface Seam {
    readonly room: string;
    readonly routes: ReadonlyArray<Route>;
    /**
     * Whether the room's handoff routes carry continuity params back to it.
     * True for deal/proof handoffs; false for Founding GTM, whose routes are
     * forward navigation out of the terminal kit room (Open Dashboard, etc.)
     * rather than a deal handoff that needs a return context.
     */
    readonly continuity?: boolean;
}

// Rooms whose HandoffStrip renders on demo-load (the explicit cross-room
// handoffs). Captured from the live new surfaces.
const SEAMS: ReadonlyArray<Seam> = [
    {
        room: "deal-workspace",
        routes: [
            { dest: "/future-autopsy/", label: "Pre-mortem a deal", primary: true },
            { dest: "/poc-framework/", label: "Forge the proof" },
            { dest: "/advisor-deploy/", label: "Deploy an advisor" },
            { dest: "/negotiation/", label: "Rehearse the negotiation" }
        ]
    },
    {
        room: "future-autopsy",
        routes: [
            { dest: "/deal-workspace/", label: "Open the deal", primary: true },
            { dest: "/discovery-studio/", label: "Run discovery again" },
            { dest: "/call-planner/", label: "Plan the next call" }
        ]
    },
    {
        room: "discovery-studio",
        routes: [
            { dest: "/deal-workspace/", label: "the deal", primary: true },
            { dest: "/future-autopsy/", label: "Pre-mortem this deal" },
            { dest: "/call-planner/", label: "Plan the next call" }
        ]
    },
    {
        room: "advisor-deploy",
        routes: [
            { dest: "/deal-workspace/", label: "Update the deal", primary: true },
            { dest: "/future-autopsy/", label: "Pre-mortem the deal" },
            { dest: "/poc-framework/", label: "Forge a proof" },
            { dest: "/negotiation/", label: "Rehearse the negotiation" }
        ]
    },
    {
        room: "negotiation",
        routes: [
            { dest: "/deal-workspace/", label: "Update the deal", primary: true },
            { dest: "/future-autopsy/", label: "Pre-mortem this deal" },
            { dest: "/advisor-deploy/", label: "Carry to an advisor" },
            { dest: "/poc-framework/", label: "Sharpen the proof" }
        ]
    },
    {
        room: "sourcing-workbench",
        routes: [
            { dest: "/signal-console/", label: "Push to Signal Console", primary: true },
            { dest: "/outbound-studio/", label: "Compose outbound" }
        ]
    },
    {
        room: "quota-workback",
        routes: [
            { dest: "/outbound-studio/", label: "Run the outbound", primary: true },
            { dest: "/cold-call-studio/", label: "Run cold calls" },
            { dest: "/deal-workspace/", label: "Check the pipeline" },
            { dest: "/dashboard/", label: "See it on the dashboard" }
        ]
    },
    {
        room: "founding-gtm",
        continuity: false,
        routes: [
            { dest: "/dashboard/", label: "Open the Dashboard", primary: true },
            { dest: "/quota-workback/", label: "Refine the quota math" },
            { dest: "/onboarding/", label: "Re-run onboarding" }
        ]
    }
];

/** Seed mm demo data and land on the room's NEW surface. */
async function gotoNewRoom(page: Page, room: string): Promise<void> {
    const ret = encodeURIComponent(`/${room}/?demo=1&qa=1`);
    await page.goto(`/demo-seed.html?demo=1&autoseed=mm&return=${ret}`);
    await page.waitForURL(new RegExp(`/${room}/`), { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
}

test.describe("new-surface cross-room seam walk", () => {
    for (const seam of SEAMS) {
        test(`${seam.room} HandoffStrip wires every route + continuity params`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            await forceNewSurfaces(ctx);
            const page = await ctx.newPage();
            const errors: string[] = [];
            page.on("pageerror", (e) => errors.push(e.message));
            try {
                await gotoNewRoom(page, seam.room);

                // The new design-system surface rendered, with its handoff.
                await expect(page.locator(".ds-wayfinder")).toBeAttached();
                const handoff = page.locator(".ds-handoff");
                await expect(handoff).toBeVisible();

                const routes = handoff.locator(".ds-handoff__routes a");
                const hrefs = await routes.evaluateAll((els) =>
                    els.map((e) => ({
                        text: e.textContent?.trim() ?? "",
                        href: e.getAttribute("href") ?? "",
                        primary: e.className.includes("ds-btn--accent")
                    }))
                );

                // Exactly one primary route (the one dominant move).
                expect(hrefs.filter((h) => h.primary).length).toBe(1);

                // Every expected route is present, points at the right room,
                // and carries the continuity params back to this room.
                for (const r of seam.routes) {
                    const match = hrefs.find(
                        (h) =>
                            h.href.startsWith(r.dest) &&
                            h.text.includes(r.label)
                    );
                    expect(
                        match,
                        `missing route ${r.label} -> ${r.dest} on ${seam.room}; got ${JSON.stringify(hrefs)}`
                    ).toBeTruthy();
                    if (seam.continuity !== false) {
                        const u = new URL(match!.href, "http://x");
                        expect(u.searchParams.get("returnTo")).toBe(
                            `/${seam.room}/`
                        );
                        expect(u.searchParams.get("fromSurface")).not.toBeNull();
                    }
                    if (r.primary) expect(match!.primary).toBe(true);
                }

                expect(
                    errors,
                    `page errors on ${seam.room}:\n${errors.join("\n")}`
                ).toEqual([]);
            } finally {
                await ctx.close();
            }
        });
    }

    // End-to-end click-throughs: prove a handoff actually navigates to the
    // destination's NEW surface (the force-new flag follows across the
    // full-page <a> navigation, same origin).
    const CHAINS: ReadonlyArray<{ from: string; label: string; to: string }> = [
        { from: "deal-workspace", label: "Pre-mortem a deal", to: "/future-autopsy/" },
        { from: "future-autopsy", label: "Open the deal", to: "/deal-workspace/" },
        { from: "sourcing-workbench", label: "Push to Signal Console", to: "/signal-console/" },
        { from: "quota-workback", label: "Run the outbound", to: "/outbound-studio/" }
    ];

    for (const chain of CHAINS) {
        test(`${chain.from} → ${chain.to} handoff click lands on the new surface`, async ({
            browser
        }) => {
            const ctx = await browser.newContext();
            await forceNewSurfaces(ctx);
            const page = await ctx.newPage();
            const errors: string[] = [];
            page.on("pageerror", (e) => errors.push(e.message));
            try {
                await gotoNewRoom(page, chain.from);

                const cta = page
                    .locator(".ds-handoff__routes a", { hasText: chain.label })
                    .first();
                await expect(cta).toBeVisible();
                await cta.click();

                await page.waitForURL(new RegExp(chain.to), { timeout: 20_000 });
                await page.waitForLoadState("networkidle");

                // Landed on the destination's NEW surface, carrying the
                // continuity param back to the source room.
                await expect(page.locator(".ds-wayfinder")).toBeAttached();
                const u = new URL(page.url());
                expect(u.searchParams.get("returnTo")).toBe(`/${chain.from}/`);

                expect(
                    errors,
                    `page errors on ${chain.from}→${chain.to}:\n${errors.join("\n")}`
                ).toEqual([]);
            } finally {
                await ctx.close();
            }
        });
    }
});
