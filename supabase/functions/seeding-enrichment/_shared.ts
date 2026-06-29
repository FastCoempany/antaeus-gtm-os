/**
 * Shared helpers for the seeding-enrichment Edge Function (ADR-019).
 * Mirrors the outdoors-events-discovery shared module — models, token
 * cost, web-search cost, CORS, and a defensive JSON-array extractor.
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
    }
} as const;

export type ModelKey = keyof typeof MODELS;

export interface TokenUsage {
    readonly input_tokens: number;
    readonly output_tokens: number;
}

export const WEB_SEARCH_COST_PER_USE_USD = 0.01;

export function computeCost(model: ModelKey, usage: TokenUsage): number {
    const pricing = MODELS[model];
    return (
        (usage.input_tokens / 1_000_000) * pricing.input_per_million_usd +
        (usage.output_tokens / 1_000_000) * pricing.output_per_million_usd
    );
}

export function roundCost(usd: number): number {
    return Math.round(usd * 10_000) / 10_000;
}

export function extractJsonArray(text: string): unknown {
    if (!text) return [];
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fence ? fence[1] : text;
    const start = candidate.indexOf("[");
    const end = candidate.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) return [];
    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return [];
    }
}

export function corsHeaders(req: Request): Record<string, string> {
    const requested = req.headers.get("Access-Control-Request-Headers");
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
            requested ?? "authorization, x-client-info, apikey, content-type"
    };
}

export function json(
    body: unknown,
    status = 200,
    cors: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...cors }
    });
}
