import { describe, expect, it } from "vitest";
import {
    loadDealsForRanking,
    loadHotAccountsForRanking
} from "./context";

function storage(rows: Record<string, unknown>): {
    getItem(key: string): string | null;
} {
    const map = new Map<string, string>(
        Object.entries(rows).map(([k, v]) => [k, JSON.stringify(v)])
    );
    return { getItem: (k) => map.get(k) ?? null };
}

describe("loadDealsForRanking", () => {
    it("returns empty on missing storage", () => {
        expect(loadDealsForRanking({ storage: null })).toEqual([]);
    });

    it("returns empty when key is absent", () => {
        expect(loadDealsForRanking({ storage: storage({}) })).toEqual([]);
    });

    it("survives malformed JSON", () => {
        const s = {
            getItem: () => "{{not json"
        };
        expect(loadDealsForRanking({ storage: s })).toEqual([]);
    });

    it("parses an array shape", () => {
        const out = loadDealsForRanking({
            storage: storage({
                gtmos_deal_workspaces: [
                    {
                        id: "d_1",
                        account_name: "Acme",
                        stage: "negotiation",
                        recovery_rank: 60
                    }
                ]
            })
        });
        expect(out.length).toBe(1);
        expect(out[0]!.id).toBe("d_1");
        expect(out[0]!.recovery_rank).toBe(60);
    });

    it("parses an object-keyed-by-id shape", () => {
        const out = loadDealsForRanking({
            storage: storage({
                gtmos_deal_workspaces: {
                    d_1: {
                        id: "d_1",
                        account_name: "Acme",
                        stage: "negotiation",
                        recovery_rank: 60
                    }
                }
            })
        });
        expect(out.length).toBe(1);
    });

    it("accepts both snake_case and camelCase fields", () => {
        const out = loadDealsForRanking({
            storage: storage({
                gtmos_deal_workspaces: [
                    {
                        id: "d_1",
                        accountName: "Acme",
                        stageRaw: "negotiation",
                        recoveryRank: 55,
                        nextStepDate: "2027-01-01"
                    }
                ]
            })
        });
        expect(out[0]!.account_name).toBe("Acme");
        expect(out[0]!.stage).toBe("negotiation");
        expect(out[0]!.recovery_rank).toBe(55);
        expect(out[0]!.next_step_date).toBe("2027-01-01");
    });

    it("drops rows missing id", () => {
        const out = loadDealsForRanking({
            storage: storage({
                gtmos_deal_workspaces: [{ account_name: "Orphan" }]
            })
        });
        expect(out).toEqual([]);
    });
});

describe("loadHotAccountsForRanking", () => {
    it("returns empty when storage absent", () => {
        expect(loadHotAccountsForRanking({ storage: null })).toEqual([]);
    });

    it("ranks by heat descending and caps at limit", () => {
        const out = loadHotAccountsForRanking({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [
                        { id: "a_a", name: "Cool", heat: 30 },
                        { id: "a_b", name: "Hot", heat: 90 },
                        { id: "a_c", name: "Warm", heat: 60 },
                        { id: "a_d", name: "Lukewarm", heat: 40 }
                    ]
                }
            }),
            limit: 2
        });
        expect(out.length).toBe(2);
        expect(out[0]!.account_name).toBe("Hot");
        expect(out[1]!.account_name).toBe("Warm");
    });

    it("falls back to legacy _heat field", () => {
        const out = loadHotAccountsForRanking({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [{ id: "a_legacy", name: "Legacy", _heat: 70 }]
                }
            })
        });
        expect(out[0]!.heat).toBe(70);
    });

    it("drops rows missing id or name", () => {
        const out = loadHotAccountsForRanking({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [
                        { heat: 99 },
                        { id: "a_noname", heat: 80 },
                        { id: "a_good", name: "Good", heat: 50 }
                    ]
                }
            })
        });
        expect(out.length).toBe(1);
        expect(out[0]!.id).toBe("a_good");
    });
});
