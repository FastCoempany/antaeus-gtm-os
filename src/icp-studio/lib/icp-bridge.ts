import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type { QualityCheck, RoleKey, SavedIcp } from "./types";

/**
 * ICP Studio ↔ Supabase row bridge.
 *
 * Translates between the in-memory `SavedIcp` shape (statement +
 * role + targeting fields + quality + checks) and the `icps`
 * Postgres row.
 *
 * Top-level columns: `name` (the ICP's industry label, used for
 * downstream joins by name), `worked` (per-row "operator has used
 * this in a real motion" flag — kept false on save; flipped true
 * by Worked-events emitted from other rooms), `summary` (the
 * statement text). Everything else (role, size, geo, buyer, pain,
 * trigger, proofWindow, engineActive, qualityScore, qualityChecks)
 * lives inside `data` jsonb so the SavedIcp shape can evolve
 * without a migration per change.
 *
 * Convention: a SavedIcp.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "icp_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the SavedIcp.id is rewritten to the new uuid before the
 * save resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a SavedIcp id looks like a real Supabase row uuid. */
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

function asRole(v: unknown): RoleKey {
    return v === "firstae" ? "firstae" : "founder";
}

function parseChecks(raw: unknown): ReadonlyArray<QualityCheck> {
    if (!Array.isArray(raw)) return [];
    const out: QualityCheck[] = [];
    for (const c of raw) {
        const o = asObject(c);
        if (!o || typeof o["text"] !== "string") continue;
        const tone = asString(o["tone"]);
        out.push({
            tone:
                tone === "good" || tone === "warn" || tone === "risk"
                    ? tone
                    : "warn",
            text: asString(o["text"])
        });
    }
    return out;
}

/**
 * Build a stable "name" column from the row data. Industry first,
 * else buyer. Falls back to "Untitled ICP" so the column never goes
 * blank (legacy guard for rows that lacked all three core fields).
 */
function deriveIcpName(industry: string, buyer: string): string {
    const i = industry.trim();
    if (i) return i;
    const b = buyer.trim();
    if (b) return `${b} buyer`;
    return "Untitled ICP";
}

/**
 * Translate a Supabase row → in-memory SavedIcp. Pulls top-level
 * columns, then unpacks the `data` jsonb blob for everything else
 * (role + targeting fields + quality).
 *
 * Returns null when the row is malformed (missing id) so callers
 * can `.filter(Boolean)` instead of guarding per-row.
 */
export function rowToIcp(
    row:
        | Row<"icps">
        | { id?: unknown; name?: unknown; summary?: unknown; data?: unknown }
        | null
        | undefined
): SavedIcp | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"icps">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;

    const data = asObject(r.data) ?? {};
    const industry = asString(data["industry"]);
    const buyer = asString(data["buyer"]);
    const summary = asString(r.summary);
    const createdAt = asString(r.created_at) || new Date().toISOString();
    const updatedAt =
        asString(r.updated_at) ||
        asString(r.created_at) ||
        new Date().toISOString();

    return {
        id,
        statement: summary || asString(data["statement"]),
        role: asRole(data["role"]),
        industry,
        size: asString(data["size"]),
        geo: asString(data["geo"]),
        buyer,
        pain: asString(data["pain"]),
        trigger: asString(data["trigger"]),
        proofWindow: asString(data["proofWindow"]),
        engineActive: asNumber(data["engineActive"]),
        qualityScore: asNumber(data["qualityScore"]),
        qualityChecks: parseChecks(data["qualityChecks"]),
        createdAt,
        updatedAt
    };
}

export function rowsToIcps(
    rows: ReadonlyArray<Row<"icps">>
): ReadonlyArray<SavedIcp> {
    return rows.map(rowToIcp).filter((i): i is SavedIcp => i !== null);
}

/**
 * Build the `data` jsonb blob — everything that isn't a top-level
 * column. Pure function, exported for tests.
 */
export function extractDataBlob(icp: SavedIcp): Record<string, unknown> {
    return {
        role: icp.role,
        industry: icp.industry,
        size: icp.size,
        geo: icp.geo,
        buyer: icp.buyer,
        pain: icp.pain,
        trigger: icp.trigger,
        proofWindow: icp.proofWindow,
        engineActive: icp.engineActive,
        qualityScore: icp.qualityScore,
        qualityChecks: icp.qualityChecks
    };
}

/**
 * Translate an in-memory SavedIcp → Insert row. Used on first save
 * for legacy-id rows (pre-cloud-sync localStorage data).
 *
 * Drops the SavedIcp.id from the insert payload — Supabase generates
 * the canonical uuid on insert.
 */
export function icpToInsert(icp: SavedIcp): InsertRow<"icps"> {
    return {
        name: deriveIcpName(icp.industry, icp.buyer),
        worked: false,
        summary: icp.statement || null,
        data: extractDataBlob(icp) as Json
    };
}

/**
 * Translate an in-memory SavedIcp → Update row. Used when the
 * SavedIcp already has a uuid id from a prior cloud sync.
 *
 * `worked` intentionally omitted — that column is mutated by other
 * rooms via Worked-events; ICP Studio only seeds it on insert.
 */
export function icpToUpdate(icp: SavedIcp): UpdateRow<"icps"> {
    return {
        name: deriveIcpName(icp.industry, icp.buyer),
        summary: icp.statement || null,
        data: extractDataBlob(icp) as Json
    };
}
