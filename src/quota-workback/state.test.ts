import { beforeEach, describe, expect, it } from "vitest";
import {
    applyBenchmark,
    benchmark,
    coverage,
    inputs,
    metrics,
    patchInputs,
    quality,
    resetSession,
    setCoverage,
    setInputs
} from "./state";
import { DEFAULT_INPUTS, EMPTY_COVERAGE } from "./lib/types";

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts with default inputs + empty coverage", () => {
        expect(inputs.value).toEqual(DEFAULT_INPUTS);
        expect(coverage.value).toEqual(EMPTY_COVERAGE);
    });

    it("metrics yield zero touches/day before quota is set", () => {
        expect(metrics.value.touchesDay).toBe(0);
        expect(metrics.value.qualityScore).toBe(0);
    });

    it("benchmark resolves from default ACV (50k → mid)", () => {
        expect(benchmark.value.band).toBe("mid");
        expect(benchmark.value.label).toBe("Mid-Market");
    });
});

describe("patch inputs", () => {
    beforeEach(() => resetSession());

    it("updates fields and recomputes metrics", () => {
        patchInputs({ quota: 1_200_000 });
        expect(metrics.value.monthlyTarget).toBe(100_000);
        expect(metrics.value.touchesDay).toBeGreaterThan(0);
    });

    it("setInputs replaces wholesale", () => {
        setInputs({ ...DEFAULT_INPUTS, quota: 600_000, acv: 100_000 });
        expect(inputs.value.quota).toBe(600_000);
        expect(metrics.value.dealsMonth).toBeGreaterThan(0);
    });
});

describe("benchmark detection", () => {
    beforeEach(() => resetSession());

    it.each([
        [10_000, "small"],
        [40_000, "mid"],
        [100_000, "enterprise"],
        [400_000, "strategic"]
    ])("ACV %i → %s", (acv, band) => {
        patchInputs({ acv });
        expect(benchmark.value.band).toBe(band);
    });
});

describe("applyBenchmark", () => {
    beforeEach(() => resetSession());

    it("snaps win/m2o/cycle to the benchmark", () => {
        patchInputs({ acv: 50_000, win: 99, m2o: 5, cycle: 999 });
        applyBenchmark();
        expect(inputs.value.win).toBe(20);
        expect(inputs.value.m2o).toBe(35);
        expect(inputs.value.cycle).toBe(90);
    });

    it("does not change quota or acv", () => {
        patchInputs({ acv: 50_000, quota: 1_000_000 });
        applyBenchmark();
        expect(inputs.value.acv).toBe(50_000);
        expect(inputs.value.quota).toBe(1_000_000);
    });
});

describe("setCoverage", () => {
    beforeEach(() => resetSession());

    it("flows into quality score", () => {
        // mid benchmark coverage = 3.5x; setting ratio to 3.5 gives full
        // coverage points (12). Quality score with benchmark inputs
        // hits 100 except for any pre-set quota gap.
        patchInputs({ quota: 1_000_000 });
        applyBenchmark();
        setCoverage({
            ratio: 3.5,
            weighted: 0,
            raw: 0,
            needed: 0,
            hasDeals: true
        });
        expect(metrics.value.qualityScore).toBeGreaterThanOrEqual(82);
        expect(quality.value.label).toBe("Ready now");
    });
});

describe("quality bands", () => {
    beforeEach(() => resetSession());

    it("zero score when quota or acv unset", () => {
        expect(quality.value.label).toBe("Thin");
        expect(quality.value.score).toBe(0);
    });
});
