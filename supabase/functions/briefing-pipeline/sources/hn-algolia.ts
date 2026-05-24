/**
 * HN Algolia search fetcher (B.1b).
 *
 * Queries the HN Algolia search-by-date endpoint for the last 7 days
 * of stories matching each term in the workspace's HydratedContext.
 * Terms are derived from ICP pain tags + competitive set + target
 * industries. In B.1b, HydratedContext is still uninitialized for
 * every workspace, so the term list is empty and this fetcher
 * gracefully no-ops.
 *
 * Each query produces up to N hits; multiple terms run in parallel
 * and dedupe at the RawItem level via the (workspace, source,
 * external_id) UNIQUE constraint on briefing_raw_items.
 *
 * Source ranking: tier S, 15/15 composite (Intelligence Coverage
 * Audit §3.1). Most reliable free API on the open internet.
 *
 * Reference: deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §3.1
 */

// deno-lint-ignore-file no-explicit-any

import { httpGet } from "./_shared.ts";

interface RawItem {
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly data: Record<string, unknown>;
}

interface HydratedContext {
    readonly icp: any;
    readonly watchlist_companies: ReadonlyArray<string>;
}

const SOURCE_ID = "hn_algolia";
const HITS_PER_QUERY = 10;
const WINDOW_DAYS = 7;
const MAX_QUERY_TERMS = 12; // bound the per-run fan-out

export const hnAlgoliaSource = {
    id: SOURCE_ID,
    fetch: async (
        ctx: HydratedContext,
        nowIso: string
    ): Promise<ReadonlyArray<RawItem>> => {
        const terms = buildQueryTerms(ctx);
        if (terms.length === 0) return [];

        const sinceUnix = Math.floor(
            (new Date(nowIso).getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000) /
                1000
        );

        const perTerm = await Promise.allSettled(
            terms.map(async (term) => fetchForTerm(term, sinceUnix))
        );

        const out: RawItem[] = [];
        const seen = new Set<string>();
        for (const result of perTerm) {
            if (result.status !== "fulfilled") continue;
            for (const item of result.value) {
                if (seen.has(item.external_id)) continue;
                seen.add(item.external_id);
                out.push(item);
            }
        }
        return out;
    }
};

function buildQueryTerms(ctx: HydratedContext): ReadonlyArray<string> {
    const terms: string[] = [];
    if (Array.isArray(ctx.watchlist_companies)) {
        for (const c of ctx.watchlist_companies) {
            if (typeof c === "string" && c.trim().length > 0) {
                terms.push(c.trim());
            }
        }
    }
    if (ctx.icp && typeof ctx.icp === "object") {
        const industries = (ctx.icp as { target_industries?: unknown })
            .target_industries;
        if (Array.isArray(industries)) {
            for (const i of industries) {
                if (typeof i === "string" && i.trim().length > 0) {
                    terms.push(i.trim());
                }
            }
        }
    }
    return Array.from(new Set(terms)).slice(0, MAX_QUERY_TERMS);
}

async function fetchForTerm(
    term: string,
    sinceUnix: number
): Promise<ReadonlyArray<RawItem>> {
    const url = buildUrl(term, sinceUnix);
    const result = await httpGet(url, { Accept: "application/json" });
    if (!result.ok) {
        console.warn("[hn-algolia] HTTP failure:", {
            term,
            status: result.status,
            error: result.error
        });
        return [];
    }
    let body: { hits?: ReadonlyArray<Record<string, unknown>> };
    try {
        body = JSON.parse(result.text);
    } catch (err) {
        console.warn("[hn-algolia] JSON parse failed:", {
            term,
            error: err instanceof Error ? err.message : String(err)
        });
        return [];
    }
    const hits = Array.isArray(body.hits) ? body.hits : [];
    const items: RawItem[] = [];
    for (const raw of hits) {
        if (!raw || typeof raw !== "object") continue;
        const objectID = asString((raw as Record<string, unknown>)["objectID"]);
        const title = asString((raw as Record<string, unknown>)["title"]);
        if (objectID === null || title === null) continue;
        const url = asString((raw as Record<string, unknown>)["url"]);
        const createdAt = asString((raw as Record<string, unknown>)["created_at"]);
        items.push({
            source_id: SOURCE_ID,
            external_id: `hn_${objectID}`,
            title,
            body: asString((raw as Record<string, unknown>)["story_text"]),
            url,
            published_date: createdAt,
            data: {
                query_term: term,
                author: asString((raw as Record<string, unknown>)["author"]),
                points: asNumber((raw as Record<string, unknown>)["points"]),
                num_comments: asNumber(
                    (raw as Record<string, unknown>)["num_comments"]
                )
            }
        });
    }
    return items;
}

function buildUrl(query: string, sinceUnix: number): string {
    const params = new URLSearchParams({
        query,
        tags: "story",
        numericFilters: `created_at_i>${sinceUnix}`,
        hitsPerPage: String(HITS_PER_QUERY)
    });
    return `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`;
}

function asString(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function asNumber(v: unknown): number | null {
    if (typeof v !== "number" || Number.isNaN(v)) return null;
    return v;
}
