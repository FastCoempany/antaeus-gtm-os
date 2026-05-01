import { describe, expect, it } from "vitest";
import { loadSectionsInput } from "./cross-room";

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

describe("loadSectionsInput — empty + defensive", () => {
    it("returns empty bag with null storage (jsdom no-op)", () => {
        const r = loadSectionsInput({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            storage: undefined as any
        });
        expect(r.icps).toEqual([]);
        expect(r.closedWon).toEqual([]);
        expect(r.openDeals).toEqual([]);
        expect(r.quota).toBeNull();
    });

    it("survives malformed JSON across every key", () => {
        const r = loadSectionsInput({
            storage: new FakeStorage({
                gtmos_icp_analytics: "{{not json",
                gtmos_deal_workspaces: "{{",
                gtmos_outbound_touches: "{{",
                gtmos_linkedin_log: "{{",
                gtmos_cold_call_log: "{{",
                gtmos_discovery_agenda: "{{",
                gtmos_autopsy_log_v1: "{{",
                gtmos_poc_data: "{{",
                gtmos_advisor_deployments: "{{",
                gtmos_qw_inputs: "{{"
            })
        });
        expect(r.icps).toEqual([]);
        expect(r.closedWon).toEqual([]);
        expect(r.touches).toEqual([]);
        expect(r.quota).toBeNull();
    });
});

describe("loadSectionsInput — ICPs", () => {
    it("hydrates id/name/persona/trigger/qualityScore from icps[]", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_icp_analytics: {
                    icps: [
                        {
                            id: "icp_1",
                            name: "Mid-market ops leader",
                            persona: "VP Ops",
                            trigger: "burn cut",
                            qualityScore: 88
                        },
                        // missing id → dropped
                        { name: "no-id" },
                        // not an object → dropped
                        "string"
                    ]
                }
            })
        });
        expect(r.icps.length).toBe(1);
        expect(r.icps[0].name).toBe("Mid-market ops leader");
        expect(r.icps[0].qualityScore).toBe(88);
    });
});

describe("loadSectionsInput — Deals", () => {
    it("splits by stage and accepts both name + accountName", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_deal_workspaces: [
                    {
                        id: "d1",
                        accountName: "Acme",
                        stage: "discovery",
                        nextStep: "demo"
                    },
                    {
                        id: "d2",
                        name: "Globex", // legacy field name
                        stage: "closed-won",
                        value: 80000,
                        closeDate: "2026-04-15"
                    },
                    {
                        id: "d3",
                        accountName: "Initech",
                        stage: "closed-lost",
                        lossReason: "Budget cut",
                        closeDate: "2026-04-01"
                    },
                    {
                        // missing id → dropped
                        accountName: "no-id"
                    }
                ]
            })
        });
        expect(r.openDeals.length).toBe(1);
        expect(r.openDeals[0].accountName).toBe("Acme");
        expect(r.closedWon.length).toBe(1);
        expect(r.closedWon[0].value).toBe(80000);
        expect(r.closedLost.length).toBe(1);
        expect(r.closedLost[0].lossReason).toBe("Budget cut");
    });
});

describe("loadSectionsInput — Touches", () => {
    it("hydrates channel + persona + outcome", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_outbound_touches: {
                    touches: [
                        {
                            accountName: "Acme",
                            persona: "csuite",
                            temperature: "warm",
                            trigger: "funding",
                            channel: "email",
                            outcome: "replied",
                            sendLine: "Hi Sarah —"
                        }
                    ]
                }
            })
        });
        expect(r.touches.length).toBe(1);
        expect(r.touches[0].channel).toBe("email");
    });
});

describe("loadSectionsInput — Cues", () => {
    it("hydrates cueIndex + actionType + outcome", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_linkedin_log: {
                    actions: [
                        {
                            accountName: "Globex",
                            cueIndex: 2,
                            actionType: "connection_request",
                            outcome: "accepted"
                        }
                    ]
                }
            })
        });
        expect(r.cues.length).toBe(1);
        expect(r.cues[0].cueIndex).toBe(2);
    });
});

describe("loadSectionsInput — Cold calls + Call planner", () => {
    it("reads both legacy logs", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_cold_call_log: {
                    calls: [
                        { accountName: "Initech", outcome: "meeting_booked" }
                    ]
                },
                gtmos_discovery_agenda: [
                    {
                        accountName: "Initech",
                        persona: "vp",
                        outcome: "advanced",
                        nextStep: "Send pricing",
                        segmentsWorked: ["pain_and_consequence"]
                    }
                ]
            })
        });
        expect(r.coldCalls.length).toBe(1);
        expect(r.callPlanner.length).toBe(1);
        expect(r.callPlanner[0].segmentsWorked).toEqual([
            "pain_and_consequence"
        ]);
    });
});

describe("loadSectionsInput — Autopsies", () => {
    it("reads both shapes (rich object + legacy task map)", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_autopsy_log_v1: {
                    deal_a: {
                        account_name: "Acme",
                        verdict: "corrected",
                        kill_switch: true,
                        tasks: [
                            { id: "t1", text: "Kill stale demo", checked: true }
                        ]
                    },
                    deal_b: {
                        // legacy bare task map
                        task1: true,
                        task2: true
                    }
                }
            })
        });
        expect(r.autopsies.length).toBe(2);
        const a = r.autopsies.find((x) => x.dealId === "deal_a");
        expect(a?.verdict).toBe("corrected");
        expect(a?.killSwitchFired).toBe(true);
        expect(a?.tasks.length).toBe(1);
        const b = r.autopsies.find((x) => x.dealId === "deal_b");
        expect(b?.verdict).toBe("unknown");
        expect(b?.tasks.length).toBe(2);
    });
});

describe("loadSectionsInput — Proofs", () => {
    it("hydrates score + band from quality{}", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_poc_data: [
                    {
                        id: "p1",
                        accountName: "Acme",
                        outcome: "passed",
                        quality: { score: 78, band: "ready" }
                    }
                ]
            })
        });
        expect(r.proofs.length).toBe(1);
        expect(r.proofs[0].score).toBe(78);
        expect(r.proofs[0].band).toBe("ready");
    });
});

describe("loadSectionsInput — Advisor deployments", () => {
    it("hydrates tier + moment + outcome (momentId fallback)", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_advisor_deployments: {
                    deployments: [
                        {
                            id: "ad1",
                            accountName: "Acme",
                            tier: "t2",
                            momentId: "intro_to_eb",
                            outcome: "deal_advance"
                        }
                    ]
                }
            })
        });
        expect(r.advisorDeployments.length).toBe(1);
        expect(r.advisorDeployments[0].moment).toBe("intro_to_eb");
    });
});

describe("loadSectionsInput — Quota", () => {
    it("returns null when quota is 0 or missing", () => {
        const r = loadSectionsInput({
            storage: storage({ gtmos_qw_inputs: { acv: 50000 } })
        });
        expect(r.quota).toBeNull();
    });

    it("hydrates from real inputs", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_qw_inputs: {
                    quota: 500000,
                    acv: 80000,
                    win: 0.25,
                    cycle: 60
                }
            })
        });
        expect(r.quota?.quota).toBe(500000);
        expect(r.quota?.winRate).toBe(0.25);
    });
});
