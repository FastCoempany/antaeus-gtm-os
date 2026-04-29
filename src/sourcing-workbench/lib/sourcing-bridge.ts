import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import type {
    LeverageKey,
    Platform,
    Prospect,
    ProspectStage,
    QueryCard
} from "./types";

/**
 * Sourcing Workbench ↔ Supabase row bridge.
 *
 * Two entity kinds (queryCards, prospects) live in the
 * `studio_artifacts` table, discriminated by `data.kind`:
 *
 *   data.kind = "sourcing.queryCard" — saved search
 *   data.kind = "sourcing.prospect"  — captured prospect record
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_QUERY_CARD = "sourcing.queryCard";
export const KIND_PROSPECT = "sourcing.prospect";

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

const PLATFORMS: ReadonlyArray<Platform> = [
    "linkedin",
    "search",
    "intent",
    "signals",
    "list"
];
function asPlatform(v: unknown, fallback: Platform = "linkedin"): Platform {
    return typeof v === "string" && PLATFORMS.includes(v as Platform)
        ? (v as Platform)
        : fallback;
}

const LEVERAGES: ReadonlyArray<LeverageKey> = [
    "network-connection",
    "existing-proof-point",
    "market-signal",
    "geographic-advantage",
    "cold"
];
function asLeverage(v: unknown, fallback: LeverageKey = "cold"): LeverageKey {
    return typeof v === "string" && LEVERAGES.includes(v as LeverageKey)
        ? (v as LeverageKey)
        : fallback;
}

const STAGES: ReadonlyArray<ProspectStage> = [
    "captured",
    "researched",
    "ready",
    "pushed",
    "dropped"
];
function asStage(
    v: unknown,
    fallback: ProspectStage = "captured"
): ProspectStage {
    return typeof v === "string" && STAGES.includes(v as ProspectStage)
        ? (v as ProspectStage)
        : fallback;
}

export function rowKind(row: Row<"studio_artifacts">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

// ─── Query Card ────────────────────────────────────────────────────────

export function rowToQueryCard(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): QueryCard | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_QUERY_CARD) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) || asString(r.created_at) || createdAt;
    return {
        id,
        platform: asPlatform(data["platform"]),
        query: asString(data["query"]),
        intent: asString(data["intent"]),
        notes: asString(data["notes"]),
        targetIcp: asString(data["targetIcp"]),
        createdAt,
        updatedAt
    };
}

export function queryCardToInsert(
    card: QueryCard
): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_QUERY_CARD,
            platform: card.platform,
            query: card.query,
            intent: card.intent,
            notes: card.notes,
            targetIcp: card.targetIcp
        } as unknown as Json
    };
}

export function queryCardToUpdate(
    card: QueryCard
): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_QUERY_CARD,
            platform: card.platform,
            query: card.query,
            intent: card.intent,
            notes: card.notes,
            targetIcp: card.targetIcp
        } as unknown as Json
    };
}

// ─── Prospect ──────────────────────────────────────────────────────────

export function rowToProspect(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Prospect | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_PROSPECT) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) || asString(r.created_at) || createdAt;
    return {
        id,
        accountName: asString(data["accountName"]),
        contactName: asString(data["contactName"]),
        contactTitle: asString(data["contactTitle"]),
        sourceQueryId: asString(data["sourceQueryId"]),
        leverage: asLeverage(data["leverage"]),
        stage: asStage(data["stage"]),
        entryPoint: asString(data["entryPoint"]),
        approach: asString(data["approach"]),
        notes: asString(data["notes"]),
        createdAt,
        updatedAt
    };
}

export function prospectToInsert(
    prospect: Prospect
): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_PROSPECT,
            accountName: prospect.accountName,
            contactName: prospect.contactName,
            contactTitle: prospect.contactTitle,
            sourceQueryId: prospect.sourceQueryId,
            leverage: prospect.leverage,
            stage: prospect.stage,
            entryPoint: prospect.entryPoint,
            approach: prospect.approach,
            notes: prospect.notes
        } as unknown as Json
    };
}

export function prospectToUpdate(
    prospect: Prospect
): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_PROSPECT,
            accountName: prospect.accountName,
            contactName: prospect.contactName,
            contactTitle: prospect.contactTitle,
            sourceQueryId: prospect.sourceQueryId,
            leverage: prospect.leverage,
            stage: prospect.stage,
            entryPoint: prospect.entryPoint,
            approach: prospect.approach,
            notes: prospect.notes
        } as unknown as Json
    };
}

// ─── Multi-kind partitioner ────────────────────────────────────────────

export interface PartitionedSourcingRows {
    readonly queryCards: ReadonlyArray<QueryCard>;
    readonly prospects: ReadonlyArray<Prospect>;
}

export function partitionSourcingRows(
    rows: ReadonlyArray<Row<"studio_artifacts">>
): PartitionedSourcingRows {
    const queryCards: QueryCard[] = [];
    const prospects: Prospect[] = [];
    for (const row of rows) {
        const kind = rowKind(row);
        if (kind === KIND_QUERY_CARD) {
            const c = rowToQueryCard(row);
            if (c) queryCards.push(c);
        } else if (kind === KIND_PROSPECT) {
            const p = rowToProspect(row);
            if (p) prospects.push(p);
        }
    }
    return { queryCards, prospects };
}
