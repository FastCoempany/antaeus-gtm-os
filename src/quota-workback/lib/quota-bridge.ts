import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import { DEFAULT_INPUTS, type PlanInputs } from "./types";

/**
 * Quota Workback ↔ Supabase row bridge.
 *
 * `PlanInputs` is a single object — quota / acv / win-rate / etc. —
 * the operator's targets + conversion assumptions. Maps to ONE row
 * in the `pipeline_settings` table per workspace; saves UPSERT that
 * single row.
 *
 * pipeline_settings has no top-level columns beyond id / workspace_id /
 * timestamps + a `data` jsonb. The bridge packs PlanInputs into
 * `data.inputs` (with a `kind` discriminator for forward-compat in
 * case more shapes land in this table later).
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_QUOTA_INPUTS = "quota.inputs";

export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asNumber(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

export function rowKind(row: Row<"pipeline_settings">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

/**
 * Hydrate PlanInputs from a Supabase row. Returns null when the row
 * is not a quota.inputs kind. Missing fields fall back to
 * DEFAULT_INPUTS so a partial row never breaks the form.
 */
export function rowToInputs(
    row:
        | Row<"pipeline_settings">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): PlanInputs | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"pipeline_settings">;
    const data = asObject(r.data);
    if (!data) return null;
    if (data["kind"] !== KIND_QUOTA_INPUTS) return null;
    const i = asObject(data["inputs"]);
    if (!i) return DEFAULT_INPUTS;
    return {
        quota: asNumber(i["quota"], DEFAULT_INPUTS.quota),
        acv: asNumber(i["acv"], DEFAULT_INPUTS.acv),
        win: asNumber(i["win"], DEFAULT_INPUTS.win),
        m2o: asNumber(i["m2o"], DEFAULT_INPUTS.m2o),
        t2m: asNumber(i["t2m"], DEFAULT_INPUTS.t2m),
        show: asNumber(i["show"], DEFAULT_INPUTS.show),
        days: asNumber(i["days"], DEFAULT_INPUTS.days),
        tpa: asNumber(i["tpa"], DEFAULT_INPUTS.tpa),
        cycle: asNumber(i["cycle"], DEFAULT_INPUTS.cycle)
    };
}

export function inputsToInsert(
    inputs: PlanInputs
): InsertRow<"pipeline_settings"> {
    return {
        data: {
            kind: KIND_QUOTA_INPUTS,
            inputs
        } as unknown as Json
    };
}

export function inputsToUpdate(
    inputs: PlanInputs
): UpdateRow<"pipeline_settings"> {
    return {
        data: {
            kind: KIND_QUOTA_INPUTS,
            inputs
        } as unknown as Json
    };
}
