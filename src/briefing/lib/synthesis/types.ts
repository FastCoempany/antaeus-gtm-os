/**
 * Synthesis types (B.2c — Stage 3.5 Synthesize).
 *
 * The shapes the Draft → Critique → Revise → Quality Gate flow passes
 * around. Mirrors the worked example in the end-to-end walkthrough §2.6
 * and the briefing_patterns table columns (migration 20260523180000).
 *
 * Canonical reference + vitest-tested; Deno mirror in synthesis-shared.ts.
 */

/** One piece of evidence the synthesis reasons over (an enriched item). */
export interface EvidenceItem {
    /** briefing_enriched_items.id — the id the model cites in evidence_item_ids. */
    readonly enriched_id: string;
    readonly source_id: string;
    readonly title: string;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly summary: string;
    readonly what_changed: string;
    readonly event_category: string;
    readonly companies: ReadonlyArray<string>;
    readonly user_relevance_score: number;
}

/** The cluster being synthesized, plus its resolved evidence. */
export interface SynthesisInput {
    readonly cluster_id: string;
    readonly cluster_type: string;
    readonly anchor: string;
    readonly weighted_evidence: number;
    readonly distinct_sources: number;
    readonly distinct_accounts: number;
    readonly trajectory: "rising" | "stable" | "declining" | null;
    readonly evidence: ReadonlyArray<EvidenceItem>;
    /** Operator commercial identity (ADR-007) — anchors why-it-matters. */
    readonly commercial_profile: {
        readonly product_category: string | null;
        readonly value_prop: string | null;
    } | null;
    /** Aggregated ICP body — target industries + buyers + pains. */
    readonly icp: {
        readonly icp_summary: string;
        readonly target_industries: ReadonlyArray<string>;
        readonly decision_maker_titles: ReadonlyArray<string>;
        readonly pains: ReadonlyArray<string>;
    } | null;
}

export interface RecommendedMove {
    readonly action: string;
    readonly rationale: string;
    /** Routed destination string, e.g. "Discovery Studio · Phase 04 · refresh existing". */
    readonly destination: string;
}

export interface SixQuestions {
    readonly what_changed: string;
    readonly evidence: string;
    readonly confidence_rationale: string;
    readonly why_it_matters: string;
    readonly who_needs_to_know: string;
    readonly what_next: string;
}

/** Stage 5a Draft output (also the shape Revise returns). */
export interface DraftPattern {
    readonly name: string;
    readonly trajectory: "rising" | "stable" | "declining" | null;
    readonly analysis: string;
    readonly six_questions: SixQuestions;
    readonly recommended_moves: ReadonlyArray<RecommendedMove>;
    readonly evidence_item_ids: ReadonlyArray<string>;
    readonly confidence: number;
}

export type CritiqueSeverity = "minor" | "significant" | "major";

export interface CritiqueIssue {
    readonly quote: string;
    readonly issue: string;
    readonly severity: CritiqueSeverity;
}

/** Stage 5b Critique output. */
export interface Critique {
    readonly overclaimed_assertions: ReadonlyArray<CritiqueIssue>;
    readonly unsupported_claims: ReadonlyArray<CritiqueIssue>;
    readonly banned_vocabulary_used: ReadonlyArray<string>;
    readonly excessive_hedging: ReadonlyArray<string>;
    readonly marketing_soup: ReadonlyArray<string>;
    readonly weak_action: ReadonlyArray<string>;
    readonly obvious_objections: ReadonlyArray<{
        readonly objection: string;
        readonly severity: CritiqueSeverity;
    }>;
    readonly revise_required: boolean;
    readonly overall_assessment: string;
}

export interface GateCheck {
    readonly name: string;
    readonly pass: boolean;
    readonly detail: string;
}

/** Stage 5d Quality Gate output. */
export interface GateResult {
    readonly passes: boolean;
    readonly checks: ReadonlyArray<GateCheck>;
    readonly failures: ReadonlyArray<string>;
}
