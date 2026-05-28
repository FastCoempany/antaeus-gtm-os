import { describe, it, expect } from "vitest";
import {
    COST_CEILING_PIPELINE_USD,
    PAUSE_THRESHOLD,
    THROTTLE_THRESHOLD,
    WARN_THRESHOLD,
    type RunCostRow,
    buildCostSummary,
    computeWeeklyCost,
    determineState,
    shouldPause,
    shouldThrottle,
    stateLabel
} from "./tracker";

/**
 * B.8 — cost tracker pure logic. The state-band thresholds are the
 * load-bearing piece: an off-by-one between throttle and pause would
 * mean either the operator burns through their week on Monday or the
 * pipeline pauses too aggressively. Anchor every band.
 */

const NOW = new Date("2026-05-28T18:00:00Z");

function run(cost: number, hoursAgo: number): RunCostRow {
    return {
        total_cost: cost,
        started_at: new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000).toISOString()
    };
}

describe("computeWeeklyCost", () => {
    it("sums runs within the 7-day window", () => {
        const runs = [
            run(0.5, 6),     // 6h ago — in window
            run(0.75, 48),   // 2 days ago — in window
            run(1.0, 144)    // 6 days ago — in window
        ];
        expect(computeWeeklyCost(runs, NOW)).toBe(2.25);
    });

    it("excludes runs older than 7 days", () => {
        const runs = [
            run(0.5, 6),
            run(5.0, 8 * 24) // 8 days ago — outside window
        ];
        expect(computeWeeklyCost(runs, NOW)).toBe(0.5);
    });

    it("returns 0 for no runs", () => {
        expect(computeWeeklyCost([], NOW)).toBe(0);
    });

    it("tolerates malformed total_cost (non-numeric → 0)", () => {
        const runs = [
            run(0.5, 6),
            { total_cost: "broken" as unknown as number, started_at: NOW.toISOString() },
            { total_cost: NaN, started_at: NOW.toISOString() }
        ];
        expect(computeWeeklyCost(runs, NOW)).toBe(0.5);
    });

    it("skips runs with unparseable timestamps", () => {
        const runs = [
            run(0.5, 6),
            { total_cost: 5.0, started_at: "not-a-date" }
        ];
        expect(computeWeeklyCost(runs, NOW)).toBe(0.5);
    });
});

describe("determineState — band thresholds at the floor", () => {
    it("returns ok below 80%", () => {
        expect(determineState(0)).toBe("ok");
        expect(determineState(1.0)).toBe("ok"); // 33% of $3
        expect(determineState(2.39)).toBe("ok"); // 79.67% — under 80
    });

    it("returns warn at exactly 80% and through 99%", () => {
        expect(determineState(COST_CEILING_PIPELINE_USD * WARN_THRESHOLD)).toBe("warn");
        expect(determineState(2.5)).toBe("warn"); // 83.3%
        expect(determineState(COST_CEILING_PIPELINE_USD - 0.01)).toBe("warn");
    });

    it("returns throttle at exactly 100% and through 149%", () => {
        expect(determineState(COST_CEILING_PIPELINE_USD * THROTTLE_THRESHOLD)).toBe("throttle");
        expect(determineState(COST_CEILING_PIPELINE_USD)).toBe("throttle");
        expect(determineState(COST_CEILING_PIPELINE_USD * 1.49)).toBe("throttle");
    });

    it("returns paused at exactly 150% and above", () => {
        expect(determineState(COST_CEILING_PIPELINE_USD * PAUSE_THRESHOLD)).toBe("paused");
        expect(determineState(COST_CEILING_PIPELINE_USD * 2)).toBe("paused");
        expect(determineState(100)).toBe("paused"); // way over
    });

    it("returns ok when ceiling is 0 (defensive)", () => {
        expect(determineState(10, 0)).toBe("ok");
    });

    it("respects a custom ceiling", () => {
        expect(determineState(5, 10)).toBe("ok");       // 50%
        expect(determineState(8.5, 10)).toBe("warn");   // 85%
        expect(determineState(12, 10)).toBe("throttle"); // 120%
        expect(determineState(16, 10)).toBe("paused");   // 160%
    });
});

describe("buildCostSummary", () => {
    it("packages weekly + ceiling + fraction + state", () => {
        const runs = [run(2.5, 6)]; // 83% of $3 → warn
        const s = buildCostSummary(runs, NOW);
        expect(s.weekly_cost_usd).toBe(2.5);
        expect(s.ceiling_usd).toBe(COST_CEILING_PIPELINE_USD);
        expect(s.fraction_of_ceiling).toBeCloseTo(0.8333, 3);
        expect(s.state).toBe("warn");
    });

    it("window_start is exactly 7 days before now", () => {
        const s = buildCostSummary([], NOW);
        const start = new Date(s.window_start).getTime();
        expect(NOW.getTime() - start).toBe(7 * 24 * 60 * 60 * 1000);
    });
});

describe("shouldThrottle / shouldPause", () => {
    it("shouldThrottle is true at throttle and paused", () => {
        expect(shouldThrottle("ok")).toBe(false);
        expect(shouldThrottle("warn")).toBe(false);
        expect(shouldThrottle("throttle")).toBe(true);
        expect(shouldThrottle("paused")).toBe(true);
    });

    it("shouldPause is true only at paused", () => {
        expect(shouldPause("ok")).toBe(false);
        expect(shouldPause("warn")).toBe(false);
        expect(shouldPause("throttle")).toBe(false);
        expect(shouldPause("paused")).toBe(true);
    });
});

describe("stateLabel", () => {
    it("returns a human-readable label per band", () => {
        expect(stateLabel("ok")).toContain("budget");
        expect(stateLabel("warn")).toContain("Approaching");
        expect(stateLabel("throttle")).toContain("Sonnet");
        expect(stateLabel("paused")).toContain("next week");
    });
});

describe("threshold constants are documented + ordered", () => {
    it("warn < throttle < pause", () => {
        expect(WARN_THRESHOLD).toBeLessThan(THROTTLE_THRESHOLD);
        expect(THROTTLE_THRESHOLD).toBeLessThan(PAUSE_THRESHOLD);
    });

    it("Tier 1 ceiling matches Cost Model v0.2 §6", () => {
        expect(COST_CEILING_PIPELINE_USD).toBe(3.0);
    });
});
