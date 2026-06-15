import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { draft, jumpTo, nextStep, resetSession, stepIndex } from "../state";
import { RoleStepDS } from "./components/StepsDS";
import { OnboardingDS } from "./OnboardingDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("OnboardingDS", () => {
    it("mounts the wayfinder + the step ladder + the first step — no pulling cell", () => {
        const { container } = render(<OnboardingDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        // a Threshold flow has no cross-room pulling cell mid-flow
        expect(container.querySelector(".ds-wayfinder__pulling")).toBeNull();
        expect(container.querySelector(".ds-progress")).not.toBeNull();
        expect(container.querySelector(".obd-step")).not.toBeNull();
    });

    it("hides Back on the intro step and shows Begin", () => {
        const { getByText, queryByText } = render(<OnboardingDS />);
        expect(getByText("Begin")).not.toBeNull();
        expect(queryByText("Back")).toBeNull();
    });

    it("the step ladder count reads 'Step N of 7', never a percent", () => {
        const { container } = render(<OnboardingDS />);
        const count = container.querySelector(".ds-progress__count")!.textContent ?? "";
        expect(count).toMatch(/Step \d of 7/);
        expect(count).not.toContain("%");
    });

    it("routes to the role step and advances the ladder", () => {
        jumpTo("role");
        const { container, getByText } = render(<OnboardingDS />);
        expect(getByText("Which seat are you in?")).not.toBeNull();
        // Back now appears (not the first step)
        expect(getByText("Back")).not.toBeNull();
        // step 3 of 7 → two done in the ladder
        const done = container.querySelectorAll(".ds-progress__step.is-done");
        expect(done.length).toBe(2);
    });
});

describe("RoleStepDS", () => {
    it("gates Continue until a role is picked, then selects it", () => {
        jumpTo("role");
        const { getByText, container } = render(<RoleStepDS />);
        const cont = getByText("Continue") as HTMLButtonElement;
        expect(cont.disabled).toBe(true);
        // pick the first role option
        const opt = container.querySelector(".obd-option") as HTMLButtonElement;
        fireEvent.click(opt);
        expect(draft.value.role).not.toBeNull();
        expect(opt.getAttribute("aria-checked")).toBe("true");
    });

    it("advancing from intro moves the step index", () => {
        render(<OnboardingDS />);
        expect(stepIndex.value).toBe(0);
        nextStep();
        expect(stepIndex.value).toBe(1);
    });
});
