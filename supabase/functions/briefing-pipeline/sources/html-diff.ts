/**
 * HTML diff / page snapshot fetcher (B.1c — the sixth source).
 *
 * For each URL the operator wants to watch, fetch the page, strip
 * HTML to text, SHA-256 the result, compare against the stored
 * snapshot in briefing_html_snapshots. Three cases:
 *
 *   1. No prior snapshot for this (workspace, url) — INSERT the
 *      baseline, emit nothing. The first fetch of a watched URL
 *      is silent; there's no "change" to report until run 2.
 *
 *   2. Prior snapshot exists AND hash matches — UPDATE last_seen_at,
 *      emit nothing. Page is steady.
 *
 *   3. Prior snapshot exists AND hash differs — UPDATE the row
 *      (new hash, new text, new last_changed_at) AND emit a RawItem
 *      to briefing_raw_items with the diff context.
 *
 * URLs to watch come from HydratedContext.tracked_urls — a reserved
 * extension slot (parallel to github_repos). No adapter populates it
 * yet, so the fetcher no-ops gracefully. When an adapter eventually
 * surfaces tracked URLs (per ICP + competitive set + operator-curated
 * watch list), this fetcher activates without any code change.
 *
 * Reference:
 *   deliverables/specs/briefing/01-build-phase-plan.md §B.1
 *   deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §3.1
 *     (Wayback Machine row — same problem, different storage choice)
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { httpGet, sha256Hex, stripHtmlToText } from "./_shared.ts";

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
    /** Reserved extension slot — populated by future adapter work. */
    readonly tracked_urls?: ReadonlyArray<string>;
    readonly workspace_id?: string;
}

interface UrlFetchResult {
    readonly item: RawItem | null;
    readonly error: string | null;
}

const SOURCE_ID = "html_diff";
const MAX_URLS = 20;

export const htmlDiffSource = {
    id: SOURCE_ID,
    fetch: async (
        ctx: HydratedContext,
        nowIso: string,
        sb?: SupabaseClient
    ): Promise<FetchResult> => {
        // The fetcher needs the supabase client to read/write
        // snapshots. The orchestrator passes it as the third arg; if
        // it's missing (defensive — shouldn't happen at runtime), the
        // fetcher reports the gap upstream rather than crashing.
        if (!sb) {
            return {
                items: [],
                error:
                    "html-diff: SupabaseClient not provided to fetcher; pipeline wiring is broken"
            };
        }
        const workspaceId = ctx.workspace_id;
        if (!workspaceId) {
            return {
                items: [],
                error:
                    "html-diff: HydratedContext missing workspace_id; can't scope snapshot reads/writes"
            };
        }

        const urls = buildUrlList(ctx);
        if (urls.length === 0) {
            return { items: [], error: null };
        }

        const perUrl = await Promise.allSettled(
            urls.map(async (url) =>
                processUrl(sb, workspaceId, url, nowIso)
            )
        );

        const out: RawItem[] = [];
        const errors: string[] = [];
        for (const result of perUrl) {
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

function buildUrlList(ctx: HydratedContext): ReadonlyArray<string> {
    const raw = ctx.tracked_urls;
    if (!Array.isArray(raw)) return [];
    const cleaned = raw
        .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//i.test(u));
    return Array.from(new Set(cleaned)).slice(0, MAX_URLS);
}

async function processUrl(
    sb: SupabaseClient,
    workspaceId: string,
    url: string,
    nowIso: string
): Promise<UrlFetchResult> {
    // Fetch the page.
    const fetchResult = await httpGet(url, {
        Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    });
    if (!fetchResult.ok) {
        return {
            item: null,
            error: `url=${url}: ${fetchResult.error ?? `HTTP ${fetchResult.status}`}`
        };
    }

    // Strip + hash.
    const text = stripHtmlToText(fetchResult.text);
    const hash = await sha256Hex(text);

    // Look up the prior snapshot.
    const prior = await sb
        .from("briefing_html_snapshots")
        .select("id, content_hash, char_count, first_seen_at, last_changed_at")
        .eq("workspace_id", workspaceId)
        .eq("url", url)
        .maybeSingle();

    if (prior.error) {
        return {
            item: null,
            error: `url=${url}: snapshot-read failed: ${prior.error.message}`
        };
    }

    // Case 1: no prior snapshot — establish baseline, emit nothing.
    if (!prior.data) {
        const insert = await sb.from("briefing_html_snapshots").insert({
            workspace_id: workspaceId,
            url,
            content_hash: hash,
            text_content: text,
            char_count: text.length,
            first_seen_at: nowIso,
            last_seen_at: nowIso,
            last_changed_at: null
        });
        if (insert.error) {
            return {
                item: null,
                error: `url=${url}: baseline-insert failed: ${insert.error.message}`
            };
        }
        return { item: null, error: null };
    }

    const priorRow = prior.data as {
        id: string;
        content_hash: string;
        char_count: number;
        first_seen_at: string;
        last_changed_at: string | null;
    };

    // Case 2: hash matches — page is steady. Bump last_seen_at.
    if (priorRow.content_hash === hash) {
        const upd = await sb
            .from("briefing_html_snapshots")
            .update({ last_seen_at: nowIso })
            .eq("id", priorRow.id);
        if (upd.error) {
            return {
                item: null,
                error: `url=${url}: last_seen update failed: ${upd.error.message}`
            };
        }
        return { item: null, error: null };
    }

    // Case 3: hash differs — page changed. Update snapshot + emit RawItem.
    const upd = await sb
        .from("briefing_html_snapshots")
        .update({
            content_hash: hash,
            text_content: text,
            char_count: text.length,
            last_seen_at: nowIso,
            last_changed_at: nowIso
        })
        .eq("id", priorRow.id);
    if (upd.error) {
        return {
            item: null,
            error: `url=${url}: change-update failed: ${upd.error.message}`
        };
    }

    const charDelta = text.length - priorRow.char_count;
    const charDeltaStr =
        charDelta > 0 ? `+${charDelta}` : String(charDelta);
    const urlSlug = url.replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 80);
    const dayStamp = nowIso.slice(0, 10).replace(/-/g, "");

    const item: RawItem = {
        source_id: SOURCE_ID,
        external_id: `htmldiff_${urlSlug}_${dayStamp}`,
        title: `Page change: ${url}`,
        body: `Text content changed (${charDeltaStr} chars). Last changed ${
            priorRow.last_changed_at ?? priorRow.first_seen_at
        }; now ${nowIso}.`,
        url,
        published_date: nowIso,
        data: {
            url,
            prior_hash: priorRow.content_hash,
            current_hash: hash,
            prior_char_count: priorRow.char_count,
            current_char_count: text.length,
            char_delta: charDelta,
            first_seen_at: priorRow.first_seen_at,
            prior_last_changed_at: priorRow.last_changed_at
        }
    };
    return { item, error: null };
}
