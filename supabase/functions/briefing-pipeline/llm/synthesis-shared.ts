/**
 * Deno-side mirror of the Briefing synthesis layer (B.2c).
 *
 * Mirrors src/briefing/lib/synthesis/{voice-rules,types,parse,quality-gate,prompts}.ts
 * verbatim. The src/ files are canonical + vitest-tested; behavior
 * changes caught by vitest must be hand-mirrored here. No runtime
 * sharing across Node + Deno — same split as llm/_shared.ts.
 */

// deno-lint-ignore-file no-explicit-any

// ─── Voice rules (mirror of voice-rules.ts) ────────────────────

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
    "while the evidence is mixed, one interpretation is"
];

export const MARKETING_SOUP_PHRASES: ReadonlyArray<string> = [
    "in today's", "in today’s", "it's no secret that", "it is no secret that",
    "have you ever wondered", "we've all been there", "we have all been there",
    "as a leading", "in the fast-paced world", "now more than ever", "the future of"
];

export const HEDGING_ADVERBS: ReadonlyArray<string> = [
    "may", "could", "might", "possibly", "potentially", "seems", "appears", "suggests"
];

export const MAX_HEDGING_ADVERBS = 3;
export const PATTERN_NAME_MAX_WORDS = 12;
export const ANALYSIS_MIN_WORDS = 60;
export const ANALYSIS_MAX_WORDS = 240;
export const MOVES_MIN = 1;
export const MOVES_MAX = 3;

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countWholeWord(text: string, term: string): number {
    if (text.length === 0 || term.length === 0) return 0;
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
    const matches = text.match(re);
    return matches ? matches.length : 0;
}

export function findBannedVocabulary(text: string): string[] {
    const hits: string[] = [];
    for (const word of BANNED_VOCABULARY) {
        if (countWholeWord(text, word) > 0) hits.push(word);
    }
    return hits;
}

export function findBannedHedgeConstructions(text: string): string[] {
    const lower = text.toLowerCase();
    return BANNED_HEDGE_CONSTRUCTIONS.filter((p) => lower.includes(p));
}

export function findMarketingSoup(text: string): string[] {
    const lower = text.toLowerCase();
    return MARKETING_SOUP_PHRASES.filter((p) => lower.includes(p));
}

export function countHedgingAdverbs(text: string): number {
    return HEDGING_ADVERBS.reduce((sum, adv) => sum + countWholeWord(text, adv), 0);
}

export function wordCount(text: string): number {
    const t = text.trim();
    if (t.length === 0) return 0;
    return t.split(/\s+/).length;
}

// ─── Types (mirror of types.ts) ────────────────────────────────

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

export interface GateResult {
    readonly passes: boolean;
    readonly checks: ReadonlyArray<GateCheck>;
    readonly failures: ReadonlyArray<string>;
}

// ─── Parse (mirror of parse.ts) ────────────────────────────────

export interface DraftParseResult {
    readonly pattern: DraftPattern | null;
    readonly error: string | null;
}

export interface CritiqueParseResult {
    readonly critique: Critique | null;
    readonly error: string | null;
}

const TRAJECTORIES: ReadonlyArray<string> = ["rising", "stable", "declining"];
const SEVERITIES: ReadonlyArray<string> = ["minor", "significant", "major"];

function extractJsonObject(raw: string): string | null {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    let s = raw.trim();
    const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch && fenceMatch[1] !== undefined) s = fenceMatch[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return s.slice(start, end + 1);
}

function asString(v: unknown, fallback = ""): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return fallback;
    return String(v);
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
}

function asTrajectory(v: unknown): "rising" | "stable" | "declining" | null {
    if (typeof v === "string" && TRAJECTORIES.includes(v)) {
        return v as "rising" | "stable" | "declining";
    }
    return null;
}

function asSeverity(v: unknown): CritiqueSeverity {
    if (typeof v === "string" && SEVERITIES.includes(v)) return v as CritiqueSeverity;
    return "minor";
}

function asConfidence(v: unknown): number {
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
        const p = Number.parseFloat(v);
        n = Number.isFinite(p) ? p : 0.5;
    } else n = 0.5;
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
}

function asSixQuestions(v: unknown): SixQuestions {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
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
    const out: RecommendedMove[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const action = asString(o["action"]).trim();
        const destination = asString(o["destination"]).trim();
        if (action.length === 0 && destination.length === 0) continue;
        out.push({ action, rationale: asString(o["rationale"]).trim(), destination });
    }
    return out;
}

export function parseDraftResponse(raw: string): DraftParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) return { pattern: null, error: "no JSON object found in response" };
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            pattern: null,
            error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { pattern: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    const candidate =
        root["draft_pattern"] && typeof root["draft_pattern"] === "object"
            ? (root["draft_pattern"] as Record<string, unknown>)
            : root["pattern"] && typeof root["pattern"] === "object"
            ? (root["pattern"] as Record<string, unknown>)
            : root["revised_pattern"] && typeof root["revised_pattern"] === "object"
            ? (root["revised_pattern"] as Record<string, unknown>)
            : root;

    const name = asString(candidate["name"]).trim();
    const analysis = asString(candidate["analysis"]).trim();
    if (name.length === 0) return { pattern: null, error: "pattern missing required 'name'" };
    if (analysis.length === 0) return { pattern: null, error: "pattern missing required 'analysis'" };

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

function asIssues(v: unknown): CritiqueIssue[] {
    if (!Array.isArray(v)) return [];
    const out: CritiqueIssue[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        out.push({
            quote: asString(o["quote"]).trim(),
            issue: asString(o["issue"]).trim(),
            severity: asSeverity(o["severity"])
        });
    }
    return out;
}

function asObjections(
    v: unknown
): Array<{ objection: string; severity: CritiqueSeverity }> {
    if (!Array.isArray(v)) return [];
    const out: Array<{ objection: string; severity: CritiqueSeverity }> = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const objection = asString(o["objection"]).trim();
        if (objection.length === 0) continue;
        out.push({ objection, severity: asSeverity(o["severity"]) });
    }
    return out;
}

function asBool(v: unknown, fallback = false): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        const n = v.toLowerCase().trim();
        if (n === "true") return true;
        if (n === "false") return false;
    }
    return fallback;
}

export function parseCritiqueResponse(raw: string): CritiqueParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) return { critique: null, error: "no JSON object found in response" };
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            critique: null,
            error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { critique: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    const c =
        root["critique"] && typeof root["critique"] === "object"
            ? (root["critique"] as Record<string, unknown>)
            : root;

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
            overall_assessment: asString(
                root["overall_assessment"] ?? c["overall_assessment"]
            ).trim()
        },
        error: null
    };
}

// ─── Quality gate (mirror of quality-gate.ts) ──────────────────

export function runQualityGate(
    pattern: DraftPattern,
    validItemIds: ReadonlyArray<string>
): GateResult {
    const checks: GateCheck[] = [];
    const sixQ = pattern.six_questions;
    const moveText = pattern.recommended_moves
        .map((m) => `${m.action} ${m.rationale}`)
        .join(" ");
    const fullText = [
        pattern.name, pattern.analysis, sixQ.what_changed, sixQ.evidence,
        sixQ.confidence_rationale, sixQ.why_it_matters, sixQ.who_needs_to_know,
        sixQ.what_next, moveText
    ].join(" \n ");

    const banned = findBannedVocabulary(fullText);
    checks.push({
        name: "banned_vocabulary",
        pass: banned.length === 0,
        detail: banned.length === 0 ? "no banned vocabulary" : `banned vocabulary used: ${banned.join(", ")}`
    });

    const analysisWords = wordCount(pattern.analysis);
    const lengthOk = analysisWords >= ANALYSIS_MIN_WORDS && analysisWords <= ANALYSIS_MAX_WORDS;
    checks.push({
        name: "analysis_length",
        pass: lengthOk,
        detail: `analysis ${analysisWords} words (need ${ANALYSIS_MIN_WORDS}–${ANALYSIS_MAX_WORDS})`
    });

    const nameWords = wordCount(pattern.name);
    checks.push({
        name: "name_word_count",
        pass: nameWords > 0 && nameWords <= PATTERN_NAME_MAX_WORDS,
        detail: `name ${nameWords} words (max ${PATTERN_NAME_MAX_WORDS})`
    });

    const trimmedName = pattern.name.trim();
    const nameDeclarative =
        trimmedName.length > 0 && !trimmedName.includes("?") && trimmedName.endsWith(".");
    checks.push({
        name: "name_declarative",
        pass: nameDeclarative,
        detail: nameDeclarative
            ? "name is declarative"
            : "name must end with a period and contain no question mark"
    });

    const moveCount = pattern.recommended_moves.length;
    const movesOk = moveCount >= MOVES_MIN && moveCount <= MOVES_MAX;
    checks.push({
        name: "moves_count",
        pass: movesOk,
        detail: `${moveCount} moves (need ${MOVES_MIN}–${MOVES_MAX})`
    });

    const allMovesRouted = pattern.recommended_moves.every(
        (m) => m.destination.trim().length > 0 && m.action.trim().length > 0
    );
    checks.push({
        name: "moves_routed",
        pass: moveCount === 0 ? false : allMovesRouted,
        detail: allMovesRouted
            ? "all moves have action + destination"
            : "a move is missing its action or routed destination"
    });

    const emptySlots = (Object.keys(sixQ) as Array<keyof typeof sixQ>).filter(
        (k) => sixQ[k].trim().length === 0
    );
    checks.push({
        name: "six_questions_complete",
        pass: emptySlots.length === 0,
        detail: emptySlots.length === 0
            ? "all six question slots populated"
            : `empty six-question slots: ${emptySlots.join(", ")}`
    });

    const hedges = countHedgingAdverbs(pattern.analysis);
    checks.push({
        name: "hedging_density",
        pass: hedges <= MAX_HEDGING_ADVERBS,
        detail: `${hedges} hedging adverbs in analysis (max ${MAX_HEDGING_ADVERBS})`
    });

    const hedgeConstructions = findBannedHedgeConstructions(fullText);
    checks.push({
        name: "banned_hedge_constructions",
        pass: hedgeConstructions.length === 0,
        detail: hedgeConstructions.length === 0
            ? "no banned hedge constructions"
            : `banned hedge constructions: ${hedgeConstructions.join("; ")}`
    });

    const soup = findMarketingSoup(fullText);
    checks.push({
        name: "marketing_soup",
        pass: soup.length === 0,
        detail: soup.length === 0 ? "no marketing-soup phrases" : `marketing-soup phrases: ${soup.join("; ")}`
    });

    const validSet = new Set(validItemIds);
    const cited = pattern.evidence_item_ids;
    const allCitedValid = cited.length > 0 && cited.every((id) => validSet.has(id));
    const invalidCited = cited.filter((id) => !validSet.has(id));
    checks.push({
        name: "evidence_ids_valid",
        pass: allCitedValid,
        detail: allCitedValid
            ? `all ${cited.length} cited ids belong to the cluster`
            : cited.length === 0
            ? "no evidence item ids cited"
            : `cited ids not in cluster: ${invalidCited.join(", ")}`
    });

    const confOk =
        Number.isFinite(pattern.confidence) && pattern.confidence >= 0 && pattern.confidence <= 1;
    checks.push({
        name: "confidence_range",
        pass: confOk,
        detail: confOk ? `confidence ${pattern.confidence}` : `confidence ${pattern.confidence} outside [0, 1]`
    });

    const failures = checks.filter((c) => !c.pass).map((c) => c.detail);
    return { passes: failures.length === 0, checks, failures };
}

// ─── Prompts (mirror of prompts.ts) ────────────────────────────

export const SYNTHESIS_PROMPT_VERSION = "synthesis-1.0";

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
        if (input.icp.pains.length > 0) lines.push(`Buyer pains: ${input.icp.pains.join("; ")}`);
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

export function buildCritiquePrompt(input: SynthesisInput, draft: DraftPattern): string {
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
