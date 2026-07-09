import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type { Advisor, RelationshipState, TierId } from "./types";

/**
 * Advisor REGISTRY (rolodex) ↔ Supabase row bridge.
 *
 * The registry sits in `studio_artifacts` with `data.kind='advisor.profile'`.
 * Each saved Advisor is one row. Deployments stay in `advisor_deployments`
 * (they have their own table + foreign-key to deal_id) — only the rolodex
 * profile lives here.
 *
 * Why studio_artifacts: there's no native `advisors` table in the schema
 * and adding one for ~10 rows per workspace would be heavy. studio_artifacts
 * already discriminates by `data.kind` and is the right fit for low-volume
 * profile data the operator owns.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_ADVISOR_PROFILE = "advisor.profile";

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

function asTier(v: unknown, fallback: TierId = "t2"): TierId {
    return v === "t1" || v === "t2" || v === "t3" || v === "t4"
        ? v
        : fallback;
}

const RELATIONSHIPS: ReadonlyArray<RelationshipState> = [
    "active",
    "dormant",
    "lapsed"
];
function asRelationship(
    v: unknown,
    fallback: RelationshipState = "active"
): RelationshipState {
    return typeof v === "string" && RELATIONSHIPS.includes(v as RelationshipState)
        ? (v as RelationshipState)
        : fallback;
}

export function rowKind(row: Row<"studio_artifacts">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

export function rowToAdvisor(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Advisor | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    const data = asObject(r.data) ?? {};
    if (data["kind"] !== KIND_ADVISOR_PROFILE) return null;
    const createdAt = asString(r.created_at) || new Date().toISOString();
    return {
        id,
        name: asString(data["name"]),
        title: asString(data["title"]),
        tier: asTier(data["tier"]),
        expertise: asString(data["expertise"]),
        equity: asString(data["equity"]),
        companies: asArray(data["companies"]).filter(
            (s): s is string => typeof s === "string"
        ),
        notes: asString(data["notes"]),
        relationship: asRelationship(data["relationship"]),
        createdAt
    };
}

export function rowsToAdvisors(
    rows: ReadonlyArray<Row<"studio_artifacts">>
): ReadonlyArray<Advisor> {
    return rows.map(rowToAdvisor).filter((a): a is Advisor => a !== null);
}

export function extractDataBlob(advisor: Advisor): Record<string, unknown> {
    return {
        kind: KIND_ADVISOR_PROFILE,
        name: advisor.name,
        title: advisor.title,
        tier: advisor.tier,
        expertise: advisor.expertise,
        equity: advisor.equity,
        companies: advisor.companies,
        notes: advisor.notes,
        relationship: advisor.relationship
    };
}

export function advisorToInsert(
    advisor: Advisor
): InsertRow<"studio_artifacts"> {
    return {
        studio: "advisor",
        artifact_type: "profile",
        title: advisor.name?.trim() || "Untitled advisor",
        data: extractDataBlob(advisor) as unknown as Json
    };
}

export function advisorToUpdate(
    advisor: Advisor
): UpdateRow<"studio_artifacts"> {
    return {
        data: extractDataBlob(advisor) as unknown as Json
    };
}
