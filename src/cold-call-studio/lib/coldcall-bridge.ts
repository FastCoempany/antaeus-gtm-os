import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type { CallLogEntry, Outcome, ThreadId } from "./types";

/**
 * Cold Call Studio ↔ Supabase row bridge.
 *
 * Each CallLogEntry becomes one row in the `discovery_call_logs`
 * table with `log_type='cold-call'`. Top-level columns: summary
 * (one-line label combining outcome + thread for SQL listings).
 * Editorial fields (account, contact, thread context, buyer response,
 * notes) live inside `data` jsonb.
 *
 * Convention: a CallLogEntry.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "call_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the CallLogEntry.id is rewritten to the new uuid before
 * save resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const LOG_TYPE_COLD_CALL = "cold-call";

export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

const THREAD_IDS: ReadonlyArray<ThreadId> = [
    "prep",
    "opener",
    "pressure",
    "proof",
    "ask",
    "exit"
];
function asThreadId(v: unknown, fallback: ThreadId = "prep"): ThreadId {
    return typeof v === "string" && THREAD_IDS.includes(v as ThreadId)
        ? (v as ThreadId)
        : fallback;
}

const OUTCOMES: ReadonlyArray<Outcome> = [
    "meeting_booked",
    "callback_scheduled",
    "referral",
    "voicemail",
    "rejected",
    "hung_up",
    "no_answer",
    "logged"
];
function asOutcome(v: unknown, fallback: Outcome = "logged"): Outcome {
    return typeof v === "string" && OUTCOMES.includes(v as Outcome)
        ? (v as Outcome)
        : fallback;
}

export function rowToCallEntry(
    row:
        | Row<"discovery_call_logs">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): CallLogEntry | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"discovery_call_logs">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    if (r.log_type !== LOG_TYPE_COLD_CALL) return null;

    const data = asObject(r.data) ?? {};
    const createdAt = asString(r.created_at) || new Date().toISOString();
    return {
        id,
        accountName: asString(data["accountName"]),
        contactName: asString(data["contactName"]),
        contactTitle: asString(data["contactTitle"]),
        threadId: asThreadId(data["threadId"]),
        threadTitle: asString(data["threadTitle"]),
        buyerResponse: asString(data["buyerResponse"]),
        recommendedResponse: asString(data["recommendedResponse"]),
        outcome: asOutcome(data["outcome"]),
        notes: asString(data["notes"]),
        source: "cold-call-studio-talk-loom",
        createdAt
    };
}

export function rowsToCallEntries(
    rows: ReadonlyArray<Row<"discovery_call_logs">>
): ReadonlyArray<CallLogEntry> {
    return rows
        .map(rowToCallEntry)
        .filter((c): c is CallLogEntry => c !== null);
}

export function extractDataBlob(entry: CallLogEntry): Record<string, unknown> {
    return {
        accountName: entry.accountName,
        contactName: entry.contactName,
        contactTitle: entry.contactTitle,
        threadId: entry.threadId,
        threadTitle: entry.threadTitle,
        buyerResponse: entry.buyerResponse,
        recommendedResponse: entry.recommendedResponse,
        outcome: entry.outcome,
        notes: entry.notes,
        source: entry.source
    };
}

function deriveSummary(entry: CallLogEntry): string {
    const account = entry.accountName.trim() || "Unknown account";
    const outcome = entry.outcome;
    return `${account} · ${outcome.replace("_", " ")}`.slice(0, 200);
}

export function callEntryToInsert(
    entry: CallLogEntry
): InsertRow<"discovery_call_logs"> {
    return {
        log_type: LOG_TYPE_COLD_CALL,
        summary: deriveSummary(entry),
        data: extractDataBlob(entry) as Json
    };
}

export function callEntryToUpdate(
    entry: CallLogEntry
): UpdateRow<"discovery_call_logs"> {
    return {
        log_type: LOG_TYPE_COLD_CALL,
        summary: deriveSummary(entry),
        data: extractDataBlob(entry) as Json
    };
}
