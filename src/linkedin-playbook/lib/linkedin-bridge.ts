import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type {
    ActionEntry,
    ActionType,
    MotionKey,
    Outcome
} from "./types";

/**
 * LinkedIn Playbook ↔ Supabase row bridge.
 *
 * Each ActionEntry becomes one row in the `sequences` table with
 * `sequence_key='linkedin'`. Top-level columns: name (account name —
 * downstream rooms can join by name without unpacking JSON), title
 * (the cue's motion label e.g. "Add air cover"). Editorial fields
 * live inside `data` jsonb so the in-memory shape can evolve without
 * a migration.
 *
 * Convention: an ActionEntry.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "li_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the ActionEntry.id is rewritten to the new uuid before
 * save resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SEQUENCE_KEY_LINKEDIN = "linkedin";

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

const ACTION_TYPES: ReadonlyArray<ActionType> = [
    "content_engage",
    "connection_request",
    "dm",
    "content_share",
    "inmail"
];
function asActionType(
    v: unknown,
    fallback: ActionType = "content_engage"
): ActionType {
    return typeof v === "string" && ACTION_TYPES.includes(v as ActionType)
        ? (v as ActionType)
        : fallback;
}

const OUTCOMES: ReadonlyArray<Outcome> = [
    "accepted",
    "replied",
    "no_response",
    "declined"
];
function asOutcome(v: unknown): Outcome | null {
    if (typeof v !== "string") return null;
    return OUTCOMES.includes(v as Outcome) ? (v as Outcome) : null;
}

const TEMPERATURES = ["ice_cold", "cool", "warm", "hot"] as const;
type Temperature = (typeof TEMPERATURES)[number];
function asTemperature(
    v: unknown,
    fallback: Temperature = "cool"
): Temperature {
    return typeof v === "string" && TEMPERATURES.includes(v as Temperature)
        ? (v as Temperature)
        : fallback;
}

const MOTION_KEYS: ReadonlyArray<MotionKey> = [
    "credibility",
    "warm_signal_account",
    "convert_connection",
    "add_air_cover"
];
function asMotionKey(
    v: unknown,
    fallback: MotionKey = "credibility"
): MotionKey {
    return typeof v === "string" && MOTION_KEYS.includes(v as MotionKey)
        ? (v as MotionKey)
        : fallback;
}

export function rowToAction(
    row:
        | Row<"sequences">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): ActionEntry | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"sequences">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    if (r.sequence_key !== SEQUENCE_KEY_LINKEDIN) return null;

    const data = asObject(r.data) ?? {};
    const accountName = asString(r.name) || asString(data["accountName"]);
    const createdAt = asString(r.created_at) || new Date().toISOString();

    return {
        id,
        accountName,
        contactName: asString(data["contactName"]),
        actionType: asActionType(data["actionType"]),
        temperature: asTemperature(data["temperature"]),
        content: asString(data["content"]),
        motionKey: asMotionKey(data["motionKey"]),
        motionLabel: asString(r.title) || asString(data["motionLabel"]),
        cueLabel: asString(data["cueLabel"]),
        whyNow: asString(data["whyNow"]),
        recommendedNext: asString(data["recommendedNext"]),
        outcome: asOutcome(data["outcome"]),
        outcomeDate: asString(data["outcomeDate"]) || null,
        createdAt
    };
}

export function rowsToActions(
    rows: ReadonlyArray<Row<"sequences">>
): ReadonlyArray<ActionEntry> {
    return rows
        .map(rowToAction)
        .filter((a): a is ActionEntry => a !== null);
}

export function extractDataBlob(entry: ActionEntry): Record<string, unknown> {
    return {
        accountName: entry.accountName,
        contactName: entry.contactName,
        actionType: entry.actionType,
        temperature: entry.temperature,
        content: entry.content,
        motionKey: entry.motionKey,
        motionLabel: entry.motionLabel,
        cueLabel: entry.cueLabel,
        whyNow: entry.whyNow,
        recommendedNext: entry.recommendedNext,
        outcome: entry.outcome,
        outcomeDate: entry.outcomeDate
    };
}

function deriveTitle(motionLabel: string, actionType: ActionType): string {
    const lbl = motionLabel.trim();
    if (lbl) return lbl.slice(0, 200);
    return `LinkedIn ${actionType}`;
}

export function actionToInsert(
    entry: ActionEntry
): InsertRow<"sequences"> {
    const title = deriveTitle(entry.motionLabel, entry.actionType);
    return {
        sequence_key: SEQUENCE_KEY_LINKEDIN,
        name: entry.accountName || title,
        title,
        data: extractDataBlob(entry) as Json
    };
}

export function actionToUpdate(
    entry: ActionEntry
): UpdateRow<"sequences"> {
    const title = deriveTitle(entry.motionLabel, entry.actionType);
    return {
        sequence_key: SEQUENCE_KEY_LINKEDIN,
        name: entry.accountName || title,
        title,
        data: extractDataBlob(entry) as Json
    };
}
