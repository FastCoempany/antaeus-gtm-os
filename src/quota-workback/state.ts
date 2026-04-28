import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    DEFAULT_INPUTS,
    EMPTY_COVERAGE,
    type Benchmark,
    type CoverageSnapshot,
    type PlanInputs,
    type PlanMetrics,
    type QualitySignal
} from "./lib/types";
import { benchmarkFor, computeMetrics, qualityBand } from "./lib/engine";
import { computeCoverage } from "./lib/coverage";
import { saveOutputs } from "./lib/persistence";

export const inputs: Signal<PlanInputs> = signal(DEFAULT_INPUTS);
export const coverage: Signal<CoverageSnapshot> = signal(EMPTY_COVERAGE);
export const loaded: Signal<boolean> = signal(false);

export const benchmark: ReadonlySignal<Benchmark> = computed(() =>
    benchmarkFor(inputs.value.acv)
);

export const metrics: ReadonlySignal<PlanMetrics> = computed(() =>
    computeMetrics(inputs.value, coverage.value)
);

export const quality: ReadonlySignal<QualitySignal> = computed(() =>
    qualityBand(metrics.value.qualityScore)
);

export function setInputs(next: PlanInputs): void {
    inputs.value = next;
}

export function patchInputs(part: Partial<PlanInputs>): void {
    inputs.value = { ...inputs.value, ...part };
}

export function setCoverage(next: CoverageSnapshot): void {
    coverage.value = next;
}

export function applyBenchmark(): void {
    const b = benchmark.value;
    inputs.value = {
        ...inputs.value,
        win: b.winRate,
        m2o: b.m2o,
        cycle: b.cycle
    };
}

/**
 * Recompute coverage from the live deal mirror using the current
 * quota + benchmark target multiple. Cheap; fires on every input
 * change via `startCoverageRecompute` below.
 */
export function refreshCoverage(): void {
    const q = inputs.value.quota;
    const target = benchmark.value.coverage;
    coverage.value = computeCoverage(q, undefined, target);
}

export function resetSession(): void {
    inputs.value = DEFAULT_INPUTS;
    coverage.value = EMPTY_COVERAGE;
    loaded.value = false;
}

let persistStop: (() => void) | null = null;
let coverageStop: (() => void) | null = null;
let storageListenerInstalled = false;

/**
 * Recompute coverage whenever quota or benchmark target changes, so
 * the panel + scoring stay in sync with the operator's edits. Also
 * watches for storage events so a deal added in another tab refreshes
 * the panel here without a manual reload.
 */
export function startCoverageRecompute(): () => void {
    if (coverageStop) return coverageStop;
    let firstRun = true;
    const dispose = effect(() => {
        const q = inputs.value.quota;
        const target = benchmark.value.coverage;
        if (firstRun) {
            firstRun = false;
            return;
        }
        coverage.value = computeCoverage(q, undefined, target);
    });
    let removeListener: (() => void) | null = null;
    if (typeof window !== "undefined" && !storageListenerInstalled) {
        const handler = (e: StorageEvent): void => {
            if (e.key === "gtmos_deal_workspaces" || e.key === null) {
                refreshCoverage();
            }
        };
        window.addEventListener("storage", handler);
        storageListenerInstalled = true;
        removeListener = () => {
            window.removeEventListener("storage", handler);
            storageListenerInstalled = false;
        };
    }
    coverageStop = () => {
        dispose();
        if (removeListener) removeListener();
        coverageStop = null;
    };
    return coverageStop;
}

export function startPersistence(): () => void {
    if (persistStop) return persistStop;
    // Persist current state immediately so downstream readers (Dashboard
    // command-intelligence aggregator, Readiness, Outbound seed) see the
    // hydrated values from the very first render — not only after the
    // operator edits a field. Fixes Codex P2 (gtmos_quota_targets +
    // gtmos_outbound_seed could otherwise stay stale on first load).
    const writeNow = (): void => {
        saveOutputs({
            inputs: inputs.value,
            metrics: metrics.value,
            band: benchmark.value.band,
            coverageTarget: benchmark.value.coverage,
            qualityLabel: quality.value.label
        });
    };
    writeNow();
    let firstRun = true;
    const dispose = effect(() => {
        // Subscribe to the same set of signals; first run is suppressed
        // because we just saved synchronously above.
        const i = inputs.value;
        const m = metrics.value;
        const b = benchmark.value;
        const q = quality.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveOutputs({
            inputs: i,
            metrics: m,
            band: b.band,
            coverageTarget: b.coverage,
            qualityLabel: q.label
        });
    });
    persistStop = () => {
        dispose();
        persistStop = null;
    };
    return persistStop;
}

// Test seeds
export function __setInputsForTests(next: PlanInputs): void {
    inputs.value = next;
}
export function __setCoverageForTests(next: CoverageSnapshot): void {
    coverage.value = next;
}
