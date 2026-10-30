/**
 * Conflicting-evidence synthesis — pure logic.
 *
 * Stable internal field names such as `found_contradiction` are retained for
 * compatibility. User-visible output should identify evidence that conflicts
 * with a stated assumption without treating model interpretation as fact.
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

export const CONTRARIAN_PROMPT_VERSION = "contrarian-1.1";

export const CONTRARIAN_SYSTEM_PROMPT = `You analyze whether current evidence conflicts with a B2B operator's stated assumptions about what they sell, who they watch, or who their ICP is.

Do not manufacture a disagreement. If the evidence is consistent with the stated positions, too sparse, too old, or too ambiguous to support a useful challenge, output found_contradiction=false.

When evidence does conflict with a stated position:
- Quote the operator's exact stated text in target_position.quoted_text. Do not paraphrase the quote.
- Cite at least 3 enriched_ids. Fewer than 3 means the evidence is too thin and found_contradiction must be false.
- Separate evidence from interpretation. State what the sources report, then explain the assessment you draw from those reports.
- Calibrate certainty to the evidence. Use words such as "may", "suggests", "is consistent with", or "does not support" when that is more accurate than a categorical claim. Do not hedge facts that are directly supported.
- Do not claim that correlation proves causation.
- Do not imply that silence, absence, or missing data proves an internal buyer or market state.
- Use plain business language. Avoid slogans, aphoristic fragments, personification, startup jargon, and decorative compound nouns.
- Recommended actions must be concrete and must not promise an outcome.

Output a single JSON object with no prose around it.`;

function listEvidence(items: ReadonlyArray<ContrarianEvidenceItem>): string {
    return items
        .map((e) => {
            const tags = [
                e.event_category ? `event:${e.event_category}` : "",
                ...e.topic_tags.map((t) => `topic:${t}`),
                ...e.pain_tags.map((p) => `pain:${p}`)
            ]
                .filter((s) => s.length > 0)
                .join(", ");
            const companies =
                e.companies.length > 0 ? ` (${e.companies.join(", ")})` : "";
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
        lines.push(
            `watchlist_companies: [${p.watchlist_companies
                .map((c) => `"${c}"`)
                .join(", ")}]`
        );
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
    lines.push(
        "Identify the single strongest evidence-backed conflict between a stated position and the current evidence. If no conflict clears the evidence bar, return found_contradiction=false."
    );
    lines.push("");
    lines.push("If an evidence-backed conflict exists, output:");
    lines.push("{");
    lines.push(`  "found_contradiction": true,`);
    lines.push(`  "no_contradiction_reason": null,`);
    lines.push(`  "target_position": {`);
    lines.push(`    "kind": "watchlist" | "value_prop" | "icp" | "competitor_set",`);
    lines.push(`    "source": "commercial_profile" | "watchlist_companies" | "icp",`);
    lines.push(`    "quoted_text": "<exact phrase from stated positions>"`);
    lines.push(`  },`);
    lines.push(`  "title": "<one sentence stating the evidence conflict without overstating certainty>",`);
    lines.push(`  "analysis": "<2-3 plain sentences: observed evidence first, interpretation second>",`);
    lines.push(`  "six_questions": {`);
    lines.push(`    "what_changed": "<what the evidence newly shows>",`);
    lines.push(`    "evidence": "<count + source kinds + relevant facts>",`);
    lines.push(`    "confidence_rationale": "<why this confidence level is justified>",`);
    lines.push(`    "why_it_matters": "<practical implication, not a guaranteed outcome>",`);
    lines.push(`    "who_needs_to_know": "<inside the operator's team>",`);
    lines.push(`    "what_next": "<one concrete verification or operating action>"`);
    lines.push(`  },`);
    lines.push(`  "confidence": <0.0-1.0>,`);
    lines.push(`  "recommended_moves": [`);
    lines.push(
        `    { "label": "<verb-led move>", "rationale": "<why the evidence supports doing it>", "destination": "<room · object · action>" }`
    );
    lines.push(`  ],`);
    lines.push(`  "evidence_ids": ["<enriched_id>", ...]`);
    lines.push("}");
    lines.push("");
    lines.push("If no evidence-backed conflict exists, output:");
    lines.push("{");
    lines.push(`  "found_contradiction": false,`);
    lines.push(
        `  "no_contradiction_reason": "<one sentence explaining what was checked and why the evidence did not justify a conflict>",`
    );
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

/** Extract the JSON body from an LLM response. Tolerates code fences. */
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
    return { passes: failures.length === 0, failures };
}
