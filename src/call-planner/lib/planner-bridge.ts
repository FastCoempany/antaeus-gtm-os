import type {
    InsertRow,
    Json,
    Row
} from "@/lib/database.types";
import type { AgendaSnapshot, PersonaKey } from "./types";

/**
 * Call Planner ↔ Supabase row bridge.
 *
 * Each saved agenda becomes one row in the `discovery_call_logs`
 * table with `log_type='discovery-agenda'`. Top-level columns:
 * summary (one-line agenda label combining account + persona).
 * Editorial fields live inside `data` jsonb (the full AgendaSnapshot).
 *
 * Unlike the Cold Call bridge, Call Planner doesn't carry a Snapshot
 * id — every save creates a new row. The cloud thus accumulates an
 * audit trail; the in-memory state holds only the current draft.
 */

export const LOG_TYPE_DISCOVERY_AGENDA = "discovery-agenda";

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

const PERSONA_KEYS: ReadonlyArray<PersonaKey> = [
    "cxo",
    "vp",
    "ops",
    "it",
    "finance",
    "revops"
];
function asPersona(v: unknown, fallback: PersonaKey = "cxo"): PersonaKey {
    return typeof v === "string" && PERSONA_KEYS.includes(v as PersonaKey)
        ? (v as PersonaKey)
        : fallback;
}

/**
 * Hydrate an AgendaSnapshot from a Supabase row. Returns null when
 * the row is malformed or wrong log_type so callers can `.filter`.
 */
export function rowToSnapshot(
    row:
        | Row<"discovery_call_logs">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): AgendaSnapshot | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"discovery_call_logs">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    if (r.log_type !== LOG_TYPE_DISCOVERY_AGENDA) return null;

    const data = asObject(r.data) ?? {};
    const gates = asArray(data["gates"])
        .map((g) => g === true)
        .slice();
    const gateDetails = asArray(data["gateDetails"])
        .map((g) => {
            const o = asObject(g) ?? {};
            return {
                label: asString(o["label"]),
                met: o["met"] === true,
                copy: asString(o["copy"])
            };
        })
        .slice();

    return {
        contact: asString(data["contact"]),
        company: asString(data["company"]),
        persona: asPersona(data["persona"]),
        linkedDeal: asString(data["linkedDeal"]),
        gates,
        gateDetails,
        score: asNumber(data["score"]),
        band: asString(data["band"]),
        nextMove: asString(data["nextMove"]),
        signalHeadline: asString(data["signalHeadline"]),
        customNotes: asString(data["customNotes"]),
        linkedinUrl: asString(data["linkedinUrl"]),
        preparedAt: asString(data["preparedAt"]) || asString(r.created_at)
    };
}

export function rowsToSnapshots(
    rows: ReadonlyArray<Row<"discovery_call_logs">>
): ReadonlyArray<AgendaSnapshot> {
    return rows
        .map(rowToSnapshot)
        .filter((s): s is AgendaSnapshot => s !== null);
}

export function extractDataBlob(
    snapshot: AgendaSnapshot
): Record<string, unknown> {
    return {
        contact: snapshot.contact,
        company: snapshot.company,
        persona: snapshot.persona,
        linkedDeal: snapshot.linkedDeal,
        gates: snapshot.gates,
        gateDetails: snapshot.gateDetails,
        score: snapshot.score,
        band: snapshot.band,
        nextMove: snapshot.nextMove,
        signalHeadline: snapshot.signalHeadline,
        customNotes: snapshot.customNotes,
        linkedinUrl: snapshot.linkedinUrl,
        preparedAt: snapshot.preparedAt
    };
}

function deriveSummary(snapshot: AgendaSnapshot): string {
    const company = snapshot.company.trim() || "Unknown";
    const contact = snapshot.contact.trim();
    const personaPart = contact ? `${contact} · ${snapshot.persona}` : snapshot.persona;
    return `${company} · ${personaPart} · ${snapshot.band || "thin"}`.slice(0, 200);
}

export function snapshotToInsert(
    snapshot: AgendaSnapshot
): InsertRow<"discovery_call_logs"> {
    return {
        log_type: LOG_TYPE_DISCOVERY_AGENDA,
        summary: deriveSummary(snapshot),
        data: extractDataBlob(snapshot) as Json
    };
}
