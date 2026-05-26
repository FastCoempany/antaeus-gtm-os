/**
 * Signal Console → Briefing evidence mapping (substrate read).
 *
 * Canon §4.21 designates Signal Console as the Briefing's data
 * substrate — "accounts, signals, heat all live in
 * signal_console_accounts + signals". The Briefing reads competitor
 * accounts for the watchlist; this maps the SIGNALS attached to those
 * accounts into briefing raw items so the operator's curated
 * competitive intelligence becomes evidence the pipeline can cluster
 * and synthesize. The Briefing only reads; it never writes back.
 *
 * Each signal's editorial outlet (TechCrunch, Reuters, …) becomes the
 * raw item's source_id, prefixed `sc:` — so two outlets reporting the
 * same event count as two distinct sources in the cluster evidence
 * gates, and the `sc:` prefix routes to a high-confidence source
 * config (operator-curated intel is low-volume + high-reliability).
 *
 * Canonical reference + vitest-tested. The Deno mirror in
 * supabase/functions/briefing-pipeline/sources/_shared.ts keeps a
 * verbatim copy — same Node/Deno split as the other parsers.
 */

/** A signal row joined to its account, as read from Supabase. */
export interface SignalConsoleSignal {
    readonly id: string;
    readonly headline: string | null;
    readonly source: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly fetched_at: string | null;
    readonly captured_at: string | null;
    readonly signal_type: string | null;
    readonly note: string | null;
    readonly confidence: number | null;
    readonly is_ai: boolean | null;
    readonly flagged: boolean | null;
    readonly account_name: string | null;
    readonly relationship_type: string | null;
}

/** Briefing raw-item shape (mirrors the orchestrator's RawItem). */
export interface SignalRawItem {
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly data: Record<string, unknown>;
}

/**
 * Normalize an editorial source name into a stable source_id slug,
 * prefixed `sc:`. "TechCrunch" → "sc:techcrunch"; "PE Hub" →
 * "sc:pe-hub"; empty/missing → "sc:unknown".
 */
export function normalizeSignalSource(source: string | null | undefined): string {
    const raw = typeof source === "string" ? source.trim().toLowerCase() : "";
    const slug = raw
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `sc:${slug.length > 0 ? slug : "unknown"}`;
}

/**
 * Map one signal into a briefing raw item. Returns null when the
 * signal can't be evidence (no headline, or flagged/dismissed).
 */
export function mapSignalToRawItem(
    signal: SignalConsoleSignal
): SignalRawItem | null {
    if (signal.flagged === true) return null;
    const title = (signal.headline ?? "").trim();
    if (title.length === 0) return null;

    const account = (signal.account_name ?? "").trim();
    // Give the enricher account context so entity extraction attributes
    // the signal to the right company. The note (if any) follows.
    const bodyParts: string[] = [];
    if (account.length > 0) {
        bodyParts.push(`Account: ${account} (competitor in the operator's watchlist).`);
    }
    if (signal.signal_type && signal.signal_type.trim().length > 0) {
        bodyParts.push(`Signal type: ${signal.signal_type.trim()}.`);
    }
    if (signal.note && signal.note.trim().length > 0) {
        bodyParts.push(signal.note.trim());
    }
    const body = bodyParts.length > 0 ? bodyParts.join(" ") : null;

    const published =
        signal.published_date ?? signal.fetched_at ?? signal.captured_at ?? null;

    return {
        source_id: normalizeSignalSource(signal.source),
        external_id: `signal:${signal.id}`,
        title,
        body,
        url: signal.url && signal.url.trim().length > 0 ? signal.url.trim() : null,
        published_date: published,
        data: {
            signal_id: signal.id,
            account_name: account.length > 0 ? account : null,
            signal_type: signal.signal_type ?? null,
            editorial_source: signal.source ?? null,
            confidence: typeof signal.confidence === "number" ? signal.confidence : null,
            is_ai: signal.is_ai === true,
            relationship_type: signal.relationship_type ?? null,
            origin: "signal_console"
        }
    };
}
