/**
 * Synthesis prompt construction (B.2c — Stage 5a/5b/5c).
 *
 * Three prompts: Draft (Opus 4.7 + extended thinking), Critique
 * (Sonnet 4.6 cross-model ensemble), Revise (Opus 4.7 back to drafter).
 * Reconstructed from the end-to-end walkthrough §2.6 worked example +
 * the Voice Document v0.1 §6/§7 structural rules. The contrarian prompt
 * in Recipe Layer Spec v0.4 §3.5e is the style template.
 *
 * Prompt version: bump SYNTHESIS_PROMPT_VERSION when the structure
 * changes — the model_v_hash rebases on it so patterns stay attributable.
 *
 * Canonical reference + vitest-tested; Deno mirror in synthesis-shared.ts.
 */

import { BANNED_VOCABULARY } from "./voice-rules";
import type { Critique, DraftPattern, SynthesisInput } from "./types";

export const SYNTHESIS_PROMPT_VERSION = "synthesis-1.0";

/**
 * Compact voice register injected into every synthesis prompt. The full
 * Voice Document lives in deliverables/specs; this is the operative
 * subset the model needs at generation time.
 */
const VOICE_REGISTER = `VOICE
=====
You are a sharp B2B operator with a decade of go-to-market scars, telling a peer what you see. Declarative over hedged. Specific over general. Evidence-anchored over assertion. Address the reader as "you"; never refer to the system as "we".

- The Pattern name is the READ, not the event. Declarative, ends with a period, max 12 words, no question marks, no listicle constructions.
- Analysis: 60–240 words, 2–4 sentences. First sentence is the read. Middle sentences synthesize the evidence. Final sentence is the directional implication.
- Assert when evidence is multi-source and direction is clear. Hedge only when single-source or reaching beyond the evidence — and name the uncertainty directly ("Single-source; confidence medium until corroborated"). Never protect yourself with throat-clearing.
- Max 3 hedging adverbs (may/could/might/possibly/potentially/seems/appears/suggests) in the analysis paragraph.
- Em-dashes earn the punch; fragments are fine when they land. No ellipses.`;

const BANNED_LINE = `BANNED VOCABULARY (never use these): ${BANNED_VOCABULARY.join(", ")}. Also banned: "it's worth noting that", "it could be argued that", "in today's", "the future of", and similar marketing throat-clearing.`;

function renderEvidence(input: SynthesisInput): string[] {
    const lines: string[] = [];
    for (const e of input.evidence) {
        const parts = [`- [${e.enriched_id}] (${e.source_id}`];
        if (e.published_date) parts.push(`, ${e.published_date.slice(0, 10)}`);
        parts.push(`) ${e.title}`);
        lines.push(parts.join(""));
        if (e.summary) lines.push(`    summary: ${e.summary}`);
        if (e.what_changed) lines.push(`    what_changed: ${e.what_changed}`);
        if (e.companies.length > 0) {
            lines.push(`    companies: ${e.companies.join(", ")}`);
        }
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
        if (input.icp.icp_summary) {
            lines.push(`Your ICP: ${input.icp.icp_summary}`);
        }
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
            "(The operator hasn't fully declared their commercial profile or ICP. Anchor why_it_matters on the category implication; keep who_needs_to_know to the operator + founding AE.)"
        );
    }
    return lines;
}

export const DRAFT_SYSTEM_PROMPT = `You are the synthesis stage of a B2B competitive-intelligence briefing. You receive one qualified cluster of evidence and produce one Pattern — a synthesized read of what the evidence means for this specific operator. Not a summary of the items; a read a sharp peer would give.

Respond with ONLY valid JSON matching the schema in the user message. No prose preamble, no markdown fences. The first character of your response must be '{' and the last must be '}'.`;

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
        "Synthesize one Pattern from this cluster. Cite only the evidence item ids above. Produce a JSON object matching this schema:"
    );
    lines.push("");
    lines.push("{");
    lines.push('  "name":        string,   // the READ, declarative, ends with period, ≤12 words');
    lines.push('  "trajectory":  "rising" | "stable" | "declining" | null,');
    lines.push('  "analysis":    string,   // 60–240 words, 2–4 sentences');
    lines.push('  "six_questions": {');
    lines.push('    "what_changed":         string,  // factual, numbers + dates, no interpretation');
    lines.push('    "evidence":             string,  // source counts + types + time window');
    lines.push('    "confidence_rationale": string,  // why this confidence — diversity, corroboration, gaps');
    lines.push('    "why_it_matters":       string,  // specific to the operator ICP + deals; never generic');
    lines.push('    "who_needs_to_know":    string,  // named roles/persona, not "stakeholders"');
    lines.push('    "what_next":            string   // verb-first, concrete, routed destination implied');
    lines.push("  },");
    lines.push('  "recommended_moves": [   // 1–3, highest-leverage first, never padded');
    lines.push('    { "action": string, "rationale": string, "destination": string }');
    lines.push("  ],");
    lines.push('  "evidence_item_ids": string[],  // subset of the ids above that support the read');
    lines.push('  "confidence":        number     // 0.0–1.0');
    lines.push("}");
    lines.push("");
    lines.push(
        "Routed destinations use the form \"Discovery Studio · Phase 04 · refresh existing\", \"Call Planner · Objection Bank · new\", \"Asset Builder · Battlecard · <competitor> · refresh existing\", or \"Outbound Studio · hook · new\"."
    );
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

export const CRITIQUE_SYSTEM_PROMPT = `You are the critique stage of a B2B intelligence briefing — a second, independent reader checking a drafted Pattern against its evidence and the house voice. You are skeptical and specific. Your job is to catch overclaims, unsupported assertions, banned vocabulary, excessive hedging, weak actions, and obvious objections the draft missed.

Respond with ONLY valid JSON matching the schema in the user message. First character '{', last character '}'.`;

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
        "Critique the draft. Be specific: quote the offending text. Check for: claims the evidence doesn't support; assertions of intent that can't be verified; banned vocabulary; more than 3 hedging adverbs in the analysis; marketing soup; weak or vague recommended actions; and obvious objections a sharp reader would raise (e.g. two of the 'three competitors' are actually parent + subsidiary). Produce a JSON object:"
    );
    lines.push("");
    lines.push("{");
    lines.push('  "overclaimed_assertions": [ { "quote": string, "issue": string, "severity": "minor"|"significant"|"major" } ],');
    lines.push('  "unsupported_claims":     [ { "quote": string, "issue": string, "severity": ... } ],');
    lines.push('  "banned_vocabulary_used": string[],');
    lines.push('  "excessive_hedging":      string[],');
    lines.push('  "marketing_soup":         string[],');
    lines.push('  "weak_action":            string[],');
    lines.push('  "obvious_objections":     [ { "objection": string, "severity": ... } ],');
    lines.push('  "revise_required":        boolean,');
    lines.push('  "overall_assessment":     string');
    lines.push("}");
    lines.push("");
    lines.push(
        "Set revise_required true if any issue is severity significant or major, or if any banned vocabulary / marketing soup is present. Respond with the JSON object only."
    );
    return lines.join("\n");
}

export const REVISE_SYSTEM_PROMPT = `You are the reviser — the original drafter, now applying a critique. Produce the corrected Pattern. Keep everything the critique didn't flag; fix everything it did. Stay in the house voice.

Respond with ONLY valid JSON matching the Pattern schema. First character '{', last character '}'.`;

export const GATE_REPAIR_SYSTEM_PROMPT = `You are fixing a Pattern that failed mechanical formatting checks. Make the smallest edits that satisfy the listed failures — do not rewrite the read, change the claim, or touch fields the failures don't mention. Stay in the house voice.

Respond with ONLY the corrected Pattern as JSON (same schema). First character '{', last character '}'.`;

/**
 * One-shot repair when the deterministic Quality Gate rejects a Pattern
 * on fixable mechanics (name too long, too many moves, a hedge
 * construction, etc.). Gives the model the exact failures and asks for
 * the minimal correction — not a re-synthesis.
 */
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
    lines.push("TASK");
    lines.push("====");
    lines.push(
        "Fix exactly the failures listed above with the smallest possible edits. Common fixes: trim the name to ≤12 words while keeping it a declarative read ending in a period; cut recommended_moves to the 3 highest-leverage; remove banned vocabulary or hedge constructions; tighten the analysis to 60–240 words. Keep the claim, the evidence_item_ids, and every field the failures don't mention unchanged. Return the full corrected Pattern as JSON with the same schema."
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
    lines.push("TASK");
    lines.push("====");
    lines.push(
        "Apply the critique. Correct every flagged issue; sharpen factual claims; remove banned vocabulary and excess hedging. Return the full corrected Pattern as JSON with the same schema as the draft (name, trajectory, analysis, six_questions, recommended_moves, evidence_item_ids, confidence). Respond with the JSON object only."
    );
    return lines.join("\n");
}
