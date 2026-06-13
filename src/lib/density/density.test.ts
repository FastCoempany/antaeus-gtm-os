import { afterEach, describe, expect, it } from "vitest";
import {
    DEFAULT_DENSITY_STATE,
    isDensityChangePayload,
    isDensityState,
    pickByDensity,
    setDensityState,
    showsAnnotations,
    sliceAffordances
} from "./index";

afterEach(() => {
    setDensityState(DEFAULT_DENSITY_STATE);
});

describe("density types", () => {
    it("the default state is walked-through (spec 02 §2.2)", () => {
        expect(DEFAULT_DENSITY_STATE).toBe("show_me_how");
    });

    it("isDensityState accepts only the two snake-case states", () => {
        expect(isDensityState("show_me_how")).toBe(true);
        expect(isDensityState("step_back")).toBe(true);
        expect(isDensityState("show-me-how")).toBe(false);
        expect(isDensityState("dense")).toBe(false);
    });

    it("isDensityChangePayload validates the Phase F payload shape", () => {
        expect(
            isDensityChangePayload({
                kind: "density_change",
                from_state: "show_me_how",
                to_state: "step_back",
                milestone: "first_deal_closed"
            })
        ).toBe(true);
        expect(isDensityChangePayload({ kind: "skill_default" })).toBe(false);
        expect(
            isDensityChangePayload({
                kind: "density_change",
                from_state: "x",
                to_state: "step_back"
            })
        ).toBe(false);
    });
});

describe("pickByDensity (sentence count, spec 02 §3.1)", () => {
    it("returns verbose in show_me_how, terse in step_back", () => {
        const v = { verbose: "the long read", terse: "Acme — stalled 18d." };
        expect(pickByDensity(v, "show_me_how")).toBe("the long read");
        expect(pickByDensity(v, "step_back")).toBe("Acme — stalled 18d.");
    });

    it("reads the live signal when no state is passed", () => {
        const v = { verbose: "long", terse: "short" };
        setDensityState("step_back");
        expect(pickByDensity(v)).toBe("short");
        setDensityState("show_me_how");
        expect(pickByDensity(v)).toBe("long");
    });
});

describe("sliceAffordances (affordance count, spec 02 §3.2 + 03 §4.7)", () => {
    const all = ["view", "edit", "atRisk", "note", "advisor", "premortem"];

    it("reveals everything in show_me_how", () => {
        const r = sliceAffordances(all, { state: "show_me_how" });
        expect(r.visible).toEqual(all);
        expect(r.collapsed).toEqual([]);
    });

    it("slices at the default index of two in step_back", () => {
        const r = sliceAffordances(all, { state: "step_back" });
        expect(r.visible).toEqual(["view", "edit"]);
        expect(r.collapsed).toEqual(["atRisk", "note", "advisor", "premortem"]);
    });

    it("honors a component's affordanceSliceIndex override", () => {
        const r = sliceAffordances(all, { state: "step_back", sliceIndex: 1 });
        expect(r.visible).toEqual(["view"]);
        expect(r.collapsed).toHaveLength(5);
    });
});

describe("showsAnnotations (annotation density, spec 02 §3.4)", () => {
    it("shows in show_me_how, hides in step_back", () => {
        expect(showsAnnotations("show_me_how")).toBe(true);
        expect(showsAnnotations("step_back")).toBe(false);
    });
});

describe("the live signal", () => {
    it("isStepBack tracks the state", async () => {
        const { isStepBack } = await import("./signal");
        setDensityState("step_back");
        expect(isStepBack.value).toBe(true);
        setDensityState("show_me_how");
        expect(isStepBack.value).toBe(false);
    });
});
