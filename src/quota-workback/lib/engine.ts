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
 * Quota Workback calculation engine.
 *
 * The 100-point score measures alignment between the selected ACV-band
 * benchmarks, the user's conversion/cycle assumptions, and current pipeline
 * coverage. It is not a holistic judgment of sales quality or readiness.
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
    if (score >= 82) return { score, label: "Near benchmark", tone: "good" };
    if (score >= 68) return { score, label: "Mixed benchmark alignment", tone: "warn" };
    return { score, label: "Low benchmark alignment", tone: "bad" };
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

    // Work the plan at the annual level and round only once, where a whole
    // thing is needed: you close whole deals and run whole meetings, but the
    // year — not each month — is what has to add up. Rounding every month up
    // used to turn a $2M target at $250k deals into 12 deals a year (1 a
    // month) instead of the 8 the target actually needs.
    const monthly = quota > 0 ? Math.round(quota / 12) : 0;
    const wholeUp = (n: number): number => (n > 0 ? Math.ceil(n - 1e-9) : 0);
    const dealsYear = acv > 0 && quota > 0 ? wholeUp(quota / acv) : 0;
    const oppsYear = win > 0 ? wholeUp(dealsYear / win) : 0;
    const meetingsYear = m2o > 0 ? wholeUp(oppsYear / m2o) : 0;
    const meetingsHeldYear = show > 0 ? wholeUp(meetingsYear / show) : 0;
    const touchesYear = t2m > 0 ? wholeUp(meetingsHeldYear / t2m) : 0;

    const dealsNeeded = round1(dealsYear / 12);
    const oppsNeeded = round1(oppsYear / 12);
    const meetingsSched = round1(meetingsYear / 12);
    const totalTouches = wholeUp(touchesYear / 12);
    const activeAccounts = tpa > 0 ? wholeUp(totalTouches / tpa) : 0;
    const touchesDay = days > 0 ? wholeUp(touchesYear / 12 / days) : 0;
    const touchesWeek = wholeUp(touchesYear / 48);
    const meetingsWeek = round1(meetingsYear / 48);
    const meetingPushesWeek = wholeUp(meetingsYear / 48);
    const oppsQuarter = round1(oppsYear / 4);
    const dealsQuarter = round1(dealsYear / 4);
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
                        12 - Math.min(12, Math.abs(cycle - benchmark.cycle) / 10)
                    ) +
                    Math.max(
                        0,
                        12 - Math.min(12, Math.abs((coverage.ratio || 0) - benchmark.coverage) * 6)
                    )
            )
        );
    }

    return {
        monthlyTarget: monthly,
        dealsYear,
        oppsYear,
        meetingsYear,
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
