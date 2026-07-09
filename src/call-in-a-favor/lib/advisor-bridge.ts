import type {
    AdvisorOutcomeStamp,
    AdvisorTier,
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type {
    Deployment,
    DeploymentOutcome,
    MomentId,
    TierId
} from "./types";
import { TIERS } from "./tiers";

/**
 * Advisor Deploy ↔ Supabase row bridge.
 *
 * Translates between the in-memory `Deployment` shape (deal × advisor
 * × moment × ask × outcome) and the `advisor_deployments` Postgres row.
 *
 * Top-level columns: deal_id (uuid only — legacy ids are null),
 * advisor_name, advisor_tier (mapped from in-memory TierId tier),
 * ask_moment, ask_text, outcome_stamp (coarse send/hold/reroute
 * routing decision). Editorial fields (dealName, dealStage, advisorId,
 * momentName, forwardableNote, fine-grained outcome, notes,
 * outcomeDate) live inside `data` jsonb so the Deployment shape can
 * evolve without a migration.
 *
 * Convention: a Deployment.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "dep_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the Deployment.id is rewritten to the new uuid before save
 * resolves.
 *
 * Note on advisors: the room's advisor REGISTRY (the rolodex of saved
 * Advisor records) lives in localStorage only. Each deployment carries
 * advisor_name + advisor_tier denormalized so cross-device deployment
 * sync works without a separate advisor table sync.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a Deployment id looks like a real Supabase row uuid. */
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

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

/** In-memory tier id → Supabase advisor_tier label.
 *  Tiers map to broader ones the schema allows (investor / advisor /
 *  customer / other). t1 → investor, t2 → advisor, t3 → advisor,
 *  t4 → customer.
 */
export function tierIdToAdvisorTier(tier: TierId): AdvisorTier {
    if (tier === "t1") return "investor";
    if (tier === "t4") return "customer";
    return "advisor";
}

/** Reverse mapping — when hydrating from a row, pick a sensible tier
 *  id from the schema's coarse tier label. Falls back to t2.
 */
export function advisorTierToTierId(
    tier: AdvisorTier | null | undefined,
    fallback: TierId = "t2"
): TierId {
    if (tier === "investor") return "t1";
    if (tier === "customer") return "t4";
    if (tier === "advisor") return "t2";
    return fallback;
}

/** In-memory deployment outcome → Supabase outcome stamp.
 *  send = ask routed to the advisor / lifecycle is open
 *  hold = held before sending
 *  reroute = rerouted before sending
 */
export function outcomeToStamp(o: DeploymentOutcome): AdvisorOutcomeStamp {
    if (o === "hold") return "hold";
    if (o === "reroute") return "reroute";
    return "send";
}

function asMomentId(v: unknown, fallback: MomentId = "intro"): MomentId {
    return typeof v === "string"
        ? ((v as MomentId) ?? fallback)
        : fallback;
}

function asOutcome(
    v: unknown,
    fallback: DeploymentOutcome = "pending"
): DeploymentOutcome {
    const allowed: ReadonlyArray<DeploymentOutcome> = [
        "pending",
        "engaged",
        "successful",
        "no_response",
        "declined",
        "hold",
        "reroute"
    ];
    if (typeof v === "string" && allowed.includes(v as DeploymentOutcome)) {
        return v as DeploymentOutcome;
    }
    return fallback;
}

/**
 * Hydrate a Deployment from a Supabase row. Returns null when the row
 * is malformed (missing id) so callers can `.filter(Boolean)`.
 */
export function rowToDeployment(
    row:
        | Row<"advisor_deployments">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Deployment | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"advisor_deployments">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;

    const data = asObject(r.data) ?? {};
    const createdAt =
        asString(r.created_at) || new Date().toISOString();
    const dealStage = asString(data["dealStage"]);
    const dealName = asString(data["dealName"]);
    const momentName = asString(data["momentName"]);
    const advisorId = asString(data["advisorId"]);
    const forwardableNote = asString(data["forwardableNote"]);
    const notes = asString(data["notes"]);
    const outcomeDate = asString(data["outcomeDate"]) || null;
    // Prefer the fine-grained outcome from the data blob; coarse
    // outcome_stamp is a fallback for rows that predate the blob.
    const outcome = asOutcome(
        data["outcome"],
        r.outcome_stamp === "hold"
            ? "hold"
            : r.outcome_stamp === "reroute"
              ? "reroute"
              : "pending"
    );

    return {
        id,
        dealId: asString(r.deal_id) || asString(data["dealId"]),
        dealName,
        dealStage,
        advisorId,
        advisorName: asString(r.advisor_name),
        momentId: asMomentId(r.ask_moment),
        momentName: momentName || asString(r.ask_moment),
        ask: asString(r.ask_text),
        forwardableNote,
        outcome,
        notes,
        createdAt,
        outcomeDate
    };
}

export function rowsToDeployments(
    rows: ReadonlyArray<Row<"advisor_deployments">>
): ReadonlyArray<Deployment> {
    return rows.map(rowToDeployment).filter((d): d is Deployment => d !== null);
}

/**
 * Build the `data` jsonb blob — everything that isn't a top-level
 * column. Pure function, exported for tests.
 */
export function extractDataBlob(
    deployment: Deployment
): Record<string, unknown> {
    const blob: Record<string, unknown> = {
        dealId: deployment.dealId,
        dealName: deployment.dealName,
        dealStage: deployment.dealStage,
        advisorId: deployment.advisorId,
        momentName: deployment.momentName,
        forwardableNote: deployment.forwardableNote,
        notes: deployment.notes,
        outcome: deployment.outcome,
        outcomeDate: deployment.outcomeDate
    };
    return blob;
}

/**
 * Default fallback tier when the caller doesn't pass one. Used to
 * ensure advisor_tier on a row never blanks out even when the advisor
 * record is in-memory only and the caller didn't resolve it.
 */
function fallbackTier(): TierId {
    return TIERS["t2"]?.id ?? "t2";
}

/**
 * Translate an in-memory Deployment → Insert row. Drops the
 * Deployment.id from the insert payload — Supabase generates the
 * canonical uuid on insert. Sets deal_id only when dealId is a uuid.
 */
export function deploymentToInsert(
    deployment: Deployment,
    advisorTier?: TierId
): InsertRow<"advisor_deployments"> {
    const insert: InsertRow<"advisor_deployments"> = {
        advisor_name: deployment.advisorName || null,
        advisor_tier: tierIdToAdvisorTier(advisorTier ?? fallbackTier()),
        ask_moment: deployment.momentId,
        ask_text: deployment.ask || null,
        outcome_stamp: outcomeToStamp(deployment.outcome),
        data: extractDataBlob(deployment) as Json
    };
    if (deployment.dealId && looksLikePersistedId(deployment.dealId)) {
        insert.deal_id = deployment.dealId;
    }
    return insert;
}

/**
 * Translate an in-memory Deployment → Update row.
 */
export function deploymentToUpdate(
    deployment: Deployment,
    advisorTier?: TierId
): UpdateRow<"advisor_deployments"> {
    return {
        deal_id:
            deployment.dealId && looksLikePersistedId(deployment.dealId)
                ? deployment.dealId
                : null,
        advisor_name: deployment.advisorName || null,
        advisor_tier: tierIdToAdvisorTier(advisorTier ?? fallbackTier()),
        ask_moment: deployment.momentId,
        ask_text: deployment.ask || null,
        outcome_stamp: outcomeToStamp(deployment.outcome),
        data: extractDataBlob(deployment) as Json
    };
}

// Re-export number helper for tests.
export { asNumber };
