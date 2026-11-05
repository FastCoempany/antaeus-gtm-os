/**
 * Deno-side Briefing synthesis helpers.
 *
 * Mirrors the behavior of `src/briefing/lib/synthesis/{voice-rules,types,
 * parse,quality-gate,prompts}.ts`. Directness does not require false certainty:
 * facts are categorical; assessments and forecasts are calibrated to evidence.
 */
// deno-lint-ignore-file no-explicit-any

// ── Voice rules ────────────────────────────────────────────────────────

export const BANNED_VOCABULARY: ReadonlyArray<string> = [
    "leverage", "unlock", "revolutionize", "revolutionary", "supercharge",
    "magical", "transform", "transformative", "transformational",
    "game-changing", "game-changer", "paradigm shift", "synergy",
    "synergistic", "best-in-class", "world-class", "cutting-edge",
    "next-generation", "next-gen", "robust", "seamless", "holistic",
    "innovative", "empower", "empowerment", "mission-critical", "streamline"
];

export const BANNED_HEDGE_CONSTRUCTIONS: ReadonlyArray<string> = [
    "it's worth noting that",
    "it is worth noting that",
    "it could be argued that",
    "there may be reasons to consider",
    "some observers might suggest",
    "it is possible, though not certain, that",
    "while the evidence is mixed, one interpretation is",
    "one could argue"
];

export const MARKETING_SOUP_PHRASES: ReadonlyArray<string> = [
    "in today's", "in today’s", "it's no secret that", "it is no secret that",
    "have you ever wondered", "we've all been there", "we have all been there",
    "as a leading", "in the fast-paced world", "now more than ever", "the future of"
];

export const PATTERN_NAME_MAX_WORDS = 12;
export const ANALYSIS_MIN_WORDS = 60;
export const ANALYSIS_MAX_WORDS = 240;
export const MOVES_MIN = 1;
export const MOVES_MAX = 3;

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function countWholeWord(text: string, term: string): number {
    if (!text || !term) return 0;
    const matches = text.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"));
    return matches ? matches.length : 0;
}
function findBannedVocabulary(text: string): string[] {
    return BANNED_VOCABULARY.filter((w) => countWholeWord(text, w) > 0);
}
function findBannedHedgeConstructions(text: string): string[] {
    const lower = text.toLowerCase();
    return BANNED_HEDGE_CONSTRUCTIONS.filter((p) => lower.includes(p));
}
function findMarketingSoup(text: string): string[] {
    const lower = text.toLowerCase();
    return MARKETING_SOUP_PHRASES.filter((p) => lower.includes(p));
}
function wordCount(text: string): number {
    const t = text.trim();
    return t ? t.split(/\s+/).length : 0;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface EvidenceItem {
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

export interface SynthesisInput {
    readonly cluster_id: string;
    readonly cluster_type: string;
    readonly anchor: string;
    readonly weighted_evidence: number;
    readonly distinct_sources: number;
    readonly distinct_accounts: number;
    readonly trajectory: "rising" | "stable" | "declining" | null;
    readonly evidence: ReadonlyArray<EvidenceItem>;
    readonly commercial_profile: {
        readonly product_category: string | null;
        readonly value_prop: string | null;
    } | null;
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
export interface Critique {
    readonly overclaimed_assertions: ReadonlyArray<CritiqueIssue>;
    readonly unsupported_claims: ReadonlyArray<CritiqueIssue>;
    readonly banned_vocabulary_used: ReadonlyArray<string>;
    readonly excessive_hedging: ReadonlyArray<string>;
    readonly marketing_soup: ReadonlyArray<string>;
    readonly weak_action: ReadonlyArray<string>;
    readonly obvious_objections: ReadonlyArray<{ readonly objection: string; readonly severity: CritiqueSeverity }>;
    readonly revise_required: boolean;
    readonly overall_assessment: string;
}
export interface GateCheck {
    readonly name: string;
    readonly pass: boolean;
    readonly detail: string;
}
export interface GateResult {
    readonly passes: boolean;
    readonly checks: ReadonlyArray<GateCheck>;
    readonly failures: ReadonlyArray<string>;
}

// ── Parse ──────────────────────────────────────────────────────────────

function extractJsonObject(raw: string): string | null {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    let s = raw.trim();
    const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch?.[1]) s = fenceMatch[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    return start >= 0 && end > start ? s.slice(start, end + 1) : null;
}
function asString(v: unknown, fallback = ""): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return fallback;
    return String(v);
}
function asStringArray(v: unknown): string[] {
    return Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];
}
function asTrajectory(v: unknown): "rising" | "stable" | "declining" | null {
    return v === "rising" || v === "stable" || v === "declining" ? v : null;
}
function asSeverity(v: unknown): CritiqueSeverity {
    return v === "significant" || v === "major" ? v : "minor";
}
function asConfidence(v: unknown): number {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : 0.5;
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
}
function asSixQuestions(v: unknown): SixQuestions {
    const o = v && typeof v === "object" ? v as Record<string, unknown> : {};
    return {
        what_changed: asString(o["what_changed"]).trim(),
        evidence: asString(o["evidence"]).trim(),
        confidence_rationale: asString(o["confidence_rationale"]).trim(),
        why_it_matters: asString(o["why_it_matters"]).trim(),
        who_needs_to_know: asString(o["who_needs_to_know"]).trim(),
        what_next: asString(o["what_next"]).trim()
    };
}
function asMoves(v: unknown): RecommendedMove[] {
    if (!Array.isArray(v)) return [];
    return v.flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const o = raw as Record<string, unknown>;
        const action = asString(o["action"]).trim();
        const destination = asString(o["destination"]).trim();
        if (!action && !destination) return [];
        return [{ action, rationale: asString(o["rationale"]).trim(), destination }];
    });
}
function asIssues(v: unknown): CritiqueIssue[] {
    if (!Array.isArray(v)) return [];
    return v.flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const o = raw as Record<string, unknown>;
        return [{ quote: asString(o["quote"]).trim(), issue: asString(o["issue"]).trim(), severity: asSeverity(o["severity"]) }];
    });
}
function asObjections(v: unknown): Array<{ objection: string; severity: CritiqueSeverity }> {
    if (!Array.isArray(v)) return [];
    return v.flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const o = raw as Record<string, unknown>;
        const objection = asString(o["objection"]).trim();
        return objection ? [{ objection, severity: asSeverity(o["severity"]) }] : [];
    });
}
function asBool(v: unknown, fallback = false): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        if (v.trim().toLowerCase() === "true") return true;
        if (v.trim().toLowerCase() === "false") return false;
    }
    return fallback;
}

export function parseDraftResponse(raw: string): { pattern: DraftPattern | null; error: string | null } {
    const jsonText = extractJsonObject(raw);
    if (!jsonText) return { pattern: null, error: "no JSON object found in response" };
    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); } catch (err) {
        return { pattern: null, error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}` };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { pattern: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    const candidate = root["draft_pattern"] && typeof root["draft_pattern"] === "object"
        ? root["draft_pattern"] as Record<string, unknown>
        : root["pattern"] && typeof root["pattern"] === "object"
        ? root["pattern"] as Record<string, unknown>
        : root["revised_pattern"] && typeof root["revised_pattern"] === "object"
        ? root["revised_pattern"] as Record<string, unknown>
        : root;
    const name = asString(candidate["name"]).trim();
    const analysis = asString(candidate["analysis"]).trim();
    if (!name) return { pattern: null, error: "pattern missing required 'name'" };
    if (!analysis) return { pattern: null, error: "pattern missing required 'analysis'" };
    return {
        pattern: {
            name,
            trajectory: asTrajectory(candidate["trajectory"]),
            analysis,
            six_questions: asSixQuestions(candidate["six_questions"]),
            recommended_moves: asMoves(candidate["recommended_moves"]),
            evidence_item_ids: asStringArray(candidate["evidence_item_ids"]),
            confidence: asConfidence(candidate["confidence"])
        },
        error: null
    };
}

export function parseCritiqueResponse(raw: string): { critique: Critique | null; error: string | null } {
    const jsonText = extractJsonObject(raw);
    if (!jsonText) return { critique: null, error: "no JSON object found in response" };
    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); } catch (err) {
        return { critique: null, error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}` };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { critique: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    const c = root["critique"] && typeof root["critique"] === "object"
        ? root["critique"] as Record<string, unknown> : root;
    return {
        critique: {
            overclaimed_assertions: asIssues(c["overclaimed_assertions"]),
            unsupported_claims: asIssues(c["unsupported_claims"]),
            banned_vocabulary_used: asStringArray(c["banned_vocabulary_used"]),
            excessive_hedging: asStringArray(c["excessive_hedging"]),
            marketing_soup: asStringArray(c["marketing_soup"]),
            weak_action: asStringArray(c["weak_action"]),
            obvious_objections: asObjections(c["obvious_objections"]),
            revise_required: asBool(root["revise_required"] ?? c["revise_required"]),
            overall_assessment: asString(root["overall_assessment"] ?? c["overall_assessment"]).trim()
        },
        error: null
    };
}

// ── Quality gate ───────────────────────────────────────────────────────

export function runQualityGate(pattern: DraftPattern, validItemIds: ReadonlyArray<string>): GateResult {
    const checks: GateCheck[] = [];
    const sixQ = pattern.six_questions;
    const fullText = [
        pattern.name, pattern.analysis, sixQ.what_changed, sixQ.evidence,
        sixQ.confidence_rationale, sixQ.why_it_matters, sixQ.who_needs_to_know,
        sixQ.what_next,
        pattern.recommended_moves.map((m) => `${m.action} ${m.rationale}`).join(" ")
    ].join(" \n ");

    const banned = findBannedVocabulary(fullText);
    checks.push({ name: "banned_vocabulary", pass: banned.length === 0, detail: banned.length ? `banned vocabulary used: ${banned.join(", ")}` : "no banned vocabulary" });

    const words = wordCount(pattern.analysis);
    checks.push({ name: "analysis_length", pass: words >= ANALYSIS_MIN_WORDS && words <= ANALYSIS_MAX_WORDS, detail: `analysis ${words} words (need ${ANALYSIS_MIN_WORDS}–${ANALYSIS_MAX_WORDS})` });

    const nameWords = wordCount(pattern.name);
    checks.push({ name: "name_word_count", pass: nameWords > 0 && nameWords <= PATTERN_NAME_MAX_WORDS, detail: `name ${nameWords} words (max ${PATTERN_NAME_MAX_WORDS})` });
    const n = pattern.name.trim();
    const declarative = !!n && !n.includes("?") && n.endsWith(".");
    checks.push({ name: "name_declarative", pass: declarative, detail: declarative ? "name is a declarative sentence" : "name must end with a period and contain no question mark" });

    const moveCount = pattern.recommended_moves.length;
    checks.push({ name: "moves_count", pass: moveCount >= MOVES_MIN && moveCount <= MOVES_MAX, detail: `${moveCount} moves (need ${MOVES_MIN}–${MOVES_MAX})` });
    const routed = moveCount > 0 && pattern.recommended_moves.every((m) => m.destination.trim() && m.action.trim());
    checks.push({ name: "moves_routed", pass: Boolean(routed), detail: routed ? "all moves have action + destination" : "a move is missing its action or routed destination" });

    const emptySlots = (Object.keys(sixQ) as Array<keyof SixQuestions>).filter((k) => !sixQ[k].trim());
    checks.push({ name: "six_questions_complete", pass: emptySlots.length === 0, detail: emptySlots.length ? `empty six-question slots: ${emptySlots.join(", ")}` : "all six question slots populated" });

    const indirect = findBannedHedgeConstructions(fullText);
    checks.push({ name: "banned_hedge_constructions", pass: indirect.length === 0, detail: indirect.length ? `indirect qualification: ${indirect.join("; ")}` : "no indirect/metadiscursive qualification" });

    const soup = findMarketingSoup(fullText);
    checks.push({ name: "marketing_soup", pass: soup.length === 0, detail: soup.length ? `marketing-soup phrases: ${soup.join("; ")}` : "no marketing-soup phrases" });

    const validSet = new Set(validItemIds);
    const cited = pattern.evidence_item_ids;
    const allCitedValid = cited.length > 0 && cited.every((id) => validSet.has(id));
    const invalid = cited.filter((id) => !validSet.has(id));
    checks.push({ name: "evidence_ids_valid", pass: allCitedValid, detail: allCitedValid ? `all ${cited.length} cited ids belong to the cluster` : cited.length === 0 ? "no evidence item ids cited" : `cited ids not in cluster: ${invalid.join(", ")}` });

    const confidenceOk = Number.isFinite(pattern.confidence) && pattern.confidence >= 0 && pattern.confidence <= 1;
    checks.push({ name: "confidence_range", pass: confidenceOk, detail: confidenceOk ? `confidence ${pattern.confidence}` : `confidence ${pattern.confidence} outside [0, 1]` });

    const failures = checks.filter((c) => !c.pass).map((c) => c.detail);
    return { passes: failures.length === 0, checks, failures };
}

// ── Prompts ────────────────────────────────────────────────────────────

export const SYNTHESIS_PROMPT_VERSION = "synthesis-1.1";

const VOICE_REGISTER = `VOICE
=====
Write as an experienced B2B operator explaining evidence to another operator. Use ordinary business language and complete propositions.

- Pattern name: one concise declarative sentence, max 12 words, ending with a period. It may state an observed change or an evidence-backed assessment. Do not use a second punch line, slogan, fragment, or imperative.
- Analysis: 60–240 words. State observed evidence first, then the assessment it supports, then the practical implication. Keep facts, interpretation, and forecast distinguishable.
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
        if (e.companies.length) lines.push(`    companies: ${e.companies.join(", ")}`);
        lines.push(`    relevance: ${e.user_relevance_score.toFixed(2)}`);
    }
    return lines;
}
function renderContext(input: SynthesisInput): string[] {
    const lines = ["OPERATOR CONTEXT", "================"];
    if (input.commercial_profile?.product_category) lines.push(`What you sell: ${input.commercial_profile.product_category}`);
    if (input.commercial_profile?.value_prop) lines.push(`Your value proposition: ${input.commercial_profile.value_prop}`);
    if (input.icp?.icp_summary) lines.push(`Your ICP: ${input.icp.icp_summary}`);
    if (input.icp?.target_industries.length) lines.push(`Target industries: ${input.icp.target_industries.join(", ")}`);
    if (input.icp?.decision_maker_titles.length) lines.push(`Buyers: ${input.icp.decision_maker_titles.join(", ")}`);
    if (input.icp?.pains.length) lines.push(`Buyer pains: ${input.icp.pains.join("; ")}`);
    if (!input.commercial_profile && !input.icp) {
        lines.push("(Commercial profile/ICP is incomplete. Keep why_it_matters at category level and state that the operator-specific implication cannot yet be established.)");
    }
    return lines;
}

export const DRAFT_SYSTEM_PROMPT = `You are the synthesis stage of a B2B competitive-intelligence briefing. You receive one qualified cluster of evidence and produce one Pattern: an evidence-backed explanation of what changed, what the evidence supports, and what the operator should verify or do next.

Do not turn the evidence into a slogan or claim intent/causation that the sources do not establish.

Respond with ONLY valid JSON matching the schema in the user message.`;

export function buildDraftPrompt(input: SynthesisInput): string {
    const lines = [
        "CLUSTER UNDER SYNTHESIS", "=======================",
        `Type: ${input.cluster_type}`, `Anchor: ${input.anchor}`,
        `Weighted evidence: ${input.weighted_evidence.toFixed(2)}`,
        `Distinct sources: ${input.distinct_sources}`,
        `Distinct accounts: ${input.distinct_accounts}`
    ];
    if (input.trajectory) lines.push(`Trajectory vs prior run: ${input.trajectory}`);
    lines.push("", "EVIDENCE ITEMS", "==============", ...renderEvidence(input), "", ...renderContext(input), "", VOICE_REGISTER, "", BANNED_LINE, "", "TASK", "====");
    lines.push("Synthesize one Pattern from this cluster. Cite only the evidence item ids above. Do not claim causation, internal intent, or future outcomes unless the evidence specifically establishes them. Produce this JSON object:");
    lines.push(`{
  "name": string,
  "trajectory": "rising" | "stable" | "declining" | null,
  "analysis": string,
  "six_questions": {
    "what_changed": string,
    "evidence": string,
    "confidence_rationale": string,
    "why_it_matters": string,
    "who_needs_to_know": string,
    "what_next": string
  },
  "recommended_moves": [ { "action": string, "rationale": string, "destination": string } ],
  "evidence_item_ids": string[],
  "confidence": number
}`);
    lines.push("Current routed destination examples: \"Deal Workspace · active deal · review\", \"Discovery Studio · question set · update\", \"Cold Call Studio · objection response · update\", \"Outbound Studio · hook · new\", \"Signal Console · watched account · review\", or \"Getting to Signed · security workstream · review\". Do not route to retired or nonexistent rooms.");
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

export const CRITIQUE_SYSTEM_PROMPT = `You are the independent critique stage of a B2B intelligence briefing. Compare the draft with its evidence. Flag overclaims, unsupported intent or causation, invented facts, banned vocabulary, indirect/metadiscursive qualification, vague actions, invalid destinations, and objections the draft failed to consider.

Do not penalize calibrated uncertainty merely because it uses words such as may, suggests, or appears.

Respond with ONLY valid JSON matching the schema in the user message.`;

export function buildCritiquePrompt(input: SynthesisInput, draft: DraftPattern): string {
    const lines = ["EVIDENCE THE DRAFT IS BUILT ON", "==============================", ...renderEvidence(input), "", "DRAFTED PATTERN", "===============", JSON.stringify(draft, null, 2), "", VOICE_REGISTER, "", BANNED_LINE, "", "TASK", "===="];
    lines.push("Critique the draft. Quote offending text. Check for unsupported claims, intent or causation that cannot be verified, banned vocabulary, indirect qualification, redundant uncertainty language, marketing filler, vague actions, invalid routes, and obvious evidence objections.");
    lines.push(`{
  "overclaimed_assertions": [ { "quote": string, "issue": string, "severity": "minor"|"significant"|"major" } ],
  "unsupported_claims": [ { "quote": string, "issue": string, "severity": "minor"|"significant"|"major" } ],
  "banned_vocabulary_used": string[],
  "excessive_hedging": string[],
  "marketing_soup": string[],
  "weak_action": string[],
  "obvious_objections": [ { "objection": string, "severity": "minor"|"significant"|"major" } ],
  "revise_required": boolean,
  "overall_assessment": string
}`);
    lines.push("Use excessive_hedging only for redundant or evasive qualification that obscures the assessment, not for necessary epistemic calibration. Set revise_required true for significant/major issues or banned/marketing language.");
    return lines.join("\n");
}

export const REVISE_SYSTEM_PROMPT = `You are revising a B2B intelligence Pattern against a critique. Preserve supported facts. Correct every overclaim, unsupported causal/intent assertion, vague action, invalid route, or language violation. Keep evidence and interpretation distinguishable.

Respond with ONLY valid JSON matching the Pattern schema.`;

export const GATE_REPAIR_SYSTEM_PROMPT = `You are fixing a Pattern that failed mechanical quality checks. Make the smallest edits necessary to satisfy the listed failures. Do not strengthen claims, invent evidence, or remove accurate uncertainty simply to sound more decisive.

Respond with ONLY the corrected Pattern as JSON.`;

export function buildGateRepairPrompt(pattern: DraftPattern, failures: ReadonlyArray<string>): string {
    const lines = ["PATTERN THAT FAILED THE QUALITY GATE", "=====================================", JSON.stringify(pattern, null, 2), "", "GATE FAILURES TO FIX", "====================", ...failures.map((f) => `- ${f}`), "", VOICE_REGISTER, "", BANNED_LINE, ""];
    lines.push("Fix exactly the listed mechanical failures. Keep supported claims, evidence_item_ids, confidence, and unrelated fields unchanged. Do not turn calibrated uncertainty into categorical certainty. Return the full Pattern as JSON.");
    return lines.join("\n");
}

export function buildRevisePrompt(input: SynthesisInput, draft: DraftPattern, critique: Critique): string {
    const lines = ["EVIDENCE", "========", ...renderEvidence(input), "", "YOUR ORIGINAL DRAFT", "===================", JSON.stringify(draft, null, 2), "", "CRITIQUE TO APPLY", "=================", JSON.stringify(critique, null, 2), "", VOICE_REGISTER, "", BANNED_LINE, ""];
    lines.push("Apply the critique. Correct every flagged issue while preserving supported evidence. Separate facts from interpretation, remove unsupported causal/intent claims, keep calibrated uncertainty where warranted, and route actions only to current product surfaces. Return the full corrected Pattern as JSON.");
    return lines.join("\n");
}
