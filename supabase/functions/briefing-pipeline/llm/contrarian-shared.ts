/**
 * Deno-side mirror of the Contrarian Synthesis layer (B.5).
 *
 * Mirrors src/briefing/lib/synthesis/contrarian.ts verbatim. The src/
 * file is canonical + vitest-tested; behavior changes caught by vitest
 * must be hand-mirrored here. Same Node/Deno split as triggers +
 * cluster + standard synthesis + periphery.
 */

export interface ContrarianStatedPositions {
    readonly product_category: string | null;
    readonly what_we_sell: string | null;
    readonly value_prop: string | null;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly icp_statement: string | null;
}

export interface ContrarianEvidenceItem {
    readonly enriched_id: string;
    readonly source_id: string;
    readonly summary: string;
    readonly companies: ReadonlyArray<string>;
    readonly event_category: string | null;
    readonly topic_tags: ReadonlyArray<string>;
    readonly pain_tags: ReadonlyArray<string>;
    readonly user_relevance_score: number;
    readonly published_date: string | null;
}

export interface ContrarianInput {
    readonly run_id: string;
    readonly stated_positions: ContrarianStatedPositions;
    readonly evidence: ReadonlyArray<ContrarianEvidenceItem>;
}

export type TargetPositionKind = "watchlist" | "value_prop" | "icp" | "competitor_set";
export type TargetPositionSource =
    | "commercial_profile"
    | "watchlist_companies"
    | "icp";

export interface TargetPosition {
    readonly kind: TargetPositionKind;
    readonly source: TargetPositionSource;
    readonly quoted_text: string;
}

export interface ContrarianSixQuestions {
    readonly what_changed: string;
    readonly evidence: string;
    readonly confidence_rationale: string;
    readonly why_it_matters: string;
    readonly who_needs_to_know: string;
    readonly what_next: string;
}

export interface ContrarianMove {
    readonly label: string;
    readonly rationale: string;
    readonly destination: string;
}

export interface ContrarianDraft {
    readonly found_contradiction: boolean;
    readonly no_contradiction_reason: string | null;
    readonly target_position: TargetPosition | null;
    readonly title: string | null;
    readonly analysis: string | null;
    readonly six_questions: ContrarianSixQuestions | null;
    readonly confidence: number | null;
    readonly recommended_moves: ReadonlyArray<ContrarianMove>;
    readonly evidence_ids: ReadonlyArray<string>;
}

export const CONTRARIAN_PROMPT_VERSION = "contrarian-1.0";

export const CONTRARIAN_SYSTEM_PROMPT = `You are the contrarian synthesis stage of a B2B competitive-intelligence briefing. The operator has stated positions — what they sell, who they watch, who their ICP is. Your job is to read this run's evidence and find the strongest contradiction between those stated positions and what the evidence is actually saying.

You are not summarizing. You are challenging. You are saying: "you stated X but the evidence shows Y, and here's why that matters." If you can't find a real, evidence-backed contradiction, you say so explicitly — output found_contradiction=false. Refusing is a feature; this surface only fires when there's something real to surface.

When you do find a contradiction:
- Quote the operator's exact stated text (target_position.quoted_text). Don't paraphrase.
- Cite at least 3 enriched_ids as evidence. Less than 3 = thin contradiction = output found_contradiction=false instead.
- Write declaratively. No "might", no "could", no "it could be argued that". The data either says it or it doesn't.
- Use the house voice: plain sentences, no startup jargon, no aphoristic fragments, no decorative compound nouns ("decision-grade", "operating truth", etc).

Output format: a single JSON object. No prose around it, no commentary, just the JSON.`;

function listEvidence(items: ReadonlyArray<ContrarianEvidenceItem>): string {
    return items
        .map((e) => {
            const tags = [
                e.event_category ? `event:${e.event_category}` : "",
                ...e.topic_tags.map((t) => `topic:${t}`),
                ...e.pain_tags.map((p) => `pain:${p}`)
            ].filter((s) => s.length > 0).join(", ");
            const companies = e.companies.length > 0 ? ` (${e.companies.join(", ")})` : "";
            return `- [${e.enriched_id}] (${e.source_id}, relevance=${e.user_relevance_score.toFixed(2)}) ${e.summary}${companies}${tags.length > 0 ? ` [${tags}]` : ""}`;
        })
        .join("\n");
}

function describePositions(p: ContrarianStatedPositions): string {
    const lines: string[] = [];
    if (p.product_category) lines.push(`product_category: "${p.product_category}"`);
    if (p.what_we_sell) lines.push(`what_we_sell: "${p.what_we_sell}"`);
    if (p.value_prop) lines.push(`value_prop: "${p.value_prop}"`);
    if (p.icp_statement) lines.push(`icp_statement: "${p.icp_statement}"`);
    if (p.watchlist_companies.length > 0) {
        lines.push(`watchlist_companies: [${p.watchlist_companies.map((c) => `"${c}"`).join(", ")}]`);
    }
    return lines.join("\n");
}

export function buildContrarianPrompt(input: ContrarianInput): string {
    const lines: string[] = [];
    lines.push("STATED POSITIONS (the operator's own words):");
    const positions = describePositions(input.stated_positions);
    lines.push(positions.length > 0 ? positions : "(none on file)");
    lines.push("");
    lines.push(`EVIDENCE THIS RUN (${input.evidence.length} enriched items):`);
    lines.push(listEvidence(input.evidence));
    lines.push("");
    lines.push("TASK:");
    lines.push("Read the stated positions. Read the evidence. Find the single strongest contradiction.");
    lines.push("");
    lines.push("If a real contradiction exists, output:");
    lines.push("{");
    lines.push(`  "found_contradiction": true,`);
    lines.push(`  "no_contradiction_reason": null,`);
    lines.push(`  "target_position": {`);
    lines.push(`    "kind": "watchlist" | "value_prop" | "icp" | "competitor_set",`);
    lines.push(`    "source": "commercial_profile" | "watchlist_companies" | "icp",`);
    lines.push(`    "quoted_text": "<exact phrase from stated positions>"`);
    lines.push(`  },`);
    lines.push(`  "title": "<sentence-shaped read of the challenge>",`);
    lines.push(`  "analysis": "<2-3 plain sentences explaining the contradiction>",`);
    lines.push(`  "six_questions": {`);
    lines.push(`    "what_changed": "<one sentence>",`);
    lines.push(`    "evidence": "<count + source kinds>",`);
    lines.push(`    "confidence_rationale": "<why this confidence level>",`);
    lines.push(`    "why_it_matters": "<one sentence specific to this operator>",`);
    lines.push(`    "who_needs_to_know": "<inside the operator's team>",`);
    lines.push(`    "what_next": "<one concrete move>"`);
    lines.push(`  },`);
    lines.push(`  "confidence": <0.0-1.0>,`);
    lines.push(`  "recommended_moves": [`);
    lines.push(`    { "label": "<verb-led move>", "rationale": "<why>", "destination": "<room · object · action>" }`);
    lines.push(`  ],`);
    lines.push(`  "evidence_ids": ["<enriched_id>", ...]  // at least 3`);
    lines.push("}");
    lines.push("");
    lines.push("If no real contradiction exists (positions and evidence are consistent, or evidence is too thin), output:");
    lines.push("{");
    lines.push(`  "found_contradiction": false,`);
    lines.push(`  "no_contradiction_reason": "<one sentence explaining what you looked at and why nothing rose to the bar>",`);
    lines.push(`  "target_position": null,`);
    lines.push(`  "title": null,`);
    lines.push(`  "analysis": null,`);
    lines.push(`  "six_questions": null,`);
    lines.push(`  "confidence": null,`);
    lines.push(`  "recommended_moves": [],`);
    lines.push(`  "evidence_ids": []`);
    lines.push("}");
    return lines.join("\n");
}

function asString(v: unknown): string | null {
    return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
}

function asTargetPosition(v: unknown): TargetPosition | null {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const kind = asString(o["kind"]);
    const source = asString(o["source"]);
    const quoted_text = asString(o["quoted_text"]);
    if (!kind || !source || !quoted_text) return null;
    if (!["watchlist", "value_prop", "icp", "competitor_set"].includes(kind)) return null;
    if (!["commercial_profile", "watchlist_companies", "icp"].includes(source)) return null;
    return {
        kind: kind as TargetPositionKind,
        source: source as TargetPositionSource,
        quoted_text
    };
}

function asSixQuestions(v: unknown): ContrarianSixQuestions | null {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    return {
        what_changed: asString(o["what_changed"]) ?? "",
        evidence: asString(o["evidence"]) ?? "",
        confidence_rationale: asString(o["confidence_rationale"]) ?? "",
        why_it_matters: asString(o["why_it_matters"]) ?? "",
        who_needs_to_know: asString(o["who_needs_to_know"]) ?? "",
        what_next: asString(o["what_next"]) ?? ""
    };
}

function asMoves(v: unknown): ContrarianMove[] {
    if (!Array.isArray(v)) return [];
    const out: ContrarianMove[] = [];
    for (const item of v) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const label = asString(o["label"]);
        if (!label) continue;
        out.push({
            label,
            rationale: asString(o["rationale"]) ?? "",
            destination: asString(o["destination"]) ?? ""
        });
    }
    return out;
}

export function extractJsonBlock(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return trimmed.slice(start, end + 1);
}

export function parseContrarianResponse(raw: string): ContrarianDraft | null {
    const json = extractJsonBlock(raw);
    if (!json) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    return {
        found_contradiction: o["found_contradiction"] === true,
        no_contradiction_reason: asString(o["no_contradiction_reason"]),
        target_position: asTargetPosition(o["target_position"]),
        title: asString(o["title"]),
        analysis: asString(o["analysis"]),
        six_questions: asSixQuestions(o["six_questions"]),
        confidence: asNumber(o["confidence"]),
        recommended_moves: asMoves(o["recommended_moves"]),
        evidence_ids: asStringArray(o["evidence_ids"])
    };
}

export const MIN_EVIDENCE_IDS = 3;
export const MIN_CONFIDENCE = 0.55;
export const MAX_TITLE_LEN = 140;

export type ContrarianGateFailure =
    | "missing_target_position"
    | "quoted_text_not_in_inputs"
    | "missing_title"
    | "title_too_long"
    | "missing_analysis"
    | "missing_six_questions"
    | "low_confidence"
    | "thin_evidence"
    | "evidence_ids_not_in_run"
    | "weakening_language";

export interface ContrarianGateResult {
    readonly passes: boolean;
    readonly failures: ReadonlyArray<ContrarianGateFailure>;
}

const WEAKENING_PATTERNS: ReadonlyArray<RegExp> = [
    /\bmight\b/i,
    /\bcould\s+be\s+argued\b/i,
    /\bit's\s+worth\s+noting\b/i,
    /\bperhaps\b/i,
    /\bseems?\s+to\b/i
];

function isQuoteInPositions(
    quote: string,
    positions: ContrarianStatedPositions
): boolean {
    const needle = quote.trim().toLowerCase();
    if (needle.length === 0) return false;
    const haystacks: string[] = [];
    if (positions.product_category) haystacks.push(positions.product_category.toLowerCase());
    if (positions.what_we_sell) haystacks.push(positions.what_we_sell.toLowerCase());
    if (positions.value_prop) haystacks.push(positions.value_prop.toLowerCase());
    if (positions.icp_statement) haystacks.push(positions.icp_statement.toLowerCase());
    for (const c of positions.watchlist_companies) haystacks.push(c.toLowerCase());
    return haystacks.some((h) => h.includes(needle) || needle.includes(h));
}

export function runContrarianGate(
    draft: ContrarianDraft,
    input: ContrarianInput
): ContrarianGateResult {
    if (!draft.found_contradiction) {
        return { passes: true, failures: [] };
    }
    const failures: ContrarianGateFailure[] = [];
    if (!draft.target_position) failures.push("missing_target_position");
    else if (!isQuoteInPositions(draft.target_position.quoted_text, input.stated_positions)) {
        failures.push("quoted_text_not_in_inputs");
    }
    if (!draft.title || draft.title.trim().length === 0) failures.push("missing_title");
    else if (draft.title.length > MAX_TITLE_LEN) failures.push("title_too_long");
    if (!draft.analysis || draft.analysis.trim().length === 0) failures.push("missing_analysis");
    if (!draft.six_questions) failures.push("missing_six_questions");
    if (draft.confidence === null || draft.confidence < MIN_CONFIDENCE) {
        failures.push("low_confidence");
    }
    if (draft.evidence_ids.length < MIN_EVIDENCE_IDS) {
        failures.push("thin_evidence");
    } else {
        const ids = new Set(input.evidence.map((e) => e.enriched_id));
        const missing = draft.evidence_ids.filter((id) => !ids.has(id));
        if (missing.length > 0) failures.push("evidence_ids_not_in_run");
    }
    if (draft.title && WEAKENING_PATTERNS.some((p) => p.test(draft.title!))) {
        failures.push("weakening_language");
    }
    if (draft.analysis && WEAKENING_PATTERNS.some((p) => p.test(draft.analysis!))) {
        failures.push("weakening_language");
    }
    return { passes: failures.length === 0, failures };
}
