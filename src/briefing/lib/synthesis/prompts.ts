/**
 * Briefing synthesis prompt construction.
 *
 * The synthesis layer must distinguish observed evidence from interpretation,
 * calibrate certainty to source quality, and route actions only to current
 * product surfaces.
 */

import { BANNED_VOCABULARY } from "./voice-rules";
import type { Critique, DraftPattern, SynthesisInput } from "./types";

export const SYNTHESIS_PROMPT_VERSION = "synthesis-1.1";

const VOICE_REGISTER = `VOICE
=====
Write as an experienced B2B operator explaining evidence to another operator. Use ordinary business language and complete propositions.

- Pattern name: one concise declarative sentence, max 12 words, ending with a period. It may state an observed change or an evidence-backed assessment. Do not use a second punch line, slogan, fragment, or imperative.
- Analysis: 60–240 words. State the observed evidence first, then the assessment it supports, then the practical implication. Keep facts, interpretation, and forecast distinguishable.
- State directly supported facts categorically. Use calibrated language such as "may", "suggests", "appears", or "is consistent with" when moving beyond direct observation. Do not imply that correlation proves causation.
- Missing data or silence does not prove an internal buyer or market state.
- Recommended actions must be concrete, routed to a current Antaeus room, and must not promise an outcome.
- Use normal sentences with subjects and verbs. Do not use aphoristic fragments, synthetic symmetry, personification, rhetorical mini-headlines, or em-dashes as substitutes for logical connective tissue.`;

const BANNED_LINE = `BANNED VOCABULARY: ${BANNED_VOCABULARY.join(", ")}. Also avoid indirect framing such as "it's worth noting that", "it could be argued that", "one could argue", marketing throat-clearing, private Antaeus ontology, and slogan-like copy.`;

function renderEvidence(input: SynthesisInput): string[] {
    const lines: string[] = [];
    for (const e of input.evidence) {
        const parts = [`- [${e.enriched_id}] (${e.source_id}`];
        if (e.published_date) parts.push(`, ${e.published_date.slice(0, 10)}`);
        parts.push(`) ${e.title}`);
        lines.push(parts.join(""));
        if (e.summary) lines.push(`    summary: ${e.summary}`);
        if (e.what_changed) lines.push(`    what_changed: ${e.what_changed}`);
        if (e.companies.length > 0) lines.push(`    companies: ${e.companies.join(", ")}`);
        lines.push(`    relevance: ${e.user_relevance_score.toFixed(2)}`);
    }
    return lines;
}

function renderContext(input: SynthesisInput): string[] {
    const lines: string[] = [];
    lines.push("OPERATOR CONTEXT");
    lines.push("================");
    if (input.commercial_profile) {
        if (input.commercial_profile.product_category) {
            lines.push(`What you sell: ${input.commercial_profile.product_category}`);
        }
        if (input.commercial_profile.value_prop) {
            lines.push(`Your value proposition: ${input.commercial_profile.value_prop}`);
        }
    }
    if (input.icp) {
        if (input.icp.icp_summary) lines.push(`Your ICP: ${input.icp.icp_summary}`);
        if (input.icp.target_industries.length > 0) {
            lines.push(`Target industries: ${input.icp.target_industries.join(", ")}`);
        }
        if (input.icp.decision_maker_titles.length > 0) {
            lines.push(`Buyers: ${input.icp.decision_maker_titles.join(", ")}`);
        }
        if (input.icp.pains.length > 0) {
            lines.push(`Buyer pains: ${input.icp.pains.join("; ")}`);
        }
    }
    if (!input.commercial_profile && !input.icp) {
        lines.push(
            "(Commercial profile/ICP is incomplete. Keep why_it_matters at category level and state that the operator-specific implication cannot yet be established.)"
        );
    }
    return lines;
}

export const DRAFT_SYSTEM_PROMPT = `You are the synthesis stage of a B2B competitive-intelligence briefing. You receive one qualified cluster of evidence and produce one Pattern: an evidence-backed explanation of what changed, what the evidence supports, and what the operator should verify or do next.

Do not turn the evidence into a slogan or claim intent/causation that the sources do not establish.

Respond with ONLY valid JSON matching the schema in the user message. No prose preamble or markdown fences.`;

export function buildDraftPrompt(input: SynthesisInput): string {
    const lines: string[] = [];
    lines.push("CLUSTER UNDER SYNTHESIS");
    lines.push("=======================");
    lines.push(`Type: ${input.cluster_type}`);
    lines.push(`Anchor: ${input.anchor}`);
    lines.push(`Weighted evidence: ${input.weighted_evidence.toFixed(2)}`);
    lines.push(`Distinct sources: ${input.distinct_sources}`);
    lines.push(`Distinct accounts: ${input.distinct_accounts}`);
    if (input.trajectory) lines.push(`Trajectory vs prior run: ${input.trajectory}`);
    lines.push("");
    lines.push("EVIDENCE ITEMS");
    lines.push("==============");
    lines.push(...renderEvidence(input));
    lines.push("");
    lines.push(...renderContext(input));
    lines.push("");
    lines.push(VOICE_REGISTER);
    lines.push("");
    lines.push(BANNED_LINE);
    lines.push("");
    lines.push("TASK");
    lines.push("====");
    lines.push(
        "Synthesize one Pattern from this cluster. Cite only the evidence item ids above. Do not claim causation, internal intent, or future outcomes unless the evidence specifically establishes them. Produce this JSON object:"
    );
    lines.push("{");
    lines.push('  "name": string,');
    lines.push('  "trajectory": "rising" | "stable" | "declining" | null,');
    lines.push('  "analysis": string,');
    lines.push('  "six_questions": {');
    lines.push('    "what_changed": string,');
    lines.push('    "evidence": string,');
    lines.push('    "confidence_rationale": string,');
    lines.push('    "why_it_matters": string,');
    lines.push('    "who_needs_to_know": string,');
    lines.push('    "what_next": string');
    lines.push("  },");
    lines.push('  "recommended_moves": [');
    lines.push('    { "action": string, "rationale": string, "destination": string }');
    lines.push("  ],");
    lines.push('  "evidence_item_ids": string[],');
    lines.push('  "confidence": number');
    lines.push("}");
    lines.push("");
    lines.push(
        "Current routed destination examples: \"Deal Workspace · active deal · review\", \"Discovery Studio · question set · update\", \"Cold Call Studio · objection response · update\", \"Outbound Studio · hook · new\", \"Signal Console · watched account · review\", or \"Getting to Signed · security workstream · review\". Do not route to retired or nonexistent rooms."
    );
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

export const CRITIQUE_SYSTEM_PROMPT = `You are the independent critique stage of a B2B intelligence briefing. Compare the draft with its evidence. Flag overclaims, unsupported intent or causation, invented facts, banned vocabulary, indirect/metadiscursive qualification, vague actions, invalid destinations, and objections the draft failed to consider.

Do not penalize calibrated uncertainty merely because it uses words such as may, suggests, or appears.

Respond with ONLY valid JSON matching the schema in the user message.`;

export function buildCritiquePrompt(
    input: SynthesisInput,
    draft: DraftPattern
): string {
    const lines: string[] = [];
    lines.push("EVIDENCE THE DRAFT IS BUILT ON");
    lines.push("==============================");
    lines.push(...renderEvidence(input));
    lines.push("");
    lines.push("DRAFTED PATTERN");
    lines.push("===============");
    lines.push(JSON.stringify(draft, null, 2));
    lines.push("");
    lines.push(VOICE_REGISTER);
    lines.push("");
    lines.push(BANNED_LINE);
    lines.push("");
    lines.push("TASK");
    lines.push("====");
    lines.push(
        "Critique the draft. Quote offending text. Check for: claims the evidence does not support; assertions of intent or causation that cannot be verified; banned vocabulary; indirect/metadiscursive qualification; uncertainty language that is redundant rather than calibrated; marketing filler; vague recommended actions; invalid or retired destinations; and obvious evidence objections. Produce a JSON object:"
    );
    lines.push("{");
    lines.push('  "overclaimed_assertions": [ { "quote": string, "issue": string, "severity": "minor"|"significant"|"major" } ],');
    lines.push('  "unsupported_claims": [ { "quote": string, "issue": string, "severity": "minor"|"significant"|"major" } ],');
    lines.push('  "banned_vocabulary_used": string[],');
    lines.push('  "excessive_hedging": string[],');
    lines.push('  "marketing_soup": string[],');
    lines.push('  "weak_action": string[],');
    lines.push('  "obvious_objections": [ { "objection": string, "severity": "minor"|"significant"|"major" } ],');
    lines.push('  "revise_required": boolean,');
    lines.push('  "overall_assessment": string');
    lines.push("}");
    lines.push(
        "Use excessive_hedging only for redundant or evasive qualification that obscures the assessment, not for necessary epistemic calibration. Set revise_required true for significant/major issues or banned/marketing language."
    );
    return lines.join("\n");
}

export const REVISE_SYSTEM_PROMPT = `You are revising a B2B intelligence Pattern against a critique. Preserve supported facts. Correct every overclaim, unsupported causal/intent assertion, vague action, invalid route, or language violation. Keep evidence and interpretation distinguishable.

Respond with ONLY valid JSON matching the Pattern schema.`;

export const GATE_REPAIR_SYSTEM_PROMPT = `You are fixing a Pattern that failed mechanical quality checks. Make the smallest edits necessary to satisfy the listed failures. Do not strengthen claims, invent evidence, or remove accurate uncertainty simply to sound more decisive.

Respond with ONLY the corrected Pattern as JSON.`;

export function buildGateRepairPrompt(
    pattern: DraftPattern,
    failures: ReadonlyArray<string>
): string {
    const lines: string[] = [];
    lines.push("PATTERN THAT FAILED THE QUALITY GATE");
    lines.push("=====================================");
    lines.push(JSON.stringify(pattern, null, 2));
    lines.push("");
    lines.push("GATE FAILURES TO FIX");
    lines.push("====================");
    for (const f of failures) lines.push(`- ${f}`);
    lines.push("");
    lines.push(VOICE_REGISTER);
    lines.push("");
    lines.push(BANNED_LINE);
    lines.push("");
    lines.push(
        "Fix exactly the listed mechanical failures. Keep supported claims, evidence_item_ids, confidence, and unrelated fields unchanged. Do not turn calibrated uncertainty into categorical certainty. Return the full Pattern as JSON."
    );
    return lines.join("\n");
}

export function buildRevisePrompt(
    input: SynthesisInput,
    draft: DraftPattern,
    critique: Critique
): string {
    const lines: string[] = [];
    lines.push("EVIDENCE");
    lines.push("========");
    lines.push(...renderEvidence(input));
    lines.push("");
    lines.push("YOUR ORIGINAL DRAFT");
    lines.push("===================");
    lines.push(JSON.stringify(draft, null, 2));
    lines.push("");
    lines.push("CRITIQUE TO APPLY");
    lines.push("=================");
    lines.push(JSON.stringify(critique, null, 2));
    lines.push("");
    lines.push(VOICE_REGISTER);
    lines.push("");
    lines.push(BANNED_LINE);
    lines.push("");
    lines.push(
        "Apply the critique. Correct every flagged issue while preserving supported evidence. Separate facts from interpretation, remove unsupported causal/intent claims, keep calibrated uncertainty where warranted, and route actions only to current product surfaces. Return the full corrected Pattern as JSON."
    );
    return lines.join("\n");
}
