/**
 * Source: Owned-Content RSS (B.4d sub-track).
 *
 * For each watched entity with a known domain, discover its RSS/Atom
 * feeds and ingest the most recent posts as briefing raw items.
 *
 * The Briefing's substrate was starved before this lit — patterns
 * synthesized from the same Signal-Console + TC + HN material every
 * week. First-party publishing channels (company blogs, resources,
 * podcasts, customer-stories, press) give the pipeline person-level
 * material the LLM can attribute to specific executives at named
 * accounts, sharpening every downstream stage.
 *
 * Auto-discovery (the operator never types a feed URL):
 *   1. Cache check: if last_discovery_at < 7 days ago + feeds exist,
 *      use the cached URLs.
 *   2. Otherwise fetch https://<domain>/ and parse <link rel="alternate"
 *      type="application/(rss|atom)+xml"> from the head.
 *   3. If none advertised, probe an ordered list of common paths
 *      (/blog/feed, /feed.xml, /rss, ...). Take the first ~2 that
 *      parse + pass freshness (latest item within 365 days).
 *   4. Persist the discovered URLs back to the entity's
 *      `data.discovered_feeds[]` cache for the next run.
 *
 * Cleaning at ingest (BEFORE writing to briefing_raw_items):
 *   - Title required + non-empty
 *   - URL required
 *   - Body >= 120 chars (kill stubs)
 *   - No marketing-fluff title patterns ("5 tips...", "introducing our
 *     new...", "the ultimate guide to...")
 *   - Per-entity cap of 5 items per run (one chatty blog can't dominate)
 *
 * The pure cleaning + discovery logic mirrors src/briefing/lib/parsers/
 * owned-content.ts (vitest-tested). The cleanup rules + freshness
 * thresholds live there and are kept in lockstep here.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type CachedFeed,
    type CleanInputItem,
    type DiscoveredFeedLink,
    type DiscoveredFeedsCache,
    type FeedEntry,
    MAX_CACHED_FEEDS_PER_ENTITY,
    buildHomepageUrl,
    buildProbeUrls,
    cacheNeedsRefresh,
    cleanFeedBatch,
    extractFeedLinksFromHtml,
    httpGet,
    normalizeDomain,
    parseAtom,
    parseRss,
    passesFeedFreshness,
    sha256Hex,
    stripHtmlToText
} from "./_shared.ts";

const SOURCE_ID = "owned_content_rss";

const MAX_ENTITIES_PER_RUN = 40;
const MAX_ITEMS_PER_FEED = 25;
const HEADERS_FEED = { Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8" };
const HEADERS_HTML = { Accept: "text/html,application/xhtml+xml" };

// ─── Public source interface ───────────────────────────────────

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

interface HydratedContextLike {
    readonly workspace_id?: string;
}

interface WatchedEntity {
    readonly id: string | null; // null for signal_console_accounts rows
    readonly name: string;
    readonly domain: string; // normalized
    readonly cache: DiscoveredFeedsCache | null;
    readonly source: "watchlist_entity" | "signal_console_account";
}

export const ownedContentRssSource = {
    id: SOURCE_ID,
    async fetch(
        ctx: HydratedContextLike,
        now: string,
        sb?: SupabaseClient
    ): Promise<FetchResult> {
        if (!sb) return { items: [], error: "no supabase client" };
        const workspaceId = ctx.workspace_id;
        if (!workspaceId) return { items: [], error: "no workspace_id" };

        const entities = await loadWatchedEntities(sb, workspaceId);
        if (entities.length === 0) {
            return { items: [], error: null };
        }

        const items: RawItem[] = [];
        const errors: string[] = [];
        for (const ent of entities.slice(0, MAX_ENTITIES_PER_RUN)) {
            try {
                const feeds = await ensureFeeds(sb, ent, now);
                if (feeds.length === 0) continue;
                const collected = await fetchFromFeeds(ent, feeds);
                items.push(...collected);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${ent.name}: ${msg}`);
            }
        }

        return {
            items,
            error: errors.length === 0 ? null : `${errors.length} entity errors: ${errors.slice(0, 3).join("; ")}`
        };
    }
};

// ─── Entity loading ────────────────────────────────────────────

async function loadWatchedEntities(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WatchedEntity[]> {
    const out = new Map<string, WatchedEntity>(); // dedupe by normalized domain
    // briefing_watchlist_entities (operator-named, includes periphery-promoted)
    const we = await sb
        .from("briefing_watchlist_entities")
        .select("id, entity_name, domain, data")
        .eq("workspace_id", workspaceId)
        .eq("status", "watched")
        .not("domain", "is", null);
    if (!we.error && we.data) {
        for (const row of we.data as Array<any>) {
            const domain = normalizeDomain(String(row.domain ?? ""));
            if (!domain || out.has(domain)) continue;
            out.set(domain, {
                id: String(row.id),
                name: String(row.entity_name ?? domain),
                domain,
                cache: extractCache(row.data),
                source: "watchlist_entity"
            });
        }
    }
    // signal_console_accounts (de-facto baseline watchlist; competitors only
    // for now — those are the entities with publishing channels we want to
    // observe most closely)
    const sc = await sb
        .from("signal_console_accounts")
        .select("account_name, domain, relationship_type, data")
        .eq("workspace_id", workspaceId)
        .not("domain", "is", null);
    if (!sc.error && sc.data) {
        for (const row of sc.data as Array<any>) {
            const rel = String(row.relationship_type ?? "");
            if (rel !== "competitor" && rel !== "partner") continue;
            const domain = normalizeDomain(String(row.domain ?? ""));
            if (!domain || out.has(domain)) continue;
            out.set(domain, {
                id: null,
                name: String(row.account_name ?? domain),
                domain,
                cache: extractCache(row.data),
                source: "signal_console_account"
            });
        }
    }
    return Array.from(out.values());
}

function extractCache(data: unknown): DiscoveredFeedsCache | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const last = typeof d["last_discovery_at"] === "string" ? d["last_discovery_at"] : undefined;
    const list = Array.isArray(d["discovered_feeds"])
        ? (d["discovered_feeds"] as Array<any>).filter(
              (f) => f && typeof f.url === "string"
          ).map((f) => ({
              url: String(f.url),
              kind: f.kind === "atom" ? "atom" : f.kind === "rss" ? "rss" : "unknown",
              last_validated_at: typeof f.last_validated_at === "string" ? f.last_validated_at : "",
              last_fetched_at: typeof f.last_fetched_at === "string" ? f.last_fetched_at : null,
              fetch_failures: typeof f.fetch_failures === "number" ? f.fetch_failures : 0
          } as CachedFeed))
        : undefined;
    if (!last && !list) return null;
    return { last_discovery_at: last, discovered_feeds: list };
}

// ─── Feed discovery ────────────────────────────────────────────

async function ensureFeeds(
    sb: SupabaseClient,
    ent: WatchedEntity,
    now: string
): Promise<ReadonlyArray<CachedFeed>> {
    // Cache hit: less than 7 days old + at least one feed present.
    if (
        ent.cache &&
        !cacheNeedsRefresh(ent.cache) &&
        ent.cache.discovered_feeds &&
        ent.cache.discovered_feeds.length > 0
    ) {
        return ent.cache.discovered_feeds;
    }
    // Cache miss / stale: re-discover.
    const discovered = await discoverFeeds(ent.domain);
    const cached: CachedFeed[] = discovered.slice(0, MAX_CACHED_FEEDS_PER_ENTITY).map((f) => ({
        url: f.url,
        kind: f.kind,
        last_validated_at: now,
        last_fetched_at: null,
        fetch_failures: 0
    }));
    // Persist whatever we found (including zero, so we don't re-probe
    // every run for a domain that has no feeds).
    await persistDiscoveryResult(sb, ent, cached, now);
    return cached;
}

async function discoverFeeds(domain: string): Promise<ReadonlyArray<DiscoveredFeedLink>> {
    const homepageUrl = buildHomepageUrl(domain);
    if (!homepageUrl) return [];
    const out: DiscoveredFeedLink[] = [];
    const seen = new Set<string>();

    // 1. Advertised feeds via <link rel="alternate">.
    const home = await httpGet(homepageUrl, HEADERS_HTML);
    if (home.ok) {
        for (const link of extractFeedLinksFromHtml(home.text, homepageUrl)) {
            if (seen.has(link.url)) continue;
            const valid = await validateFeed(link.url);
            if (valid) {
                seen.add(link.url);
                out.push({ ...link, kind: valid.kind });
                if (out.length >= MAX_CACHED_FEEDS_PER_ENTITY) return out;
            }
        }
    }

    // 2. Probe common paths.
    for (const url of buildProbeUrls(domain)) {
        if (seen.has(url)) continue;
        const valid = await validateFeed(url);
        if (valid) {
            seen.add(url);
            out.push({ url, kind: valid.kind, title: null });
            if (out.length >= MAX_CACHED_FEEDS_PER_ENTITY) return out;
        }
    }
    return out;
}

async function validateFeed(url: string): Promise<{ kind: "rss" | "atom" } | null> {
    const r = await httpGet(url, HEADERS_FEED);
    if (!r.ok || r.text.length === 0) return null;
    let entries: ReadonlyArray<FeedEntry> = [];
    let kind: "rss" | "atom" = "rss";
    // Heuristic: try both parsers; whichever yields entries wins. RSS
    // first because most company blogs publish RSS.
    entries = parseRss(r.text);
    if (entries.length === 0) {
        entries = parseAtom(r.text);
        if (entries.length === 0) return null;
        kind = "atom";
    }
    if (!passesFeedFreshness(entries.map((e) => ({ published_date: e.published_date })))) {
        return null;
    }
    return { kind };
}

async function persistDiscoveryResult(
    sb: SupabaseClient,
    ent: WatchedEntity,
    cached: ReadonlyArray<CachedFeed>,
    now: string
): Promise<void> {
    // Only the watchlist_entity source is updatable from here — we don't
    // write back into signal_console_accounts (that table belongs to the
    // Signal Console room).
    if (ent.source !== "watchlist_entity" || !ent.id) return;
    const patch = {
        data: {
            ...(ent.cache ?? {}),
            discovered_feeds: cached,
            last_discovery_at: now
        } as unknown as never
    };
    const r = await sb
        .from("briefing_watchlist_entities")
        .update(patch)
        .eq("id", ent.id);
    if (r.error) {
        console.error("[owned-content] persist discovery failed:", r.error);
    }
}

// ─── Item fetch + clean ────────────────────────────────────────

async function fetchFromFeeds(
    ent: WatchedEntity,
    feeds: ReadonlyArray<CachedFeed>
): Promise<ReadonlyArray<RawItem>> {
    const allInputs: CleanInputItem[] = [];
    const feedMeta: Array<{ url: string; kind: string }> = [];
    for (const feed of feeds) {
        const r = await httpGet(feed.url, HEADERS_FEED);
        if (!r.ok || r.text.length === 0) continue;
        let entries: ReadonlyArray<FeedEntry> = [];
        if (feed.kind === "atom") entries = parseAtom(r.text);
        else entries = parseRss(r.text);
        if (entries.length === 0 && feed.kind !== "atom") {
            // Fallback: re-try as atom in case the kind was wrong.
            entries = parseAtom(r.text);
        }
        // Most-recent first; cap per feed before merging.
        const capped = entries.slice(0, MAX_ITEMS_PER_FEED);
        for (const e of capped) {
            allInputs.push({
                title: e.title,
                body: e.summary ? stripHtmlToText(e.summary) : null,
                url: e.link,
                published_date: e.published_date
            });
        }
        feedMeta.push({ url: feed.url, kind: feed.kind });
    }
    // Apply cleaning + per-entity cap.
    const cleaned = cleanFeedBatch(allInputs);
    const out: RawItem[] = [];
    for (const item of cleaned.kept) {
        const externalId = await sha256Hex(`${SOURCE_ID}:${ent.domain}:${item.url ?? item.title}`);
        out.push({
            source_id: SOURCE_ID,
            external_id: externalId.slice(0, 24),
            title: item.title,
            body: item.body,
            url: item.url,
            published_date: item.published_date,
            data: {
                origin: "owned_content_rss",
                entity_name: ent.name,
                entity_domain: ent.domain,
                entity_source: ent.source,
                feed_count: feedMeta.length,
                rejection_summary: cleaned.rejections,
                capped: cleaned.capped
            }
        });
    }
    return out;
}
