import { describe, expect, it } from "vitest";
import { buildFollowRead } from "./follow-data";

/** Minimal storage stub. */
function storageWith(entries: Record<string, unknown>): { getItem(k: string): string | null } {
    const map = new Map<string, string>(
        Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)])
    );
    return { getItem: (k) => map.get(k) ?? null };
}

const RECENT = new Date().toISOString();
const FUTURE = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const STALE = new Date(Date.now() - 40 * 86400000).toISOString();

const SEEDED = {
    gtmos_sc_v4: {
        accounts: [
            {
                id: "a1",
                name: "Ramp",
                signals: [
                    {
                        headline: "Opened 12 AE roles",
                        published_date: RECENT,
                        confidence: 0.95,
                        is_ai: true
                    }
                ]
            },
            { id: "a2", name: "Vanta", signals: [] }
        ]
    },
    gtmos_deal_workspaces: [
        {
            id: "d1",
            accountName: "Ramp",
            value: 84000,
            stage: "verbal",
            nextStep: "Results meeting",
            nextStepDate: FUTURE,
            champion: "Dana Cho",
            economicBuyer: "Priya Nair",
            updated_at: RECENT
        }
    ],
    gtmos_outbound_touches: {
        touches: [
            { id: "t1", accountName: "Ramp", outcome: "sent", createdAt: RECENT },
            { id: "t2", accountName: "Ramp", outcome: "replied", createdAt: RECENT }
        ]
    },
    gtmos_advisor_registry: {
        advisors: [{ id: "adv1", name: "Elena Ruiz", companies: ["Ramp"], tier: "t4" }]
    }
};

describe("buildFollowRead", () => {
    it("returns null when the name is unknown everywhere", () => {
        const read = buildFollowRead("Nobody Corp", { storage: storageWith(SEEDED) });
        expect(read).toBeNull();
    });

    it("returns null on empty storage or blank name", () => {
        expect(buildFollowRead("Ramp", { storage: storageWith({}) })).toBeNull();
        expect(buildFollowRead("   ", { storage: storageWith(SEEDED) })).toBeNull();
    });

    it("assembles where-it-stands from the live deal", () => {
        const read = buildFollowRead("Ramp", { storage: storageWith(SEEDED), herePath: "/dashboard/" });
        expect(read).not.toBeNull();
        expect(read!.stands).toContain("$84k");
        expect(read!.stands).toContain("Verbal Commit");
        expect(read!.stands).toContain(FUTURE);
    });

    it("matches names case-insensitively", () => {
        const read = buildFollowRead("ramp", { storage: storageWith(SEEDED) });
        expect(read).not.toBeNull();
        expect(read!.name).toBe("ramp");
        expect(read!.stands).toContain("$84k");
    });

    it("marks Getting to Signed as the next stop for a deal at terms", () => {
        const read = buildFollowRead("Ramp", { storage: storageWith(SEEDED), herePath: "/deal-workspace/" });
        const gts = read!.stops.find((s) => s.key === "getting-to-signed");
        expect(gts?.state).toBe("next");
        expect(read!.move?.href).toContain("/getting-to-signed/");
        expect(read!.move?.href).toContain("deal=d1");
    });

    it("marks the current room as here", () => {
        const read = buildFollowRead("Ramp", { storage: storageWith(SEEDED), herePath: "/deal-workspace/" });
        const dw = read!.stops.find((s) => s.key === "deal-workspace");
        expect(dw?.state).toBe("here");
    });

    it("remembers the champion, the signer, and who carries weight", () => {
        const read = buildFollowRead("Ramp", { storage: storageWith(SEEDED) });
        expect(read!.remembered).toContain("Dana Cho");
        expect(read!.remembered).toContain("Priya Nair");
        expect(read!.remembered).toContain("Elena Ruiz");
        expect(read!.remembered).toContain("2 touches logged");
    });

    it("carries continuity params on every stop href", () => {
        const read = buildFollowRead("Ramp", {
            storage: storageWith(SEEDED),
            herePath: "/dashboard/",
            hereLabel: "Dashboard"
        });
        for (const stop of read!.stops) {
            expect(stop.href).toContain("focusObject=Ramp");
            expect(stop.href).toContain("fromSurface=follow");
            expect(stop.href).toContain(`returnTo=${encodeURIComponent("/dashboard/")}`);
            expect(stop.href).toContain("returnLabel=Dashboard");
        }
    });

    it("reads an account-only object with heat and routes the move to outbound", () => {
        const read = buildFollowRead("Vanta", { storage: storageWith(SEEDED) });
        expect(read).not.toBeNull();
        expect(read!.stands).toContain("Watched in Signal Console");
        expect(read!.move?.href).toContain("/outbound-studio/");
        expect(read!.move?.href).toContain("account=Vanta");
        const ob = read!.stops.find((s) => s.key === "outbound-studio");
        expect(ob?.state).toBe("next");
    });

    it("routes a decaying deal's move to the Deal Workspace", () => {
        const storage = storageWith({
            ...SEEDED,
            gtmos_deal_workspaces: [
                {
                    id: "d2",
                    accountName: "Ramp",
                    value: 120000,
                    stage: "evaluation",
                    updated_at: STALE
                }
            ]
        });
        const read = buildFollowRead("Ramp", { storage, herePath: "/dashboard/" });
        expect(read!.move?.href).toContain("/deal-workspace/");
        const dw = read!.stops.find((s) => s.key === "deal-workspace");
        expect(dw?.state).toBe("next");
        expect(read!.pulling).toContain("Stalled");
    });

    it("parses the { deals: [...] } envelope shape too", () => {
        const storage = storageWith({
            gtmos_deal_workspaces: {
                deals: [
                    {
                        id: "d3",
                        accountName: "Northwind",
                        value: 50000,
                        stage: "discovery",
                        updated_at: RECENT,
                        nextStep: "Second call",
                        nextStepDate: FUTURE
                    }
                ]
            }
        });
        const read = buildFollowRead("Northwind", { storage });
        expect(read).not.toBeNull();
        expect(read!.stands).toContain("$50k");
    });
});
