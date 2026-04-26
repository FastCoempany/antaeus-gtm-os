import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type {
    AutopsyDoc,
    ForensicSheetKey,
    TaskLog,
    VerdictMode,
    Vitals
} from "./lib/types";
import { MAX_LEDGER_CASES } from "./lib/types";

/**
 * Phase 4 / Room 4 — Future Autopsy runtime state.
 *
 * Per canon §4.14 the room is a forensic light-table: deals are pinned
 * as evidence, then the analysis column shows causal pattern +
 * intervention options. State signals here mirror that:
 *
 *   - autopsyUniverse — the ranked array of pinned cases (≤ 6)
 *   - selectedDealId  — drives the active pinned case
 *   - currentAutopsy  — the diagnosis output for the selected case
 *   - currentVerdictMode — left-alone vs. corrected docket
 *   - currentForensicSheet — which sheet tab is visible
 *   - taskLog — persisted task-completion state (gtmos_autopsy_log_v1)
 *
 * Wave 2 will wire deal-loading + vitals computation. Wave 5 will
 * persist the task log. Wave 1 keeps the structures empty so layout
 * + smoke test land cleanly.
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** All available vitals (sourced from Deal Workspace data in Wave 2). */
export const allVitals: Signal<ReadonlyArray<Vitals>> = signal([]);

/** Whether the initial deal load has completed. */
export const loaded: Signal<boolean> = signal(false);

// ─── View state ────────────────────────────────────────────────────────

export const selectedDealId: Signal<string | null> = signal(null);

export const currentVerdictMode: Signal<VerdictMode> = signal("left");

export const currentForensicSheet: Signal<ForensicSheetKey> = signal("pattern");

export const taskLog: Signal<TaskLog> = signal({});

// ─── Derived projections ────────────────────────────────────────────────

/**
 * Universe ranking — top N deals by autopsy urgency. Wave 3 will inject
 * the real ranker (`autopsyUniverseScore`); Wave 1 ranks by `riskScore`
 * as a placeholder so the ledger renders.
 */
export const autopsyUniverse: ReadonlySignal<ReadonlyArray<Vitals>> = computed(() => {
    const open = allVitals.value.filter((v) => !v.isClosed);
    const sorted = open.slice().sort((a, b) => {
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
        return (b.staleDays ?? 0) - (a.staleDays ?? 0);
    });
    return sorted.slice(0, MAX_LEDGER_CASES);
});

/**
 * Resolves the currently pinned case — explicit selection wins, else
 * the universe's top entry, else null.
 */
export const selectedVitals: ReadonlySignal<Vitals | null> = computed(() => {
    const id = selectedDealId.value;
    if (id) {
        const match = autopsyUniverse.value.find((v) => v.id === id);
        if (match) return match;
        // selection might point at a vital that's no longer in the top-N;
        // fall back to looking at the full universe before giving up.
        const fallback = allVitals.value.find((v) => v.id === id);
        if (fallback) return fallback;
    }
    return autopsyUniverse.value[0] ?? null;
});

/**
 * Computed autopsy doc for the selected case. Wave 3 wires the
 * generator; Wave 1 returns null to keep the layout calm.
 */
export const currentAutopsy: Signal<AutopsyDoc | null> = signal(null);

// ─── Actions ────────────────────────────────────────────────────────────

export function setAllVitals(vitals: ReadonlyArray<Vitals>): void {
    allVitals.value = vitals;
    loaded.value = true;
}

export function selectDeal(id: string | null): void {
    selectedDealId.value = id;
}

export function setVerdictMode(mode: VerdictMode): void {
    currentVerdictMode.value = mode;
}

export function setForensicSheet(key: ForensicSheetKey): void {
    currentForensicSheet.value = key;
}

export function setTaskLog(next: TaskLog): void {
    taskLog.value = next;
}

export function setCurrentAutopsy(doc: AutopsyDoc | null): void {
    currentAutopsy.value = doc;
}

export function resetSession(): void {
    allVitals.value = [];
    loaded.value = false;
    selectedDealId.value = null;
    currentVerdictMode.value = "left";
    currentForensicSheet.value = "pattern";
    taskLog.value = {};
    currentAutopsy.value = null;
}

/** Test-only — seed the vitals list. */
export function __setAllVitalsForTests(vitals: ReadonlyArray<Vitals>): void {
    allVitals.value = vitals;
    loaded.value = true;
}
