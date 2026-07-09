import { describe, expect, it } from "vitest";
import {
    advisorsForDeal,
    recommendedAdvisor,
    recommendedMomentForDeal
} from "./recommend";
import type { Advisor, AdvisorDeal, Deployment } from "./types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "a",
        name: p.name ?? "Sarah",
        title: p.title ?? "",
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
        value: p.value ?? 0,
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

describe("advisorsForDeal", () => {
    it("returns advisors whose companies match the deal account (case-insensitive)", () => {
        const advisors = [
            makeAdvisor({
                id: "a",
                companies: ["Meridian Logistics", "Other Co"]
            }),
            makeAdvisor({ id: "b", companies: ["Beta Corp"] }),
            makeAdvisor({ id: "c", companies: ["MERIDIAN LOGISTICS"] })
        ];
        const deal = makeDeal({ accountName: "Meridian Logistics" });
        expect(
            advisorsForDeal(advisors, deal).map((a) => a.id)
        ).toEqual(["a", "c"]);
    });

    it("returns [] for null deal", () => {
        expect(advisorsForDeal([makeAdvisor({})], null)).toHaveLength(0);
    });

    it("returns [] when account name is empty", () => {
        const deal = makeDeal({ accountName: "" });
        expect(advisorsForDeal([makeAdvisor({})], deal)).toHaveLength(0);
    });
});

describe("recommendedMomentForDeal", () => {
    it("intro for null deal", () => {
        expect(recommendedMomentForDeal(null)).toBe("intro");
    });

    it("intro for prospect stage", () => {
        expect(
            recommendedMomentForDeal(makeDeal({ stage: "prospect" }))
        ).toBe("intro");
    });

    it("eb_bridge for discovery without economicBuyer", () => {
        expect(
            recommendedMomentForDeal(
                makeDeal({ stage: "discovery", economicBuyer: "" })
            )
        ).toBe("eb_bridge");
    });

    it("intro (default branch fallback) for discovery WITH economicBuyer", () => {
        // Legacy code falls through to the final "return intro" after the
        // discovery+EB gate fails to match — the discovery+EB case has no
        // explicit branch.
        expect(
            recommendedMomentForDeal(
                makeDeal({
                    stage: "discovery",
                    economicBuyer: "Sarah Chen"
                })
            )
        ).toBe("intro");
    });

    it("poc_stall for evaluation/poc with overdue or missing nextStepDate", () => {
        const past = "2020-01-01T00:00:00Z";
        expect(
            recommendedMomentForDeal(
                makeDeal({ stage: "evaluation", nextStepDate: past })
            )
        ).toBe("poc_stall");
        expect(
            recommendedMomentForDeal(
                makeDeal({ stage: "poc", nextStepDate: null })
            )
        ).toBe("poc_stall");
    });

    it("reference for evaluation/poc with future nextStepDate", () => {
        const future = "2099-01-01T00:00:00Z";
        expect(
            recommendedMomentForDeal(
                makeDeal({ stage: "evaluation", nextStepDate: future })
            )
        ).toBe("reference");
    });

    it("procurement for negotiation/verbal when nextStep mentions procurement/legal/security", () => {
        for (const word of ["procurement", "legal", "security"]) {
            expect(
                recommendedMomentForDeal(
                    makeDeal({
                        stage: "negotiation",
                        nextStep: `Waiting on ${word} review`
                    })
                )
            ).toBe("procurement");
        }
    });

    it("board_decision for negotiation/verbal without decisionProcess or EB", () => {
        expect(
            recommendedMomentForDeal(
                makeDeal({
                    stage: "negotiation",
                    nextStep: "advance",
                    decisionProcess: "",
                    economicBuyer: "Sarah"
                })
            )
        ).toBe("board_decision");
    });

    it("reference for negotiation/verbal with both decisionProcess + EB", () => {
        expect(
            recommendedMomentForDeal(
                makeDeal({
                    stage: "verbal",
                    nextStep: "advance",
                    decisionProcess: "CIO + CFO",
                    economicBuyer: "Sarah"
                })
            )
        ).toBe("reference");
    });

    it("renewal for closed-won", () => {
        expect(
            recommendedMomentForDeal(makeDeal({ stage: "closed-won" }))
        ).toBe("renewal");
    });
});

describe("recommendedAdvisor", () => {
    const now = Date.parse("2026-04-27T00:00:00Z");

    it("returns null for empty registry", () => {
        expect(recommendedAdvisor([], [], makeDeal({}), now)).toBeNull();
    });

    it("prefers exact-company match with cooldown OK", () => {
        const exactCool = makeAdvisor({
            id: "a",
            tier: "t2",
            companies: ["Meridian Logistics"]
        });
        const deps: Deployment[] = [
            // Make exactCool be cooling
            {
                id: "d1",
                dealId: "",
                dealName: "",
                dealStage: "",
                advisorId: "a",
                advisorName: "",
                momentId: "intro",
                momentName: "",
                ask: "",
                forwardableNote: "",
                outcome: "pending",
                notes: "",
                createdAt: "2026-04-26T00:00:00Z",
                outcomeDate: null
            }
        ];
        const exactAvail = makeAdvisor({
            id: "b",
            tier: "t2",
            companies: ["Meridian Logistics"]
        });
        const deal = makeDeal({ accountName: "Meridian Logistics" });
        const result = recommendedAdvisor(
            [exactCool, exactAvail],
            deps,
            deal,
            now
        );
        expect(result?.id).toBe("b");
    });

    it("falls back to exact-company match (cooling) when no available", () => {
        const exactCool = makeAdvisor({
            id: "a",
            tier: "t2",
            companies: ["Meridian Logistics"]
        });
        const otherAvail = makeAdvisor({ id: "z", companies: [] });
        const deps: Deployment[] = [
            {
                id: "d1",
                dealId: "",
                dealName: "",
                dealStage: "",
                advisorId: "a",
                advisorName: "",
                momentId: "intro",
                momentName: "",
                ask: "",
                forwardableNote: "",
                outcome: "pending",
                notes: "",
                createdAt: "2026-04-26T00:00:00Z",
                outcomeDate: null
            }
        ];
        const deal = makeDeal({ accountName: "Meridian Logistics" });
        expect(
            recommendedAdvisor([exactCool, otherAvail], deps, deal, now)?.id
        ).toBe("a");
    });

    it("falls back to first registered advisor when no exact match", () => {
        const others = [
            makeAdvisor({ id: "first", companies: ["Other"] }),
            makeAdvisor({ id: "second", companies: ["Other"] })
        ];
        const deal = makeDeal({ accountName: "NoMatch Inc" });
        expect(recommendedAdvisor(others, [], deal, now)?.id).toBe(
            "first"
        );
    });
});
