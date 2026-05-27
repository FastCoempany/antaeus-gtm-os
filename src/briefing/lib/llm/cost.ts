/**
 * Model registry + cost calculation for the Briefing LLM layer (B.2a).
 *
 * Per the Cost Model v0.2 spec, every LLM call carries a deterministic
 * cost. The wrapper records cost on every call (briefing_runs.total_cost +
 * briefing_enriched_items.enrichment_cost). The Briefing footer (B.9
 * territory) reads these to display "Cost this week: $0.34".
 *
 * Pricing here matches Anthropic's published API rates as of the
 * 2026-05 build phase plan. Rates are in USD per million tokens.
 * Source: https://docs.anthropic.com/claude/docs/models-overview
 *
 * If Anthropic adjusts pricing, update this file — every cost report
 * across the pipeline depends on it. The model_v hash function downstream
 * (model-version.ts) includes the rate version so that Patterns
 * generated under different pricing windows stay distinguishable in
 * audit envelopes.
 */

export interface ModelPricing {
    /** Cost in USD per million input tokens. */
    readonly input_per_million_usd: number;
    /** Cost in USD per million output tokens. */
    readonly output_per_million_usd: number;
    /** Model identifier as used in the Anthropic API. */
    readonly api_id: string;
    /** Human label for logs + audit envelopes. */
    readonly label: string;
}

/**
 * Models the pipeline uses. Naming matches the canonical 2026-05 set
 * per CLAUDE.md (Opus 4.7, Sonnet 4.6, Haiku 4.5). Anthropic API IDs
 * are the durable identifier; the version-suffixed `api_id` is what
 * we send in the HTTP request.
 */
export const MODELS = {
    haiku_4_5: {
        api_id: "claude-haiku-4-5-20251001",
        label: "Haiku 4.5",
        input_per_million_usd: 1.0,
        output_per_million_usd: 5.0
    },
    sonnet_4_6: {
        api_id: "claude-sonnet-4-6",
        label: "Sonnet 4.6",
        input_per_million_usd: 3.0,
        output_per_million_usd: 15.0
    },
    opus_4_7: {
        api_id: "claude-opus-4-7",
        label: "Opus 4.7",
        input_per_million_usd: 5.0,
        output_per_million_usd: 25.0
    }
} as const satisfies Readonly<Record<string, ModelPricing>>;

export type ModelKey = keyof typeof MODELS;

export interface TokenUsage {
    readonly input_tokens: number;
    readonly output_tokens: number;
}

/**
 * Compute the USD cost of a single Anthropic call given the model
 * and reported token usage.
 *
 * Returns USD as a number; round at the persistence layer to whatever
 * decimal place the column tolerates (briefing_enriched_items.
 * enrichment_cost is numeric(8,4) — four decimal places).
 */
export function computeCost(model: ModelKey, usage: TokenUsage): number {
    const pricing = MODELS[model];
    const inputCost = (usage.input_tokens / 1_000_000) * pricing.input_per_million_usd;
    const outputCost = (usage.output_tokens / 1_000_000) * pricing.output_per_million_usd;
    return inputCost + outputCost;
}

/**
 * Round to four decimal places to match the briefing_enriched_items.
 * enrichment_cost column's numeric(8,4) precision. Avoid floating-point
 * artifacts in the stored value.
 */
export function roundCost(usd: number): number {
    return Math.round(usd * 10_000) / 10_000;
}
