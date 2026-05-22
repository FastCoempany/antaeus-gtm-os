import type { InsertRow, Json, Row, UpdateRow } from "@/lib/database-helpers";
import type { Signal } from "./types";

/**
 * Signals table ↔ in-memory Signal bridge.
 *
 * Step 2 (PR #140) added the `signals` Postgres table to replace the
 * nested `signal_console_accounts.data.signals[]` jsonb array.
 * Generators querying signal recency want a proper table with
 * indexed columns; reads via the `signals_with_account` view join in
 * account context inline.
 *
 * Step 3 (this PR) dual-writes: every signal added to an account
 * also lands in the signals table. The legacy in-memory shape
 * (Account.signals[]) stays as-is; the signals table is the
 * cloud-canonical copy. Step 4 will flip reads.
 *
 * In-memory Signal shape (src/signal-console/lib/types.ts) carries
 * BOTH new field names (is_ai, headline) AND legacy aliases (ai,
 * title) for forward-compat with rows captured from the pre-Phase-2
 * static-app shape. This bridge picks the new names on write +
 * accepts both on read.
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Delta 1"
 * Ref: supabase/migrations/20260522120000_signal_console_signals_table.sql
 */

function asString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumberMaybe(v: unknown): number | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

/**
 * Normalize a date-ish string to a Postgres-acceptable `timestamptz`
 * value, or return undefined when the input is unusable.
 *
 * The enrichment server emits `published_date` as a year-month string
 * (e.g. "2025-10") when the source data doesn't provide a full date —
 * that's how `enrichment-server/enrich-server.js mapSignalsToConsole`
 * falls back to `now.slice(0, 7)`. Postgres rejects partial ISO dates
 * for `timestamptz` columns with error 22007 ("invalid input syntax
 * for type timestamp with time zone").
 *
 * Handles:
 *   "2025"                    → "2025-01-01T00:00:00.000Z"
 *   "2025-10"                 → "2025-10-01T00:00:00.000Z"
 *   "2025-10-15"              → "2025-10-15T00:00:00.000Z"
 *   "2025-10-15T12:30:00Z"    → passed through verbatim (valid)
 *   "2025-10-15 12:30:00"     → expanded via Date parsing
 *   anything else / invalid   → undefined (caller omits the field)
 *
 * Discovered: 2026-05-22 during Step 3 verification. The enrichment
 * server emits `"2025-10"` for signals where the published date can't
 * be parsed off the source page, and every insert to `signals` failed
 * with 22007. Latent because PR #142 dual-write was off by default;
 * surfaced the first time the feature flag flipped on.
 */
export function normalizeTimestamptz(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Year only: "YYYY" → "YYYY-01-01T00:00:00.000Z"
    if (/^\d{4}$/.test(trimmed)) {
        return `${trimmed}-01-01T00:00:00.000Z`;
    }
    // Year-month: "YYYY-MM" → "YYYY-MM-01T00:00:00.000Z"
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
        return `${trimmed}-01T00:00:00.000Z`;
    }
    // Year-month-day: "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00.000Z"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return `${trimmed}T00:00:00.000Z`;
    }
    // Anything fuller: trust Date parsing. Catches "2025-10-15T12:30:00Z",
    // "2025-10-15 12:30:00", RFC2822, etc. Invalid → NaN → undefined.
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) return undefined;
    return new Date(parsed).toISOString();
}

/**
 * Translate a signals-table Row → in-memory Signal. Returns null on
 * malformed rows (missing id) so callers can `.filter(Boolean)`.
 *
 * Reads from both the table's top-level columns AND the `data` jsonb
 * blob, so forward-compat fields written to `data` (e.g. by a future
 * generator that captures a field not yet promoted to a column) show
 * up on the in-memory Signal.
 */
export function rowToSignal(
    row: Row<"signals"> | { id?: unknown } | null | undefined
): Signal | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"signals">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const blob = asObject(r.data) ?? {};
    const isAi = r.is_ai === true || blob["is_ai"] === true || blob["ai"] === true;
    const flagged = r.flagged === true || blob["flagged"] === true;

    const sig: Signal = {
        id,
        ...(asString(r.signal_type) ? { type: asString(r.signal_type) } : {}),
        ...(asString(r.headline) ? { headline: asString(r.headline) } : {}),
        ...(asString(r.source) ? { source: asString(r.source) } : {}),
        ...(asString(r.url) ? { url: asString(r.url) } : {}),
        ...(asString(r.published_date)
            ? { published_date: asString(r.published_date) }
            : {}),
        ...(asString(r.fetched_at)
            ? { fetched_at: asString(r.fetched_at) }
            : {}),
        ...(asString(r.captured_at)
            ? { capturedAt: asString(r.captured_at) }
            : {}),
        ...(asNumberMaybe(r.confidence) !== undefined
            ? { confidence: asNumberMaybe(r.confidence)! }
            : {}),
        ...(isAi ? { is_ai: true } : {}),
        ...(flagged ? { flagged: true } : {}),
        ...(asString(r.note) ? { note: asString(r.note) } : {})
    };
    return sig;
}

/**
 * Translate a list of signal rows → list of Signals, silently
 * dropping malformed entries.
 */
export function rowsToSignals(
    rows: ReadonlyArray<Row<"signals">>
): ReadonlyArray<Signal> {
    return rows.map(rowToSignal).filter((s): s is Signal => s !== null);
}

/**
 * Translate an in-memory Signal → Insert row for the signals table.
 *
 * `account_id` MUST be provided by the caller — it's the parent
 * account's uuid in `signal_console_accounts`. Workspace_id is left
 * for the DB default (current_user_default_workspace_id() function).
 *
 * Forward-compat: any in-memory Signal fields that don't map to a
 * top-level column land in the `data` jsonb so a future regen
 * surfacing those fields can read them back without data loss.
 */
export function signalToInsert(
    signal: Signal,
    accountId: string
): InsertRow<"signals"> {
    // Pick the canonical name (headline > legacy title), and (type > legacy cat).
    const headline = signal.headline ?? signal.title;
    const signalType = signal.type ?? signal.cat;
    const isAi = signal.is_ai === true || signal.ai === true;
    const flagged =
        signal.flagged === true ||
        (typeof signal.status === "string" && signal.status === "flagged");

    // Stash forward-compat fields (anything not promoted to a column).
    // Legacy aliases stay in data so existing rows round-trip cleanly.
    const dataBlob: Record<string, unknown> = {};
    if (signal.cat && signal.cat !== signal.type) dataBlob["cat"] = signal.cat;
    if (signal.title && signal.title !== signal.headline) {
        dataBlob["title"] = signal.title;
    }
    if (signal.status && signal.status !== "flagged") {
        dataBlob["status"] = signal.status;
    }
    if (signal.ai === true && signal.is_ai !== true) dataBlob["ai"] = true;

    // Normalize timestamptz fields — the enrichment server emits
    // partial ISO strings like "2025-10" that Postgres rejects with
    // error 22007. normalizeTimestamptz returns undefined for unusable
    // inputs so we omit the field cleanly when it can't be parsed.
    const publishedDate = normalizeTimestamptz(signal.published_date);
    const fetchedAt = normalizeTimestamptz(signal.fetched_at);
    const capturedAt = normalizeTimestamptz(signal.capturedAt);

    return {
        // id intentionally omitted — Supabase generates a uuid.
        // If the in-memory Signal already has a uuid id, the caller
        // should pass it explicitly (some flows pin the id for
        // dedupe / idempotency); we don't force it here so the DB
        // can mint one for manual adds.
        ...(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(signal.id) ? { id: signal.id } : {}),
        account_id: accountId,
        ...(signalType ? { signal_type: signalType } : {}),
        ...(headline ? { headline } : {}),
        ...(signal.source ? { source: signal.source } : {}),
        ...(signal.url ? { url: signal.url } : {}),
        ...(publishedDate ? { published_date: publishedDate } : {}),
        ...(fetchedAt ? { fetched_at: fetchedAt } : {}),
        ...(capturedAt ? { captured_at: capturedAt } : {}),
        ...(typeof signal.confidence === "number"
            ? { confidence: signal.confidence }
            : {}),
        is_ai: isAi,
        flagged,
        ...(signal.note ? { note: signal.note } : {}),
        data: dataBlob as Json
    };
}

/**
 * Translate an in-memory Signal → Update row for the signals table.
 * Operator-facing mutations are typically `flagged` toggles and
 * `note` edits; this writes all editable fields so the patch is
 * idempotent against drift.
 */
export function signalToUpdate(signal: Signal): UpdateRow<"signals"> {
    const headline = signal.headline ?? signal.title;
    const signalType = signal.type ?? signal.cat;
    const isAi = signal.is_ai === true || signal.ai === true;
    const flagged =
        signal.flagged === true ||
        (typeof signal.status === "string" && signal.status === "flagged");
    // Normalize timestamptz fields (same reasoning as signalToInsert).
    const publishedDate = normalizeTimestamptz(signal.published_date);
    const fetchedAt = normalizeTimestamptz(signal.fetched_at);
    const capturedAt = normalizeTimestamptz(signal.capturedAt);
    return {
        ...(signalType !== undefined ? { signal_type: signalType } : {}),
        ...(headline !== undefined ? { headline } : {}),
        ...(signal.source !== undefined ? { source: signal.source } : {}),
        ...(signal.url !== undefined ? { url: signal.url } : {}),
        ...(publishedDate !== undefined
            ? { published_date: publishedDate }
            : {}),
        ...(fetchedAt !== undefined ? { fetched_at: fetchedAt } : {}),
        ...(capturedAt !== undefined ? { captured_at: capturedAt } : {}),
        ...(typeof signal.confidence === "number"
            ? { confidence: signal.confidence }
            : {}),
        is_ai: isAi,
        flagged,
        ...(signal.note !== undefined ? { note: signal.note } : {})
    };
}

/**
 * True when an in-memory Signal id looks like a Supabase row uuid.
 * Used by dual-write paths to decide insert vs update.
 */
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function looksLikePersistedSignalId(id: string): boolean {
    return UUID_RE.test(id);
}
