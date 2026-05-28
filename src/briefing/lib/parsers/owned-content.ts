/**
 * Owned-content RSS — pure helpers (B.4d sub-track).
 *
 * The cleaning + feed-discovery logic for the Owned-Content RSS source.
 * Pure functions only: no HTTP, no Supabase, no Deno. The Deno-side
 * fetcher (supabase/functions/briefing-pipeline/sources/owned-content-rss.ts)
 * mirrors these verbatim and adds the network/IO layer.
 *
 * Auto-discovery beats manual feed-URL paste because:
 *   - operators promote periphery candidates without knowing the URL,
 *   - the operator-facing burden ("paste the feed URL") is silly when
 *     companies publish <link rel="alternate"> in their <head>,
 *   - feed URLs are stable enough that one discovery pass per week
 *     covers re-validation cost.
 *
 * Cleaning rigor is non-negotiable here. An auto-discovered feed is
 * inherently lower-trust than a hand-curated one — we don't know the
 * publisher's editorial stance, the feed might be a kitchen-sink
 * aggregator, marketing fluff is the default not the exception. The
 * rejection rules below run BEFORE the items hit `briefing_raw_items`;
 * the enrich stage can then focus on real categorization rather than
 * filtering out "5 tips to boost productivity".
 */

// ─── Discovery ─────────────────────────────────────────────────

/**
 * Common feed-URL paths to probe when the homepage doesn't advertise a
 * feed via <link rel="alternate">. Order matters: probe specific paths
 * first ("/blog/feed" is almost always blog-only and higher-signal),
 * then bare-root paths, then atom variants. Cap probing at this list —
 * don't try wild paths.
 */
export const FEED_PROBE_PATHS: ReadonlyArray<string> = [
    "/blog/feed",
    "/blog/feed.xml",
    "/blog/rss",
    "/blog/rss.xml",
    "/blog/atom.xml",
    "/feed",
    "/feed.xml",
    "/rss",
    "/rss.xml",
    "/atom.xml",
    "/resources/feed",
    "/podcast/feed",
    "/news/feed"
];

export interface DiscoveredFeedLink {
    readonly url: string;
    readonly kind: "rss" | "atom" | "unknown";
    readonly title: string | null;
}

const FEED_LINK_TAG_REGEX =
    /<link\s+[^>]*rel\s*=\s*["']alternate["'][^>]*>/gi;

/**
 * Extract <link rel="alternate" type="application/(rss|atom)+xml"> entries
 * from a page's HTML. Returns the URLs (resolved against the base URL)
 * + the feed kind. Empty list if nothing useful is advertised.
 */
export function extractFeedLinksFromHtml(
    html: string,
    baseUrl: string
): ReadonlyArray<DiscoveredFeedLink> {
    const out: DiscoveredFeedLink[] = [];
    const seen = new Set<string>();
    const matches = html.match(FEED_LINK_TAG_REGEX) ?? [];
    for (const tag of matches) {
        const typeMatch = tag.match(/type\s*=\s*["']([^"']+)["']/i);
        const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
        const titleMatch = tag.match(/title\s*=\s*["']([^"']+)["']/i);
        if (!hrefMatch || !typeMatch) continue;
        const t = typeMatch[1]?.toLowerCase() ?? "";
        let kind: "rss" | "atom" | "unknown" = "unknown";
        if (t.includes("rss")) kind = "rss";
        else if (t.includes("atom")) kind = "atom";
        else continue; // only RSS/Atom; ignore JSON feeds for now
        const resolved = resolveUrl(hrefMatch[1] ?? "", baseUrl);
        if (!resolved || seen.has(resolved)) continue;
        seen.add(resolved);
        out.push({
            url: resolved,
            kind,
            title: titleMatch ? titleMatch[1] ?? null : null
        });
    }
    return out;
}

/** Resolve a possibly-relative URL against the base. "" / invalid → null. */
export function resolveUrl(href: string, baseUrl: string): string | null {
    const trimmed = href.trim();
    if (trimmed.length === 0) return null;
    try {
        return new URL(trimmed, baseUrl).toString();
    } catch {
        return null;
    }
}

/** Build the list of candidate feed URLs to probe for a given domain. */
export function buildProbeUrls(domain: string): ReadonlyArray<string> {
    const root = normalizeDomain(domain);
    if (!root) return [];
    return FEED_PROBE_PATHS.map((p) => `https://${root}${p}`);
}

/** Build the homepage URL for the link-tag discovery pass. */
export function buildHomepageUrl(domain: string): string | null {
    const root = normalizeDomain(domain);
    if (!root) return null;
    return `https://${root}/`;
}

/**
 * Strip protocol, trailing slash, "www.", and whitespace.
 * Returns null for empty / malformed input.
 */
export function normalizeDomain(domain: string): string | null {
    const trimmed = domain.trim().toLowerCase();
    if (trimmed.length === 0) return null;
    const noProtocol = trimmed.replace(/^https?:\/\//, "");
    const noTrailing = noProtocol.replace(/\/+$/, "");
    const noWww = noTrailing.replace(/^www\./, "");
    // Reject obvious garbage: must look like a domain (at least one dot).
    if (!/^[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/.test(noWww)) return null;
    return noWww;
}

// ─── Feed validation ───────────────────────────────────────────

export interface FreshnessOpts {
    readonly minItems: number;
    readonly maxAgeDays: number;
    readonly now: Date;
}

export const DEFAULT_FRESHNESS: FreshnessOpts = {
    minItems: 1,
    maxAgeDays: 365,
    now: new Date()
};

export interface MinimalFeedEntry {
    readonly published_date: string | null;
}

/**
 * A feed passes freshness if it has at least `minItems` entries and the
 * most recent one is within `maxAgeDays`. Kills abandoned blogs that
 * haven't published in over a year — those produce no real signal and
 * eat probe time.
 */
export function passesFeedFreshness(
    entries: ReadonlyArray<MinimalFeedEntry>,
    opts: Partial<FreshnessOpts> = {}
): boolean {
    const merged: FreshnessOpts = { ...DEFAULT_FRESHNESS, ...opts };
    if (entries.length < merged.minItems) return false;
    const cutoff = merged.now.getTime() - merged.maxAgeDays * 24 * 60 * 60 * 1000;
    for (const e of entries) {
        if (!e.published_date) continue;
        const t = new Date(e.published_date).getTime();
        if (!Number.isFinite(t)) continue;
        if (t >= cutoff) return true;
    }
    return false;
}

// ─── Item cleaning ─────────────────────────────────────────────

/**
 * Title patterns that scream marketing fluff. Items matching these are
 * REJECTED at ingest, not flagged for the enrich pass — the enrich LLM
 * is expensive and shouldn't spend cycles on "5 tips for better
 * something". The list is conservative: only patterns where the title
 * itself, in isolation, is enough to disqualify.
 *
 * Operator escape hatch: hand-curated sources (Signal Console signals,
 * TechCrunch funding tag) don't run through this filter — only auto-
 * discovered owned-content feeds do.
 */
export const MARKETING_FLUFF_PATTERNS: ReadonlyArray<RegExp> = [
    /^\s*\d+\s+(tips|ways|reasons|things|steps|hacks|secrets|lessons)/i,
    /^\s*(the\s+)?ultimate\s+guide\s+to/i,
    /^\s*(introducing|announcing)\s+our\s+new/i,
    /^\s*how\s+to\s+(boost|improve|increase|maximize|grow|scale|10x)\s+your/i,
    /^\s*\d+\s+best\s+(practices|tools|tips)/i,
    /\bbest\s+practices\b.*\b(checklist|guide|playbook)\b/i,
    /^\s*(top|best)\s+\d+\s+/i,
    /^\s*\[(webinar|ebook|whitepaper|guide)\]/i
];

export const MIN_BODY_LENGTH = 120;
export const PER_ENTITY_ITEM_CAP = 5;

export interface CleanInputItem {
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
}

export type CleanRejection =
    | "empty_title"
    | "empty_body"
    | "body_too_short"
    | "marketing_fluff"
    | "no_url";

export type CleanOutcome =
    | { readonly kind: "keep"; readonly item: CleanInputItem }
    | { readonly kind: "reject"; readonly reason: CleanRejection };

/**
 * Apply the ingest-gate cleaning rules. Returns either a kept item or
 * a rejection reason. Callers log the reason for stage_log diagnostics.
 *
 * Order matters: cheapest checks first so we exit early on garbage.
 */
export function cleanFeedItem(item: CleanInputItem): CleanOutcome {
    const title = item.title.trim();
    if (title.length === 0) return { kind: "reject", reason: "empty_title" };
    if (!item.url || item.url.trim().length === 0) {
        return { kind: "reject", reason: "no_url" };
    }
    if (!item.body || item.body.trim().length === 0) {
        return { kind: "reject", reason: "empty_body" };
    }
    const bodyLen = item.body.trim().length;
    if (bodyLen < MIN_BODY_LENGTH) {
        return { kind: "reject", reason: "body_too_short" };
    }
    for (const pat of MARKETING_FLUFF_PATTERNS) {
        if (pat.test(title)) return { kind: "reject", reason: "marketing_fluff" };
    }
    return { kind: "keep", item: { ...item, title, body: item.body.trim() } };
}

/**
 * Apply cleaning to a batch + enforce the per-entity cap. The cap
 * prevents one chatty corporate blog from drowning out everyone else
 * in a single run — even if their last 50 posts are gold, you only
 * need the 5 most recent for a weekly briefing.
 *
 * Caller is expected to pass items in publication-date desc order so
 * the cap keeps the most recent ones.
 */
export interface BatchCleanResult {
    readonly kept: ReadonlyArray<CleanInputItem>;
    readonly rejections: Readonly<Record<CleanRejection, number>>;
    readonly capped: number;
}

export function cleanFeedBatch(
    items: ReadonlyArray<CleanInputItem>,
    perEntityCap: number = PER_ENTITY_ITEM_CAP
): BatchCleanResult {
    const kept: CleanInputItem[] = [];
    const rejections: Record<CleanRejection, number> = {
        empty_title: 0,
        empty_body: 0,
        body_too_short: 0,
        marketing_fluff: 0,
        no_url: 0
    };
    let capped = 0;
    for (const it of items) {
        if (kept.length >= perEntityCap) {
            capped += 1;
            continue;
        }
        const outcome = cleanFeedItem(it);
        if (outcome.kind === "keep") {
            kept.push(outcome.item);
        } else {
            rejections[outcome.reason] += 1;
        }
    }
    return { kept, rejections, capped };
}

// ─── Discovered-feeds cache shape ──────────────────────────────

export interface CachedFeed {
    readonly url: string;
    readonly kind: "rss" | "atom" | "unknown";
    readonly last_validated_at: string;
    readonly last_fetched_at: string | null;
    readonly fetch_failures: number;
}

/** Lives under `briefing_watchlist_entities.data.discovered_feeds`. */
export interface DiscoveredFeedsCache {
    readonly discovered_feeds?: ReadonlyArray<CachedFeed>;
    readonly last_discovery_at?: string;
}

const REVALIDATE_AFTER_DAYS = 7;

/**
 * Whether the cached discovery is fresh enough to skip re-probing.
 * Re-probe weekly even on hits, in case the company changed feed paths.
 */
export function cacheNeedsRefresh(
    cache: DiscoveredFeedsCache | null,
    now: Date = new Date()
): boolean {
    if (!cache || !cache.last_discovery_at) return true;
    const t = new Date(cache.last_discovery_at).getTime();
    if (!Number.isFinite(t)) return true;
    const ageDays = (now.getTime() - t) / (24 * 60 * 60 * 1000);
    return ageDays >= REVALIDATE_AFTER_DAYS;
}

/** Cap how many discovered feeds we'll cache per entity (avoid blowup on aggregators). */
export const MAX_CACHED_FEEDS_PER_ENTITY = 4;
