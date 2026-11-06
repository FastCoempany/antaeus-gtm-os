import { describe, it, expect } from "vitest";
import { runQualityGate } from "./quality-gate";
import type { DraftPattern } from "./types";

const VALID_IDS = ["itm_001", "itm_002", "itm_003"];

function validPattern(): DraftPattern {
    return {
        name: "Three CDP vendors introduced zero-cost entry options.",
        trajectory: "rising",
        analysis:
            "Two independent CDP competitors introduced zero-cost entry tiers in the same week, and the category incumbent released an open-source option during the same period. That evidence suggests the category's entry price is being contested by multiple vendors rather than by one isolated offer. Three active deals are currently in evaluation or negotiation, where a new free alternative may affect buyer comparisons. Review those deals for pricing objections and document whether orchestration depth, implementation requirements, or another factor still distinguishes the paid option.",
        six_questions: {
            what_changed:
                "Two competitors launched free tiers within 7 days; the incumbent released an open-source option in the same period.",
            evidence: "4 items across 4 sources over a 7-day window. Weighted evidence 3.43.",
            confidence_rationale:
                "The launches are supported by multiple sources. The effect on active deals is an assessment that still needs buyer confirmation.",
            why_it_matters:
                "Three active deals are in stages where a new free alternative may enter the buyer's comparison set.",
            who_needs_to_know: "The founder and founding AE.",
            what_next: "Review the three active deals for new pricing or free-option objections."
        },
        recommended_moves: [
            {
                action: "Review the three active deals for free-option objections.",
                rationale: "The new entry options may change the alternatives buyers compare.",
                destination: "Deal Workspace · active evaluation and negotiation deals"
            },
            {
                action: "Update discovery questions about free alternatives.",
                rationale: "Buyer confirmation is needed before treating the market change as a deal-level objection.",
                destination: "Discovery Studio · pricing alternatives · update"
            }
        ],
        evidence_item_ids: ["itm_001", "itm_002"],
        confidence: 0.82
    };
}

describe("runQualityGate", () => {
    it("passes a clean, calibrated pattern", () => {
        const result = runQualityGate(validPattern(), VALID_IDS);
        expect(result.passes).toBe(true);
        expect(result.failures).toEqual([]);
    });

    it("fails on banned vocabulary anywhere in the pattern", () => {
        const p = {
            ...validPattern(),
            analysis: validPattern().analysis + " This is a seamless, game-changing shift."
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.passes).toBe(false);
        const check = result.checks.find((c) => c.name === "banned_vocabulary");
        expect(check?.pass).toBe(false);
        expect(check?.detail).toContain("seamless");
        expect(check?.detail).toContain("game-changing");
    });

    it("does not false-positive an unrelated substring", () => {
        const p = {
            ...validPattern(),
            analysis: validPattern().analysis + " Their data platform is the source of record."
        };
        expect(runQualityGate(p, VALID_IDS).checks.find((c) => c.name === "banned_vocabulary")?.pass).toBe(true);
    });

    it("enforces analysis length bounds", () => {
        expect(
            runQualityGate({ ...validPattern(), analysis: "Too short." }, VALID_IDS)
                .checks.find((c) => c.name === "analysis_length")?.pass
        ).toBe(false);
        expect(
            runQualityGate({ ...validPattern(), analysis: "word ".repeat(250).trim() }, VALID_IDS)
                .checks.find((c) => c.name === "analysis_length")?.pass
        ).toBe(false);
    });

    it("enforces concise declarative names", () => {
        const long = {
            ...validPattern(),
            name: "This is a very long pattern name that runs well past the twelve word limit."
        };
        expect(runQualityGate(long, VALID_IDS).checks.find((c) => c.name === "name_word_count")?.pass).toBe(false);

        const question = { ...validPattern(), name: "Has the CDP entry price changed?" };
        expect(runQualityGate(question, VALID_IDS).checks.find((c) => c.name === "name_declarative")?.pass).toBe(false);
    });

    it("enforces one to three routed actions", () => {
        expect(runQualityGate({ ...validPattern(), recommended_moves: [] }, VALID_IDS).passes).toBe(false);
        const m = validPattern().recommended_moves[0]!;
        expect(
            runQualityGate({ ...validPattern(), recommended_moves: [m, m, m, m] }, VALID_IDS)
                .checks.find((c) => c.name === "moves_count")?.pass
        ).toBe(false);
        expect(
            runQualityGate(
                { ...validPattern(), recommended_moves: [{ action: "Review it.", rationale: "Evidence changed.", destination: "" }] },
                VALID_IDS
            ).checks.find((c) => c.name === "moves_routed")?.pass
        ).toBe(false);
    });

    it("requires every six-question slot", () => {
        const p = {
            ...validPattern(),
            six_questions: { ...validPattern().six_questions, who_needs_to_know: "" }
        };
        const check = runQualityGate(p, VALID_IDS).checks.find((c) => c.name === "six_questions_complete");
        expect(check?.pass).toBe(false);
        expect(check?.detail).toContain("who_needs_to_know");
    });

    it("allows calibrated uncertainty without an arbitrary word-count failure", () => {
        const p = {
            ...validPattern(),
            analysis:
                "The evidence may reflect a category-wide pricing change, although the effect on individual deals is not yet confirmed. A free tier could matter more in smaller evaluations and might matter less where implementation depth is the deciding factor. The pattern suggests a change in the alternatives buyers can consider, but it does not prove that buyers will choose the free option. Review active deals and ask buyers whether the new alternatives have entered their evaluation."
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.some((c) => c.name === "hedging_density")).toBe(false);
        expect(result.passes).toBe(true);
    });

    it("still rejects indirect/metadiscursive qualification", () => {
        const p = {
            ...validPattern(),
            six_questions: {
                ...validPattern().six_questions,
                confidence_rationale: "It's worth noting that the sample is small."
            }
        };
        expect(
            runQualityGate(p, VALID_IDS).checks.find((c) => c.name === "banned_hedge_constructions")?.pass
        ).toBe(false);
    });

    it("rejects marketing-soup phrasing", () => {
        const p = {
            ...validPattern(),
            analysis: "In today's fast-moving category, the market is changing quickly. " + validPattern().analysis
        };
        expect(runQualityGate(p, VALID_IDS).checks.find((c) => c.name === "marketing_soup")?.pass).toBe(false);
    });

    it("requires valid evidence ids", () => {
        expect(
            runQualityGate({ ...validPattern(), evidence_item_ids: [] }, VALID_IDS)
                .checks.find((c) => c.name === "evidence_ids_valid")?.pass
        ).toBe(false);
        const bad = runQualityGate(
            { ...validPattern(), evidence_item_ids: ["itm_001", "itm_999"] },
            VALID_IDS
        ).checks.find((c) => c.name === "evidence_ids_valid");
        expect(bad?.pass).toBe(false);
        expect(bad?.detail).toContain("itm_999");
    });

    it("requires confidence in [0,1]", () => {
        expect(
            runQualityGate({ ...validPattern(), confidence: 1.4 }, VALID_IDS)
                .checks.find((c) => c.name === "confidence_range")?.pass
        ).toBe(false);
    });

    it("aggregates multiple failures", () => {
        const result = runQualityGate(
            { ...validPattern(), name: "Bad name?", evidence_item_ids: [] },
            VALID_IDS
        );
        expect(result.passes).toBe(false);
        expect(result.failures.length).toBeGreaterThanOrEqual(2);
    });
});
