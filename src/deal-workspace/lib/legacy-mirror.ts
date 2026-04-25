import type { Deal } from "./deal-shape";

/**
 * Wave 4 — backwards-compatibility bridge to legacy localStorage.
 *
 * Until Dashboard / Future Autopsy / Readiness migrate off the legacy
 * stack, they read deals from `gtmos_deal_workspaces` (an array of
 * legacy items, see js/deal-health.js loadAllDeals). The new room
 * writes its source-of-truth to Supabase, but every save/load also
 * mirrors the current array into that key so the legacy readers stay
 * consistent with whatever the operator just edited in the new room.
 *
 * This is removed in Phase 5 once every reader has migrated.
 *
 * Failures are swallowed — storage may be unavailable (private mode,
 * quota exceeded, hostile environment). The new room is the source of
 * truth; the mirror is best-effort.
 */

export const LEGACY_DEALS_KEY = "gtmos_deal_workspaces";

/**
 * Project a Deal into the legacy localStorage shape. The legacy reader
 * is permissive (camelCase + snake_case fallbacks, missing fields ok);
 * we emit the camelCase version that legacyDealToDeal already accepts.
 */
function dealToLegacyItem(deal: Deal): Record<string, unknown> {
    const item: Record<string, unknown> = {
        id: deal.id,
        accountName: deal.accountName,
        value: deal.value,
        stage: deal.stage
    };
    if (deal.nextStep !== undefined) item.nextStep = deal.nextStep;
    if (deal.nextStepDate !== undefined) item.nextStepDate = deal.nextStepDate;
    if (deal.closeDate !== undefined) item.closeDate = deal.closeDate;
    if (deal.forecastCategory !== undefined)
        item.forecastCategory = deal.forecastCategory;
    if (deal.momentum !== undefined) item.momentum = deal.momentum;
    if (deal.champion !== undefined) item.champion = deal.champion;
    if (deal.economicBuyer !== undefined) item.economicBuyer = deal.economicBuyer;
    if (deal.useCase !== undefined) item.useCase = deal.useCase;
    if (deal.pain !== undefined) item.pain = deal.pain;
    if (deal.competition !== undefined) item.competition = deal.competition;
    if (deal.decisionProcess !== undefined)
        item.decisionProcess = deal.decisionProcess;
    if (deal.notes !== undefined) item.notes = deal.notes;
    if (deal.stakeholders !== undefined) item.stakeholders = deal.stakeholders;
    if (deal.lossReason !== undefined) item.lossReason = deal.lossReason;
    if (deal.lossNotes !== undefined) item.lossNotes = deal.lossNotes;
    if (deal.created_at !== undefined) item.created_at = deal.created_at;
    if (deal.updated_at !== undefined) item.updated_at = deal.updated_at;
    return item;
}

export function dealsToLegacyArray(
    deals: ReadonlyArray<Deal>
): ReadonlyArray<Record<string, unknown>> {
    return deals.map(dealToLegacyItem);
}

/**
 * Mirror the current Deal array into `gtmos_deal_workspaces`. Safe to
 * call in test / SSR / hostile-storage environments — failures are
 * swallowed.
 */
export function mirrorToLegacyStorage(deals: ReadonlyArray<Deal>): void {
    try {
        if (typeof localStorage === "undefined") return;
        const arr = dealsToLegacyArray(deals);
        localStorage.setItem(LEGACY_DEALS_KEY, JSON.stringify(arr));
    } catch {
        // best-effort
    }
}
