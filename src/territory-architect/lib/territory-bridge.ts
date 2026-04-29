import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import type {
    Approach,
    DispositionState,
    TerritoryAccount,
    Thesis,
    TierId
} from "./types";

/**
 * Territory Architect ↔ Supabase row bridge.
 *
 * Three entity kinds (theses, approaches, accounts) all live in the
 * `studio_artifacts` table, discriminated by the `data.kind` field:
 *
 *   data.kind = "territory.thesis"   — strategic bet
 *   data.kind = "territory.approach" — talk-track template
 *   data.kind = "territory.account"  — tagged account
 *
 * studio_artifacts has no top-level columns beyond id / workspace_id /
 * timestamps, so everything else lives in `data`. This is the cost
 * of using a generic artifact table — but it's appropriate for
 * Territory because none of the 3 kinds have natural top-level columns
 * other rooms would join on.
 *
 * Convention: a Thesis/Approach/Account.id IS the row id (uuid) once
 * cloud-synced. Legacy localStorage rows have non-uuid ids; on first
 * sync they're inserted (Supabase generates uuid) and the in-memory
 * id is rewritten before save resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_THESIS = "territory.thesis";
export const KIND_APPROACH = "territory.approach";
export const KIND_ACCOUNT = "territory.account";
export type TerritoryKind =
    | typeof KIND_THESIS
    | typeof KIND_APPROACH
    | typeof KIND_ACCOUNT;

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

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asTier(v: unknown, fallback: TierId = "t1"): TierId {
    return v === "t1" || v === "t2" || v === "t3" || v === "t4"
        ? v
        : fallback;
}

const DISPOSITION_STATES: ReadonlyArray<DispositionState> = [
    "active",
    "paused",
    "closed-won",
    "closed-lost",
    "reroute"
];
function asDisposition(v: unknown, fallback: DispositionState = "active"): DispositionState {
    return typeof v === "string" &&
        DISPOSITION_STATES.includes(v as DispositionState)
        ? (v as DispositionState)
        : fallback;
}

/** Read the discriminator from a row's `data` blob. */
export function rowKind(row: Row<"studio_artifacts">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

// ─── Thesis ────────────────────────────────────────────────────────────

export function rowToThesis(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Thesis | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_THESIS) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) || asString(r.created_at) || createdAt;
    return {
        id,
        title: asString(data["title"]),
        pressure: asString(data["pressure"]),
        segment: asString(data["segment"]),
        whyUs: asString(data["whyUs"]),
        tier: asTier(data["tier"]),
        accountIds: asArray(data["accountIds"]).filter(
            (x): x is string => typeof x === "string"
        ),
        createdAt,
        updatedAt
    };
}

export function thesisToInsert(thesis: Thesis): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_THESIS,
            title: thesis.title,
            pressure: thesis.pressure,
            segment: thesis.segment,
            whyUs: thesis.whyUs,
            tier: thesis.tier,
            accountIds: thesis.accountIds
        } as unknown as Json
    };
}

export function thesisToUpdate(thesis: Thesis): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_THESIS,
            title: thesis.title,
            pressure: thesis.pressure,
            segment: thesis.segment,
            whyUs: thesis.whyUs,
            tier: thesis.tier,
            accountIds: thesis.accountIds
        } as unknown as Json
    };
}

// ─── Approach ──────────────────────────────────────────────────────────

export function rowToApproach(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Approach | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_APPROACH) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) || asString(r.created_at) || createdAt;
    return {
        id,
        name: asString(data["name"]),
        trigger: asString(data["trigger"]),
        script: asString(data["script"]),
        bridge: asString(data["bridge"]),
        thesisId: asString(data["thesisId"]),
        createdAt,
        updatedAt
    };
}

export function approachToInsert(
    approach: Approach
): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_APPROACH,
            name: approach.name,
            trigger: approach.trigger,
            script: approach.script,
            bridge: approach.bridge,
            thesisId: approach.thesisId
        } as unknown as Json
    };
}

export function approachToUpdate(
    approach: Approach
): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_APPROACH,
            name: approach.name,
            trigger: approach.trigger,
            script: approach.script,
            bridge: approach.bridge,
            thesisId: approach.thesisId
        } as unknown as Json
    };
}

// ─── Account ───────────────────────────────────────────────────────────

export function rowToAccount(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): TerritoryAccount | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_ACCOUNT) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) || asString(r.created_at) || createdAt;
    return {
        id,
        name: asString(data["name"]),
        tier: asTier(data["tier"]),
        thesisId: asString(data["thesisId"]),
        approachId: asString(data["approachId"]),
        disposition: asDisposition(data["disposition"]),
        notes: asString(data["notes"]),
        createdAt,
        updatedAt
    };
}

export function accountToInsert(
    account: TerritoryAccount
): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_ACCOUNT,
            name: account.name,
            tier: account.tier,
            thesisId: account.thesisId,
            approachId: account.approachId,
            disposition: account.disposition,
            notes: account.notes
        } as unknown as Json
    };
}

export function accountToUpdate(
    account: TerritoryAccount
): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_ACCOUNT,
            name: account.name,
            tier: account.tier,
            thesisId: account.thesisId,
            approachId: account.approachId,
            disposition: account.disposition,
            notes: account.notes
        } as unknown as Json
    };
}

// ─── Multi-kind partitioner ────────────────────────────────────────────

export interface PartitionedRows {
    readonly theses: ReadonlyArray<Thesis>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly accounts: ReadonlyArray<TerritoryAccount>;
}

/**
 * Walk a list of studio_artifacts rows once and bucket by kind.
 * Returns three lists; non-territory kinds are dropped silently.
 */
export function partitionTerritoryRows(
    rows: ReadonlyArray<Row<"studio_artifacts">>
): PartitionedRows {
    const theses: Thesis[] = [];
    const approaches: Approach[] = [];
    const accounts: TerritoryAccount[] = [];
    for (const row of rows) {
        const kind = rowKind(row);
        if (kind === KIND_THESIS) {
            const t = rowToThesis(row);
            if (t) theses.push(t);
        } else if (kind === KIND_APPROACH) {
            const a = rowToApproach(row);
            if (a) approaches.push(a);
        } else if (kind === KIND_ACCOUNT) {
            const a = rowToAccount(row);
            if (a) accounts.push(a);
        }
    }
    return { theses, approaches, accounts };
}
