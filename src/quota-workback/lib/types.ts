/**
 * Quota Workback domain types.
 *
 * PlanInputs contains the seller's target and conversion assumptions.
 * Benchmarks are selected by typical deal size (ACV band). PlanMetrics are
 * derived planning numbers; QualitySignal reports benchmark alignment, not a
 * holistic readiness judgment. CoverageSnapshot comes from Deal Workspace.
 */

export interface PlanInputs {
    readonly quota: number;
    readonly acv: number;
    /** Win rate, expressed as a percentage (0-100). */
    readonly win: number;
    /** Meeting to opportunity, expressed as a percentage (0-100). */
    readonly m2o: number;
    /** Outreach to first meeting, expressed as a percentage (0-100). */
    readonly t2m: number;
    /** Show rate, expressed as a percentage (0-100). */
    readonly show: number;
    /** Working days per month used to calculate required daily activity. */
    readonly days: number;
    /** Outreach touches per account. */
    readonly tpa: number;
    /** Average sales cycle in days. */
    readonly cycle: number;
}

export const DEFAULT_INPUTS: PlanInputs = {
    quota: 0,
    acv: 50_000,
    win: 20,
    m2o: 35,
    t2m: 2,
    show: 80,
    days: 20,
    tpa: 8,
    cycle: 45
};

export type AcvBand = "small" | "mid" | "enterprise" | "strategic";

export interface Benchmark {
    readonly band: AcvBand;
    readonly label: string;
    readonly maxAcv: number;
    /** Win rate, percentage. */
    readonly winRate: number;
    /** Average sales cycle, days. */
    readonly cycle: number;
    /** Meeting-to-opportunity conversion, percentage. */
    readonly m2o: number;
    /** Outreach-to-first-meeting conversion, percentage. */
    readonly t2m: number;
    /** Coverage multiple (e.g. 3.0x). */
    readonly coverage: number;
    readonly winRange: string;
    readonly cycleRange: string;
}

export const ACV_BENCHMARKS: Readonly<Record<AcvBand, Benchmark>> = {
    small: {
        band: "small",
        label: "SMB",
        maxAcv: 30_000,
        winRate: 25,
        cycle: 45,
        m2o: 40,
        t2m: 2.5,
        coverage: 3.0,
        winRange: "20-30%",
        cycleRange: "30-60 days"
    },
    mid: {
        band: "mid",
        label: "Mid-Market",
        maxAcv: 75_000,
        winRate: 20,
        cycle: 90,
        m2o: 35,
        t2m: 2,
        coverage: 3.5,
        winRange: "15-25%",
        cycleRange: "60-120 days"
    },
    enterprise: {
        band: "enterprise",
        label: "Enterprise",
        maxAcv: 200_000,
        winRate: 15,
        cycle: 180,
        m2o: 30,
        t2m: 1.5,
        coverage: 4.5,
        winRange: "10-18%",
        cycleRange: "120-270 days"
    },
    strategic: {
        band: "strategic",
        label: "Strategic",
        maxAcv: Number.POSITIVE_INFINITY,
        winRate: 12,
        cycle: 240,
        m2o: 25,
        t2m: 1,
        coverage: 5.0,
        winRange: "8-15%",
        cycleRange: "180-360 days"
    }
};

export interface PlanMetrics {
    readonly monthlyTarget: number;
    readonly weeklyRevenue: number;
    readonly dealsMonth: number;
    readonly dealsQuarter: number;
    readonly oppsMonth: number;
    readonly oppsQuarter: number;
    readonly meetingsMonth: number;
    readonly meetingsWeek: number;
    readonly meetingPushesWeek: number;
    readonly touchesMonth: number;
    readonly touchesWeek: number;
    readonly touchesDay: number;
    readonly activeAccounts: number;
    readonly pipelineNeeded: number;
    readonly accountPressure: number;
    readonly qualityScore: number;
    readonly winRateRaw: number;
    readonly meetingToOppRaw: number;
    readonly touchToMeetingRaw: number;
    readonly showRateRaw: number;
    readonly cycleDays: number;
    readonly winState: "benchmark" | "custom";
    readonly m2oState: "benchmark" | "custom";
    readonly cycleState: "benchmark" | "custom";
}

export type QualityTone = "good" | "warn" | "bad";

export interface QualitySignal {
    readonly score: number;
    readonly label: "Near benchmark" | "Mixed benchmark alignment" | "Low benchmark alignment";
    readonly tone: QualityTone;
}

export interface CoverageSnapshot {
    /** Coverage ratio (e.g. 3.4 = 3.4x raw pipeline against quota). */
    readonly ratio: number;
    /** Weighted pipeline value after stage probability. */
    readonly weighted: number;
    /** Raw pipeline value, sum of open deal amounts. */
    readonly raw: number;
    /** Gap-to-required-coverage dollar amount; 0 when on/over target. */
    readonly needed: number;
    /** True when coverage was computed from recorded deals. */
    readonly hasDeals: boolean;
}

export const EMPTY_COVERAGE: CoverageSnapshot = {
    ratio: 0,
    weighted: 0,
    raw: 0,
    needed: 0,
    hasDeals: false
};
