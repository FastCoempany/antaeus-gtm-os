import type { Deal, StageId, Stakeholder, StakeholderRole, Momentum, LossReason } from "./deal-shape";
import { STAGE_IDS, LOSS_REASONS, STAKEHOLDER_ROLES } from "./deal-shape";

/**
 * Bridge between Supabase row shapes (and the Phase 2.3 migration
 * blob shape) and the flat Deal type the room works in.
 *
 * Two read paths:
 *   - dbRowToDeal(row): a native deals-table row (column data + jsonb)
 *   - legacyDealToDeal(item): one item from the legacy
 *     localStorage / Phase 2.3 migration blob
 *
 * One write path:
 *   - dealToDbWrite(deal): produces the column + jsonb shape that
 *     data.deals.insert / .update expects.
 *
 * The legacy shape is more permissive than the typed Deal — random
 * extra fields are tolerated, missing fields fill with defaults.
 */

const STAGE_ID_SET: ReadonlySet<string> = new Set(STAGE_IDS);
const LOSS_REASON_SET: ReadonlySet<string> = new Set(LOSS_REASONS);
const ROLE_SET: ReadonlySet<string> = new Set(STAKEHOLDER_ROLES);

function asString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

function asStage(v: unknown): StageId {
    if (typeof v === "string" && STAGE_ID_SET.has(v)) return v as StageId;
    return "prospect";
}

function asMomentum(v: unknown): Momentum | undefined {
    if (v === "strong" || v === "neutral" || v === "stalling") return v;
    return undefined;
}

function asLossReason(v: unknown): LossReason | undefined {
    if (typeof v === "string" && LOSS_REASON_SET.has(v)) {
        return v as LossReason;
    }
    return undefined;
}

function asStakeholderRole(v: unknown): StakeholderRole | "" {
    if (typeof v === "string" && ROLE_SET.has(v)) return v as StakeholderRole;
    return "";
}

function asStakeholders(v: unknown): ReadonlyArray<Stakeholder> | undefined {
    if (!Array.isArray(v)) return undefined;
    return v
        .map((raw): Stakeholder | null => {
            if (!raw || typeof raw !== "object") return null;
            const r = raw as Record<string, unknown>;
            const name = asString(r.name);
            if (!name) return null;
            return {
                name,
                role: asStakeholderRole(r.role),
                engaged: r.engaged === true ? true : undefined
            };
        })
        .filter((s): s is Stakeholder => s !== null);
}

/**
 * Convert one item from the legacy `gtmos_deal_workspaces` array
 * (or equivalent passthrough-blob entry) into a Deal. Tolerates a
 * bunch of permissiveness — missing fields fill with defaults,
 * unknown fields are dropped.
 */
export function legacyDealToDeal(raw: unknown, fallbackId: string = ""): Deal {
    if (!raw || typeof raw !== "object") {
        return {
            id: fallbackId || cryptoRandomId(),
            accountName: "",
            value: 0,
            stage: "prospect"
        };
    }
    const r = raw as Record<string, unknown>;
    const id = asString(r.id) ?? (fallbackId || cryptoRandomId());
    return {
        id,
        accountName: asString(r.accountName) ?? asString(r.account_name) ?? "",
        value: asNumber(r.value ?? r.deal_value),
        stage: asStage(r.stage),
        nextStep: asString(r.nextStep),
        nextStepDate: asString(r.nextStepDate) ?? asString(r.next_step_date),
        closeDate: asString(r.closeDate) ?? asString(r.close_date),
        forecastCategory:
            asString(r.forecastCategory) ?? asString(r.forecast_category),
        momentum: asMomentum(r.momentum),
        champion: asString(r.champion),
        economicBuyer: asString(r.economicBuyer) ?? asString(r.economic_buyer),
        useCase: asString(r.useCase) ?? asString(r.use_case),
        pain: asString(r.pain),
        competition: asString(r.competition),
        decisionProcess:
            asString(r.decisionProcess) ?? asString(r.decision_process),
        notes: asString(r.notes),
        stakeholders: asStakeholders(r.stakeholders),
        lossReason: asLossReason(r.lossReason ?? r.loss_reason),
        lossNotes: asString(r.lossNotes) ?? asString(r.loss_notes),
        created_at: asString(r.created_at),
        updated_at: asString(r.updated_at)
    };
}

/**
 * Convert a `deals` table row from Supabase into a Deal. Pulls
 * intel from the `data` jsonb where it lives and normalizes column
 * names back to the flat shape.
 */
export function dbRowToDeal(row: unknown): Deal {
    if (!row || typeof row !== "object") {
        return {
            id: cryptoRandomId(),
            accountName: "",
            value: 0,
            stage: "prospect"
        };
    }
    const r = row as Record<string, unknown>;
    const blob = (r.data && typeof r.data === "object" ? r.data : {}) as Record<
        string,
        unknown
    >;
    return {
        id: asString(r.id) ?? cryptoRandomId(),
        accountName: asString(r.account_name) ?? asString(blob.accountName) ?? "",
        value: asNumber(r.deal_value),
        stage: asStage(r.stage),
        nextStep: asString(blob.nextStep),
        nextStepDate: asString(r.next_step_date),
        closeDate: asString(r.close_date),
        forecastCategory: asString(r.forecast_category),
        momentum: asMomentum(blob.momentum),
        champion: asString(blob.champion),
        economicBuyer: asString(blob.economicBuyer),
        useCase: asString(blob.useCase),
        pain: asString(blob.pain),
        competition: asString(blob.competition),
        decisionProcess: asString(blob.decisionProcess),
        notes: asString(blob.notes),
        stakeholders: asStakeholders(blob.stakeholders),
        lossReason: asLossReason(r.loss_reason),
        lossNotes: asString(blob.lossNotes),
        created_at: asString(r.created_at),
        updated_at: asString(r.updated_at)
    };
}

/**
 * Detect a Phase 2.3 migration blob row in `deals` (`data.migration_version
 * === 'phase-2.3-passthrough'`). Return the parsed legacy items, or null
 * if this row isn't a blob.
 *
 * Wave 4 will REPLACE these blob rows with proper per-deal rows on first
 * save. Until then the room reads from the blob.
 */
export function blobToLegacyDealArray(row: unknown): unknown[] | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const data = r.data;
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    if (d.migration_version !== "phase-2.3-passthrough") return null;
    const fromLs = d.migrated_from_localstorage;
    if (!fromLs || typeof fromLs !== "object") return null;
    const arr = (fromLs as Record<string, unknown>).gtmos_deal_workspaces;
    if (!Array.isArray(arr)) return null;
    return arr;
}

/**
 * Pull the full Deal[] from a list of rows, handling both native
 * deal rows and the Phase 2.3 migration blob row. Native rows take
 * precedence — if both exist, the migration blob is treated as a
 * historical snapshot only and skipped.
 */
export function rowsToDeals(rows: ReadonlyArray<unknown>): ReadonlyArray<Deal> {
    const nativeDeals: Deal[] = [];
    const blobDeals: Deal[] = [];
    for (const row of rows) {
        const blob = blobToLegacyDealArray(row);
        if (blob) {
            for (let i = 0; i < blob.length; i++) {
                blobDeals.push(legacyDealToDeal(blob[i], `legacy-${i}`));
            }
        } else {
            nativeDeals.push(dbRowToDeal(row));
        }
    }
    return nativeDeals.length > 0 ? nativeDeals : blobDeals;
}

/**
 * Convert a Deal back into the column + jsonb shape that
 * data.deals.insert / .update expects. Wave 3 uses this on save.
 */
export function dealToDbWrite(deal: Deal): Record<string, unknown> {
    const blob: Record<string, unknown> = {};
    if (deal.nextStep !== undefined) blob.nextStep = deal.nextStep;
    if (deal.momentum !== undefined) blob.momentum = deal.momentum;
    if (deal.champion !== undefined) blob.champion = deal.champion;
    if (deal.economicBuyer !== undefined) blob.economicBuyer = deal.economicBuyer;
    if (deal.useCase !== undefined) blob.useCase = deal.useCase;
    if (deal.pain !== undefined) blob.pain = deal.pain;
    if (deal.competition !== undefined) blob.competition = deal.competition;
    if (deal.decisionProcess !== undefined) blob.decisionProcess = deal.decisionProcess;
    if (deal.notes !== undefined) blob.notes = deal.notes;
    if (deal.stakeholders !== undefined) blob.stakeholders = deal.stakeholders;
    if (deal.lossNotes !== undefined) blob.lossNotes = deal.lossNotes;
    return {
        account_name: deal.accountName,
        stage: deal.stage,
        deal_value: deal.value,
        close_date: deal.closeDate ?? null,
        next_step_date: deal.nextStepDate ?? null,
        forecast_category: deal.forecastCategory ?? null,
        loss_reason: deal.lossReason ?? null,
        data: blob
    };
}

function cryptoRandomId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Test/SSR fallback
    return "00000000-0000-0000-0000-" + Math.random().toString(16).slice(2, 14).padStart(12, "0");
}
