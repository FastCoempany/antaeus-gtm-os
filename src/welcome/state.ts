import {
    computed,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_ACTIVATION,
    EMPTY_COUNTS,
    type ActivationContext,
    type NextAction,
    type WorkspaceCounts
} from "./lib/types";
import {
    buildActions,
    buildActivationModel,
    prettyRole,
    type ActivationModel
} from "./lib/engine";
import { loadActivationContext, loadCounts } from "./lib/loader";
import { loadStamp, type StampValue } from "./lib/stamp";

export const counts: Signal<WorkspaceCounts> = signal(EMPTY_COUNTS);
export const activation: Signal<ActivationContext> = signal(EMPTY_ACTIVATION);
export const stamp: Signal<StampValue> = signal({
    week: 1,
    day: 1,
    label: "Week 1 · Day 1"
});
export const loaded: Signal<boolean> = signal(false);

export const model: ReadonlySignal<ActivationModel> = computed(() =>
    buildActivationModel(counts.value)
);

export const actions: ReadonlySignal<ReadonlyArray<NextAction>> = computed(() =>
    buildActions(counts.value)
);

export const roleLabel: ReadonlySignal<string> = computed(() =>
    prettyRole(activation.value.role)
);

export function setCounts(next: WorkspaceCounts): void {
    counts.value = next;
}

export function setActivation(next: ActivationContext): void {
    activation.value = next;
}

export function refreshFromStorage(): void {
    counts.value = loadCounts();
    activation.value = loadActivationContext();
    stamp.value = loadStamp();
    loaded.value = true;
}

export function resetSession(): void {
    counts.value = EMPTY_COUNTS;
    activation.value = EMPTY_ACTIVATION;
    loaded.value = false;
}

// Test seeds
export function __setCountsForTests(next: WorkspaceCounts): void {
    counts.value = next;
}
export function __setActivationForTests(next: ActivationContext): void {
    activation.value = next;
}
