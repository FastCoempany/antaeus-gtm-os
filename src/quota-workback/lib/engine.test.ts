import { describe, expect, it } from "vitest";
import {
    benchmarkFor,
    computeMetrics,
    getBand,
    qualityBand
} from "./engine";
import {
    DEFAULT_INPUTS,
    EMPTY_COVERAGE,
    type CoverageSnapshot
} from "./types";

describe("getBand", () => {
    it.each([
        [0, "small"],
        [10_000, "small"],
        [29_999, "small"],
        [30_000, "mid"],
        [50_000, "mid"],
        [74_999, "mid"],
        [75_000, "enterprise"],
        [199_999, "enterprise"],
        [200_000, "strategic"],
        [500_000, "strategic"]
    ])("ACV %i → %s", (acv, band) => {
        expect(getBand(acv)).toBe(band);
    });
});

describe("benchmarkFor", () => {
    it("returns the right benchmark per ACV", () => {
        expect(benchmarkFor(50_000).label).toBe("Mid-Market");
        expect(benchmarkFor(100_000).label).toBe("Enterprise");
    });
});

describe("qualityBand", () => {
    it("≥82 ready / ≥68 workable / else thin", () => {
        expect(qualityBand(90).label).toBe("Ready now");
        expect(qualityBand(82).label).toBe("Ready now");
        expect(qualityBand(81).label).toBe("Workable");
        expect(qualityBand(68).label).toBe("Workable");
        expect(qualityBand(67).label).toBe("Thin");
        expect(qualityBand(0).label).toBe("Thin");
    });
});

describe("computeMetrics", () => {
    it("zero quota gives zero downstream", () => {
        const m = computeMetrics(DEFAULT_INPUTS, EMPTY_COVERAGE);
        expect(m.monthlyTarget).toBe(0);
        expect(m.dealsMonth).toBe(0);
        expect(m.touchesDay).toBe(0);
        expect(m.qualityScore).toBe(0);
    });

    it("realistic mid-market plan computes credible numbers", () => {
        // $1.2M quota, $50k ACV, 20% win, 35% m2o, 0.7% touch->meeting, 80% show, 20 days, 8 tpa, 90 day cycle
        const m = computeMetrics(
            {
                ...DEFAULT_INPUTS,
                quota: 1_200_000,
                acv: 50_000,
                win: 20,
                m2o: 35,
                t2m: 0.7,
                show: 80,
                days: 20,
                tpa: 8,
                cycle: 90
            },
            { ...EMPTY_COVERAGE, ratio: 3.5, hasDeals: true }
        );
        expect(m.monthlyTarget).toBe(100_000);
        expect(m.dealsMonth).toBe(2);
        expect(m.oppsMonth).toBeGreaterThanOrEqual(10);
        expect(m.meetingsMonth).toBeGreaterThanOrEqual(28);
        expect(m.touchesDay).toBeGreaterThan(0);
        expect(m.qualityScore).toBeGreaterThanOrEqual(82);
    });

    it("custom assumptions drift winState/m2oState/cycleState", () => {
        const m = computeMetrics(
            {
                ...DEFAULT_INPUTS,
                quota: 1_000_000,
                acv: 50_000,
                win: 5,
                m2o: 5,
                cycle: 365
            },
            EMPTY_COVERAGE
        );
        expect(m.winState).toBe("custom");
        expect(m.m2oState).toBe("custom");
        expect(m.cycleState).toBe("custom");
    });

    it("benchmark assumptions land in `benchmark` state (within tolerance)", () => {
        const m = computeMetrics(
            {
                ...DEFAULT_INPUTS,
                quota: 600_000,
                acv: 50_000,
                win: 20, // benchmark
                m2o: 35, // benchmark
                cycle: 90 // benchmark
            },
            EMPTY_COVERAGE
        );
        expect(m.winState).toBe("benchmark");
        expect(m.m2oState).toBe("benchmark");
        expect(m.cycleState).toBe("benchmark");
    });

    it("quality score peaks near 100 with benchmark inputs + benchmark coverage", () => {
        const cov: CoverageSnapshot = {
            ...EMPTY_COVERAGE,
            ratio: 3.5,
            hasDeals: true
        };
        const m = computeMetrics(
            {
                ...DEFAULT_INPUTS,
                quota: 600_000,
                acv: 50_000,
                win: 20,
                m2o: 35,
                cycle: 90
            },
            cov
        );
        expect(m.qualityScore).toBe(100);
    });

    it("clamps quality to 0-100 range", () => {
        const m = computeMetrics(
            { ...DEFAULT_INPUTS, quota: 1_000, acv: 50_000 },
            EMPTY_COVERAGE
        );
        expect(m.qualityScore).toBeGreaterThanOrEqual(0);
        expect(m.qualityScore).toBeLessThanOrEqual(100);
    });
});
