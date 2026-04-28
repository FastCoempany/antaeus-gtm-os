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

export function resetSession(): void {
    inputs.value = DEFAULT_INPUTS;
    coverage.value = EMPTY_COVERAGE;
    loaded.value = false;
}

let persistStop: (() => void) | null = null;

export function startPersistence(): () => void {
    if (persistStop) return persistStop;
    let firstRun = true;
    const dispose = effect(() => {
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
