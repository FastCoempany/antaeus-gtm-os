import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_ICP_DRAFT,
    type IcpDraft,
    type RoleKey,
    type SavedIcp
} from "./lib/types";
import { buildStatement } from "./lib/builders";
import { buildIcpQuality } from "./lib/quality";
import { saveAnalytics, uid } from "./lib/persistence";

/**
 * Phase 4 / Room 11 — ICP Studio runtime state.
 *
 * Per canon §4.4 the ICP is the thing being sharpened — Wave 1
 * establishes the shape. Wave 2 ports the build/quality engine; Wave
 * 3 wires the dark-hero + work-area UI; Wave 4 persistence; Wave 5
 * cross-room outflow (ICP match scoring → Territory + Sourcing +
 * Signal Console + Outbound + Discovery + Readiness + Handoff).
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** Form draft — the ICP under composition right now. */
export const draft: Signal<IcpDraft> = signal(EMPTY_ICP_DRAFT);

/** Persistent saved ICPs (mirrored to `gtmos_icp_analytics.icps[]`). */
export const savedIcps: Signal<ReadonlyArray<SavedIcp>> = signal([]);

/** Cumulative Worked counter (mirrored to `gtmos_icp_analytics.totalWorked`). */
export const totalWorked: Signal<number> = signal(0);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ───────────────────────────────────────────────

/**
 * Effective industry — when draft.industry === "custom" the operator's
 * typed-in industryCustom value wins; otherwise the select value.
 */
export const effectiveIndustry: ReadonlySignal<string> = computed(() => {
    const d = draft.value;
    return d.industry === "custom"
        ? d.industryCustom.trim()
        : d.industry;
});

/** Effective buyer — same custom-fallback rule. */
export const effectiveBuyer: ReadonlySignal<string> = computed(() => {
    const d = draft.value;
    return d.buyer === "custom" ? d.buyerCustom.trim() : d.buyer;
});

/** Most-recent saved ICPs (newest first). */
export const recentIcps: ReadonlySignal<ReadonlyArray<SavedIcp>> = computed(
    () => {
        return savedIcps.value
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt || 0).getTime() -
                    new Date(a.updatedAt || a.createdAt || 0).getTime()
            );
    }
);

// ─── Actions ───────────────────────────────────────────────────────────

export function patchDraft(part: Partial<IcpDraft>): void {
    draft.value = { ...draft.value, ...part } as IcpDraft;
}

export function setRole(role: RoleKey): void {
    patchDraft({ role });
}

export function resetDraft(): void {
    draft.value = EMPTY_ICP_DRAFT;
}

export function setSavedIcps(next: ReadonlyArray<SavedIcp>): void {
    savedIcps.value = next;
}

export function appendSavedIcp(icp: SavedIcp): void {
    savedIcps.value = [...savedIcps.value, icp];
}

export function replaceSavedIcp(icp: SavedIcp): void {
    savedIcps.value = savedIcps.value.map((existing) =>
        existing.id === icp.id ? icp : existing
    );
}

export function removeSavedIcp(id: string): void {
    savedIcps.value = savedIcps.value.filter((icp) => icp.id !== id);
}

export function setTotalWorked(n: number): void {
    totalWorked.value = Math.max(0, Math.floor(n));
}

export function bumpTotalWorked(by: number = 1): void {
    totalWorked.value = Math.max(0, totalWorked.value + by);
}

export function resetSession(): void {
    draft.value = EMPTY_ICP_DRAFT;
    savedIcps.value = [];
    totalWorked.value = 0;
    loaded.value = false;
}

// ─── High-level actions ────────────────────────────────────────────────

/**
 * Effective industry / buyer applying the custom-fallback rule. Pure —
 * mirrors the computed signals but takes the draft explicitly so tests
 * + saveDraftAsIcp can reuse the same logic.
 */
function effective(value: string, custom: string): string {
    return value === "custom" ? custom.trim() : value;
}

/**
 * Save the current draft as a SavedIcp. Returns the new SavedIcp or
 * null when the minimum (industry + size + buyer) is missing — same
 * legacy guard as line 1665.
 */
export function saveDraftAsIcp(
    now: number = Date.now()
): SavedIcp | null {
    const d = draft.value;
    const industry = effective(d.industry, d.industryCustom);
    const size = d.size;
    const buyer = effective(d.buyer, d.buyerCustom);
    if (!industry || !size || !buyer) return null;

    const statement = buildStatement({
        industry,
        size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow
    });
    const engineActiveNum =
        Number(d.engineActive) > 0 ? Math.floor(Number(d.engineActive)) : 0;
    const quality = buildIcpQuality({
        role: d.role,
        industry,
        size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow,
        activeAccounts: engineActiveNum
    });
    const iso = new Date(now).toISOString();
    const icp: SavedIcp = {
        id: uid("icp", now),
        statement: statement.text,
        role: d.role,
        industry,
        size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow,
        engineActive: engineActiveNum,
        qualityScore: quality.score,
        qualityChecks: quality.checks,
        createdAt: iso,
        updatedAt: iso
    };
    appendSavedIcp(icp);
    bumpTotalWorked(1);
    return icp;
}

// ─── Persistence side-effect ───────────────────────────────────────────

let analyticsPersistStop: (() => void) | null = null;

/**
 * Mirror savedIcps + totalWorked writes to localStorage. Skips first
 * run to avoid redundant boot-time write — same pattern as Phase 4 /
 * Rooms 3-10.
 */
export function startAnalyticsPersistence(): () => void {
    if (analyticsPersistStop) return analyticsPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const icps = savedIcps.value;
        const worked = totalWorked.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAnalytics({ icps, totalWorked: worked });
    });
    analyticsPersistStop = () => {
        dispose();
        analyticsPersistStop = null;
    };
    return analyticsPersistStop;
}

// Test-only seed helpers ───────────────────────────────────────────────

export function __setSavedIcpsForTests(
    next: ReadonlyArray<SavedIcp>
): void {
    savedIcps.value = next;
}

export function __setDraftForTests(d: IcpDraft): void {
    draft.value = d;
}
