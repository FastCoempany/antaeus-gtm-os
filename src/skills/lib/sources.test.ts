import { describe, expect, it } from "vitest";
import {
    resolveHottestSignalConsoleAccount,
    resolveLatestCallPlannerAgenda,
    resolveTopPressureOpenDeal,
    resolveTopStalledDeals
} from "./sources";

function storage(rows: Record<string, unknown>): {
    getItem(key: string): string | null;
} {
    const map = new Map<string, string>(
        Object.entries(rows).map(([k, v]) => [k, JSON.stringify(v)])
    );
    return { getItem: (key) => map.get(key) ?? null };
}

describe("resolveHottestSignalConsoleAccount", () => {
    it("returns none when storage is empty", () => {
        const r = resolveHottestSignalConsoleAccount({ storage: storage({}) });
        expect(r.kind).toBe("none");
    });

    it("picks the highest-heat account", () => {
        const r = resolveHottestSignalConsoleAccount({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [
                        { name: "Cool", heat: 30 },
                        { name: "Hot", heat: 80 },
                        { name: "Warm", heat: 50 }
                    ]
                }
            })
        });
        expect(r.kind).toBe("value");
        if (r.kind !== "value") return;
        expect(r.value).toBe("Hot");
    });

    it("falls back to legacy _heat when canonical heat is absent", () => {
        const r = resolveHottestSignalConsoleAccount({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [{ name: "Legacy", _heat: 70 }]
                }
            })
        });
        expect(r.kind).toBe("value");
    });

    it("ignores rows missing name", () => {
        const r = resolveHottestSignalConsoleAccount({
            storage: storage({
                gtmos_sc_v4: { accounts: [{ heat: 99 }] }
            })
        });
        expect(r.kind).toBe("none");
    });
});

describe("resolveTopPressureOpenDeal", () => {
    it("picks the deal with the highest recovery_rank", () => {
        const r = resolveTopPressureOpenDeal({
            storage: storage({
                gtmos_deal_workspaces: [
                    { id: "d_a", stage: "negotiation", recovery_rank: 5 },
                    { id: "d_b", stage: "discovery", recovery_rank: 12 },
                    { id: "d_c", stage: "negotiation", recovery_rank: 3 }
                ]
            })
        });
        expect(r.kind).toBe("value");
        if (r.kind !== "value") return;
        expect(r.value).toBe("d_b");
    });

    it("ignores closed deals", () => {
        const r = resolveTopPressureOpenDeal({
            storage: storage({
                gtmos_deal_workspaces: [
                    { id: "d_won", stage: "closed-won", recovery_rank: 99 },
                    { id: "d_open", stage: "negotiation", recovery_rank: 1 }
                ]
            })
        });
        expect(r.kind).toBe("value");
        if (r.kind !== "value") return;
        expect(r.value).toBe("d_open");
    });

    it("accepts both array and id-keyed map shapes", () => {
        const r = resolveTopPressureOpenDeal({
            storage: storage({
                gtmos_deal_workspaces: {
                    "d_a": { id: "d_a", stage: "negotiation", recovery_rank: 5 },
                    "d_b": { id: "d_b", stage: "discovery", recovery_rank: 12 }
                }
            })
        });
        expect(r.kind).toBe("value");
    });

    it("returns none when no open deals", () => {
        const r = resolveTopPressureOpenDeal({
            storage: storage({
                gtmos_deal_workspaces: [
                    { id: "d_a", stage: "closed-won", recovery_rank: 9 }
                ]
            })
        });
        expect(r.kind).toBe("none");
    });
});

describe("resolveLatestCallPlannerAgenda", () => {
    it("returns the agenda's accountName", () => {
        const r = resolveLatestCallPlannerAgenda({
            storage: storage({
                gtmos_discovery_agenda: { accountName: "Acme" }
            })
        });
        expect(r.kind).toBe("value");
        if (r.kind !== "value") return;
        expect(r.value).toBe("Acme");
    });

    it("returns none when no agenda or no accountName", () => {
        expect(
            resolveLatestCallPlannerAgenda({ storage: storage({}) }).kind
        ).toBe("none");
        expect(
            resolveLatestCallPlannerAgenda({
                storage: storage({ gtmos_discovery_agenda: {} })
            }).kind
        ).toBe("none");
    });
});

describe("resolveTopStalledDeals", () => {
    it("returns a sorted list of open-deal ids, capped by limit", () => {
        const r = resolveTopStalledDeals({
            storage: storage({
                gtmos_deal_workspaces: [
                    { id: "d_a", stage: "negotiation", recovery_rank: 5 },
                    { id: "d_b", stage: "discovery", recovery_rank: 12 },
                    { id: "d_c", stage: "negotiation", recovery_rank: 3 },
                    { id: "d_d", stage: "evaluation", recovery_rank: 8 }
                ]
            }),
            limit: 2
        });
        expect(r.kind).toBe("list");
        if (r.kind !== "list") return;
        expect(r.values).toEqual(["d_b", "d_d"]);
    });

    it("excludes closed + zero-rank deals", () => {
        const r = resolveTopStalledDeals({
            storage: storage({
                gtmos_deal_workspaces: [
                    { id: "d_won", stage: "closed-won", recovery_rank: 99 },
                    { id: "d_zero", stage: "negotiation", recovery_rank: 0 },
                    { id: "d_real", stage: "negotiation", recovery_rank: 5 }
                ]
            })
        });
        expect(r.kind).toBe("list");
        if (r.kind !== "list") return;
        expect(r.values).toEqual(["d_real"]);
    });

    it("returns none when no qualifying deals", () => {
        const r = resolveTopStalledDeals({ storage: storage({}) });
        expect(r.kind).toBe("none");
    });
});
