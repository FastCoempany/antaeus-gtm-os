import { beforeEach, describe, expect, it } from "vitest";
import {
    SEEDING_STEPS,
    __resetSeedingForTests,
    goToStep,
    nextStep,
    prevStep,
    seedingIndex,
    seedingStep
} from "./state";

beforeEach(() => __resetSeedingForTests());

describe("seeding step controller", () => {
    it("starts at the doorway", () => {
        expect(seedingStep.value).toBe("door");
        expect(seedingIndex.value).toBe(0);
    });

    it("walks forward through every step in order", () => {
        for (let i = 1; i < SEEDING_STEPS.length; i++) {
            nextStep();
            expect(seedingStep.value).toBe(SEEDING_STEPS[i]);
        }
    });

    it("does not run off the end", () => {
        for (let i = 0; i < SEEDING_STEPS.length + 3; i++) nextStep();
        expect(seedingStep.value).toBe(SEEDING_STEPS[SEEDING_STEPS.length - 1]);
    });

    it("does not run off the front", () => {
        prevStep();
        expect(seedingStep.value).toBe("door");
    });

    it("goToStep jumps to a valid step and ignores bogus ones", () => {
        goToStep("deals");
        expect(seedingStep.value).toBe("deals");
        // @ts-expect-error — guarding the runtime against a bad id
        goToStep("nope");
        expect(seedingStep.value).toBe("deals");
    });
});
