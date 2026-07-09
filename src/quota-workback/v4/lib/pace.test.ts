import { describe, expect, it } from "vitest";
import { readActuals, buildBelievability, buildPace, fmtMoney } from "./pace";
import { benchmarkFor, computeMetrics } from "../../lib/engine";
import { EMPTY_COVERAGE } from "../../lib/types";
import { DEFAULT_INPUTS } from "../../lib/types";

class FakeStorage {
    private m = new Map<string, string>();
    getItem(k: string): string | null { return this.m.get(k) ?? null; }
    setItem(k: string, v: string): void { this.m.set(k, v); }
}

const NOW = new Date("2026-07-08T12:00:00");

describe("readActuals", () => {
    it("counts this month's outreach, meetings, and closes defensively", () => {
        const s = new FakeStorage();
        const iso = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString();
        s.setItem("gtmos_outbound_touches", JSON.stringify({ touches: [
            { createdAt: iso(1) }, { createdAt: iso(2) }, { createdAt: iso(40) } // 40d = last month, excluded
        ]}));
        s.setItem("gtmos_cold_call_log", JSON.stringify({ calls: [
            { createdAt: iso(1), outcome: "meeting_booked" }, { createdAt: iso(3), outcome: "voicemail" }
        ]}));
        s.setItem("gtmos_deal_workspaces", JSON.stringify([
            { id: "w", stage: "closed-won", value: 40000, updated_at: iso(2) },
            { id: "w2", stage: "closed-won", value: 60000, updated_at: iso(90) } // last quarter: YTD yes, month no
        ]));
        const a = readActuals(s, NOW);
        expect(a.meetingsThisMonth).toBe(1);
        expect(a.closedThisMonth).toBe(1);
        expect(a.closedWonYtd).toBe(100000);
        expect(a.hasActivity).toBe(true);
        expect(a.outreachPerDay).toBeGreaterThan(0);
    });

    it("degrades to zeros on an empty workspace", () => {
        const a = readActuals(new FakeStorage(), NOW);
        expect(a.hasActivity).toBe(false);
        expect(a.outreachPerDay).toBe(0);
    });
});

describe("buildBelievability", () => {
    it("calls out the one optimistic assumption + its cost", () => {
        const bench = benchmarkFor(50000);
        const inputs = { ...DEFAULT_INPUTS, quota: 1200000, acv: 50000, m2o: bench.m2o * 1.3 };
        const m = computeMetrics(inputs, EMPTY_COVERAGE);
        const b = buildBelievability(inputs, bench, m);
        expect(b.solid).toBe(false);
        expect(b.read).toContain("stretch");
        expect(b.cost).toBeTruthy();
        expect(b.fix?.key).toBe("m2o");
    });

    it("reads solid when the plan matches the benchmark", () => {
        const bench = benchmarkFor(50000);
        const inputs = { ...DEFAULT_INPUTS, quota: 1200000, acv: 50000, win: bench.winRate, m2o: bench.m2o };
        const m = computeMetrics(inputs, EMPTY_COVERAGE);
        expect(buildBelievability(inputs, bench, m).solid).toBe(true);
    });
});

describe("buildPace", () => {
    it("projects closed + weighted pipeline, reports the shortfall", () => {
        const pace = buildPace(1200000,
            { outreachPerDay: 7, meetingsThisMonth: 3, closedThisMonth: 1, closedWonYtd: 340000, hasActivity: true },
            { ratio: 2.1, weighted: 600000, raw: 1300000, needed: 780000, hasDeals: true });
        expect(pace.projected).toBe(940000);
        expect(pace.short).toBe(260000);
        expect(pace.onTarget).toBe(false);
        expect(fmtMoney(pace.projected)).toBe("$940k");
    });
});
