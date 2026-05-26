/**
 * Source: Signal Console signals (substrate read).
 *
 * Reads the signals attached to the workspace's COMPETITOR-flagged
 * accounts and emits them as briefing raw items. This is the Briefing
 * reading its data substrate per canon §4.21 — the operator's curated
 * competitive intelligence (the Deel/Rippling/Remote intel they track
 * in Signal Console) becomes evidence the pipeline clusters and
 * synthesizes. Read-only; the Briefing never writes to Signal Console
 * tables.
 *
 * Each signal's editorial outlet becomes its source_id (`sc:<outlet>`)
 * so two outlets reporting one event count as two distinct sources in
 * the cluster gates, and the `sc:` prefix routes to the curated
 * high-confidence source config.
 *
 * The pure mapping (mapSignalToRawItem) lives in ./_shared.ts, mirrored
 * from the vitest-tested canonical src/briefing/lib/parsers/signal-console.ts.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type SignalConsoleSignal,
    type SignalRawItem,
    mapSignalToRawItem
} from "./_shared.ts";

const SOURCE_ID = "signal_console";

// Look back far enough to catch the competitive narrative; recency
// weighting in the cluster math handles older items' lower value.
const LOOKBACK_DAYS = 180;
const MAX_SIGNALS = 80;

interface HydratedContextLike {
    readonly workspace_id?: string;
}

interface FetchResult {
    readonly items: ReadonlyArray<SignalRawItem>;
    readonly error: string | null;
}

export const signalConsoleSource = {
    id: SOURCE_ID,
    async fetch(
        ctx: HydratedContextLike,
        _now: string,
        sb?: SupabaseClient
    ): Promise<FetchResult> {
        if (!sb) return { items: [], error: "no supabase client" };
        const workspaceId = ctx.workspace_id;
        if (!workspaceId) return { items: [], error: "no workspace_id in context" };

        const since = new Date(
            Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        // Inner-join to the account so we have account_name +
        // relationship_type; filter to competitors in code (robust
        // against embedded-filter syntax quirks).
        const result = await sb
            .from("signals")
            .select(
                "id, headline, source, url, published_date, fetched_at, captured_at, signal_type, note, confidence, is_ai, flagged, account:signal_console_accounts!inner(account_name, relationship_type)"
            )
            .eq("workspace_id", workspaceId)
            .eq("flagged", false)
            .gte("published_date", since)
            .order("published_date", { ascending: false })
            .limit(MAX_SIGNALS);

        if (result.error) {
            return { items: [], error: result.error.message };
        }

        const rows = (result.data ?? []) as Array<any>;
        const items: SignalRawItem[] = [];
        for (const row of rows) {
            const account = Array.isArray(row.account) ? row.account[0] : row.account;
            const relationship =
                account && typeof account.relationship_type === "string"
                    ? account.relationship_type
                    : null;
            // Only competitor intel feeds the Briefing's category read.
            if (relationship !== "competitor") continue;

            const signal: SignalConsoleSignal = {
                id: String(row.id),
                headline: row.headline ?? null,
                source: row.source ?? null,
                url: row.url ?? null,
                published_date: row.published_date ?? null,
                fetched_at: row.fetched_at ?? null,
                captured_at: row.captured_at ?? null,
                signal_type: row.signal_type ?? null,
                note: row.note ?? null,
                confidence: typeof row.confidence === "number" ? row.confidence : null,
                is_ai: row.is_ai === true,
                flagged: row.flagged === true,
                account_name: account && account.account_name ? account.account_name : null,
                relationship_type: relationship
            };
            const item = mapSignalToRawItem(signal);
            if (item) items.push(item);
        }

        return { items, error: null };
    }
};
