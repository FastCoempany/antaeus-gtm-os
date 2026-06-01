import { computed, effect, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type {
    AutopsyDoc,
    ForensicSheetKey,
    TaskLog,
    VerdictMode,
    Vitals
} from "./lib/types";
import { MAX_LEDGER_CASES } from "./lib/types";
import type { ComputedVitals } from "./lib/vitals";
import { generateAutopsy, rankAutopsyUniverse } from "./lib/autopsy";
import { saveTaskLog, toggleTask as toggleTaskInLog } from "./lib/task-log";
import { saveTaskLogToCloud } from "./lib/cloud-persistence";

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
 * Universe ranking — Wave 3 wires the real autopsyUniverseScore
 * (2 × risk + min(stale, 60) + value/stage/qual amplifiers). Drops
 * closed deals + caps at MAX_LEDGER_CASES.
 */
export const autopsyUniverse: ReadonlySignal<ReadonlyArray<Vitals>> = computed(() => {
    return rankAutopsyUniverse(allVitals.value as ReadonlyArray<ComputedVitals>, {
        limit: MAX_LEDGER_CASES
    });
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
 * Computed autopsy doc for the selected case. Re-runs the generator
 * whenever selectedVitals changes — keeps the diagnosis honest as
 * cross-room state shifts (e.g., Deal Workspace updates a stage).
 */
export const currentAutopsy: ReadonlySignal<AutopsyDoc | null> = computed(() => {
    const v = selectedVitals.value as ComputedVitals | null;
    if (!v) return null;
    return generateAutopsy(v);
});

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

export function resetSession(): void {
    allVitals.value = [];
    loaded.value = false;
    selectedDealId.value = null;
    currentVerdictMode.value = "left";
    currentForensicSheet.value = "pattern";
    taskLog.value = {};
}

export function toggleTaskDone(dealId: string, taskId: string): void {
    taskLog.value = toggleTaskInLog(taskLog.value, dealId, taskId);
}

/** Test-only — seed the vitals list. */
export function __setAllVitalsForTests(vitals: ReadonlyArray<Vitals>): void {
    allVitals.value = vitals;
    loaded.value = true;
}

let taskLogPublishStop: (() => void) | null = null;

/**
 * Wire the side-effect that mirrors every taskLog change to
 * localStorage (gtmos_autopsy_log_v1). Skips the first run so a boot-
 * time seed doesn't trigger a redundant write.
 */
export function startTaskLogPersistence(): () => void {
    if (taskLogPublishStop) return taskLogPublishStop;
    let firstRun = true;
    const dispose = effect(() => {
        const log = taskLog.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        // localStorage stays the eager-write path — instant + survives
        // network failure. Cloud write is fire-and-forget: when cloud
        // boot has registered a client it persists; when it hasn't yet
        // the call is a safe no-op.
        saveTaskLog(log);
        void saveTaskLogToCloud(log);
    });
    taskLogPublishStop = () => {
        dispose();
        taskLogPublishStop = null;
    };
    return taskLogPublishStop;
}
