/**
 * Watchlist Trigger parser (B.3a).
 *
 * A single LLM call (Sonnet 4.6) turns the operator's natural language
 * into one of the five structured trigger types, with a confidence and
 * a plain-English rephrasing to confirm. Per Watchlist Trigger Grammar
 * v0.1 §4.
 *
 * The examples foreground the CONSISTENT movers — hiring / exec moves,
 * product launches, funding, and the aggregation "N competitors did X"
 * shape — because those fire regularly and carry signal. Pricing-change
 * is supported but not the flagship (it's a once-a-year event per
 * company; a trigger built on it mostly sits dark).
 *
 * Canonical reference + vitest-tested; Deno mirror in triggers/_shared.ts.
 */

import {
    type ParseDisposition,
    type ParseAmbiguity,
    type TriggerParseResult,
    type TriggerParsedQuery,
    type TriggerType
} from "./types";

export const TRIGGER_PARSE_PROMPT_VERSION = "trigger-parse-1.0";

export interface TriggerParseInputs {
    readonly natural_language: string;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly competitors: ReadonlyArray<string>;
    readonly icp_categories: ReadonlyArray<string>;
    readonly active_triggers_summary: ReadonlyArray<string>;
}

export const TRIGGER_PARSE_SYSTEM_PROMPT = `You parse a B2B GTM operator's natural-language Watchlist Trigger into a structured query for a competitive-intelligence system. The system supports EXACTLY FIVE trigger types — no others. Be willing to reject vague input rather than commit a low-confidence guess.

Respond with ONLY a JSON object in the schema given in the user message. No preamble, no markdown fences. First character '{', last character '}'.`;

function list(values: ReadonlyArray<string>): string {
    return values.length > 0 ? values.join(", ") : "(none set)";
}

export function buildTriggerParsePrompt(inputs: TriggerParseInputs): string {
    const lines: string[] = [];

    lines.push("THE FIVE TYPES");
    lines.push("==============");
    lines.push("");
    lines.push("1. single_event — alert when a specific event happens at a specific target.");
    lines.push('   "Alert me when Deel hires a VP of Sales"');
    lines.push('   "Alert me when Rippling launches a new product module"');
    lines.push('   "Alert me when Lumana is acquired"');
    lines.push("");
    lines.push("2. aggregation — alert when N events of a type happen within a window, optionally filtered.");
    lines.push('   "Alert me when 2+ competitors expand their platform in 30 days"');
    lines.push('   "Alert me when 3+ VP Sales hires happen at Series B companies in 30 days"');
    lines.push('   "Alert me when 2+ EOR competitors raise a round in 60 days"');
    lines.push("");
    lines.push("3. threshold — alert when a tracked metric crosses a threshold vs a baseline.");
    lines.push("   \"Alert me when 'agentic workflow' Wikipedia pageviews grow 50% over rolling 60 days\"");
    lines.push('   "Alert me when our category appears on HN frontpage 10+ times in a week"');
    lines.push("");
    lines.push("4. adjacency — alert about anything related to a target (broad coverage, lower threshold).");
    lines.push('   "Alert me about anything Deel does in IT or device management"');
    lines.push('   "Alert me about any new entrant in the Employer-of-Record category"');
    lines.push("");
    lines.push("5. silence — alert when an expected source goes quiet longer than a threshold.");
    lines.push('   "Alert me if Rippling stops publishing product updates for 30+ days"');
    lines.push('   "Alert me if no exec moves happen across our competitors for 60+ days"');
    lines.push("");
    lines.push("USER INPUT");
    lines.push("==========");
    lines.push(inputs.natural_language);
    lines.push("");
    lines.push("USER CONTEXT (for resolving references)");
    lines.push("=======================================");
    lines.push(`Watchlist companies: ${list(inputs.watchlist_companies)}`);
    lines.push(`Competitors: ${list(inputs.competitors)}`);
    lines.push(`ICP categories: ${list(inputs.icp_categories)}`);
    lines.push(`Active triggers already created: ${list(inputs.active_triggers_summary)}`);
    lines.push("");
    lines.push("PARSE RULES");
    lines.push("===========");
    lines.push("1. Pick the trigger type. If a count is specified, prefer aggregation. If unsure between single_event and adjacency, prefer single_event (more specific).");
    lines.push("2. Resolve the target against the watchlist + competitors. Flag typos/near-misses in ambiguities. Accept unknown targets but note them.");
    lines.push("3. Map the event to the predefined category list. If it doesn't map cleanly, use category \"any\" and note it.");
    lines.push("4. Extract quantifiers (N, window, threshold). If the user says \"soon\"/\"recently\" without specifics, ask for clarification.");
    lines.push("5. Defaults when the user is silent: aggregation window_days=30, window_type=rolling, fire_once_per_window=true; threshold baseline=previous_window (same window_days); adjacency relevance_threshold=0.6, digest_mode=true; silence reset_on_activity=true; single_event fire_once=false.");
    lines.push("6. Confidence: 0.95+ when everything resolves; 0.80-0.94 minor ambiguity; 0.70-0.79 significant but best-guessable; below 0.70 return ambiguities and DO NOT commit a parsed_query.");
    lines.push("7. Reject anti-CRM asks (trial signups, customer churn, internal metrics) — those aren't publicly observable. Reject pure-vague asks (\"anything important\", \"when things change\").");
    lines.push("8. Compound inputs (\"X AND Y\") can't be one trigger — set suggested_split and parse_succeeded=false.");
    lines.push("9. rephrased_for_confirmation: plain English of exactly what the system will watch for, so the operator can verify the parse.");
    lines.push("");
    lines.push("OUTPUT FORMAT");
    lines.push("=============");
    lines.push("{");
    lines.push('  "parse_succeeded": true | false,');
    lines.push('  "parse_failure_reason": string | null,');
    lines.push('  "trigger_type": "single_event" | "aggregation" | "threshold" | "adjacency" | "silence" | null,');
    lines.push('  "parsed_query": { "type": <trigger_type>, ... type-specific fields ... } | null,');
    lines.push('  "parse_confidence": number,   // 0.0-1.0');
    lines.push('  "ambiguities": [ { "field": string, "question": string, "suggested_clarification": string } ],');
    lines.push('  "rephrased_for_confirmation": string,');
    lines.push('  "suggested_split": string[] | null,');
    lines.push('  "notes": string | null');
    lines.push("}");
    lines.push("");
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

// ─── Response parsing ──────────────────────────────────────────

const VALID_TYPES: ReadonlyArray<TriggerType> = [
    "single_event",
    "aggregation",
    "threshold",
    "adjacency",
    "silence"
];

function extractJsonObject(raw: string): string | null {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    let s = raw.trim();
    const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fence && fence[1] !== undefined) s = fence[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return s.slice(start, end + 1);
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
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

function asConfidence(v: unknown): number {
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
        const p = Number.parseFloat(v);
        n = Number.isFinite(p) ? p : 0;
    } else n = 0;
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
}

function asType(v: unknown): TriggerType | null {
    return typeof v === "string" && (VALID_TYPES as ReadonlyArray<string>).includes(v)
        ? (v as TriggerType)
        : null;
}

function asAmbiguities(v: unknown): ParseAmbiguity[] {
    if (!Array.isArray(v)) return [];
    const out: ParseAmbiguity[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const question = asString(o["question"]).trim();
        if (question.length === 0) continue;
        out.push({
            field: asString(o["field"]).trim(),
            question,
            suggested_clarification: asString(o["suggested_clarification"]).trim()
        });
    }
    return out;
}

function asStringArrayOrNull(v: unknown): string[] | null {
    if (!Array.isArray(v)) return null;
    const out = v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
    return out.length > 0 ? out : null;
}

/**
 * Defensive parse of the parser LLM's JSON. Never throws. A parse that
 * claims success but carries no usable parsed_query / type is demoted
 * to parse_succeeded=false so the UI doesn't try to arm a null query.
 */
export function parseTriggerResponse(raw: string): TriggerParseResult {
    const failure = (reason: string): TriggerParseResult => ({
        parse_succeeded: false,
        parse_failure_reason: reason,
        trigger_type: null,
        parsed_query: null,
        parse_confidence: 0,
        ambiguities: [],
        rephrased_for_confirmation: "",
        suggested_split: null,
        notes: null
    });

    const jsonText = extractJsonObject(raw);
    if (jsonText === null) return failure("no JSON object found in response");
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return failure(`JSON parse failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return failure("response root is not a JSON object");
    }
    const o = parsed as Record<string, unknown>;

    const triggerType = asType(o["trigger_type"]);
    const query = normalizeParsedQuery(o["parsed_query"], triggerType);
    const succeededFlag = asBool(o["parse_succeeded"]);
    // A success claim is only honored if we actually have a typed query.
    const succeeded = succeededFlag && triggerType !== null && query !== null;

    return {
        parse_succeeded: succeeded,
        parse_failure_reason: succeeded ? null : asString(o["parse_failure_reason"]) || (succeededFlag ? "parser returned no usable query" : "parse did not succeed"),
        trigger_type: succeeded ? triggerType : null,
        parsed_query: succeeded ? query : null,
        parse_confidence: asConfidence(o["parse_confidence"]),
        ambiguities: asAmbiguities(o["ambiguities"]),
        rephrased_for_confirmation: asString(o["rephrased_for_confirmation"]).trim(),
        suggested_split: asStringArrayOrNull(o["suggested_split"]),
        notes: typeof o["notes"] === "string" && o["notes"].trim().length > 0 ? o["notes"].trim() : null
    };
}

/**
 * Light normalization: ensure parsed_query.type matches trigger_type
 * and the object is shaped enough to store. Type-specific deep
 * validation is deferred — the matcher reads defensively and the
 * structured-form editor (B.3b) lets the operator correct fields.
 */
function normalizeParsedQuery(
    v: unknown,
    triggerType: TriggerType | null
): TriggerParsedQuery | null {
    if (!v || typeof v !== "object" || Array.isArray(v) || triggerType === null) return null;
    const o = { ...(v as Record<string, unknown>) };
    // Force the discriminant to agree with trigger_type.
    o["type"] = triggerType;
    return o as unknown as TriggerParsedQuery;
}

/**
 * Map confidence (+ success) to the UI's next action, per grammar §4.3.
 */
export function parseDisposition(result: TriggerParseResult): ParseDisposition {
    if (!result.parse_succeeded) return "clarify_only";
    const c = result.parse_confidence;
    if (c >= 0.95) return "arm_ready";
    if (c >= 0.8) return "confirm_minor";
    if (c >= 0.7) return "resolve_first";
    return "clarify_only";
}
