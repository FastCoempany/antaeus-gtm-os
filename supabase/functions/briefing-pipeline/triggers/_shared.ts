/**
 * Deno-side mirror of the Watchlist Trigger layer (B.3a).
 *
 * Mirrors src/briefing/lib/triggers/{types,parser,matchers}.ts verbatim.
 * The src/ files are canonical + vitest-tested; behavior changes caught
 * by vitest must be hand-mirrored here. Same Node/Deno split as the LLM
 * + cluster + synthesis layers.
 */

// ─── Types (mirror of types.ts) ────────────────────────────────

export type TriggerType =
    | "single_event"
    | "aggregation"
    | "threshold"
    | "adjacency"
    | "silence";

export type EventCategory =
    | "exec_move"
    | "pricing_change"
    | "product_launch"
    | "funding_round"
    | "m_a_event"
    | "regulatory_action"
    | "security_incident"
    | "partnership_announcement"
    | "integration_added"
    | "integration_removed"
    | "leadership_departure"
    | "layoff_event"
    | "geographic_expansion"
    | "vertical_expansion"
    | "narrative_shift_mention"
    | "press_coverage"
    | "patent_filing"
    | "trust_certification_change"
    | "any";

export type TriggerTarget =
    | { readonly type: "company"; readonly name: string; readonly aliases?: ReadonlyArray<string> }
    | { readonly type: "companies"; readonly names: ReadonlyArray<string>; readonly logic: "any" | "all" }
    | { readonly type: "category"; readonly category_descriptor: string }
    | { readonly type: "any" };

export interface TriggerEvent {
    readonly category: EventCategory;
    readonly subcategory?: string;
    readonly qualifier?: string;
}

export interface SingleEventQuery {
    readonly type: "single_event";
    readonly event: TriggerEvent;
    readonly target: TriggerTarget;
    readonly fire_once: boolean;
    readonly cooldown_days?: number;
}

export interface AggregationFilters {
    readonly role_pattern?: string;
    readonly company_funding_stage?: ReadonlyArray<string>;
    readonly company_category?: ReadonlyArray<string>;
    readonly company_geography?: ReadonlyArray<string>;
    readonly exclude_companies?: ReadonlyArray<string>;
}

export interface AggregationQuery {
    readonly type: "aggregation";
    readonly event: TriggerEvent;
    readonly min_count: number;
    readonly window_days: number;
    readonly window_type: "rolling" | "calendar";
    readonly filters: AggregationFilters;
    readonly target?: TriggerTarget;
    readonly fire_once_per_window?: boolean;
}

export interface ThresholdMetric {
    readonly source: string;
    readonly target: string;
    readonly metric_type:
        | "raw_count"
        | "growth_rate"
        | "growth_pct"
        | "ratio_vs_baseline"
        | "percentile";
}

export type ThresholdBaseline =
    | { readonly type: "previous_window"; readonly window_days: number }
    | { readonly type: "same_period_last_year" }
    | { readonly type: "all_time_average" }
    | { readonly type: "fixed_value"; readonly value: number }
    | { readonly type: "rolling_baseline"; readonly window_days: number };

export type ThresholdComparison =
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "crosses_above"
    | "crosses_below";

export interface ThresholdQuery {
    readonly type: "threshold";
    readonly metric: ThresholdMetric;
    readonly comparison: ThresholdComparison;
    readonly value: number;
    readonly window_days: number;
    readonly baseline: ThresholdBaseline;
    readonly fire_once?: boolean;
}

export interface AdjacencyScope {
    readonly context?: string;
    readonly topics?: ReadonlyArray<string>;
    readonly categories?: ReadonlyArray<EventCategory>;
}

export interface AdjacencyQuery {
    readonly type: "adjacency";
    readonly target: TriggerTarget;
    readonly scope?: AdjacencyScope;
    readonly relevance_threshold: number;
    readonly exclude_event_categories?: ReadonlyArray<EventCategory>;
    readonly digest_mode?: boolean;
}

export type SilenceTarget =
    | { readonly type: "source"; readonly source_type: string; readonly company?: string }
    | { readonly type: "event_category"; readonly category: EventCategory; readonly filters?: AggregationFilters }
    | { readonly type: "topic"; readonly topic: string; readonly sources?: ReadonlyArray<string> };

export interface SilenceQuery {
    readonly type: "silence";
    readonly target: SilenceTarget;
    readonly silence_days: number;
    readonly reset_on_activity: boolean;
}

export type TriggerParsedQuery =
    | SingleEventQuery
    | AggregationQuery
    | ThresholdQuery
    | AdjacencyQuery
    | SilenceQuery;

export interface ParseAmbiguity {
    readonly field: string;
    readonly question: string;
    readonly suggested_clarification: string;
}

export interface TriggerParseResult {
    readonly parse_succeeded: boolean;
    readonly parse_failure_reason: string | null;
    readonly trigger_type: TriggerType | null;
    readonly parsed_query: TriggerParsedQuery | null;
    readonly parse_confidence: number;
    readonly ambiguities: ReadonlyArray<ParseAmbiguity>;
    readonly rephrased_for_confirmation: string;
    readonly suggested_split: ReadonlyArray<string> | null;
    readonly notes: string | null;
}

export type ParseDisposition =
    | "arm_ready"
    | "confirm_minor"
    | "resolve_first"
    | "clarify_only";

// ─── Parser (mirror of parser.ts) ──────────────────────────────

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

function pStr(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function pBool(v: unknown, fallback = false): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        const n = v.toLowerCase().trim();
        if (n === "true") return true;
        if (n === "false") return false;
    }
    return fallback;
}

function pConfidence(v: unknown): number {
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
        const p = Number.parseFloat(v);
        n = Number.isFinite(p) ? p : 0;
    } else n = 0;
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
}

function pType(v: unknown): TriggerType | null {
    return typeof v === "string" && (VALID_TYPES as ReadonlyArray<string>).includes(v)
        ? (v as TriggerType)
        : null;
}

function pAmbiguities(v: unknown): ParseAmbiguity[] {
    if (!Array.isArray(v)) return [];
    const out: ParseAmbiguity[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const question = pStr(o["question"]).trim();
        if (question.length === 0) continue;
        out.push({
            field: pStr(o["field"]).trim(),
            question,
            suggested_clarification: pStr(o["suggested_clarification"]).trim()
        });
    }
    return out;
}

function pStringArrayOrNull(v: unknown): string[] | null {
    if (!Array.isArray(v)) return null;
    const out = v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
    return out.length > 0 ? out : null;
}

function normalizeParsedQuery(v: unknown, triggerType: TriggerType | null): TriggerParsedQuery | null {
    if (!v || typeof v !== "object" || Array.isArray(v) || triggerType === null) return null;
    const o = { ...(v as Record<string, unknown>) };
    o["type"] = triggerType;
    return o as unknown as TriggerParsedQuery;
}

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

    const triggerType = pType(o["trigger_type"]);
    const query = normalizeParsedQuery(o["parsed_query"], triggerType);
    const succeededFlag = pBool(o["parse_succeeded"]);
    const succeeded = succeededFlag && triggerType !== null && query !== null;

    return {
        parse_succeeded: succeeded,
        parse_failure_reason: succeeded
            ? null
            : pStr(o["parse_failure_reason"]) || (succeededFlag ? "parser returned no usable query" : "parse did not succeed"),
        trigger_type: succeeded ? triggerType : null,
        parsed_query: succeeded ? query : null,
        parse_confidence: pConfidence(o["parse_confidence"]),
        ambiguities: pAmbiguities(o["ambiguities"]),
        rephrased_for_confirmation: pStr(o["rephrased_for_confirmation"]).trim(),
        suggested_split: pStringArrayOrNull(o["suggested_split"]),
        notes: typeof o["notes"] === "string" && o["notes"].trim().length > 0 ? o["notes"].trim() : null
    };
}

export function parseDisposition(result: TriggerParseResult): ParseDisposition {
    if (!result.parse_succeeded) return "clarify_only";
    const c = result.parse_confidence;
    if (c >= 0.95) return "arm_ready";
    if (c >= 0.8) return "confirm_minor";
    if (c >= 0.7) return "resolve_first";
    return "clarify_only";
}

// ─── Matchers (mirror of matchers.ts) ──────────────────────────

export interface MatchableItem {
    readonly enriched_id: string;
    readonly companies: ReadonlyArray<string>;
    readonly exec_move_company: string | null;
    readonly exec_move_role: string | null;
    readonly event_category: string;
    readonly topic_tags: ReadonlyArray<string>;
    readonly user_relevance_score: number;
    readonly text: string;
    readonly published_date: string | null;
}

function lc(s: string): string {
    return s.trim().toLowerCase();
}

function companySet(item: MatchableItem): Set<string> {
    const set = new Set<string>();
    for (const c of item.companies) {
        const k = lc(c);
        if (k.length > 0) set.add(k);
    }
    if (item.exec_move_company) {
        const k = lc(item.exec_move_company);
        if (k.length > 0) set.add(k);
    }
    return set;
}

export function targetMatches(item: MatchableItem, target: TriggerTarget | undefined): boolean {
    if (!target || target.type === "any") return true;
    const companies = companySet(item);
    if (target.type === "company") {
        const names = [target.name, ...(target.aliases ?? [])].map(lc);
        return names.some((n) => n.length > 0 && companies.has(n));
    }
    if (target.type === "companies") {
        const names = target.names.map(lc).filter((n) => n.length > 0);
        if (names.length === 0) return false;
        return target.logic === "all"
            ? names.every((n) => companies.has(n))
            : names.some((n) => companies.has(n));
    }
    const descriptor = lc(target.category_descriptor);
    if (descriptor.length === 0) return false;
    if ([...companies].some((c) => c.includes(descriptor))) return true;
    if (item.topic_tags.some((t) => lc(t).includes(descriptor))) return true;
    return item.text.includes(descriptor);
}

export function eventCategoryMatches(item: MatchableItem, category: EventCategory): boolean {
    if (category === "any") return true;
    return lc(item.event_category) === lc(category);
}

export function rolePatternMatches(item: MatchableItem, pattern: string | undefined): boolean {
    if (!pattern || pattern.trim().length === 0) return true;
    const role = item.exec_move_role;
    if (!role) return false;
    try {
        return new RegExp(pattern, "i").test(role);
    } catch {
        return lc(role).includes(lc(pattern));
    }
}

function qualifierSatisfied(item: MatchableItem, qualifier: string | undefined): boolean {
    if (!qualifier || qualifier.trim().length === 0) return true;
    const tokens = lc(qualifier)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3);
    if (tokens.length === 0) return true;
    const hay = item.text + " " + item.topic_tags.map(lc).join(" ");
    return tokens.some((t) => hay.includes(t));
}

export function matchSingleEvent(item: MatchableItem, q: SingleEventQuery): boolean {
    if (!eventCategoryMatches(item, q.event.category)) return false;
    if (!targetMatches(item, q.target)) return false;
    if (!qualifierSatisfied(item, q.event.qualifier)) return false;
    return true;
}

export function matchAdjacency(item: MatchableItem, q: AdjacencyQuery): boolean {
    if (!targetMatches(item, q.target)) return false;
    const threshold = Number.isFinite(q.relevance_threshold) ? q.relevance_threshold : 0.6;
    if (item.user_relevance_score < threshold) return false;
    if (q.exclude_event_categories && q.exclude_event_categories.length > 0) {
        if (q.exclude_event_categories.some((c) => eventCategoryMatches(item, c))) return false;
    }
    if (q.scope) {
        if (q.scope.topics && q.scope.topics.length > 0) {
            const topics = q.scope.topics.map(lc);
            const itemTopics = item.topic_tags.map(lc);
            const hit = topics.some((t) => itemTopics.includes(t) || item.text.includes(t));
            if (!hit) return false;
        }
        if (q.scope.categories && q.scope.categories.length > 0) {
            if (!q.scope.categories.some((c) => eventCategoryMatches(item, c))) return false;
        }
    }
    return true;
}

export function aggregationItemMatches(item: MatchableItem, q: AggregationQuery): boolean {
    if (!eventCategoryMatches(item, q.event.category)) return false;
    if (!targetMatches(item, q.target)) return false;
    if (!qualifierSatisfied(item, q.event.qualifier)) return false;
    if (!rolePatternMatches(item, q.filters.role_pattern)) return false;
    if (q.filters.exclude_companies && q.filters.exclude_companies.length > 0) {
        const excluded = new Set(q.filters.exclude_companies.map(lc));
        const companies = companySet(item);
        if ([...companies].some((c) => excluded.has(c))) return false;
    }
    return true;
}

export function aggregationFires(
    matchingItems: ReadonlyArray<MatchableItem>,
    q: AggregationQuery
): { count: number; fires: boolean } {
    const ids = new Set(matchingItems.map((i) => i.enriched_id));
    const count = ids.size;
    return { count, fires: count >= q.min_count };
}

export function withinWindow(
    item: MatchableItem,
    windowDays: number,
    nowIso: string,
    fallbackDate?: string | null
): boolean {
    const dateStr = item.published_date ?? fallbackDate ?? null;
    if (!dateStr) return true;
    const itemMs = new Date(dateStr).getTime();
    const nowMs = new Date(nowIso).getTime();
    if (!Number.isFinite(itemMs) || !Number.isFinite(nowMs)) return true;
    const ageDays = (nowMs - itemMs) / (24 * 60 * 60 * 1000);
    return ageDays <= windowDays && ageDays >= 0 - 1;
}

export function evaluateThreshold(
    currentValue: number,
    baselineValue: number,
    q: ThresholdQuery
): boolean {
    let observed: number;
    switch (q.metric.metric_type) {
        case "growth_pct":
        case "growth_rate":
            observed = baselineValue !== 0 ? (currentValue - baselineValue) / baselineValue : 0;
            break;
        case "ratio_vs_baseline":
            observed = baselineValue !== 0 ? currentValue / baselineValue : 0;
            break;
        default:
            observed = currentValue;
            break;
    }
    return compareThreshold(observed, q.comparison, q.value);
}

function compareThreshold(observed: number, comparison: ThresholdComparison, value: number): boolean {
    switch (comparison) {
        case "greater_than":
        case "crosses_above":
            return observed > value;
        case "greater_than_or_equal":
            return observed >= value;
        case "less_than":
        case "crosses_below":
            return observed < value;
        case "less_than_or_equal":
            return observed <= value;
        default:
            return false;
    }
}

export function evaluateSilence(daysSinceLastActivity: number | null, q: SilenceQuery): boolean {
    if (daysSinceLastActivity === null) return q.silence_days > 0;
    return daysSinceLastActivity >= q.silence_days;
}
