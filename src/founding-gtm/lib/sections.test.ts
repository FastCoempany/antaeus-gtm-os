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
import type { DealRecord, IcpRecord, SectionsInput } from "./types";

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
    autopsySnapshots: [],
    proofs: [],
    advisorDeployments: [],
    quota: null,
    discoveryCalls: [],
    discoveryStats: null,
    discoveryWorked: []
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

describe("authorSection1 — target customers", () => {
    it("is empty with no ICPs and no closes", () => {
        expect(authorSection1(empty).status).toBe("empty");
    });

    it("is partial when an ICP exists without enough closed-deal history", () => {
        const s = authorSection1(input({ icps: [icp()] }));
        expect(s.status).toBe("partial");
        expect(s.body.join(" ")).toMatch(/not enough outcome history/i);
    });

    it("is partial when closed deals exist without an explicit ICP", () => {
        const s = authorSection1(
            input({ closedWon: [deal({ id: "w1" }), deal({ id: "w2" })] })
        );
        expect(s.status).toBe("partial");
        expect(s.body.join(" ")).toMatch(/no explicit targeting definition/i);
    });

    it("reports ICP mismatch as an observed label mismatch", () => {
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
        expect(s.surprise?.headline).toMatch(/does not match/i);
        expect(s.surprise?.body).toMatch(/closed-won deals with an ICP label/i);
    });

    it("does not claim a lost customer profile caused the loss", () => {
        const s = authorSection1(
            input({
                icps: [icp({ name: "ops" })],
                closedWon: [deal({ id: "w1", icpLabel: "ops" }), deal({ id: "w2", icpLabel: "ops" })],
                closedLost: [deal({ id: "l1", icpLabel: "agency" })]
            })
        );
        expect(s.body.join(" ")).toMatch(/disqualification hypotheses/i);
        expect(s.body.join(" ")).toMatch(/not as proof/i);
    });
});

describe("authorSection2 — outreach patterns", () => {
    it("is empty with no outreach activity", () => {
        expect(authorSection2(empty).status).toBe("empty");
    });

    it("is partial below the comparison threshold", () => {
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
        expect(s.body.join(" ")).toMatch(/not yet enough channel volume/i);
    });

    it("ranks observed channel response rates", () => {
        const touches = [
            ...Array(10).fill({
                accountName: "A",
                persona: "csuite",
                temperature: "warm",
                trigger: "",
                channel: "email",
                outcome: "replied",
                sendLine: "Specific message",
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
        expect(s.body.join(" ")).toMatch(/observed response rate/i);
        expect(s.body.join(" ")).toMatch(/starting hypothesis/i);
    });

    it("treats unused channels as untested rather than ineffective", () => {
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
        expect(s.surprise?.headline).toMatch(/no recorded test/i);
    });
});

describe("authorSection3 — discovery patterns", () => {
    it("is empty with no discovery activity", () => {
        expect(authorSection3(empty).status).toBe("empty");
    });

    it("is partial when a plan exists but no completed call is recorded", () => {
        const s = authorSection3(
            input({
                callPlanner: [
                    {
                        accountName: "A",
                        persona: "vp",
                        outcome: "",
                        nextStep: "Book technical eval",
                        createdAtIso: "",
                        segmentsWorked: []
                    }
                ]
            })
        );
        expect(s.status).toBe("partial");
        expect(s.body.join(" ")).toMatch(/without outcome history/i);
    });

    it("reports aggregate advance rate as observed data", () => {
        const s = authorSection3(
            input({
                discoveryStats: { totalCalls: 12, advancedCalls: 5 },
                discoveryWorked: ["cx_resolution_1", "cx_resolution_2"]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body[0]).toContain("42%");
        expect(s.body[0]).toMatch(/observed advance rate/i);
        expect(s.evidence.some((e) => e.includes("cx_resolution_1"))).toBe(true);
    });

    it("reports a frequent segment on advanced calls without assigning causality", () => {
        const advanced = (id: string, segs: ReadonlyArray<string>) => ({
            id,
            createdAtIso: "2026-05-20T10:00:00.000Z",
            accountName: "Acme",
            activeFramework: "customer-support",
            segmentKeysWorked: segs,
            disposition: "advanced" as const
        });
        const s = authorSection3(
            input({
                discoveryCalls: [
                    advanced("c1", ["pain-and-consequence", "trigger-and-urgency"]),
                    advanced("c2", ["pain-and-consequence", "proof-threshold"]),
                    advanced("c3", ["pain-and-consequence"])
                ]
            })
        );
        expect(s.body[0]).toContain("100%");
        expect(s.body[1]).toContain("pain-and-consequence");
        expect(s.body[1]).toMatch(/pattern to test and teach/i);
        expect(s.body[1]).toMatch(/not as proof/i);
    });

    it("describes missing recent segments as a change to review", () => {
        const s = authorSection3(
            input({
                discoveryCalls: [
                    {
                        id: "old",
                        createdAtIso: "2026-01-01T10:00:00.000Z",
                        accountName: "Old",
                        activeFramework: "customer-support",
                        segmentKeysWorked: ["pain-and-consequence", "trigger-and-urgency"],
                        disposition: "advanced"
                    },
                    ...Array.from({ length: 5 }, (_, i) => ({
                        id: `recent-${i}`,
                        createdAtIso: `2026-05-${10 + i}T10:00:00.000Z`,
                        accountName: "Recent",
                        activeFramework: "customer-support",
                        segmentKeysWorked: ["pain-and-consequence"],
                        disposition: "advanced" as const
                    }))
                ]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline).toMatch(/absent from the last five calls/i);
        expect(s.surprise?.body).toContain("trigger-and-urgency");
    });

    it("uses per-call data before aggregate fallback", () => {
        const s = authorSection3(
            input({
                discoveryStats: { totalCalls: 10, advancedCalls: 7 },
                discoveryCalls: [
                    {
                        id: "c1",
                        createdAtIso: "2026-05-20",
                        accountName: "A",
                        activeFramework: null,
                        segmentKeysWorked: ["opening-frame"],
                        disposition: "lost"
                    }
                ]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline).toMatch(/no logged discovery call/i);
    });
});

describe("authorSection4 — deal progression", () => {
    it("is empty with no deals", () => {
        expect(authorSection4(empty).status).toBe("empty");
    });

    it("is partial with fewer than two closed deals", () => {
        const s = authorSection4(
            input({ openDeals: [deal({ id: "o1" })], closedWon: [deal({ id: "w1" })] })
        );
        expect(s.status).toBe("partial");
    });

    it("reports win rate without treating stage as a cause", () => {
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
        expect(s.body[0]).toContain("40%");
        expect(s.body[0]).toMatch(/does not establish why/i);
    });

    it("treats zero outside-support coverage as a hypothesis to test", () => {
        const s = authorSection4(
            input({
                closedWon: [deal({ id: "w1" })],
                closedLost: [
                    deal({ id: "l1", stage: "evaluation" }),
                    deal({ id: "l2", stage: "evaluation" })
                ]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.body).toMatch(/test whether outside support helps/i);
    });
});

describe("authorSection5 — loss patterns", () => {
    it("is empty with no losses and no reviews", () => {
        expect(authorSection5(empty).status).toBe("empty");
    });

    it("is partial when losses exist without reviewed corrective actions", () => {
        const s = authorSection5(
            input({ closedLost: [deal({ id: "l1", lossReason: "Budget" })] })
        );
        expect(s.status).toBe("partial");
        expect(s.body.join(" ")).toMatch(/without a documented review/i);
    });

    it("counts checked Future Autopsy tasks as reviewed records", () => {
        const s = authorSection5(
            input({
                closedLost: [
                    deal({ id: "l1", accountName: "Meridian Logistics", lossReason: "single-threaded" })
                ],
                autopsies: [
                    {
                        dealId: "l1",
                        accountName: "Meridian Logistics",
                        verdict: "unknown",
                        killSwitchFired: false,
                        tasks: [{ id: "t1", text: "Engage more stakeholders", checked: true }]
                    }
                ]
            })
        );
        expect(s.status).toBe("ready");
        const row = s.evidence.find((e) => e.includes("Meridian Logistics"));
        expect(row).toContain("single-threaded");
        expect(row).toContain("1 corrective action");
    });

    it("labels historical-loss keyword overlap as a text match, not recurrence proof", () => {
        const s = authorSection5(
            input({
                closedLost: [deal({ id: "l1", lossReason: "security review stalled" })],
                openDeals: [deal({ id: "o1", accountName: "OpenCo", nextStep: "complete security review" })],
                autopsies: [
                    {
                        dealId: "l1",
                        accountName: "Acme",
                        verdict: "unknown",
                        killSwitchFired: false,
                        tasks: [{ id: "t1", text: "Review security", checked: true }]
                    }
                ]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline).toMatch(/text overlaps/i);
        expect(s.surprise?.body).toMatch(/not evidence/i);
    });
});

describe("authorSection6 — win patterns", () => {
    it("is partial with one win", () => {
        const s = authorSection6(
            input({ closedWon: [deal({ id: "w1", accountName: "Acme" })] })
        );
        expect(s.status).toBe("partial");
        expect(s.body[0]).toMatch(/not enough to infer/i);
    });

    it("reports recurring persona and trigger as frequencies, not causes", () => {
        const s = authorSection6(
            input({
                closedWon: [
                    deal({ id: "w1", persona: "VP Ops", trigger: "burn cut", icpLabel: "enterprise" }),
                    deal({ id: "w2", persona: "VP Ops", trigger: "burn cut", icpLabel: "enterprise" })
                ]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body.join(" ")).toContain("VP Ops");
        expect(s.body.join(" ")).toContain("burn cut");
        expect(s.body.join(" ")).toMatch(/does not claim those traits caused/i);
    });

    it("reports a closed-won ICP label missing from open pipeline", () => {
        const s = authorSection6(
            input({
                closedWon: [
                    deal({ id: "w1", icpLabel: "enterprise" }),
                    deal({ id: "w2", icpLabel: "enterprise" })
                ],
                openDeals: [deal({ id: "o1", icpLabel: "agency" })]
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline).toMatch(/absent from the current open pipeline/i);
    });
});

describe("authorSection7 — first-week cadence", () => {
    it("is empty without quota inputs", () => {
        expect(authorSection7(empty).status).toBe("empty");
    });

    it("calculates the same quota planning requirements", () => {
        const s = authorSection7(
            input({
                quota: {
                    quota: 500000,
                    acv: 50000,
                    winRate: 0.25,
                    cycle: 90,
                    touchesPerDay: 20
                },
                openDeals: [deal({ id: "o1" })]
            })
        );
        expect(s.status).toBe("ready");
        expect(s.body[0]).toContain("10 closed deals");
        expect(s.evidence.find((e) => e.includes("Win-rate assumption"))).toBeDefined();
        expect(s.body.join(" ")).toMatch(/not as a claim that this schedule causes quota attainment/i);
    });

    it("reports recent activity dropoff as an observation", () => {
        const olderIso = new Date(Date.now() - 30 * 86400000).toISOString();
        const s = authorSection7(
            input({
                quota: {
                    quota: 500000,
                    acv: 50000,
                    winRate: 0.25,
                    cycle: 90,
                    touchesPerDay: 20
                },
                touches: Array(8).fill({
                    accountName: "A",
                    persona: "vp",
                    temperature: "warm",
                    trigger: "",
                    channel: "email",
                    outcome: "no_reply",
                    sendLine: "",
                    createdAtIso: olderIso
                })
            })
        );
        expect(s.surprise?.tone).toBe("corrective");
        expect(s.surprise?.headline).toMatch(/recent outbound activity is lower/i);
    });
});

describe("aggregate", () => {
    it("returns all seven sections in stable order", () => {
        const sections = authorAllSections(empty);
        expect(sections).toHaveLength(7);
        expect(sections.map((s) => s.id)).toEqual([
            "who_hits",
            "rails_that_worked",
            "questions_that_earned",
            "won_and_leaked",
            "losses_paid_for",
            "why_we_win",
            "day_one_rhythm"
        ]);
    });

    it("counts ready / partial / empty", () => {
        expect(
            countReady([
                { id: "who_hits", kicker: "", title: "", status: "ready", body: [], evidence: [], surprise: null },
                { id: "rails_that_worked", kicker: "", title: "", status: "partial", body: [], evidence: [], surprise: null },
                { id: "questions_that_earned", kicker: "", title: "", status: "empty", body: [], evidence: [], surprise: null }
            ])
        ).toEqual({ ready: 1, partial: 1, empty: 1 });
    });
});
