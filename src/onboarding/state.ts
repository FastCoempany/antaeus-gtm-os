import {
    computed,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_DRAFT,
    STEP_ORDER,
    type OnboardingDraft,
    type StepId
} from "./lib/types";
import { seedFromDraft, validate, type DraftValidation } from "./lib/seed";

export const draft: Signal<OnboardingDraft> = signal(EMPTY_DRAFT);
export const stepIndex: Signal<number> = signal(0);
export const seeded: Signal<boolean> = signal(false);

export const currentStep: ReadonlySignal<StepId> = computed(
    () => STEP_ORDER[stepIndex.value] ?? "complete"
);

export const progress: ReadonlySignal<{
    readonly current: number;
    readonly total: number;
    readonly pct: number;
}> = computed(() => {
    const total = STEP_ORDER.length - 1; // exclude "complete"
    const current = Math.min(stepIndex.value + 1, total);
    return {
        current,
        total,
        pct: total > 0 ? Math.round((current / total) * 100) : 0
    };
});

export const validation: ReadonlySignal<DraftValidation> = computed(() =>
    validate(draft.value)
);

export function patchDraft(part: Partial<OnboardingDraft>): void {
    draft.value = { ...draft.value, ...part };
}

export function nextStep(): void {
    stepIndex.value = Math.min(stepIndex.value + 1, STEP_ORDER.length - 1);
}

export function prevStep(): void {
    stepIndex.value = Math.max(stepIndex.value - 1, 0);
}

export function jumpTo(step: StepId): void {
    const idx = STEP_ORDER.indexOf(step);
    if (idx >= 0) stepIndex.value = idx;
}

export function finishAndSeed(now?: number): { items: ReadonlyArray<string> } {
    const result = seedFromDraft(draft.value, { now });
    seeded.value = result.seeded;
    stepIndex.value = STEP_ORDER.indexOf("complete");
    return { items: result.items };
}

export function resetSession(): void {
    draft.value = EMPTY_DRAFT;
    stepIndex.value = 0;
    seeded.value = false;
}

// Test seeds
export function __setDraftForTests(next: OnboardingDraft): void {
    draft.value = next;
}
export function __setStepForTests(index: number): void {
    stepIndex.value = index;
}
