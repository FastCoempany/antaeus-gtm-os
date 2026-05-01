import { describe, expect, it } from "vitest";
import { aggregateReadinessInput } from "./readiness-aggregator";
import { EMPTY_READINESS_INPUT } from "@/lib/readiness";

class FakeStorage {
    constructor(private map: Record<string, string> = {}) {}
    getItem(key: string): string | null {
        return this.map[key] ?? null;
    }
}

function storage(map: Record<string, unknown>): FakeStorage {
    const string: Record<string, string> = {};
    for (const k of Object.keys(map)) {
        string[k] =
            typeof map[k] === "string"
                ? (map[k] as string)
                : JSON.stringify(map[k]);
    }
    return new FakeStorage(string);
}

describe("aggregateReadinessInput", () => {
    it("returns EMPTY_READINESS_INPUT when storage is null", () => {
        const r = aggregateReadinessInput({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            storage: undefined as any
        });
        // Falls back to localStorage which is undefined in node — engine
        // returns the empty shape.
        expect(r).toEqual(EMPTY_READINESS_INPUT);
    });

    it("counts ICPs and picks the best qualityScore", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_icp_analytics: {
                    icps: [
                        { qualityScore: 60 },
                        { qualityScore: 88 },
                        { qualityScore: 40 }
                    ]
                }
            })
        });
        expect(r.icpCount).toBe(3);
        expect(r.bestIcpQualityScore).toBe(88);
    });

    it("counts territory accounts (top-level array)", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_ta_accounts: [{}, {}, {}, {}]
            })
        });
        expect(r.territoryAccountCount).toBe(4);
    });

    it("counts only ready/pushed prospects", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_sw_prospects: [
                    { stage: "captured" },
                    { stage: "researched" },
                    { stage: "ready" },
                    { stage: "pushed" },
                    { stage: "dropped" }
                ]
            })
        });
        expect(r.sourcingProspectsReady).toBe(2);
    });

    it("classifies hot vs warm accounts", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [
                        { heat: 80 },
                        { heat: 60 },
                        { heat: 40 },
                        { heat: 92 }
                    ]
                }
            })
        });
        expect(r.accountsWithHeat).toBe(3); // 80 + 60 + 92 are >= 50
        expect(r.hotAccounts).toBe(2); // 80 + 92 are >= 75
    });

    it("respects explicit zero heat over stale legacy _heat", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_sc_v4: {
                    accounts: [{ heat: 0, _heat: 99 }]
                }
            })
        });
        expect(r.hotAccounts).toBe(0);
    });

    it("counts touches + distinct accounts", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_outbound_touches: {
                    touches: [
                        { accountName: "Acme" },
                        { accountName: "Acme" },
                        { accountName: "ACME" }, // case-insensitive dedupe
                        { accountName: "Globex" }
                    ]
                }
            })
        });
        expect(r.outboundTouches).toBe(4);
        expect(r.distinctAccountsTouched).toBe(2);
    });

    it("counts cold-call entries", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_cold_call_log: {
                    calls: [{}, {}, {}]
                }
            })
        });
        expect(r.coldCallsLogged).toBe(3);
    });

    it("counts linkedin actions", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_linkedin_log: {
                    actions: [{}, {}]
                }
            })
        });
        expect(r.linkedinCues).toBe(2);
    });

    it("reads discovery stats verbatim", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_discovery_stats: {
                    totalCalls: 9,
                    advancedCalls: 4
                }
            })
        });
        expect(r.discoveryStudioSessions).toBe(9);
        expect(r.discoveryAdvancedCalls).toBe(4);
    });

    it("classifies deals by stage + next-step + loss reason", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_deal_workspaces: [
                    { stage: "discovery", nextStep: "Send proposal" },
                    { stage: "discovery", nextStep: "" },
                    { stage: "evaluation", nextStep: "Demo" },
                    { stage: "closed-won" },
                    { stage: "closed-won" },
                    {
                        stage: "closed-lost",
                        lossReason: "Budget cut"
                    },
                    { stage: "closed-lost" } // no reason → not analyzed
                ]
            })
        });
        expect(r.activeDeals).toBe(3);
        expect(r.dealsWithNextStep).toBe(2);
        expect(r.closedWonDeals).toBe(2);
        expect(r.closedLostDealsAnalyzed).toBe(1);
    });

    it("counts cast proofs (heat sum > 0 OR named outcome)", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_poc_data: [
                    { outcome: "open" }, // not cast
                    {
                        outcome: "open",
                        heat: { claim: 0, owner: 0, kill: 0 }
                    }, // not cast
                    {
                        outcome: "open",
                        heat: { claim: 5, owner: 0, kill: 0 }
                    }, // cast (heat sum > 0)
                    { outcome: "passed" } // cast (named outcome)
                ]
            })
        });
        expect(r.castProofs).toBe(2);
    });

    it("counts unique deals with autopsy entries", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_autopsy_log_v1: {
                    deal_a: { task1: true },
                    deal_b: { task1: true, task2: true }
                }
            })
        });
        expect(r.futureAutopsiesRun).toBe(2);
    });

    it("counts advisor deployments", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_advisor_deployments: {
                    deployments: [{}, {}, {}, {}]
                }
            })
        });
        expect(r.advisorDeployments).toBe(4);
    });

    it("clamps handoffSectionsReady to 0..7", () => {
        const r = aggregateReadinessInput({
            storage: storage({
                gtmos_founding_gtm_health: { sections_ready: 99 }
            })
        });
        expect(r.handoffSectionsReady).toBe(7);

        const r2 = aggregateReadinessInput({
            storage: storage({
                gtmos_founding_gtm_health: { sections_ready: -3 }
            })
        });
        expect(r2.handoffSectionsReady).toBe(0);
    });

    it("survives malformed JSON without throwing", () => {
        const r = aggregateReadinessInput({
            storage: new FakeStorage({
                gtmos_icp_analytics: "{ invalid",
                gtmos_deal_workspaces: "not an array"
            })
        });
        expect(r.icpCount).toBe(0);
        expect(r.activeDeals).toBe(0);
    });
});
