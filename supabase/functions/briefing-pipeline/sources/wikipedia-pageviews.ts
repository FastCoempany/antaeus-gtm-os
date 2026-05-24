/**
 * Wikipedia Pageviews fetcher (B.1b).
 *
 * Pulls the daily pageviews series for each article in the
 * workspace's watchlist, computes recent-vs-prior week deltas, emits
 * a RawItem per article whose interest is "moving" (significant
 * absolute baseline + significant relative change). Articles whose
 * interest is steady are silently dropped — the Briefing surface
 * shouldn't fire on flat data.
 *
 * Articles to track come from the HydratedContext:
 *   - target_industries map to category articles (e.g. "Customer
 *     data platform", "Vector database")
 *   - watchlist_companies map to their own Wikipedia entries (e.g.
 *     "Snowflake Inc.", "Databricks")
 *
 * In B.1b the HydratedContext is uninitialized, so the article list
 * is empty and this fetcher no-ops.
 *
 * Article-name resolution is a known gap: the fetcher uses the term
 * directly as the article title, which only works when the term
 * matches Wikipedia's canonical title. Smart aliasing (CDP → Customer
 * data platform) is a B.2+ enhancement.
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

interface FetchResult {
    readonly items: ReadonlyArray<RawItem>;
    readonly error: string | null;
}

interface HydratedContext {
    readonly icp: any;
    readonly watchlist_companies: ReadonlyArray<string>;
}

const SOURCE_ID = "wikipedia_pageviews";
const WINDOW_DAYS = 7;
const MAX_ARTICLES = 20;
const RELATIVE_THRESHOLD = 0.5;
const ABSOLUTE_MIN_BASELINE = 100;

export const wikipediaPageviewsSource = {
    id: SOURCE_ID,
    fetch: async (
        ctx: HydratedContext,
        nowIso: string
    ): Promise<FetchResult> => {
        const articles = buildArticleList(ctx);
        if (articles.length === 0) {
            return { items: [], error: null };
        }

        const now = new Date(nowIso);
        const endDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        // Need 2N days to compare two complete windows.
        const startDate = new Date(
            endDate.getTime() - WINDOW_DAYS * 2 * 24 * 60 * 60 * 1000
        );

        const perArticle = await Promise.allSettled(
            articles.map(async (article) =>
                fetchArticle(article, startDate, endDate, nowIso)
            )
        );

        const out: RawItem[] = [];
        const errors: string[] = [];
        for (const result of perArticle) {
            if (result.status === "rejected") {
                errors.push(
                    result.reason instanceof Error
                        ? result.reason.message
                        : String(result.reason)
                );
                continue;
            }
            if (result.value.error !== null) {
                errors.push(result.value.error);
            }
            if (result.value.item !== null) {
                out.push(result.value.item);
            }
        }
        const error =
            out.length === 0 && errors.length > 0
                ? errors.slice(0, 3).join("; ")
                : null;
        return { items: out, error };
    }
};

interface ArticleFetchResult {
    readonly item: RawItem | null;
    readonly error: string | null;
}

function buildArticleList(ctx: HydratedContext): ReadonlyArray<string> {
    const articles: string[] = [];
    if (Array.isArray(ctx.watchlist_companies)) {
        for (const c of ctx.watchlist_companies) {
            if (typeof c === "string" && c.trim().length > 0) {
                articles.push(c.trim());
            }
        }
    }
    if (ctx.icp && typeof ctx.icp === "object") {
        const industries = (ctx.icp as { target_industries?: unknown })
            .target_industries;
        if (Array.isArray(industries)) {
            for (const i of industries) {
                if (typeof i === "string" && i.trim().length > 0) {
                    articles.push(i.trim());
                }
            }
        }
    }
    return Array.from(new Set(articles)).slice(0, MAX_ARTICLES);
}

async function fetchArticle(
    article: string,
    startDate: Date,
    endDate: Date,
    nowIso: string
): Promise<ArticleFetchResult> {
    const url = pageviewsUrl(article, startDate, endDate);
    const result = await httpGet(url, { Accept: "application/json" });
    if (!result.ok) {
        // 404 is expected for articles Wikipedia doesn't carry; not
        // an error signal. Other failures are real.
        if (result.status === 404) {
            return { item: null, error: null };
        }
        return {
            item: null,
            error: `article=${article}: ${result.error ?? `HTTP ${result.status}`}`
        };
    }

    let body: { items?: Array<{ timestamp?: string; views?: number }> };
    try {
        body = JSON.parse(result.text);
    } catch (err) {
        return {
            item: null,
            error: `article=${article}: JSON parse failed: ${
                err instanceof Error ? err.message : String(err)
            }`
        };
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length < WINDOW_DAYS * 2) return { item: null, error: null };

    const sorted = [...items].sort((a, b) =>
        String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""))
    );
    const total = sorted.length;
    const recentViews = sorted
        .slice(total - WINDOW_DAYS, total)
        .map((i) => (typeof i.views === "number" ? i.views : 0));
    const priorViews = sorted
        .slice(total - WINDOW_DAYS * 2, total - WINDOW_DAYS)
        .map((i) => (typeof i.views === "number" ? i.views : 0));
    const recentAvg = average(recentViews);
    const priorAvg = average(priorViews);

    if (
        priorAvg < ABSOLUTE_MIN_BASELINE &&
        recentAvg < ABSOLUTE_MIN_BASELINE
    ) {
        return { item: null, error: null };
    }

    const deltaPct =
        priorAvg === 0 ? (recentAvg > 0 ? 999 : 0) : (recentAvg - priorAvg) / priorAvg;
    if (Math.abs(deltaPct) < RELATIVE_THRESHOLD) {
        return { item: null, error: null };
    }

    const direction = deltaPct > 0 ? "up" : "down";
    const articleSlug = article.replace(/ /g, "_");
    const item: RawItem = {
        source_id: SOURCE_ID,
        external_id: `wp_${articleSlug}_${endDate.toISOString().slice(0, 10)}`,
        title: `Wikipedia pageviews ${direction} for "${article}" (${Math.round(deltaPct * 100)}% w/w)`,
        body: `Recent 7-day avg ${Math.round(recentAvg)} pageviews/day; prior 7-day avg ${Math.round(priorAvg)} pageviews/day.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(articleSlug)}`,
        published_date: nowIso,
        data: {
            article,
            window_days: WINDOW_DAYS,
            recent_avg: recentAvg,
            prior_avg: priorAvg,
            delta_pct: deltaPct,
            direction
        }
    };
    return { item, error: null };
}

function pageviewsUrl(article: string, startDate: Date, endDate: Date): string {
    const encoded = encodeURIComponent(article.replace(/ /g, "_"));
    const start = ymd(startDate);
    const end = ymd(endDate);
    return (
        "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/" +
        `en.wikipedia/all-access/all-agents/${encoded}/daily/${start}/${end}`
    );
}

function ymd(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

function average(values: ReadonlyArray<number>): number {
    if (values.length === 0) return 0;
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
}
