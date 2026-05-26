import { describe, it, expect } from "vitest";
import { parseCritiqueResponse, parseDraftResponse } from "./parse";

const DRAFT_JSON = JSON.stringify({
    reasoning: { factual_claim: "x", so_what: "y" },
    draft_pattern: {
        name: "The floor went to zero.",
        trajectory: "rising",
        analysis: "A real read about the evidence and what it means for the operator.",
        six_questions: {
            what_changed: "a",
            evidence: "b",
            confidence_rationale: "c",
            why_it_matters: "d",
            who_needs_to_know: "e",
            what_next: "f"
        },
        recommended_moves: [
            { action: "Do X.", rationale: "Because.", destination: "Discovery Studio · Phase 04 · refresh existing" }
        ],
        evidence_item_ids: ["itm_001", "itm_002"],
        confidence: 0.8
    }
});

describe("parseDraftResponse", () => {
    it("parses a wrapped draft_pattern", () => {
        const { pattern, error } = parseDraftResponse(DRAFT_JSON);
        expect(error).toBeNull();
        expect(pattern?.name).toBe("The floor went to zero.");
        expect(pattern?.trajectory).toBe("rising");
        expect(pattern?.recommended_moves).toHaveLength(1);
        expect(pattern?.evidence_item_ids).toEqual(["itm_001", "itm_002"]);
        expect(pattern?.confidence).toBe(0.8);
    });

    it("parses a bare pattern (no wrapper)", () => {
        const bare = JSON.stringify({
            name: "Bare read.",
            analysis: "Some analysis that is sufficiently present to parse.",
            six_questions: {},
            recommended_moves: [],
            evidence_item_ids: [],
            confidence: 0.5
        });
        const { pattern, error } = parseDraftResponse(bare);
        expect(error).toBeNull();
        expect(pattern?.name).toBe("Bare read.");
    });

    it("strips markdown fences", () => {
        const fenced = "```json\n" + DRAFT_JSON + "\n```";
        const { pattern } = parseDraftResponse(fenced);
        expect(pattern?.name).toBe("The floor went to zero.");
    });

    it("clamps confidence into [0,1]", () => {
        const j = JSON.stringify({ name: "n.", analysis: "a real analysis string here", confidence: 5 });
        const { pattern } = parseDraftResponse(j);
        expect(pattern?.confidence).toBe(1);
    });

    it("defaults invalid trajectory to null", () => {
        const j = JSON.stringify({ name: "n.", analysis: "a real analysis string here", trajectory: "sideways" });
        const { pattern } = parseDraftResponse(j);
        expect(pattern?.trajectory).toBeNull();
    });

    it("errors when name missing", () => {
        const j = JSON.stringify({ analysis: "present" });
        const { pattern, error } = parseDraftResponse(j);
        expect(pattern).toBeNull();
        expect(error).toContain("name");
    });

    it("errors when analysis missing", () => {
        const j = JSON.stringify({ name: "n." });
        const { pattern, error } = parseDraftResponse(j);
        expect(pattern).toBeNull();
        expect(error).toContain("analysis");
    });

    it("errors on non-JSON", () => {
        const { pattern, error } = parseDraftResponse("not json at all");
        expect(pattern).toBeNull();
        expect(error).not.toBeNull();
    });

    it("drops malformed moves", () => {
        const j = JSON.stringify({
            name: "n.",
            analysis: "a real analysis string here",
            recommended_moves: [{ action: "ok", destination: "d" }, "garbage", { rationale: "only" }]
        });
        const { pattern } = parseDraftResponse(j);
        expect(pattern?.recommended_moves).toHaveLength(1);
    });
});

describe("parseCritiqueResponse", () => {
    it("parses a full critique", () => {
        const j = JSON.stringify({
            critique: {
                overclaimed_assertions: [
                    { quote: "x", issue: "y", severity: "minor" }
                ],
                unsupported_claims: [],
                banned_vocabulary_used: ["seamless"],
                excessive_hedging: [],
                marketing_soup: [],
                weak_action: [],
                obvious_objections: [{ objection: "z", severity: "significant" }]
            },
            revise_required: true,
            overall_assessment: "Strong draft."
        });
        const { critique, error } = parseCritiqueResponse(j);
        expect(error).toBeNull();
        expect(critique?.revise_required).toBe(true);
        expect(critique?.banned_vocabulary_used).toEqual(["seamless"]);
        expect(critique?.overclaimed_assertions).toHaveLength(1);
        expect(critique?.obvious_objections[0].objection).toBe("z");
    });

    it("reads revise_required nested under critique", () => {
        const j = JSON.stringify({ critique: { revise_required: true } });
        const { critique } = parseCritiqueResponse(j);
        expect(critique?.revise_required).toBe(true);
    });

    it("defaults revise_required false when absent", () => {
        const j = JSON.stringify({ critique: {} });
        const { critique } = parseCritiqueResponse(j);
        expect(critique?.revise_required).toBe(false);
    });

    it("errors on non-JSON", () => {
        const { critique, error } = parseCritiqueResponse("garbage");
        expect(critique).toBeNull();
        expect(error).not.toBeNull();
    });
});
