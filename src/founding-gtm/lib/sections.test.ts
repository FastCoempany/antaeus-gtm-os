import { describe, expect, it } from "vitest";
import {
    authorAllSections,
    authorSection1,
    authorSection2,
    authorSection3,
    authorSection4,
    authorSection5,
    authorSection6,
    authorSection7,
    countReady
} from "./sections";
import type {
    DealRecord,
    IcpRecord,
    SectionsInput
} from "./types";

const empty: SectionsInput = {
    icps: [],
    closedWon: [],
    closedLost: [],
    openDeals: [],
    touches: [],
    cues: [],
    coldCalls: [],
    callPlanner: [],
    autopsies: [],
    proofs: [],
    advisorDeployments: [],
    quota: null
};

function input(over: Partial<SectionsInput> = {}): SectionsInput {
    return { ...empty, ...over };
}

function deal(over: Partial<DealRecord> = {}): DealRecord {
    return {
        id: "d_x",
        accountName: "Acme",
        stage: "discovery",
        value: 0,
        nextStep: "",
        icpLabel: "",
        persona: "",
        trigger: "",
        lossReason: "",
        closeDate: "",
        createdAt: "",
        ...over
    };
}

function icp(over: Partial<IcpRecord> = {}): IcpRecord {
    return {
        id: "i_x",
        name: "X",
        persona: "",
        trigger: "",
        worked: false,
        qualityScore: 0,
        ...over
    };
}

// ─── §1 ────────────────────────────────────────────────────────────────

describe("authorSection1 — Who hits, who misses, why", () => {
    it("is empty with no ICPs and no closes", () => {
        const s = authorSection1(empty);
        expect(s.status).toBe("empty");
        expect(s.body).toEqual([]);
    });

    it("is partial with ICPs but no closes", () => {
        const s = authorSection1(input({ icps: [icp()] }));
        expect(s.status).toBe("partial");
        expect(s.body[0]).toContain("hypothesis");
    });

    it("is partial with closes but no named ICPs", () => {
        const s = authorSection1(
            input({
                closedWon: [deal({ id: "w1" }), deal({ id: "w2" })]
            })
        );
        expect(s.status).toBe("partial");
        expect(s.body[0].toLowerCase()).toContain("instinct");
    });

    it("becomes ready with ICPs + closes; surprises on ICP mismatch", () => {
        const s = authorSection1(
            input({
                icps: [icp({ name: "Mid-market ops leader" })],
                closedWon: [
                    deal({ id: "w1", icpLabel: "tiny SMB", persona: "founder" }),
                    deal({ id: "w2", icpLabel: "tiny SMB", persona: "founder" })
                ],
                closedLost: [deal({ id: "l1", icpLabel: "enterprise" })]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain("doesn't match");
    });

    it("affirms when stated ICP matches actual closes", () => {
        const s = authorSection1(
            input({
                icps: [icp({ name: "ops leader" })],
                closedWon: [
                    deal({ id: "w1", icpLabel: "ops leader" }),
                    deal({ id: "w2", icpLabel: "ops leader" })
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.surprise?.tone).toBe("affirming");
    });
});

// ─── §2 ────────────────────────────────────────────────────────────────

describe("authorSection2 — The rails that worked", () => {
    it("is empty with no reach activity", () => {
        const s = authorSection2(empty);
        expect(s.status).toBe("empty");
    });

    it("is partial under 10 touches total", () => {
        const s = authorSection2(
            input({
                touches: Array(3).fill({
                    accountName: "A",
                    persona: "csuite",
                    temperature: "warm",
                    trigger: "",
                    channel: "email",
                    outcome: "replied",
                    sendLine: "",
                    createdAtIso: ""
                })
            })
        );
        expect(s.status).toBe("partial");
    });

    it("ranks channels by reply rate when ≥10 touches", () => {
        const touches = [
            ...Array(10).fill({
                accountName: "A",
                persona: "csuite",
                temperature: "warm",
                trigger: "",
                channel: "email",
                outcome: "replied",
                sendLine: "Hi —",
                createdAtIso: ""
            }),
            ...Array(10).fill({
                accountName: "B",
                persona: "vp",
                temperature: "cool",
                trigger: "",
                channel: "linkedin_dm",
                outcome: "no_reply",
                sendLine: "",
                createdAtIso: ""
            })
        ];
        const s = authorSection2(input({ touches }));
        expect(s.status).toBe("ready");
        expect(s.evidence[0]).toContain("email");
    });

    it("surfaces 'untried channel' surprise when only one channel is hit", () => {
        const touches = Array(15).fill({
            accountName: "A",
            persona: "csuite",
            temperature: "warm",
            trigger: "",
            channel: "email",
            outcome: "replied",
            sendLine: "",
            createdAtIso: ""
        });
        const s = authorSection2(input({ touches }));
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain("never tried");
    });
});

// ─── §3 ────────────────────────────────────────────────────────────────

describe("authorSection3 — The questions that earned the next meeting", () => {
    it("is empty with no plans", () => {
        const s = authorSection3(empty);
        expect(s.status).toBe("empty");
    });

    it("is partial when plans exist but none advanced", () => {
        const s = authorSection3(
            input({
                callPlanner: [
                    {
                        accountName: "A",
                        persona: "vp",
                        outcome: "no_show",
                        nextStep: "",
                        createdAtIso: "",
                        segmentsWorked: ["pain_and_consequence"]
                    }
                ]
            })
        );
        expect(s.status).toBe("partial");
    });

    it("ranks segments + names the most-pulled thread when ≥1 advanced", () => {
        const s = authorSection3(
            input({
                callPlanner: [
                    {
                        accountName: "A",
                        persona: "vp",
                        outcome: "advanced",
                        nextStep: "Send pricing by Tuesday",
                        createdAtIso: "2026-04-20T10:00:00Z",
                        segmentsWorked: ["pain_and_consequence", "trigger_and_urgency"]
                    },
                    {
                        accountName: "B",
                        persona: "vp",
                        outcome: "advanced",
                        nextStep: "Demo with EB",
                        createdAtIso: "2026-04-21T10:00:00Z",
                        segmentsWorked: ["pain_and_consequence"]
                    }
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body[1]).toContain("pain_and_consequence");
    });

    it("surprises on dropped segments", () => {
        const callPlanner = [
            {
                accountName: "A",
                persona: "vp",
                outcome: "advanced",
                nextStep: "x",
                createdAtIso: "2026-01-01T10:00:00Z",
                segmentsWorked: ["pain_and_consequence", "decision_architecture"]
            },
            ...Array(5).fill({
                accountName: "B",
                persona: "vp",
                outcome: "advanced",
                nextStep: "y",
                createdAtIso: "2026-04-25T10:00:00Z",
                segmentsWorked: ["pain_and_consequence"]
            })
        ];
        const s = authorSection3(input({ callPlanner }));
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain("stopped asking");
    });
});

// ─── §4 ────────────────────────────────────────────────────────────────

describe("authorSection4 — Where deals are won + where they leak", () => {
    it("is empty with no deals", () => {
        const s = authorSection4(empty);
        expect(s.status).toBe("empty");
    });

    it("is partial with <2 closes", () => {
        const s = authorSection4(
            input({
                openDeals: [deal({ id: "o1" })],
                closedWon: [deal({ id: "w1" })]
            })
        );
        expect(s.status).toBe("partial");
    });

    it("computes win rate and lists stage stops on ready path", () => {
        const s = authorSection4(
            input({
                closedWon: [deal({ id: "w1" }), deal({ id: "w2" })],
                closedLost: [
                    deal({ id: "l1", stage: "evaluation" }),
                    deal({ id: "l2", stage: "evaluation" }),
                    deal({ id: "l3", stage: "negotiation" })
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body[0]).toContain("Win rate");
    });

    it("surprises when leaky stage has zero advisor coverage", () => {
        const s = authorSection4(
            input({
                closedWon: [deal({ id: "w1" })],
                closedLost: [
                    deal({ id: "l1", stage: "evaluation" }),
                    deal({ id: "l2", stage: "evaluation" })
                ]
                // no advisor deployments → corrective surprise
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
    });
});

// ─── §5 ────────────────────────────────────────────────────────────────

describe("authorSection5 — The losses we paid for", () => {
    it("is empty with no losses + no autopsies", () => {
        const s = authorSection5(empty);
        expect(s.status).toBe("empty");
    });

    it("is partial when losses exist but no corrected autopsies", () => {
        const s = authorSection5(
            input({
                closedLost: [deal({ id: "l1", lossReason: "Budget" })]
            })
        );
        expect(s.status).toBe("partial");
        expect(s.body[0]).toContain("folklore");
    });

    it("becomes ready with corrected autopsies + cross-refs open deals", () => {
        const s = authorSection5(
            input({
                closedLost: [
                    deal({
                        id: "l1",
                        accountName: "Initech",
                        lossReason: "no champion identified"
                    })
                ],
                autopsies: [
                    {
                        dealId: "l1",
                        accountName: "Initech",
                        verdict: "corrected",
                        killSwitchFired: false,
                        tasks: [
                            {
                                id: "t1",
                                text: "always identify champion before pricing",
                                checked: true
                            }
                        ]
                    }
                ],
                openDeals: [
                    deal({
                        id: "o1",
                        accountName: "Globex",
                        nextStep: "Need to identify champion before next call"
                    })
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain(
            "symptoms of past losses"
        );
    });
});

// ─── §6 ────────────────────────────────────────────────────────────────

describe("authorSection6 — Why we win", () => {
    it("is empty with no wins", () => {
        const s = authorSection6(empty);
        expect(s.status).toBe("empty");
    });

    it("is partial with one win (anecdote, not pattern)", () => {
        const s = authorSection6(
            input({ closedWon: [deal({ id: "w1", accountName: "Acme" })] })
        );
        expect(s.status).toBe("partial");
        expect(s.body[0]).toContain("anecdote");
    });

    it("names the dominant persona + trigger on ≥2 wins", () => {
        const s = authorSection6(
            input({
                closedWon: [
                    deal({
                        id: "w1",
                        persona: "VP Ops",
                        trigger: "burn cut"
                    }),
                    deal({
                        id: "w2",
                        persona: "VP Ops",
                        trigger: "burn cut"
                    })
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body.join(" ")).toContain("VP Ops");
        expect(s.body.join(" ")).toContain("burn cut");
    });

    it("surprises on winning ICP missing from open pipeline", () => {
        const s = authorSection6(
            input({
                closedWon: [
                    deal({ id: "w1", icpLabel: "fintech ops" }),
                    deal({ id: "w2", icpLabel: "fintech ops" })
                ],
                openDeals: [deal({ id: "o1", icpLabel: "agency" })]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain(
            "missing from your current pipeline"
        );
    });
});

// ─── §7 ────────────────────────────────────────────────────────────────

describe("authorSection7 — What the first week looks like", () => {
    it("is empty with no quota", () => {
        const s = authorSection7(empty);
        expect(s.status).toBe("empty");
    });

    it("computes deals/touches/meetings from quota math", () => {
        const s = authorSection7(
            input({
                quota: {
                    quota: 500_000,
                    acv: 50_000,
                    winRate: 0.2,
                    cycle: 60
                },
                openDeals: [deal({ id: "o1" })]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body[0]).toContain("10 deals"); // 500k / 50k
        expect(s.evidence.find((e) => e.includes("Win rate"))).toBeDefined();
    });

    it("surprises when activity stopped (history but nothing recent)", () => {
        const olderIso = new Date(Date.now() - 30 * 86400000).toISOString();
        const s = authorSection7(
            input({
                quota: { quota: 100000, acv: 50000, winRate: 0.2, cycle: 60 },
                touches: Array(10).fill({
                    accountName: "A",
                    persona: "csuite",
                    temperature: "warm",
                    trigger: "",
                    channel: "email",
                    outcome: "replied",
                    sendLine: "",
                    createdAtIso: olderIso
                })
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline.toLowerCase()).toContain("went quiet");
    });
});

// ─── Aggregate ────────────────────────────────────────────────────────

describe("authorAllSections + countReady", () => {
    it("returns 7 sections in canonical order", () => {
        const all = authorAllSections(empty);
        expect(all.map((s) => s.id)).toEqual([
            "who_hits",
            "rails_that_worked",
            "questions_that_earned",
            "won_and_leaked",
            "losses_paid_for",
            "why_we_win",
            "day_one_rhythm"
        ]);
    });

    it("counts statuses correctly", () => {
        const all = authorAllSections(empty);
        const counts = countReady(all);
        expect(counts.empty).toBe(7);
        expect(counts.ready).toBe(0);
    });
});
