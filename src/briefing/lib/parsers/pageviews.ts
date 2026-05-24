/**
 * Wikipedia Pageviews API helpers — Node-side reference implementation.
 *
 * The Wikipedia Pageviews API is the cleanest free signal for
 * category-narrative interest (per Intelligence Coverage Audit §2.5,
 * 15/15 composite). For any Wikipedia article, we can pull daily
 * pageview counts over a window and detect significant deltas.
 *
 * Endpoint shape:
 *   GET https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/
 *       en.wikipedia/all-access/all-agents/<URL-encoded title>/daily/<YYYYMMDD>/<YYYYMMDD>
 *
 * Response shape (relevant subset):
 *   { items: [{ article, timestamp, views }, ...] }
 *
 * The fetcher (Deno side) computes the pageviews window URL, fetches,
 * and hands the JSON body to detectSignificantDelta() below. A delta
 * is "significant" when the most recent N days' average pageviews is
 * meaningfully higher or lower than the prior N days' average — i.e.
 * the article's interest is moving, not steady.
 *
 * Why thresholds live in code rather than spec: the Audit names this
 * source as 15/15 but doesn't lock thresholds. They're calibrated
 * here against operator judgment + iterated as B.7 (Evaluation
 * Harness) starts tracking which deltas the operator marks Used vs
 * Noise.
 */

export interface PageviewsResponseItem {
    readonly article: string;
    readonly timestamp: string; // YYYYMMDDHH from the API
    readonly views: number;
}

export interface PageviewsResponse {
    readonly items: ReadonlyArray<PageviewsResponseItem>;
}

export interface PageviewsDelta {
    readonly article: string;
    readonly window_days: number;
    readonly recent_avg: number;
    readonly prior_avg: number;
    readonly delta_pct: number;
    readonly is_significant: boolean;
    readonly direction: "up" | "down" | "flat";
}

/**
 * The recent N-day average vs prior N-day average. A delta is
 * significant when (a) the relative change exceeds RELATIVE_THRESHOLD
 * AND (b) the absolute baseline is above ABSOLUTE_MIN_BASELINE (so
 * 1→3 views doesn't fire — it's noise on a low-volume article). N
 * defaults to 7 (a week vs the prior week is the natural cadence for
 * a Monday-morning briefing).
 *
 * Tuning history: tighter = fewer fires + cleaner signal; looser =
 * more fires + more noise. Current values were chosen to fire on
 * articles like "Customer data platform" picking up coverage during
 * an industry consolidation event, without firing on noisy small
 * articles.
 */
const RELATIVE_THRESHOLD = 0.5; // 50% change either direction
const ABSOLUTE_MIN_BASELINE = 100; // skip articles below 100 views/day average

export function detectSignificantDelta(
    response: PageviewsResponse,
    windowDays = 7
): PageviewsDelta | null {
    const items = response.items ?? [];
    if (items.length < windowDays * 2) {
        // Not enough data to compare two complete windows. The
        // pipeline window should give us 14+ days; if it doesn't,
        // the API didn't return what we asked for.
        return null;
    }

    const article = items[0]?.article ?? "(unknown)";
    const sorted = [...items].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
    );

    const total = sorted.length;
    const recentSlice = sorted.slice(total - windowDays, total);
    const priorSlice = sorted.slice(total - windowDays * 2, total - windowDays);

    const recentAvg = average(recentSlice.map((i) => i.views));
    const priorAvg = average(priorSlice.map((i) => i.views));

    if (priorAvg < ABSOLUTE_MIN_BASELINE && recentAvg < ABSOLUTE_MIN_BASELINE) {
        return null; // Low-volume article on both sides; not worth signaling.
    }

    // Pre-emptive guard for divide-by-zero on a brand-new article
    // (no prior views). Treat 0→nonzero as a +inf relative jump but
    // surface as a finite "up" signal with a representative deltaPct.
    const deltaPct =
        priorAvg === 0
            ? recentAvg > 0
                ? 999
                : 0
            : (recentAvg - priorAvg) / priorAvg;

    const isSignificant = Math.abs(deltaPct) >= RELATIVE_THRESHOLD;
    const direction: PageviewsDelta["direction"] =
        Math.abs(deltaPct) < 0.05 ? "flat" : deltaPct > 0 ? "up" : "down";

    return {
        article,
        window_days: windowDays,
        recent_avg: recentAvg,
        prior_avg: priorAvg,
        delta_pct: deltaPct,
        is_significant: isSignificant,
        direction
    };
}

function average(values: ReadonlyArray<number>): number {
    if (values.length === 0) return 0;
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
}

/**
 * Build the Wikipedia Pageviews URL for a given article + window.
 *
 *   article    — the page title as Wikipedia stores it (spaces become
 *                underscores, special chars URL-encoded)
 *   startDate  — UTC Date for the start of the window (inclusive)
 *   endDate    — UTC Date for the end of the window (inclusive)
 */
export function pageviewsUrl(
    article: string,
    startDate: Date,
    endDate: Date
): string {
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
