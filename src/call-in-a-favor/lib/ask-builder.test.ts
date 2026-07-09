import { describe, expect, it } from "vitest";
import { buildAsk, dealPressure } from "./ask-builder";
import { findMoment } from "./moments";
import type { Advisor, AdvisorDeal } from "./types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "a",
        name: p.name ?? "Sarah Chen",
        title: p.title ?? "Operator",
        tier: p.tier ?? "t2",
        expertise: "",
        equity: "",
        companies: p.companies ?? [],
        notes: "",
        relationship: "active",
        createdAt: "2026-01-01T00:00:00Z"
    };
}

function makeDeal(p: Partial<AdvisorDeal>): AdvisorDeal {
    return {
        id: p.id ?? "d",
        accountName: p.accountName ?? "Meridian Logistics",
        stage: p.stage ?? "discovery",
        value: p.value ?? 50000,
        nextStep: p.nextStep ?? "",
        nextStepDate: p.nextStepDate ?? null,
        champion: p.champion ?? "",
        economicBuyer: p.economicBuyer ?? "",
        primaryContact: p.primaryContact ?? "",
        buyer: p.buyer ?? "",
        decisionProcess: p.decisionProcess ?? "",
        advisorHistory: []
    };
}

describe("dealPressure", () => {
    it("returns the no-deal sentence when deal is null", () => {
        expect(dealPressure(null)).toBe("No live deal linked yet.");
    });

    it("flags missing nextStepDate", () => {
        expect(dealPressure(makeDeal({ nextStepDate: null }))).toContain(
            "no dated next step"
        );
    });

    it("flags overdue nextStepDate", () => {
        expect(
            dealPressure(makeDeal({ nextStepDate: "2020-01-01T00:00:00Z" }))
        ).toContain("overdue");
    });

    it("flags blurry decisionProcess in evaluation+", () => {
        expect(
            dealPressure(
                makeDeal({
                    stage: "evaluation",
                    nextStepDate: "2099-01-01T00:00:00Z",
                    decisionProcess: ""
                })
            )
        ).toContain("how the buyer is going to make this decision");
    });

    it("flags missing EB late in the deal", () => {
        expect(
            dealPressure(
                makeDeal({
                    stage: "negotiation",
                    nextStepDate: "2099-01-01T00:00:00Z",
                    decisionProcess: "CIO+CFO",
                    economicBuyer: ""
                })
            )
        ).toContain("signing authority");
    });

    it("flags missing champion in evaluation/poc", () => {
        expect(
            dealPressure(
                makeDeal({
                    stage: "poc",
                    nextStepDate: "2099-01-01T00:00:00Z",
                    decisionProcess: "CIO",
                    champion: ""
                })
            )
        ).toContain("Nobody inside the buyer");
    });

    it("returns the precise-ask copy when nothing is wrong", () => {
        expect(
            dealPressure(
                makeDeal({
                    stage: "negotiation",
                    nextStepDate: "2099-01-01T00:00:00Z",
                    decisionProcess: "CIO",
                    economicBuyer: "Sarah",
                    champion: "Lee"
                })
            )
        ).toContain("precise enough");
    });
});

describe("buildAsk", () => {
    const moment = findMoment("intro");

    it("substitutes [company] and [buyer] tokens in the ask line", () => {
        const out = buildAsk({
            deal: makeDeal({
                accountName: "Acme Inc",
                economicBuyer: "Pat Buyer"
            }),
            advisor: makeAdvisor({ name: "Sarah Chen" }),
            moment,
            customAsk: ""
        });
        expect(out.title).toContain("Acme Inc");
        expect(out.title).toContain("Pat Buyer");
        expect(out.title).not.toContain("[company]");
        expect(out.title).not.toContain("[buyer]");
    });

    it("uses the advisor's first name in the greeting", () => {
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({ name: "Sarah Chen" }),
            moment,
            customAsk: ""
        });
        expect(out.ask).toMatch(/^Hi Sarah,/);
    });

    it("falls back to [advisor] when advisor is null", () => {
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: null,
            moment,
            customAsk: ""
        });
        expect(out.ask).toMatch(/^Hi \[advisor\],/);
    });

    it("buyer fallback walks economicBuyer → champion → primaryContact → buyer → 'the right owner'", () => {
        const out1 = buildAsk({
            deal: makeDeal({ champion: "Lee" }),
            advisor: makeAdvisor({}),
            moment,
            customAsk: ""
        });
        expect(out1.title).toContain("Lee");
        const out2 = buildAsk({
            deal: makeDeal({ primaryContact: "Pat" }),
            advisor: makeAdvisor({}),
            moment,
            customAsk: ""
        });
        expect(out2.title).toContain("Pat");
        const out3 = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment,
            customAsk: ""
        });
        expect(out3.title).toContain("the right owner");
    });

    it("uses customAsk verbatim when non-empty", () => {
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment,
            customAsk: "My custom override line"
        });
        expect(out.ask).toBe("My custom override line");
    });

    it("ignores whitespace-only customAsk", () => {
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment,
            customAsk: "   "
        });
        expect(out.ask).toMatch(/^Hi /);
    });

    it("forward note replaces 'the right owner' placeholder with [Buyer]", () => {
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment,
            customAsk: ""
        });
        expect(out.forward).toContain("[Buyer] -");
    });

    it("forward note uses real buyer when available", () => {
        const out = buildAsk({
            deal: makeDeal({ economicBuyer: "Pat Buyer" }),
            advisor: makeAdvisor({}),
            moment,
            customAsk: ""
        });
        expect(out.forward).toContain("Pat Buyer -");
        expect(out.forward).not.toContain("[Buyer] -");
    });

    it("returns moment proof + outcome verbatim", () => {
        const m = findMoment("eb_bridge");
        const out = buildAsk({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment: m,
            customAsk: ""
        });
        expect(out.proof).toBe(m.proof);
        expect(out.outcome).toBe(m.outcome);
    });
});
