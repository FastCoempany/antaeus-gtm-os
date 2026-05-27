/**
 * Watchlist Trigger types (B.3a).
 *
 * The five-type grammar from Watchlist Trigger Grammar v0.1 §2-3.
 * The parser (parser.ts) turns natural language into one of these
 * `parsed_query` shapes; the matchers (matchers.ts) evaluate them
 * against enriched items + per-run metrics.
 *
 * Canonical reference + vitest-tested. The Deno mirror in
 * supabase/functions/briefing-pipeline/triggers/_shared.ts keeps a
 * verbatim copy — same Node/Deno split as the LLM + cluster layers.
 */

export type TriggerType =
    | "single_event"
    | "aggregation"
    | "threshold"
    | "adjacency"
    | "silence";

export const EVENT_CATEGORIES = [
    "exec_move",
    "pricing_change",
    "product_launch",
    "funding_round",
    "m_a_event",
    "regulatory_action",
    "security_incident",
    "partnership_announcement",
    "integration_added",
    "integration_removed",
    "leadership_departure",
    "layoff_event",
    "geographic_expansion",
    "vertical_expansion",
    "narrative_shift_mention",
    "press_coverage",
    "patent_filing",
    "trust_certification_change",
    "any"
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

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

/** The parser's full output (grammar §4.2 output format). */
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

/**
 * What the system should do with a parse, per the confidence model
 * (grammar §4.3). The UI uses this to decide whether to offer Confirm,
 * require ambiguity resolution, or only ask clarifying questions.
 */
export type ParseDisposition = "arm_ready" | "confirm_minor" | "resolve_first" | "clarify_only";
