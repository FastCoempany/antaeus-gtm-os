import { describe, expect, it } from "vitest";
import { computeSpendRead } from "./score";
import { findMoment } from "./moments";
import type { Advisor, AdvisorDeal } from "./types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "a",
        name: p.name ?? "Sarah",
        title: "",
        tier: "t2",
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
        id: "d",
        accountName: p.accountName ?? "Meridian Logistics",
        stage: p.stage ?? "discovery",
        value: 50000,
        nextStep: "",
        nextStepDate: p.nextStepDate ?? null,
        champion: p.champion ?? "",
        economicBuyer: p.economicBuyer ?? "",
        primaryContact: "",
        buyer: "",
        decisionProcess: "",
        advisorHistory: []
    };
}

describe("computeSpendRead", () => {
    it("returns base 30 / not_ready with everything missing", () => {
        const r = computeSpendRead({
            deal: null,
            advisor: null,
            moment: findMoment("intro"),
            advisors: []
        });
        expect(r.score).toBe(30);
        expect(r.band).toBe("not_ready");
        expect(r.bandLabel).toBe("Not ready");
    });

    it("adds +15 for deal selected", () => {
        const r = computeSpendRead({
            deal: makeDeal({}),
            advisor: null,
            moment: findMoment("intro"),
            advisors: []
        });
        expect(r.score).toBe(45);
    });

    it("adds +15 for advisor selected", () => {
        const r = computeSpendRead({
            deal: null,
            advisor: makeAdvisor({}),
            moment: findMoment("intro"),
            advisors: []
        });
        expect(r.score).toBe(45);
    });

    it("adds +14 for at least one exact-company match", () => {
        const r = computeSpendRead({
            deal: makeDeal({ accountName: "Acme" }),
            advisor: null,
            moment: findMoment("intro"),
            advisors: [makeAdvisor({ companies: ["Acme"] })]
        });
        expect(r.score).toBe(30 + 15 + 14);
    });

    it("adds +8 for nextStepDate", () => {
        const r = computeSpendRead({
            deal: makeDeal({ nextStepDate: "2099-01-01T00:00:00Z" }),
            advisor: null,
            moment: findMoment("intro"),
            advisors: []
        });
        expect(r.score).toBe(30 + 15 + 8);
    });

    it("adds +8 for economicBuyer or champion", () => {
        const ebOnly = computeSpendRead({
            deal: makeDeal({ economicBuyer: "Pat" }),
            advisor: null,
            moment: findMoment("intro"),
            advisors: []
        });
        expect(ebOnly.score).toBe(30 + 15 + 8);
        const champOnly = computeSpendRead({
            deal: makeDeal({ champion: "Lee" }),
            advisor: null,
            moment: findMoment("intro"),
            advisors: []
        });
        expect(champOnly.score).toBe(30 + 15 + 8);
    });

    it("adds +5 for non-intro moment", () => {
        const r = computeSpendRead({
            deal: null,
            advisor: null,
            moment: findMoment("eb_bridge"),
            advisors: []
        });
        expect(r.score).toBe(35);
    });

    it("ask_ready band at score >= 72", () => {
        const r = computeSpendRead({
            deal: makeDeal({
                accountName: "Acme",
                nextStepDate: "2099-01-01T00:00:00Z",
                economicBuyer: "Pat"
            }),
            advisor: makeAdvisor({}),
            moment: findMoment("eb_bridge"),
            advisors: [makeAdvisor({ companies: ["Acme"] })]
        });
        // 30 + 15 + 15 + 14 + 8 + 8 + 5 = 95 → cap 92
        expect(r.score).toBe(92);
        expect(r.band).toBe("ask_ready");
    });

    it("narrow_first band at 54..71", () => {
        // 30 + 15 (deal) + 15 (advisor) = 60
        const r = computeSpendRead({
            deal: makeDeal({}),
            advisor: makeAdvisor({}),
            moment: findMoment("intro"),
            advisors: []
        });
        expect(r.score).toBe(60);
        expect(r.band).toBe("narrow_first");
    });

    it("caps at 92", () => {
        const r = computeSpendRead({
            deal: makeDeal({
                accountName: "Acme",
                nextStepDate: "2099-01-01T00:00:00Z",
                economicBuyer: "Pat",
                champion: "Lee"
            }),
            advisor: makeAdvisor({}),
            moment: findMoment("renewal"),
            advisors: [makeAdvisor({ companies: ["Acme"] })]
        });
        expect(r.score).toBeLessThanOrEqual(92);
    });
});
