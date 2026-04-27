import type { Deal } from "@/deal-workspace/lib/deal-shape";
import { reportError } from "@/lib/observability";

/**
 * Phase 4 / Room 4 Wave 2 — deal loader.
 *
 * Future Autopsy is a synthesis room: it doesn't own deal data, it
 * pulls from the Deal Workspace's published mirror. Phase 4 / Room 1's
 * `mirrorToLegacyStorage` writes `gtmos_deal_workspaces` on every state
 * change; this loader reads it back.
 *
 * Same posture as Dashboard's snapshot aggregator (Phase 4 / Room 2):
 * defensive parsing, never throws, returns empty array when the key
 * is missing or malformed.
 *
 * Once Deal Workspace is fully on the new stack and consumers read
 * directly from Supabase, this loader can switch to data-client. For
 * now, localStorage is the bridge during cutover.
 */

export const DEAL_WORKSPACES_KEY = "gtmos_deal_workspaces";

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

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

/**
 * Coerce a permissive raw row (legacy or migration-blob shape) into
 * the typed Deal. Mirrors the legacy `dh.adaptDeal()` field-name
 * tolerance: accepts both camelCase (`accountName`, `nextStep`,
 * `closeDate`) and snake_case (`account_name`, `next_step`,
 * `close_date`) so existing data flows in without translation.
 */
function parseDeal(raw: unknown): Deal | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    if (!id) return null;
    const accountName =
        asString(o.accountName) ?? asString(o.account_name) ?? asString(o.name) ?? "";
    const stageRaw =
        asString(o.stage) ?? asString(o.stage_id) ?? "prospect";
    const value = asNumber(o.value ?? o.deal_value ?? o.amount);
    const deal: Deal = {
        id,
        accountName,
        value,
        stage: stageRaw as Deal["stage"],
        ...(asString(o.nextStep ?? o.next_steps ?? o.next_step)
            ? { nextStep: asString(o.nextStep ?? o.next_steps ?? o.next_step) }
            : {}),
        ...(asString(o.nextStepDate ?? o.next_step_date)
            ? {
                  nextStepDate: asString(o.nextStepDate ?? o.next_step_date)
              }
            : {}),
        ...(asString(o.closeDate ?? o.close_date ?? o.timeline)
            ? {
                  closeDate: asString(o.closeDate ?? o.close_date ?? o.timeline)
              }
            : {}),
        ...(asString(o.forecastCategory ?? o.forecast_category)
            ? {
                  forecastCategory: asString(
                      o.forecastCategory ?? o.forecast_category
                  )
              }
            : {}),
        ...(o.momentum === "strong" || o.momentum === "neutral" || o.momentum === "stalling"
            ? { momentum: o.momentum }
            : {}),
        ...(asString(o.champion) ? { champion: asString(o.champion) } : {}),
        ...(asString(o.economicBuyer ?? o.economic_buyer)
            ? {
                  economicBuyer: asString(o.economicBuyer ?? o.economic_buyer)
              }
            : {}),
        ...(asString(o.useCase ?? o.use_cases ?? o.use_case)
            ? { useCase: asString(o.useCase ?? o.use_cases ?? o.use_case) }
            : {}),
        ...(asString(o.pain ?? o.pain_points)
            ? { pain: asString(o.pain ?? o.pain_points) }
            : {}),
        ...(asString(o.competition) ? { competition: asString(o.competition) } : {}),
        ...(asString(o.decisionProcess ?? o.decision_process)
            ? {
                  decisionProcess: asString(
                      o.decisionProcess ?? o.decision_process
                  )
              }
            : {}),
        ...(asString(o.notes) ? { notes: asString(o.notes) } : {}),
        ...(Array.isArray(o.stakeholders)
            ? { stakeholders: o.stakeholders as Deal["stakeholders"] }
            : {}),
        ...(asString(o.lossReason ?? o.loss_reason)
            ? {
                  lossReason: asString(o.lossReason ?? o.loss_reason) as Deal["lossReason"]
              }
            : {}),
        ...(asString(o.lossNotes ?? o.loss_notes)
            ? { lossNotes: asString(o.lossNotes ?? o.loss_notes) }
            : {}),
        ...(asString(o.updated_at) ? { updated_at: asString(o.updated_at) } : {}),
        ...(asString(o.created_at) ? { created_at: asString(o.created_at) } : {})
    };
    return deal;
}

/**
 * Read all deals from `gtmos_deal_workspaces`. Returns empty array on
 * missing / malformed input. Never throws; storage outages report via
 * Sentry but resolve to [] so the room renders cleanly.
 */
export function loadDealsFromMirror(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<Deal> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(DEAL_WORKSPACES_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(parseDeal).filter((d): d is Deal => d !== null);
    } catch (err) {
        reportError(err, { op: "future-autopsy.loadDealsFromMirror" });
        return [];
    }
}
