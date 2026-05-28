/**
 * Source: Podcast Guest Appearances (Family 2 of the source expansion
 * track).
 *
 * For a curated list of industry-relevant podcasts (PODCAST_FEEDS in
 * ./podcast-feeds.config.ts), fetch each one's RSS feed and scan
 * recent episodes for mentions of any watched entity. When a match
 * hits, emit a raw item attributing the episode to that entity.
 *
 * This source is the "third-party stages" side of the person-level
 * signal stack — what people at target companies say in someone else's
 * house. Family 1 (owned-content-rss) handles their own house.
 *
 * Pure logic lives in ./_shared.ts (mirrored from
 * src/briefing/lib/parsers/podcast-guests.ts, vitest-tested).
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type FeedEntry,
    type PodcastInputItem,
    type WatchedEntityRef,
    cleanEpisodeBatch,
    extractGuestName,
    httpGet,
    matchEntitiesInEpisode,
    parseAtom,
    parseRss,
    sha256Hex,
    stripHtmlToText
} from "./_shared.ts";
import { PODCAST_FEEDS } from "./podcast-feeds.config.ts";

const SOURCE_ID = "podcast_guests";
const HEADERS_FEED = {
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8"
};
const MAX_EPISODES_SCANNED_PER_PODCAST = 30;

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

export const podcastGuestsSource = {
    id: SOURCE_ID,
    async fetch(
        ctx: HydratedContextLike,
        _now: string,
        sb?: SupabaseClient
    ): Promise<FetchResult> {
        if (!sb) return { items: [], error: "no supabase client" };
        const workspaceId = ctx.workspace_id;
        if (!workspaceId) return { items: [], error: "no workspace_id" };

        const entities = await loadWatchedEntities(sb, workspaceId);
        if (entities.length === 0) {
            // No watched entities means no possible matches; skip cleanly.
            return { items: [], error: null };
        }

        const items: RawItem[] = [];
        const errors: string[] = [];
        for (const feed of PODCAST_FEEDS) {
            try {
                const collected = await fetchPodcast(feed, entities);
                items.push(...collected);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${feed.id}: ${msg}`);
            }
        }
        return {
            items,
            error: errors.length === 0
                ? null
                : `${errors.length} podcast errors: ${errors.slice(0, 3).join("; ")}`
        };
    }
};

async function loadWatchedEntities(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WatchedEntityRef[]> {
    const out: WatchedEntityRef[] = [];
    const seen = new Set<string>(); // dedupe by lowercase name
    const push = (name: string, aliases: ReadonlyArray<string>) => {
        const key = name.trim().toLowerCase();
        if (key.length === 0 || seen.has(key)) return;
        seen.add(key);
        out.push({ name: name.trim(), aliases });
    };

    // briefing_watchlist_entities (operator-named, includes periphery-promoted)
    const we = await sb
        .from("briefing_watchlist_entities")
        .select("entity_name, entity_aliases")
        .eq("workspace_id", workspaceId)
        .eq("status", "watched");
    if (!we.error && we.data) {
        for (const row of we.data as Array<any>) {
            const name = typeof row.entity_name === "string" ? row.entity_name : "";
            const aliases = Array.isArray(row.entity_aliases)
                ? row.entity_aliases.filter((a: unknown): a is string => typeof a === "string")
                : [];
            if (name) push(name, aliases);
        }
    }
    // signal_console_accounts (de-facto baseline — competitors + partners)
    const sc = await sb
        .from("signal_console_accounts")
        .select("account_name, relationship_type")
        .eq("workspace_id", workspaceId);
    if (!sc.error && sc.data) {
        for (const row of sc.data as Array<any>) {
            const rel = String(row.relationship_type ?? "");
            if (rel !== "competitor" && rel !== "partner") continue;
            const name = typeof row.account_name === "string" ? row.account_name : "";
            if (name) push(name, []);
        }
    }
    return out;
}

async function fetchPodcast(
    feed: typeof PODCAST_FEEDS[number],
    entities: ReadonlyArray<WatchedEntityRef>
): Promise<ReadonlyArray<RawItem>> {
    const r = await httpGet(feed.rss_url, HEADERS_FEED);
    if (!r.ok || r.text.length === 0) {
        console.warn(`[podcast-guests] ${feed.id} feed unreachable: ${r.error ?? r.status}`);
        return [];
    }
    let entries: ReadonlyArray<FeedEntry> = parseRss(r.text);
    if (entries.length === 0) {
        entries = parseAtom(r.text);
        if (entries.length === 0) return [];
    }
    // Scan only the most recent episodes — older ones rarely surface
    // a watched entity in a way the operator cares about.
    const recent = entries.slice(0, MAX_EPISODES_SCANNED_PER_PODCAST);
    const inputs: PodcastInputItem[] = [];
    for (const e of recent) {
        const description = e.summary ? stripHtmlToText(e.summary) : null;
        const matched = matchEntitiesInEpisode(
            { title: e.title, description },
            entities
        );
        if (matched.length === 0) continue; // skip early — cleaner stage_log
        inputs.push({
            title: e.title,
            description,
            url: e.link,
            published_date: e.published_date,
            matched_entities: matched
        });
    }
    const cleaned = cleanEpisodeBatch(inputs);

    const out: RawItem[] = [];
    for (const item of cleaned.kept) {
        const externalId = await sha256Hex(`${SOURCE_ID}:${feed.id}:${item.url ?? item.title}`);
        out.push({
            source_id: SOURCE_ID,
            external_id: externalId.slice(0, 24),
            title: item.title,
            body: item.description,
            url: item.url,
            published_date: item.published_date,
            data: {
                origin: "podcast_guests",
                podcast_id: feed.id,
                podcast_name: feed.name,
                podcast_category: feed.category,
                podcast_rss_url: feed.rss_url,
                matched_entities: item.matched_entities,
                guest_name: extractGuestName(item.title),
                episodes_scanned: recent.length,
                rejection_summary: cleaned.rejections,
                capped: cleaned.capped
            }
        });
    }
    return out;
}
