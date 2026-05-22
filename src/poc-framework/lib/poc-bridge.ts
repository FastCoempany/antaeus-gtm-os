import type {
    InsertRow,
    Json,
    ProofOutcomeState,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type {
    DurationDays,
    LinkedDealSummary,
    Outcome,
    Proof,
    ProofDocs,
    QualityBand
} from "./types";

/**
 * PoC Framework ↔ Supabase row bridge.
 *
 * Translates between the in-memory `Proof` shape (account + vendor
 * + readout owner + duration + outcome + criteria + boundaries +
 * quality + docs + linkedDealName) and the `proofs` Postgres row.
 *
 * Top-level columns: claim (success criteria one-liner), claim_owner
 * (readout owner), success_metric (success criteria full text),
 * kill_rule (boundaries), outcome_state (mapped from in-memory
 * Outcome), duration_days (7|14), deal_id (linkedDealId or null —
 * NULL when the legacy id isn't a uuid yet). Editorial fields
 * (account name, vendor, linkedDealName, qualityScore, qualityBand,
 * docs, updatedAt-ish) live inside `data` jsonb.
 *
 * Convention: a Proof.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "poc_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the Proof.id is rewritten to the new uuid before save
 * resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a Proof id looks like a real Supabase row uuid. */
export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

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

/** In-memory Outcome → Supabase ProofOutcomeState. */
export function outcomeToState(o: Outcome): ProofOutcomeState {
    if (o === "converted") return "passed";
    if (o === "failed") return "failed";
    if (o === "in_progress") return "open";
    return "open";
}

/** Supabase ProofOutcomeState → in-memory Outcome.
 *
 * Accepts `string | null | undefined` because the regen types
 * outcome_state as a plain `string` (the DB column is text, not a
 * Postgres enum). Unknown values fall through to "not_started" so
 * malformed rows from a future schema change don't throw.
 */
export function stateToOutcome(
    s: ProofOutcomeState | string | null | undefined
): Outcome {
    if (s === "passed") return "converted";
    if (s === "failed") return "failed";
    if (s === "abandoned") return "failed";
    if (s === "open") return "in_progress";
    return "not_started";
}

function asDuration(v: unknown): DurationDays {
    return v === 14 ? 14 : 7;
}

function asBand(v: unknown): QualityBand {
    return v === "ready" || v === "workable" ? v : "thin";
}

function parseDocs(v: unknown): ProofDocs {
    const o = asObject(v);
    if (!o) {
        return { scope: "", kickoff: "", readout: "", email: "" };
    }
    return {
        scope: asString(o["scope"]),
        kickoff: asString(o["kickoff"]),
        readout: asString(o["readout"]),
        email: asString(o["email"])
    };
}

/**
 * Hydrate a Proof from a Supabase row. Returns null when the row
 * is malformed (missing id) so callers can `.filter(Boolean)`.
 */
export function rowToProof(
    row:
        | Row<"proofs">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Proof | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"proofs">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;

    const data = asObject(r.data) ?? {};
    const updatedAt =
        asString(r.updated_at) ||
        asString(r.created_at) ||
        new Date().toISOString();

    return {
        id,
        account: asString(data["account"]),
        vendor: asString(data["vendor"]),
        readoutOwner: asString(r.claim_owner) || asString(data["readoutOwner"]),
        linkedDealId: asString(r.deal_id),
        linkedDealName: asString(data["linkedDealName"]),
        durationDays: asDuration(r.duration_days ?? data["durationDays"]),
        outcome: stateToOutcome(r.outcome_state),
        successCriteria:
            asString(r.success_metric) || asString(data["successCriteria"]),
        boundaries: asString(r.kill_rule) || asString(data["boundaries"]),
        qualityScore: asNumber(data["qualityScore"]),
        qualityBand: asBand(data["qualityBand"]),
        docs: parseDocs(data["docs"]),
        updatedAt
    };
}

export function rowsToProofs(
    rows: ReadonlyArray<Row<"proofs">>
): ReadonlyArray<Proof> {
    return rows.map(rowToProof).filter((p): p is Proof => p !== null);
}

/**
 * Build the `data` jsonb blob — everything that isn't a top-level
 * column. Pure function, exported for tests.
 */
export function extractDataBlob(proof: Proof): Record<string, unknown> {
    return {
        account: proof.account,
        vendor: proof.vendor,
        readoutOwner: proof.readoutOwner,
        linkedDealName: proof.linkedDealName,
        durationDays: proof.durationDays,
        qualityScore: proof.qualityScore,
        qualityBand: proof.qualityBand,
        docs: proof.docs,
        successCriteria: proof.successCriteria,
        boundaries: proof.boundaries
    };
}

/**
 * Build a one-line claim from the proof's success criteria. Used as
 * the top-level `claim` column so a SQL listing can show the proof's
 * headline without unpacking the JSON.
 */
function deriveClaim(
    successCriteria: string,
    account: string,
    vendor: string
): string {
    const trimmed = successCriteria.trim();
    if (trimmed) {
        const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
        return firstLine.slice(0, 200);
    }
    if (account && vendor) return `${vendor} pilot at ${account}`;
    if (account) return `Pilot at ${account}`;
    return "Untitled pilot";
}

/**
 * Translate an in-memory Proof → Insert row. Drops the Proof.id from
 * the insert payload — Supabase generates the canonical uuid on
 * insert. Sets deal_id only when linkedDealId is a uuid (legacy ids
 * stay null until the linked deal itself is migrated).
 */
export function proofToInsert(proof: Proof): InsertRow<"proofs"> {
    const insert: InsertRow<"proofs"> = {
        claim: deriveClaim(proof.successCriteria, proof.account, proof.vendor),
        claim_owner: proof.readoutOwner || null,
        success_metric: proof.successCriteria || null,
        kill_rule: proof.boundaries || null,
        outcome_state: outcomeToState(proof.outcome),
        duration_days: proof.durationDays,
        data: extractDataBlob(proof) as Json
    };
    if (proof.linkedDealId && looksLikePersistedId(proof.linkedDealId)) {
        insert.deal_id = proof.linkedDealId;
    }
    return insert;
}

/**
 * Translate an in-memory Proof → Update row.
 */
export function proofToUpdate(proof: Proof): UpdateRow<"proofs"> {
    return {
        deal_id:
            proof.linkedDealId && looksLikePersistedId(proof.linkedDealId)
                ? proof.linkedDealId
                : null,
        claim: deriveClaim(proof.successCriteria, proof.account, proof.vendor),
        claim_owner: proof.readoutOwner || null,
        success_metric: proof.successCriteria || null,
        kill_rule: proof.boundaries || null,
        outcome_state: outcomeToState(proof.outcome),
        duration_days: proof.durationDays,
        data: extractDataBlob(proof) as Json
    };
}

/** Re-export for tests. */
export type { LinkedDealSummary };
