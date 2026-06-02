/**
 * Shared helpers for the Outdoors Events discovery Edge Function
 * (ADR-016 PR 2).
 *
 * Self-contained Deno module — types + cost + voice-lite + dedupe are
 * duplicated here on purpose so the function bundles standalone, same
 * pattern as supabase/functions/briefing-pipeline/llm/_shared.ts.
 */

// deno-lint-ignore-file no-explicit-any

// ─── Models + cost ─────────────────────────────────────────────────

export interface ModelPricing {
    readonly input_per_million_usd: number;
    readonly output_per_million_usd: number;
    readonly api_id: string;
    readonly label: string;
}

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

// Anthropic web_search is billed per search ($10 / 1000 searches as of
// 2026) on top of token cost. We surface it so the run ledger's
// total_cost_usd reflects reality.
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

// ─── Voice-lite (canon Part III §11) ───────────────────────────────

/**
 * Minimal banned-vocab gate. The full Voice Document lives in
 * src/lib/voice/ (Node tree, can't import here). This is the Deno
 * duplicate of the banned-noun subset that matters for short
 * event-relevance copy. A relevance_reason that trips this is dropped.
 */
const BANNED_SUBSTRINGS: ReadonlyArray<string> = [
    "wedge",
    "verdict",
    "decision-grade",
    "operating truth",
    "command intelligence",
    "synergy",
    "leverage the",
    "unlock value",
    "game-chang",
    "supercharge",
    "best-in-class",
    "world-class",
    "cutting-edge",
    "revolutioniz",
    "paradigm",
    "ecosystem play"
];

export function passesVoiceLite(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    const lower = text.toLowerCase();
    for (const banned of BANNED_SUBSTRINGS) {
        if (lower.includes(banned)) return false;
    }
    // Reject manifesto-fragment shape: 3+ sentence fragments with no verb-ish
    // tokens is hard to detect cheaply; we settle for a length sanity bound.
    if (text.length > 320) return false;
    return true;
}

// ─── Dedupe key ────────────────────────────────────────────────────

/**
 * Workspace-scoped slug from name + start_date + city. Matches the
 * unique index outdoors_events_workspace_dedupe_idx. Lowercased,
 * alphanumeric-collapsed so "RSA Conference 2026" + "2026-05-04" +
 * "San Francisco" is stable across runs even if the model phrases
 * the name slightly differently.
 */
export function buildDedupeKey(
    name: string,
    startDate: string | null,
    whereAt: string | null
): string {
    const slug = (s: string): string =>
        s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60);
    const namePart = slug(name);
    const datePart = startDate ? startDate.slice(0, 7) : "nodate"; // year-month
    const cityPart = whereAt ? slug(whereAt).slice(0, 24) : "nowhere";
    return `${namePart}__${datePart}__${cityPart}`;
}

// ─── Discovered event shape ────────────────────────────────────────

export type RelevanceTier = "direct" | "adjacent" | "indirect";

export function isRelevanceTier(v: unknown): v is RelevanceTier {
    return v === "direct" || v === "adjacent" || v === "indirect";
}

export interface DiscoveredEvent {
    readonly name: string;
    readonly kind: string | null;
    readonly where_at: string | null;
    readonly start_date: string | null;
    readonly end_date: string | null;
    readonly tags: ReadonlyArray<string>;
    readonly source_url: string | null;
    readonly relevance_tier: RelevanceTier;
    readonly relevance_reason: string;
}

/**
 * Parse + validate the LLM's JSON event array. Drops malformed
 * entries, entries that fail the voice gate, and entries without a
 * resolvable-looking source URL (web-grounded events must carry a
 * real link — no URL means likely hallucinated).
 */
export function parseDiscoveredEvents(raw: unknown): DiscoveredEvent[] {
    if (!Array.isArray(raw)) return [];
    const out: DiscoveredEvent[] = [];
    for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const name = typeof o.name === "string" ? o.name.trim() : "";
        if (name.length === 0) continue;
        const tier = o.relevance_tier;
        if (!isRelevanceTier(tier)) continue;
        const reason =
            typeof o.relevance_reason === "string"
                ? o.relevance_reason.trim()
                : "";
        if (!passesVoiceLite(reason)) continue;
        const sourceUrl =
            typeof o.source_url === "string" ? o.source_url.trim() : "";
        // Web-grounded discovery must carry a real URL.
        if (!/^https?:\/\//i.test(sourceUrl)) continue;
        const tags = Array.isArray(o.tags)
            ? (o.tags
                  .filter((t) => typeof t === "string")
                  .map((t) => (t as string).trim())
                  .filter((t) => t.length > 0) as string[])
            : [];
        out.push({
            name,
            kind: typeof o.kind === "string" ? o.kind.trim() || null : null,
            where_at:
                typeof o.where_at === "string" ? o.where_at.trim() || null : null,
            start_date: normalizeDate(o.start_date),
            end_date: normalizeDate(o.end_date),
            tags,
            source_url: sourceUrl,
            relevance_tier: tier,
            relevance_reason: reason
        });
    }
    return out;
}

function normalizeDate(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * Pull a JSON array out of an LLM text response that may wrap it in
 * prose or a ```json fence. Returns [] if no array is found.
 */
export function extractJsonArray(text: string): unknown {
    if (!text) return [];
    // Try a fenced block first.
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
