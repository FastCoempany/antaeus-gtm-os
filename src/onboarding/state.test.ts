import { beforeEach, describe, expect, it } from "vitest";
import {
    currentStep,
    draft,
    finishAndSeed,
    nextStep,
    patchDraft,
    prevStep,
    progress,
    resetSession,
    stepIndex,
    seeded,
    validation,
    jumpTo
} from "./state";
import { EMPTY_DRAFT, STEP_ORDER } from "./lib/types";

function clearStorage(): void {
    if (typeof localStorage !== "undefined") {
        for (const k of Object.keys(localStorage)) {
            if (k.startsWith("gtmos_")) localStorage.removeItem(k);
        }
    }
}

describe("initial state", () => {
    beforeEach(() => {
        clearStorage();
        resetSession();
    });

    it("starts at step 0 (thesis)", () => {
        expect(stepIndex.value).toBe(0);
        expect(currentStep.value).toBe("thesis");
    });

    it("draft is empty", () => {
        expect(draft.value).toEqual(EMPTY_DRAFT);
    });

    it("validation reflects empty draft", () => {
        expect(validation.value.canFinish).toBe(false);
        expect(validation.value.canSeedAnything).toBe(false);
    });

    it("progress reports 1/7 14% on arrival (Endowed Progress Effect)", () => {
        const p = progress.value;
        expect(p.current).toBe(1);
        expect(p.total).toBe(STEP_ORDER.length - 1);
        expect(p.pct).toBeGreaterThanOrEqual(14);
    });
});

describe("step navigation", () => {
    beforeEach(() => {
        clearStorage();
        resetSession();
    });

    it("nextStep advances by 1, capped at the last step", () => {
        nextStep();
        expect(currentStep.value).toBe("company");
        for (let i = 0; i < 100; i++) nextStep();
        expect(currentStep.value).toBe("complete");
    });

    it("prevStep goes back, floored at 0", () => {
        nextStep();
        nextStep();
        prevStep();
        expect(currentStep.value).toBe("company");
        prevStep();
        prevStep();
        expect(currentStep.value).toBe("thesis");
    });

    it("jumpTo lands on the named step", () => {
        jumpTo("icp");
        expect(currentStep.value).toBe("icp");
        jumpTo("complete");
        expect(currentStep.value).toBe("complete");
    });

    it("jumpTo unknown step is a no-op", () => {
        jumpTo("icp");
        // @ts-expect-error testing the defensive path
        jumpTo("nonsense");
        expect(currentStep.value).toBe("icp");
    });
});

describe("patchDraft", () => {
    beforeEach(() => {
        clearStorage();
        resetSession();
    });

    it("merges changes", () => {
        patchDraft({ companyName: "Antaeus" });
        expect(draft.value.companyName).toBe("Antaeus");
        patchDraft({ role: "founder" });
        expect(draft.value.role).toBe("founder");
        expect(draft.value.companyName).toBe("Antaeus");
    });
});

describe("finishAndSeed", () => {
    beforeEach(() => {
        clearStorage();
        resetSession();
    });

    it("seeds the workspace + advances to complete", () => {
        patchDraft({
            companyName: "Antaeus",
            role: "founder",
            icpStatement: "Mid-market."
        });
        const result = finishAndSeed(1_730_000_000_000);
        expect(result.items.length).toBeGreaterThan(0);
        expect(currentStep.value).toBe("complete");
        expect(seeded.value).toBe(true);
    });

    it("empty draft still moves to complete + flags seeded=false", () => {
        const result = finishAndSeed(1_730_000_000_000);
        expect(result.items).toEqual([]);
        expect(currentStep.value).toBe("complete");
        expect(seeded.value).toBe(false);
    });
});
