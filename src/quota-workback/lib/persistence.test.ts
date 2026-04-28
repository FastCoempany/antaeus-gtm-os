import { beforeEach, describe, expect, it } from "vitest";
import { loadInputs, saveOutputs } from "./persistence";
import {
    DEFAULT_INPUTS,
    EMPTY_COVERAGE,
    type PlanMetrics
} from "./types";
import { computeMetrics } from "./engine";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

describe("loadInputs", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("returns DEFAULT_INPUTS when nothing is stored", () => {
        expect(loadInputs(store)).toEqual(DEFAULT_INPUTS);
    });

    it("falls back to gtmos_outbound_seed when qw_inputs is missing", () => {
        store.setItem(
            "gtmos_outbound_seed",
            JSON.stringify({
                annual_quota: 600_000,
                avg_deal_size: 75_000,
                win_rate: 18,
                touch_to_meeting: 0.5,
                show_rate: 75,
                cycle_days: 100
            })
        );
        const out = loadInputs(store);
        expect(out.quota).toBe(600_000);
        expect(out.acv).toBe(75_000);
        expect(out.win).toBe(18);
        expect(out.cycle).toBe(100);
    });

    it("qw_inputs takes precedence over outbound_seed", () => {
        store.setItem(
            "gtmos_outbound_seed",
            JSON.stringify({ annual_quota: 100_000, avg_deal_size: 10_000 })
        );
        store.setItem(
            "gtmos_qw_inputs",
            JSON.stringify({
                quota: 500_000,
                acv: 50_000,
                win: 20,
                m2o: 35,
                t2m: 0.7,
                show: 80,
                days: 20,
                tpa: 8,
                cycle: 60
            })
        );
        const out = loadInputs(store);
        expect(out.quota).toBe(500_000);
        expect(out.acv).toBe(50_000);
    });

    it("returns DEFAULT_INPUTS on parse error", () => {
        store.setItem("gtmos_qw_inputs", "{not json");
        expect(loadInputs(store)).toEqual(DEFAULT_INPUTS);
    });

    it("treats string-with-commas as a number", () => {
        store.setItem(
            "gtmos_qw_inputs",
            JSON.stringify({ quota: "1,200,000", acv: "50,000" })
        );
        const out = loadInputs(store);
        expect(out.quota).toBe(1_200_000);
        expect(out.acv).toBe(50_000);
    });
});

describe("saveOutputs", () => {
    let store: FakeStorage;
    let metrics: PlanMetrics;
    beforeEach(() => {
        store = new FakeStorage();
        metrics = computeMetrics(
            { ...DEFAULT_INPUTS, quota: 600_000 },
            EMPTY_COVERAGE
        );
    });

    it("writes all 3 keys", () => {
        saveOutputs(
            {
                inputs: { ...DEFAULT_INPUTS, quota: 600_000 },
                metrics,
                band: "mid",
                coverageTarget: 3.5,
                qualityLabel: "Workable"
            },
            store
        );
        expect(store.getItem("gtmos_qw_inputs")).not.toBeNull();
        expect(store.getItem("gtmos_outbound_seed")).not.toBeNull();
        expect(store.getItem("gtmos_quota_targets")).not.toBeNull();
    });

    it("outbound seed carries acv + win + coverage target + band", () => {
        saveOutputs(
            {
                inputs: { ...DEFAULT_INPUTS, quota: 600_000, acv: 75_000, win: 18 },
                metrics,
                band: "enterprise",
                coverageTarget: 4.5,
                qualityLabel: "Workable"
            },
            store
        );
        const seed = JSON.parse(
            store.getItem("gtmos_outbound_seed") ?? "{}"
        );
        expect(seed.annual_quota).toBe(600_000);
        expect(seed.avg_deal_size).toBe(75_000);
        expect(seed.win_rate).toBe(18);
        expect(seed.coverage_target).toBe(4.5);
        expect(seed.acv_band).toBe("enterprise");
    });

    it("quota_targets carries the full metrics shape", () => {
        saveOutputs(
            {
                inputs: { ...DEFAULT_INPUTS, quota: 600_000 },
                metrics,
                band: "mid",
                coverageTarget: 3.5,
                qualityLabel: "Workable"
            },
            store
        );
        const targets = JSON.parse(
            store.getItem("gtmos_quota_targets") ?? "{}"
        );
        expect(targets.monthly_target).toBe(metrics.monthlyTarget);
        expect(targets.deals_needed_quarter).toBe(metrics.dealsQuarter);
        expect(targets.benchmark_band).toBe("mid");
        expect(targets.quality_band).toBe("Workable");
    });

    it("noops when storage is null", () => {
        expect(() =>
            saveOutputs(
                {
                    inputs: DEFAULT_INPUTS,
                    metrics,
                    band: "mid",
                    coverageTarget: 3.5,
                    qualityLabel: "Workable"
                },
                null
            )
        ).not.toThrow();
    });
});
