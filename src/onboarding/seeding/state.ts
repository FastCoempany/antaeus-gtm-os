import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";

/**
 * Seeding flow — step controller (Earned Depth doctrine, canon Part III
 * §12; ADR-019). The Earned-Depth rebuild of onboarding: a guided,
 * payoff-gated flow that writes real data into the living rooms.
 *
 * State lives in module-level signals (no preact/hooks — the design-
 * system-composed surfaces avoid the hook-name transform).
 */

export type SeedingStepId =
    | "door"
    | "icp"
    | "accounts"
    | "wake"
    | "deals"
    | "quota"
    | "landing";

export const SEEDING_STEPS: ReadonlyArray<SeedingStepId> = [
    "door",
    "icp",
    "accounts",
    "wake",
    "deals",
    "quota",
    "landing"
];

export const seedingStep: Signal<SeedingStepId> = signal("door");

export const seedingIndex: ReadonlySignal<number> = computed(() =>
    SEEDING_STEPS.indexOf(seedingStep.value)
);

export function goToStep(id: SeedingStepId): void {
    if (SEEDING_STEPS.includes(id)) seedingStep.value = id;
}

export function nextStep(): void {
    const i = SEEDING_STEPS.indexOf(seedingStep.value);
    if (i >= 0 && i < SEEDING_STEPS.length - 1) {
        seedingStep.value = SEEDING_STEPS[i + 1]!;
    }
}

export function prevStep(): void {
    const i = SEEDING_STEPS.indexOf(seedingStep.value);
    if (i > 0) seedingStep.value = SEEDING_STEPS[i - 1]!;
}

/** @internal test reset. */
export function __resetSeedingForTests(): void {
    seedingStep.value = "door";
}
