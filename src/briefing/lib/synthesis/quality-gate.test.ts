import { describe, it, expect } from "vitest";
import { runQualityGate } from "./quality-gate";
import type { DraftPattern } from "./types";

const VALID_IDS = ["itm_001", "itm_002", "itm_003"];

// A pattern that passes every gate check — modeled on the walkthrough
// §2.6 CL-001 revised pattern.
function validPattern(): DraftPattern {
    return {
        name: "The CDP entry floor went to zero. Reposition before deals feel it.",
        trajectory: "rising",
        analysis:
            "Two independent CDP competitors launched zero-cost entry tiers within the same week, and the category-defining incumbent moved in parallel. The synchronized timing is the signal: the pricing floor is being contested across the category, not by one opportunistic player. Your active deals at Vector Analytics, Pulse Insights, and Atlas Data all sit in evaluation or negotiation — the stages where a free option becomes the load-bearing objection. Anchor orchestration depth before price surfaces, or the conversation starts on their terms.",
        six_questions: {
            what_changed:
                "Two competitors launched free tiers within 7 days; the incumbent released an open-source build in parallel.",
            evidence: "4 items across 4 sources over a 7-day window. Weighted evidence 3.43.",
            confidence_rationale:
                "Multi-source, same-week timing, independent competitors moving the same direction. Confidence high.",
            why_it_matters:
                "Your sub-$50K pilots are no longer uncontested; expect the free-option objection in three active deals within two weeks.",
            who_needs_to_know: "You and Marcus, the founding AE.",
            what_next: "Refresh Discovery Phase 04 to anchor orchestration depth before price."
        },
        recommended_moves: [
            {
                action: "Refresh Discovery Phase 04 to anchor orchestration depth ahead of pricing.",
                rationale: "If price surfaces first, you compete on price.",
                destination: "Discovery Studio · Phase 04 · refresh existing"
            },
            {
                action: "Draft an objection handler for 'we'll pilot the free option first'.",
                rationale: "The Pulse Insights call this week is high-risk for it.",
                destination: "Call Planner · Objection Bank · new"
            }
        ],
        evidence_item_ids: ["itm_001", "itm_002"],
        confidence: 0.82
    };
}

describe("runQualityGate", () => {
    it("passes a clean pattern", () => {
        const result = runQualityGate(validPattern(), VALID_IDS);
        expect(result.passes).toBe(true);
        expect(result.failures).toEqual([]);
    });

    it("fails on banned vocabulary anywhere in the pattern", () => {
        const p = { ...validPattern(), analysis: validPattern().analysis + " This is a seamless, game-changing shift." };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.passes).toBe(false);
        const check = result.checks.find((c) => c.name === "banned_vocabulary");
        expect(check?.pass).toBe(false);
        expect(check?.detail).toContain("seamless");
        expect(check?.detail).toContain("game-changing");
    });

    it("does not false-positive 'platform' for 'transform' (word boundaries)", () => {
        const p = {
            ...validPattern(),
            analysis: validPattern().analysis + " Their data platform is the anchor."
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "banned_vocabulary")?.pass).toBe(true);
    });

    it("fails when analysis is too short", () => {
        const p = { ...validPattern(), analysis: "Too short to be a real read." };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "analysis_length")?.pass).toBe(false);
    });

    it("fails when analysis is too long", () => {
        const p = { ...validPattern(), analysis: "word ".repeat(250).trim() };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "analysis_length")?.pass).toBe(false);
    });

    it("fails a name over 12 words", () => {
        const p = {
            ...validPattern(),
            name: "This is a very long pattern name that runs well past the twelve word limit."
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "name_word_count")?.pass).toBe(false);
    });

    it("fails a name with a question mark", () => {
        const p = { ...validPattern(), name: "Has the CDP floor gone to zero?" };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "name_declarative")?.pass).toBe(false);
    });

    it("fails a name not ending in a period", () => {
        const p = { ...validPattern(), name: "The CDP entry floor went to zero" };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "name_declarative")?.pass).toBe(false);
    });

    it("fails when there are zero moves", () => {
        const p = { ...validPattern(), recommended_moves: [] };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "moves_count")?.pass).toBe(false);
        expect(result.checks.find((c) => c.name === "moves_routed")?.pass).toBe(false);
    });

    it("fails when there are more than three moves", () => {
        const m = validPattern().recommended_moves[0];
        const p = { ...validPattern(), recommended_moves: [m, m, m, m] };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "moves_count")?.pass).toBe(false);
    });

    it("fails when a move is missing its destination", () => {
        const p = {
            ...validPattern(),
            recommended_moves: [
                { action: "Do the thing.", rationale: "Because.", destination: "" }
            ]
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "moves_routed")?.pass).toBe(false);
    });

    it("fails when a six-question slot is empty", () => {
        const sq = { ...validPattern().six_questions, who_needs_to_know: "" };
        const p = { ...validPattern(), six_questions: sq };
        const result = runQualityGate(p, VALID_IDS);
        const check = result.checks.find((c) => c.name === "six_questions_complete");
        expect(check?.pass).toBe(false);
        expect(check?.detail).toContain("who_needs_to_know");
    });

    it("fails when hedging adverbs exceed three in the analysis", () => {
        const p = {
            ...validPattern(),
            analysis:
                "This may be a shift that could matter, and it might possibly seem like the floor is moving — though the evidence appears mixed and potentially suggests caution. The timing could be coincidence. Either way, the read is that pricing pressure may be arriving in your active deals within the next two-week window soon.",
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "hedging_density")?.pass).toBe(false);
    });

    it("fails on banned hedge constructions", () => {
        const sq = {
            ...validPattern().six_questions,
            confidence_rationale: "It's worth noting that the sample is small."
        };
        const p = { ...validPattern(), six_questions: sq };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "banned_hedge_constructions")?.pass).toBe(false);
    });

    it("fails on marketing-soup phrasing", () => {
        const p = {
            ...validPattern(),
            analysis: "In today's fast-moving category, the CDP floor went to zero. " + validPattern().analysis
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "marketing_soup")?.pass).toBe(false);
    });

    it("fails when evidence ids are empty", () => {
        const p = { ...validPattern(), evidence_item_ids: [] };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "evidence_ids_valid")?.pass).toBe(false);
    });

    it("fails when a cited id is not in the cluster", () => {
        const p = { ...validPattern(), evidence_item_ids: ["itm_001", "itm_999"] };
        const result = runQualityGate(p, VALID_IDS);
        const check = result.checks.find((c) => c.name === "evidence_ids_valid");
        expect(check?.pass).toBe(false);
        expect(check?.detail).toContain("itm_999");
    });

    it("fails when confidence is out of range", () => {
        const p = { ...validPattern(), confidence: 1.4 };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.checks.find((c) => c.name === "confidence_range")?.pass).toBe(false);
    });

    it("aggregates multiple failures", () => {
        const p = {
            ...validPattern(),
            name: "Bad name?",
            evidence_item_ids: []
        };
        const result = runQualityGate(p, VALID_IDS);
        expect(result.passes).toBe(false);
        expect(result.failures.length).toBeGreaterThanOrEqual(2);
    });
});
