import {
    ACV_BENCHMARKS,
    type AcvBand,
    type Benchmark,
    type CoverageSnapshot,
    type PlanInputs,
    type PlanMetrics,
    type QualitySignal
} from "./types";

/**
 * Phase 4 / Room 14 — quota workback engine.
 *
 * Faithful TypeScript port of the legacy `calc()` from
 * `app/quota-workback/index.html` lines 498-585. Preserves the
 * benchmark band tiers, the per-rate computation chain, and the
 * 100-point quality score formula verbatim.
 *
 * Score build-up:
 *   base 34
 *   + max(0, 24 - min(24, |win - benchmark.winRate|))
 *   + max(0, 18 - min(18, |m2o - benchmark.m2o|))
 *   + max(0, 12 - min(12, |cycle - benchmark.cycle| / 10))
 *   + max(0, 12 - min(12, |coverage.ratio - benchmark.coverage| * 6))
 *   clamped to 0-100; zero when quota or acv is unset.
 */

export function getBand(acv: number): AcvBand {
    const v = Number(acv) || 0;
    if (v >= 200_000) return "strategic";
    if (v >= 75_000) return "enterprise";
    if (v >= 30_000) return "mid";
    return "small";
}

export function benchmarkFor(acv: number): Benchmark {
    return ACV_BENCHMARKS[getBand(acv)];
}

export function qualityBand(score: number): QualitySignal {
    if (score >= 82) return { score, label: "Ready now", tone: "good" };
    if (score >= 68) return { score, label: "Workable", tone: "warn" };
    return { score, label: "Thin", tone: "bad" };
}

function ceilDiv(a: number, b: number): number {
    return b > 0 ? Math.ceil(a / b) : 0;
}

function round1(n: number): number {
    return Math.round((Number(n) || 0) * 10) / 10;
}

function assumptionState(
    user: number,
    benchmark: number,
    tolerance = 0.12
): "benchmark" | "custom" {
    if (!benchmark) return "custom";
    return Math.abs((user - benchmark) / benchmark) <= tolerance
        ? "benchmark"
        : "custom";
}

export function computeMetrics(
    inputs: PlanInputs,
    coverage: CoverageSnapshot
): PlanMetrics {
    const benchmark = benchmarkFor(inputs.acv);
    const quota = Math.max(0, inputs.quota);
    const acv = Math.max(0, inputs.acv);
    const win = inputs.win / 100;
    const m2o = inputs.m2o / 100;
    const t2m = inputs.t2m / 100;
    const show = inputs.show / 100;
    const days = Math.max(0, inputs.days);
    const tpa = Math.max(0, inputs.tpa);
    const cycle = Math.max(0, inputs.cycle);

    const monthly = quota > 0 ? Math.round(quota / 12) : 0;
    const dealsNeeded = acv > 0 ? Math.ceil(monthly / acv) : 0;
    const oppsNeeded = win > 0 ? Math.ceil(dealsNeeded / win) : 0;
    const meetingsSched = m2o > 0 ? Math.ceil(oppsNeeded / m2o) : 0;
    const meetingsHeld = show > 0 ? Math.ceil(meetingsSched / show) : 0;
    const totalTouches = t2m > 0 ? Math.ceil(meetingsHeld / t2m) : 0;
    const activeAccounts = tpa > 0 ? Math.ceil(totalTouches / tpa) : 0;
    const touchesDay = days > 0 ? Math.ceil(totalTouches / days) : 0;
    const touchesWeek = ceilDiv(totalTouches, 4);
    const meetingsWeek = round1(meetingsSched / 4);
    const meetingPushesWeek = ceilDiv(meetingsSched, 4);
    const oppsQuarter = oppsNeeded * 3;
    const dealsQuarter = dealsNeeded * 3;
    const weeklyRevenue = ceilDiv(monthly, 4);
    const pipelineNeeded = win > 0 ? Math.round(monthly / win) : 0;
    const accountPressure = days > 0 ? round1(activeAccounts / days) : 0;

    let qualityScore = 0;
    if (quota > 0 && acv > 0) {
        qualityScore = Math.max(
            0,
            Math.min(
                100,
                34 +
                    Math.max(
                        0,
                        24 - Math.min(24, Math.abs(inputs.win - benchmark.winRate))
                    ) +
                    Math.max(
                        0,
                        18 - Math.min(18, Math.abs(inputs.m2o - benchmark.m2o))
                    ) +
                    Math.max(
                        0,
                        12 -
                            Math.min(12, Math.abs(cycle - benchmark.cycle) / 10)
                    ) +
                    Math.max(
                        0,
                        12 -
                            Math.min(
                                12,
                                Math.abs(
                                    (coverage.ratio || 0) - benchmark.coverage
                                ) * 6
                            )
                    )
            )
        );
    }

    return {
        monthlyTarget: monthly,
        weeklyRevenue,
        dealsMonth: dealsNeeded,
        dealsQuarter,
        oppsMonth: oppsNeeded,
        oppsQuarter,
        meetingsMonth: meetingsSched,
        meetingsWeek,
        meetingPushesWeek,
        touchesMonth: totalTouches,
        touchesWeek,
        touchesDay,
        activeAccounts,
        pipelineNeeded,
        accountPressure,
        qualityScore,
        winRateRaw: inputs.win,
        meetingToOppRaw: inputs.m2o,
        touchToMeetingRaw: inputs.t2m,
        showRateRaw: inputs.show,
        cycleDays: cycle,
        winState: assumptionState(inputs.win, benchmark.winRate),
        m2oState: assumptionState(inputs.m2o, benchmark.m2o, 0.15),
        cycleState: assumptionState(cycle, benchmark.cycle, 0.2)
    };
}
