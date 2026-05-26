import { describe, it, expect } from "vitest";
import {
    SYNTHESIS_PROMPT_VERSION,
    buildCritiquePrompt,
    buildDraftPrompt,
    buildRevisePrompt
} from "./prompts";
import type { Critique, DraftPattern, SynthesisInput } from "./types";

function input(): SynthesisInput {
    return {
        cluster_id: "cls_1",
        cluster_type: "narrative_shift",
        anchor: "pricing compression",
        weighted_evidence: 3.43,
        distinct_sources: 4,
        distinct_accounts: 3,
        trajectory: "rising",
        evidence: [
            {
                enriched_id: "itm_001",
                source_id: "techcrunch_rss",
                title: "Deel launches free tier",
                url: "https://techcrunch.com/x",
                published_date: "2026-05-20T00:00:00Z",
                summary: "Deel launched a free tier.",
                what_changed: "Entry price went to zero.",
                event_category: "pricing_change",
                companies: ["Deel"],
                user_relevance_score: 0.9
            }
        ],
        commercial_profile: {
            product_category: "Employer of Record platform",
            value_prop: "Hire anywhere in days without an entity."
        },
        icp: {
            icp_summary: "Scaling B2B SaaS going international",
            target_industries: ["B2B SaaS"],
            decision_maker_titles: ["Head of People"],
            pains: ["misclassification exposure"]
        }
    };
}

function draft(): DraftPattern {
    return {
        name: "The entry floor went to zero.",
        trajectory: "rising",
        analysis: "A read.",
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
        evidence_item_ids: ["itm_001"],
        confidence: 0.8
    };
}

describe("buildDraftPrompt", () => {
    it("includes the cluster, evidence ids, and operator context", () => {
        const p = buildDraftPrompt(input());
        expect(p).toContain("pricing compression");
        expect(p).toContain("[itm_001]");
        expect(p).toContain("Employer of Record platform");
        expect(p).toContain("Scaling B2B SaaS going international");
        expect(p).toContain("six_questions");
    });

    it("injects the banned vocabulary line", () => {
        const p = buildDraftPrompt(input());
        expect(p.toLowerCase()).toContain("banned vocabulary");
        expect(p).toContain("seamless");
    });

    it("handles a null commercial profile + null icp", () => {
        const i = { ...input(), commercial_profile: null, icp: null };
        const p = buildDraftPrompt(i);
        expect(p).toContain("hasn't fully declared");
    });
});

describe("buildCritiquePrompt", () => {
    it("includes the draft + evidence", () => {
        const p = buildCritiquePrompt(input(), draft());
        expect(p).toContain("DRAFTED PATTERN");
        expect(p).toContain("The entry floor went to zero.");
        expect(p).toContain("revise_required");
    });
});

describe("buildRevisePrompt", () => {
    it("includes draft + critique", () => {
        const critique: Critique = {
            overclaimed_assertions: [],
            unsupported_claims: [],
            banned_vocabulary_used: [],
            excessive_hedging: [],
            marketing_soup: [],
            weak_action: [],
            obvious_objections: [],
            revise_required: true,
            overall_assessment: "Fix the count."
        };
        const p = buildRevisePrompt(input(), draft(), critique);
        expect(p).toContain("CRITIQUE TO APPLY");
        expect(p).toContain("Fix the count.");
    });
});

describe("SYNTHESIS_PROMPT_VERSION", () => {
    it("is a stable identifier", () => {
        expect(SYNTHESIS_PROMPT_VERSION).toBe("synthesis-1.0");
    });
});
