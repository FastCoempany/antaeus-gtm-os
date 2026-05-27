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
    EVENT_CATEGORIES,
    type AdjacencyQuery,
    type AggregationFilters,
    type AggregationQuery,
    type EventCategory,
    type ParseAmbiguity,
    type ParseDisposition,
    type SilenceQuery,
    type SingleEventQuery,
    type ThresholdQuery,
    type TriggerParseResult,
    type TriggerParsedQuery,
    type TriggerTarget,
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
    lines.push("PARSED_QUERY SCHEMA BY TYPE (use these EXACT field names)");
    lines.push("========================================================");
    lines.push("A target is always one of:");
    lines.push('  {"type":"company","name":string}');
    lines.push('  {"type":"companies","names":string[],"logic":"any"|"all"}');
    lines.push('  {"type":"category","category_descriptor":string}');
    lines.push('  {"type":"any"}');
    lines.push("Resolve named companies into a target — do NOT put them in filters.");
    lines.push("");
    lines.push('single_event: {"type":"single_event","event":{"category":<category>,"qualifier"?:string},"target":<target>,"fire_once":boolean,"cooldown_days"?:number}');
    lines.push('aggregation:  {"type":"aggregation","event":{"category":<category>,"qualifier"?:string},"min_count":number,"window_days":number,"window_type":"rolling"|"calendar","filters":{"role_pattern"?:string,"exclude_companies"?:string[]},"target"?:<target>,"fire_once_per_window":boolean}');
    lines.push('threshold:    {"type":"threshold","metric":{"source":string,"target":string,"metric_type":"raw_count"|"growth_pct"|"ratio_vs_baseline"},"comparison":"greater_than_or_equal"|"less_than"|...,"value":number,"window_days":number,"baseline":{"type":"previous_window","window_days":number}}');
    lines.push('adjacency:    {"type":"adjacency","target":<target>,"relevance_threshold":number,"scope"?:{"topics"?:string[],"categories"?:<category>[]},"exclude_event_categories"?:<category>[],"digest_mode":boolean}');
    lines.push('silence:      {"type":"silence","target":{"type":"source","source_type":string,"company"?:string},"silence_days":number,"reset_on_activity":boolean}');
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
/**
 * Canonicalize a parsed_query into the exact shape the matchers read,
 * regardless of which near-miss field names the model emitted. This is
 * the parser↔matcher contract: the LLM is smart but improvises field
 * names (event_category vs event.category, resolved_targets vs target),
 * and a slightly-off shape would crash or no-op the matcher. Run on
 * every parse + again in the matcher runner (defensive for hand-inserted
 * rows). Exported so the Deno runner shares the exact logic.
 */
export function normalizeParsedQuery(
    v: unknown,
    triggerType: TriggerType | null
): TriggerParsedQuery | null {
    if (!v || typeof v !== "object" || Array.isArray(v) || triggerType === null) return null;
    const o = v as Record<string, unknown>;
    switch (triggerType) {
        case "single_event":
            return normSingleEvent(o);
        case "aggregation":
            return normAggregation(o);
        case "adjacency":
            return normAdjacency(o);
        case "threshold":
            return normThreshold(o);
        case "silence":
            return normSilence(o);
        default:
            return null;
    }
}

function obj(v: unknown): Record<string, unknown> {
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function num(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const p = Number.parseFloat(v);
        if (Number.isFinite(p)) return p;
    }
    return fallback;
}

function strArray(v: unknown): string[] {
    if (typeof v === "string") return v.trim().length > 0 ? [v.trim()] : [];
    if (!Array.isArray(v)) return [];
    return v
        .map((x) => {
            if (typeof x === "string") return x.trim();
            // Tolerate [{name:"X"}] / [{company:"X"}] shapes.
            const xo = obj(x);
            const n = (xo["name"] ?? xo["company"] ?? xo["company_name"]) as unknown;
            return typeof n === "string" ? n.trim() : "";
        })
        .filter((s) => s.length > 0);
}

function normCategory(v: unknown): EventCategory {
    if (typeof v === "string") {
        const lc = v.trim().toLowerCase();
        const hit = EVENT_CATEGORIES.find((c) => c === lc);
        if (hit) return hit;
    }
    return "any";
}

function normCategoryArray(v: unknown): EventCategory[] {
    if (!Array.isArray(v)) return [];
    return v.map(normCategory).filter((c) => c !== "any" || true); // keep order
}

/** Pull the event {category, subcategory, qualifier} from many shapes. */
function normEvent(o: Record<string, unknown>): { category: EventCategory; subcategory?: string; qualifier?: string } {
    const e = obj(o["event"]);
    const category = normCategory(
        e["category"] ?? o["event_category"] ?? o["category"]
    );
    const subRaw = (e["subcategory"] ?? o["subcategory"]) as unknown;
    const qualRaw = (e["qualifier"] ?? o["qualifier"]) as unknown;
    const out: { category: EventCategory; subcategory?: string; qualifier?: string } = { category };
    if (typeof subRaw === "string" && subRaw.trim().length > 0) out.subcategory = subRaw.trim();
    if (typeof qualRaw === "string" && qualRaw.trim().length > 0) out.qualifier = qualRaw.trim();
    return out;
}

/** Coerce any target-ish value into a canonical TriggerTarget. */
function normTarget(v: unknown, extraNames?: unknown): TriggerTarget {
    // Loose: a bare string or array.
    if (typeof v === "string") {
        const n = v.trim();
        if (n.length === 0) return { type: "any" };
        return { type: "company", name: n };
    }
    if (Array.isArray(v)) {
        const names = strArray(v);
        return names.length > 0 ? { type: "companies", names, logic: "any" } : { type: "any" };
    }
    const t = obj(v);
    const tType = typeof t["type"] === "string" ? (t["type"] as string) : "";
    if (tType === "company" && typeof t["name"] === "string") {
        const aliases = strArray(t["aliases"]);
        return aliases.length > 0
            ? { type: "company", name: (t["name"] as string).trim(), aliases }
            : { type: "company", name: (t["name"] as string).trim() };
    }
    if (tType === "companies" || Array.isArray(t["names"])) {
        const names = strArray(t["names"] ?? extraNames);
        const logic = t["logic"] === "all" ? "all" : "any";
        if (names.length > 0) return { type: "companies", names, logic };
    }
    if (tType === "category" || typeof t["category_descriptor"] === "string") {
        const desc = (t["category_descriptor"] ?? t["descriptor"] ?? t["category"]) as unknown;
        if (typeof desc === "string" && desc.trim().length > 0) {
            return { type: "category", category_descriptor: desc.trim() };
        }
    }
    if (tType === "any") return { type: "any" };
    // Single name field, or fall through to extraNames (resolved_targets).
    if (typeof t["name"] === "string" && (t["name"] as string).trim().length > 0) {
        return { type: "company", name: (t["name"] as string).trim() };
    }
    const extra = strArray(extraNames);
    if (extra.length === 1) return { type: "company", name: extra[0]! };
    if (extra.length > 1) return { type: "companies", names: extra, logic: "any" };
    return { type: "any" };
}

function normFilters(o: Record<string, unknown>): AggregationFilters {
    const f = obj(o["filters"]);
    const out: AggregationFilters = {};
    const role = (f["role_pattern"] ?? f["role"]) as unknown;
    if (typeof role === "string" && role.trim().length > 0) (out as { role_pattern?: string }).role_pattern = role.trim();
    const exclude = strArray(f["exclude_companies"]);
    if (exclude.length > 0) (out as { exclude_companies?: string[] }).exclude_companies = exclude;
    const stage = strArray(f["company_funding_stage"]);
    if (stage.length > 0) (out as { company_funding_stage?: string[] }).company_funding_stage = stage;
    const cat = strArray(f["company_category"]);
    if (cat.length > 0) (out as { company_category?: string[] }).company_category = cat;
    const geo = strArray(f["company_geography"]);
    if (geo.length > 0) (out as { company_geography?: string[] }).company_geography = geo;
    return out;
}

function normSingleEvent(o: Record<string, unknown>): SingleEventQuery {
    const out: SingleEventQuery = {
        type: "single_event",
        event: normEvent(o),
        target: normTarget(o["target"], pickNames(o)),
        fire_once: o["fire_once"] === true
    };
    const cd = o["cooldown_days"];
    if (typeof cd === "number" && cd > 0) (out as { cooldown_days?: number }).cooldown_days = cd;
    return out;
}

function normAggregation(o: Record<string, unknown>): AggregationQuery {
    const wt = o["window_type"] === "calendar" ? "calendar" : "rolling";
    return {
        type: "aggregation",
        event: normEvent(o),
        min_count: Math.max(1, Math.round(num(o["min_count"], 1))),
        window_days: Math.max(1, Math.round(num(o["window_days"], 30))),
        window_type: wt,
        filters: normFilters(o),
        target: normTarget(o["target"], pickNames(o)),
        fire_once_per_window: o["fire_once_per_window"] !== false
    };
}

function normAdjacency(o: Record<string, unknown>): AdjacencyQuery {
    const out: AdjacencyQuery = {
        type: "adjacency",
        target: normTarget(o["target"], pickNames(o)),
        relevance_threshold: clamp01(num(o["relevance_threshold"], 0.6)),
        digest_mode: o["digest_mode"] !== false
    };
    const scopeRaw = obj(o["scope"]);
    const topics = strArray(scopeRaw["topics"]);
    const cats = normCategoryArray(scopeRaw["categories"]);
    const context = typeof scopeRaw["context"] === "string" ? scopeRaw["context"].trim() : "";
    if (topics.length > 0 || cats.length > 0 || context.length > 0) {
        const scope: { context?: string; topics?: string[]; categories?: EventCategory[] } = {};
        if (context.length > 0) scope.context = context;
        if (topics.length > 0) scope.topics = topics;
        if (cats.length > 0) scope.categories = cats;
        (out as { scope?: typeof scope }).scope = scope;
    }
    const excl = normCategoryArray(o["exclude_event_categories"]);
    if (excl.length > 0) (out as { exclude_event_categories?: EventCategory[] }).exclude_event_categories = excl;
    return out;
}

function normThreshold(o: Record<string, unknown>): ThresholdQuery {
    const m = obj(o["metric"]);
    const validMetricTypes = ["raw_count", "growth_rate", "growth_pct", "ratio_vs_baseline", "percentile"];
    const mtRaw = (m["metric_type"] ?? o["metric_type"]) as unknown;
    const metric_type = (typeof mtRaw === "string" && validMetricTypes.includes(mtRaw)
        ? mtRaw
        : "raw_count") as ThresholdQuery["metric"]["metric_type"];
    const validComparisons = [
        "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "crosses_above", "crosses_below"
    ];
    const cmpRaw = o["comparison"] as unknown;
    const comparison = (typeof cmpRaw === "string" && validComparisons.includes(cmpRaw)
        ? cmpRaw
        : "greater_than_or_equal") as ThresholdQuery["comparison"];
    const baselineRaw = obj(o["baseline"]);
    const bType = typeof baselineRaw["type"] === "string" ? (baselineRaw["type"] as string) : "previous_window";
    const window_days = Math.max(1, Math.round(num(o["window_days"], 30)));
    let baseline: ThresholdQuery["baseline"];
    if (bType === "fixed_value") baseline = { type: "fixed_value", value: num(baselineRaw["value"], 0) };
    else if (bType === "same_period_last_year") baseline = { type: "same_period_last_year" };
    else if (bType === "all_time_average") baseline = { type: "all_time_average" };
    else if (bType === "rolling_baseline") baseline = { type: "rolling_baseline", window_days: Math.max(1, Math.round(num(baselineRaw["window_days"], window_days))) };
    else baseline = { type: "previous_window", window_days: Math.max(1, Math.round(num(baselineRaw["window_days"], window_days))) };
    const out: ThresholdQuery = {
        type: "threshold",
        metric: {
            source: typeof m["source"] === "string" ? (m["source"] as string) : "",
            target: typeof m["target"] === "string" ? (m["target"] as string) : typeof o["target"] === "string" ? (o["target"] as string) : "",
            metric_type
        },
        comparison,
        value: num(o["value"], 0),
        window_days,
        baseline
    };
    if (o["fire_once"] === true) (out as { fire_once?: boolean }).fire_once = true;
    return out;
}

function normSilence(o: Record<string, unknown>): SilenceQuery {
    const t = obj(o["target"]);
    const tType = typeof t["type"] === "string" ? (t["type"] as string) : "";
    let target: SilenceQuery["target"];
    if (tType === "event_category") {
        target = { type: "event_category", category: normCategory(t["category"]) };
    } else if (tType === "topic" || typeof t["topic"] === "string") {
        const sources = strArray(t["sources"]);
        target = sources.length > 0
            ? { type: "topic", topic: String(t["topic"] ?? "").trim(), sources }
            : { type: "topic", topic: String(t["topic"] ?? "").trim() };
    } else {
        const company = typeof t["company"] === "string" ? (t["company"] as string).trim() : undefined;
        target = company
            ? { type: "source", source_type: String(t["source_type"] ?? "company_blog"), company }
            : { type: "source", source_type: String(t["source_type"] ?? "company_blog") };
    }
    return {
        type: "silence",
        target,
        silence_days: Math.max(1, Math.round(num(o["silence_days"], 30))),
        reset_on_activity: o["reset_on_activity"] !== false
    };
}

/** Candidate name lists the model commonly puts targets under. */
function pickNames(o: Record<string, unknown>): unknown {
    const f = obj(o["filters"]);
    return (
        o["resolved_targets"] ??
        o["targets"] ??
        o["names"] ??
        f["resolved_targets"] ??
        f["targets"] ??
        f["names"] ??
        null
    );
}

function clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
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
