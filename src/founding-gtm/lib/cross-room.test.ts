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
    it("hydrates id/name/persona/trigger/qualityScore from legacy icps[]", () => {
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

    it("reads the real SavedIcp shape (statement → name, buyer → persona)", () => {
        // What ICP Studio actually persists: SavedIcp, with `statement`
        // (no `name`) and `buyer` (no `persona`). Reading bare `name`/
        // `persona` left every ICP nameless.
        const r = loadSectionsInput({
            storage: storage({
                gtmos_icp_analytics: {
                    totalWorked: 3,
                    icps: [
                        {
                            id: "icp_real",
                            statement:
                                "Series A AI-native teams cutting contractor spend",
                            buyer: "Head of Ops",
                            trigger: "new funding round",
                            qualityScore: 74
                        }
                    ]
                }
            })
        });
        expect(r.icps.length).toBe(1);
        expect(r.icps[0].name).toBe(
            "Series A AI-native teams cutting contractor spend"
        );
        expect(r.icps[0].persona).toBe("Head of Ops");
        expect(r.icps[0].trigger).toBe("new funding round");
        expect(r.icps[0].qualityScore).toBe(74);
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
    it("reads both legacy logs (call planner as a bare array)", () => {
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

    it("reads the real Call Planner AgendaSnapshot (single object)", () => {
        // What Call Planner actually persists: one AgendaSnapshot object
        // (latest plan), with `company` + `nextMove` + `preparedAt`, and
        // no `outcome`/`segmentsWorked`. Reading it as a bare array
        // returned zero planned calls.
        const r = loadSectionsInput({
            storage: storage({
                gtmos_discovery_agenda: {
                    contact: "Sarah Chen",
                    company: "Globex",
                    persona: "vp",
                    nextMove: "Send pricing + book technical eval",
                    preparedAt: "2026-05-30T12:00:00.000Z",
                    score: 78,
                    band: "workable"
                }
            })
        });
        expect(r.callPlanner.length).toBe(1);
        expect(r.callPlanner[0].accountName).toBe("Globex");
        expect(r.callPlanner[0].nextStep).toBe(
            "Send pricing + book technical eval"
        );
        // A plan carries no completed-call outcome — stays empty by design.
        expect(r.callPlanner[0].outcome).toBe("");
        expect(r.callPlanner[0].segmentsWorked).toEqual([]);
    });

    it("drops an empty autosaved agenda draft (no account)", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_discovery_agenda: { contact: "", company: "", score: 0 }
            })
        });
        expect(r.callPlanner.length).toBe(0);
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

    it("reads the real Future Autopsy task-log shape (tasks as {id:{done}})", () => {
        // What Future Autopsy actually persists:
        //   { dealId: { tasks: { taskId: { done, doneAt } }, lastRunAt } }
        // The reader previously only handled array-tasks and bare-boolean
        // maps, so real logs surfaced zero completed tasks.
        const r = loadSectionsInput({
            storage: storage({
                gtmos_autopsy_log_v1: {
                    deal_real: {
                        tasks: {
                            fix_champion: { done: true, doneAt: "2026-05-29" },
                            rebuild_agenda: { done: false }
                        },
                        lastRunAt: "2026-05-29T10:00:00.000Z"
                    }
                }
            })
        });
        expect(r.autopsies.length).toBe(1);
        const rec = r.autopsies[0];
        expect(rec.dealId).toBe("deal_real");
        // Only the done task counts as checked; verdict/account aren't in
        // the log (the room regenerates them at render time).
        expect(rec.tasks.length).toBe(1);
        expect(rec.tasks[0].id).toBe("fix_champion");
        expect(rec.verdict).toBe("unknown");
    });
});

describe("loadSectionsInput — Proofs", () => {
    it("hydrates score + band from legacy quality{} bare array", () => {
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

    it("reads the real PoC shape ({pocs:[]} envelope, flat quality fields)", () => {
        // What PoC Framework actually persists: `{ pocs: Proof[] }` with
        // `account` + flat `qualityScore`/`qualityBand`. Reading the bare
        // array off this object returned zero proofs in production.
        const r = loadSectionsInput({
            storage: storage({
                gtmos_poc_data: {
                    pocs: [
                        {
                            id: "proof_real",
                            account: "Initech",
                            outcome: "passed",
                            qualityScore: 82,
                            qualityBand: "ready",
                            linkedDealName: "Initech"
                        }
                    ]
                }
            })
        });
        expect(r.proofs.length).toBe(1);
        expect(r.proofs[0].accountName).toBe("Initech");
        expect(r.proofs[0].score).toBe(82);
        expect(r.proofs[0].band).toBe("ready");
        expect(r.proofs[0].outcome).toBe("passed");
    });
});

describe("loadSectionsInput — Advisor deployments", () => {
    it("hydrates tier + moment + outcome from legacy shape", () => {
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
        expect(r.advisorDeployments[0].accountName).toBe("Acme");
    });

    it("reads the real Deployment shape (dealName → accountName)", () => {
        // What Advisor Deploy actually persists: Deployment carries
        // `dealName`, not `accountName`. The Section 4 coverage-gap
        // surprise matches deployments to deal accounts, so a blank
        // accountName broke the match entirely.
        const r = loadSectionsInput({
            storage: storage({
                gtmos_advisor_deployments: {
                    deployments: [
                        {
                            id: "dep_real",
                            dealId: "d_globex",
                            dealName: "Globex",
                            dealStage: "negotiation",
                            advisorId: "adv_1",
                            advisorName: "Jordan Lee",
                            momentId: "intro_to_eb",
                            momentName: "Intro to the economic buyer",
                            outcome: "deal_advance"
                        }
                    ]
                }
            })
        });
        expect(r.advisorDeployments.length).toBe(1);
        expect(r.advisorDeployments[0].accountName).toBe("Globex");
        expect(r.advisorDeployments[0].moment).toBe("intro_to_eb");
        expect(r.advisorDeployments[0].outcome).toBe("deal_advance");
    });
});

describe("loadSectionsInput — Discovery stats + worked threads (§3 source)", () => {
    it("reads gtmos_discovery_stats counts", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_discovery_stats: { totalCalls: 12, advancedCalls: 5 }
            })
        });
        expect(r.discoveryStats?.totalCalls).toBe(12);
        expect(r.discoveryStats?.advancedCalls).toBe(5);
    });

    it("returns null discoveryStats when totalCalls is 0 or missing", () => {
        const r = loadSectionsInput({
            storage: storage({ gtmos_discovery_stats: { advancedCalls: 2 } })
        });
        expect(r.discoveryStats).toBeNull();
    });

    it("reads gtmos_discovery_worked as the set of truthy node ids", () => {
        const r = loadSectionsInput({
            storage: storage({
                gtmos_discovery_worked: {
                    cx_resolution_1: true,
                    cx_resolution_2: true,
                    cx_agent_1: false
                }
            })
        });
        expect(r.discoveryWorked).toContain("cx_resolution_1");
        expect(r.discoveryWorked).toContain("cx_resolution_2");
        expect(r.discoveryWorked).not.toContain("cx_agent_1");
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
