/**
 * Source: Trust Center / sub-processor disclosure pages (Family 3 of
 * the source expansion track).
 *
 * The stable replacement for fragile "customer logo scraping." Most
 * B2B SaaS publishes a Trust Center or sub-processor list — Vanta /
 * Drata / SafeBase have made this near-conventional. For each watched
 * entity, we:
 *
 *   1. Find their Trust Center URL via the cache, then by scanning
 *      the homepage for "trust"/"sub-processor" anchors, then by
 *      probing common paths (/sub-processors, /trust, /security, ...).
 *   2. Validate the discovered URL with a "looks like a trust page"
 *      heuristic — explicit "sub-processor" language OR enough known
 *      vendor mentions to be a trust page even without the phrase.
 *   3. Cache the validated URL in
 *      briefing_watchlist_entities.data.trust_center_url. Re-probe
 *      weekly.
 *   4. Strip the page to plain text and match against KNOWN_SUBPROCESSORS
 *      (curated B2B-vendor catalog). Word-boundary regex defends
 *      against substring collisions like "Notion" in "intuition."
 *   5. Emit one raw item per (watched_entity, vendor) match with
 *      context. Per-entity cap of 10 prevents Fortune-50-sized
 *      disclosure pages from drowning the briefing.
 *
 * Pure logic lives in ./_shared.ts (mirrored from
 * src/briefing/lib/parsers/trust-center.ts, vitest-tested).
 *
 * Caching note: signal_console_accounts entities have no cache surface
 * we write to (the Signal Console room owns that table). They re-
 * discover every run — tolerated because cold-start trust-page
 * discovery is bounded by aggressive timeouts + early exit on first
 * valid URL.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type SubprocessorMatch,
    type TrustCenterCache,
    type TrustInputItem,
    buildTrustTitle,
    cleanTrustBatch,
    evaluateTrustPage,
    extractTrustLinksFromHtml,
    htmlToPlainText,
    httpGet,
    isLikelyTrustPage,
    matchSubprocessors,
    sha256Hex,
    trustCacheNeedsRefresh,
    TRUST_PROBE_PATHS
} from "./_shared.ts";
import { KNOWN_SUBPROCESSORS } from "./trust-center-vendors.config.ts";

const SOURCE_ID = "trust_center";

const MAX_ENTITIES_PER_RUN = 40;
const HEADERS_HTML = { Accept: "text/html,application/xhtml+xml" };

// Aggressive timeouts at discovery — we're probing potentially-
// unreachable domains and shouldn't burn the 150s Edge-Function
// budget on a few slow ones.
const DISCOVERY_TIMEOUT_MS = 5_000;
// Reading the (cached) trust page itself gets a slightly more
// generous budget since these are real pages with content the LLM
// downstream will consume.
const TRUST_PAGE_FETCH_TIMEOUT_MS = 8_000;

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
    readonly domain: string;
    readonly cache: TrustCenterCache | null;
    readonly source: "watchlist_entity" | "signal_console_account";
}

export const trustCenterSource = {
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
        if (entities.length === 0) return { items: [], error: null };

        const scoped = entities.slice(0, MAX_ENTITIES_PER_RUN);
        // Same parallelization shape as the Owned-Content hotfix:
        // entities run concurrently, probes inside one entity stay
        // sequential (polite to the target server).
        const settled = await Promise.allSettled(
            scoped.map(async (ent) => {
                const trustUrl = await ensureTrustUrl(sb, ent, now);
                if (!trustUrl) return [] as RawItem[];
                return collectFromTrustPage(ent, trustUrl);
            })
        );

        const items: RawItem[] = [];
        const errors: string[] = [];
        for (let i = 0; i < settled.length; i += 1) {
            const r = settled[i];
            const ent = scoped[i];
            if (!r || !ent) continue;
            if (r.status === "fulfilled") {
                items.push(...r.value);
            } else {
                const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
                errors.push(`${ent.name}: ${msg}`);
            }
        }
        return {
            items,
            error: errors.length === 0
                ? null
                : `${errors.length} entity errors: ${errors.slice(0, 3).join("; ")}`
        };
    }
};

// ─── Entity loading ────────────────────────────────────────────

async function loadWatchedEntities(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WatchedEntity[]> {
    const out = new Map<string, WatchedEntity>(); // dedupe by domain
    const we = await sb
        .from("briefing_watchlist_entities")
        .select("id, entity_name, domain, data")
        .eq("workspace_id", workspaceId)
        .eq("status", "watched")
        .not("domain", "is", null);
    if (!we.error && we.data) {
        for (const row of we.data as Array<any>) {
            const domain = normalizeTrustDomain(String(row.domain ?? ""));
            if (!domain || out.has(domain)) continue;
            out.set(domain, {
                id: String(row.id),
                name: String(row.entity_name ?? domain),
                domain,
                cache: extractTrustCache(row.data),
                source: "watchlist_entity"
            });
        }
    }
    const sc = await sb
        .from("signal_console_accounts")
        .select("account_name, domain, relationship_type, data")
        .eq("workspace_id", workspaceId)
        .not("domain", "is", null);
    if (!sc.error && sc.data) {
        for (const row of sc.data as Array<any>) {
            const rel = String(row.relationship_type ?? "");
            if (rel !== "competitor" && rel !== "partner") continue;
            const domain = normalizeTrustDomain(String(row.domain ?? ""));
            if (!domain || out.has(domain)) continue;
            out.set(domain, {
                id: null,
                name: String(row.account_name ?? domain),
                domain,
                cache: extractTrustCache(row.data),
                source: "signal_console_account"
            });
        }
    }
    return Array.from(out.values());
}

function normalizeTrustDomain(domain: string): string | null {
    const trimmed = domain.trim().toLowerCase();
    if (trimmed.length === 0) return null;
    const noProtocol = trimmed.replace(/^https?:\/\//, "");
    const noTrailing = noProtocol.replace(/\/+$/, "");
    const noWww = noTrailing.replace(/^www\./, "");
    if (!/^[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/.test(noWww)) return null;
    return noWww;
}

function extractTrustCache(data: unknown): TrustCenterCache | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const url = typeof d["trust_center_url"] === "string" ? d["trust_center_url"] : undefined;
    const validated = typeof d["trust_center_last_validated_at"] === "string"
        ? d["trust_center_last_validated_at"]
        : undefined;
    const fetched = typeof d["trust_center_last_fetched_at"] === "string"
        ? d["trust_center_last_fetched_at"]
        : null;
    if (!url && !validated) return null;
    return {
        trust_center_url: url,
        trust_center_last_validated_at: validated,
        trust_center_last_fetched_at: fetched
    };
}

// ─── Discovery ─────────────────────────────────────────────────

async function ensureTrustUrl(
    sb: SupabaseClient,
    ent: WatchedEntity,
    now: string
): Promise<string | null> {
    if (
        ent.cache &&
        !trustCacheNeedsRefresh(ent.cache) &&
        ent.cache.trust_center_url
    ) {
        return ent.cache.trust_center_url;
    }
    const url = await discoverTrustUrl(ent.domain);
    await persistTrustDiscovery(sb, ent, url, now);
    return url;
}

async function discoverTrustUrl(domain: string): Promise<string | null> {
    const homepageUrl = `https://${domain}/`;

    // 1. Homepage scan for trust-related anchors. Catches hosted trust
    //    centers (trust.foo.com, foo.vanta.com) without us needing a
    //    per-platform integration.
    const home = await httpGet(homepageUrl, HEADERS_HTML, DISCOVERY_TIMEOUT_MS);
    if (home.ok) {
        const links = extractTrustLinksFromHtml(home.text, homepageUrl);
        for (const link of links) {
            if (await validateTrustUrl(link.url)) return link.url;
        }
    }

    // 2. Probe common paths against the bare domain.
    for (const path of TRUST_PROBE_PATHS) {
        const url = `https://${domain}${path}`;
        if (await validateTrustUrl(url)) return url;
    }
    return null;
}

async function validateTrustUrl(url: string): Promise<boolean> {
    const r = await httpGet(url, HEADERS_HTML, DISCOVERY_TIMEOUT_MS);
    if (!r.ok || r.text.length === 0) return false;
    const hints = evaluateTrustPage(r.text, KNOWN_SUBPROCESSORS);
    return isLikelyTrustPage(hints);
}

async function persistTrustDiscovery(
    sb: SupabaseClient,
    ent: WatchedEntity,
    url: string | null,
    now: string
): Promise<void> {
    if (ent.source !== "watchlist_entity" || !ent.id) return;
    // Merge into existing data jsonb; preserve discovered_feeds from
    // Family 1 so we don't clobber that cache.
    const sel = await sb
        .from("briefing_watchlist_entities")
        .select("data")
        .eq("id", ent.id)
        .single();
    const existing = (sel.data?.data ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
        ...existing,
        trust_center_url: url,
        trust_center_last_validated_at: now
    };
    const upd = await sb
        .from("briefing_watchlist_entities")
        .update({ data: patch as unknown as never })
        .eq("id", ent.id);
    if (upd.error) {
        console.error("[trust-center] cache write failed:", upd.error);
    }
}

// ─── Content extraction ────────────────────────────────────────

async function collectFromTrustPage(
    ent: WatchedEntity,
    trustUrl: string
): Promise<ReadonlyArray<RawItem>> {
    const r = await httpGet(trustUrl, HEADERS_HTML, TRUST_PAGE_FETCH_TIMEOUT_MS);
    if (!r.ok || r.text.length === 0) {
        console.warn(`[trust-center] ${ent.name} trust page unreachable: ${r.error ?? r.status}`);
        return [];
    }
    const text = htmlToPlainText(r.text);
    const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
    if (matches.length === 0) return [];

    const candidateItems: TrustInputItem[] = matches.map((vendor: SubprocessorMatch) => ({
        entity_name: ent.name,
        entity_domain: ent.domain,
        trust_page_url: trustUrl,
        vendor
    }));
    const cleaned = cleanTrustBatch(candidateItems);

    const now = new Date().toISOString();
    const out: RawItem[] = [];
    for (const item of cleaned.kept) {
        const externalId = await sha256Hex(
            `${SOURCE_ID}:${ent.domain}:${item.vendor.vendor_id}`
        );
        out.push({
            source_id: SOURCE_ID,
            external_id: externalId.slice(0, 24),
            title: buildTrustTitle(item),
            body: item.vendor.context.length > 0 ? item.vendor.context : null,
            url: trustUrl,
            published_date: now, // we observed it now; trust pages don't carry their own publish date
            data: {
                origin: "trust_center",
                entity_name: ent.name,
                entity_domain: ent.domain,
                entity_source: ent.source,
                vendor_id: item.vendor.vendor_id,
                vendor_name: item.vendor.vendor_name,
                vendor_category: item.vendor.category,
                trust_page_url: trustUrl,
                rejection_summary: cleaned.rejections,
                capped: cleaned.capped
            }
        });
    }
    return out;
}
