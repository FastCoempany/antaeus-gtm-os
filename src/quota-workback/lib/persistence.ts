import { reportError } from "@/lib/observability";
import {
    DEFAULT_INPUTS,
    type AcvBand,
    type PlanInputs,
    type PlanMetrics
} from "./types";

const KEY_INPUTS = "gtmos_qw_inputs";
const KEY_OUTBOUND_SEED = "gtmos_outbound_seed";
const KEY_QUOTA_TARGETS = "gtmos_quota_targets";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const cleaned = v.replace(/[^0-9.\-]/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
}

export function loadInputs(s?: StorageLike | null): PlanInputs {
    const store = getStorage(s);
    if (!store) return DEFAULT_INPUTS;
    try {
        const raw = store.getItem(KEY_INPUTS);
        const seedRaw = store.getItem(KEY_OUTBOUND_SEED);
        const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        const seed = seedRaw
            ? (JSON.parse(seedRaw) as Record<string, unknown>)
            : {};
        return {
            quota: asNumber(saved["quota"] ?? seed["annual_quota"], 0),
            acv: asNumber(saved["acv"] ?? seed["avg_deal_size"], 50_000),
            win: asNumber(saved["win"] ?? seed["win_rate"], 20),
            m2o: asNumber(saved["m2o"], 35),
            t2m: asNumber(saved["t2m"] ?? seed["touch_to_meeting"], 0.7),
            show: asNumber(saved["show"] ?? seed["show_rate"], 80),
            days: asNumber(saved["days"], 20),
            tpa: asNumber(saved["tpa"], 8),
            cycle: asNumber(saved["cycle"] ?? seed["cycle_days"], 45)
        };
    } catch (err) {
        reportError(err, { op: "quota.loadInputs" });
        return DEFAULT_INPUTS;
    }
}

export interface SaveOutputsArgs {
    readonly inputs: PlanInputs;
    readonly metrics: PlanMetrics;
    readonly band: AcvBand;
    readonly coverageTarget: number;
    readonly qualityLabel: string;
}

export function saveOutputs(
    args: SaveOutputsArgs,
    s?: StorageLike | null
): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(KEY_INPUTS, JSON.stringify(args.inputs));
        store.setItem(
            KEY_OUTBOUND_SEED,
            JSON.stringify({
                annual_quota: args.inputs.quota,
                avg_deal_size: args.inputs.acv,
                win_rate: args.inputs.win,
                touch_to_meeting: args.inputs.t2m,
                show_rate: args.inputs.show,
                cycle_days: args.inputs.cycle,
                coverage_target: args.coverageTarget,
                acv_band: args.band
            })
        );
        store.setItem(
            KEY_QUOTA_TARGETS,
            JSON.stringify({
                monthly_target: args.metrics.monthlyTarget,
                weekly_target: args.metrics.weeklyRevenue,
                deals_needed_month: args.metrics.dealsMonth,
                deals_needed_quarter: args.metrics.dealsQuarter,
                opps_needed_month: args.metrics.oppsMonth,
                opps_needed_quarter: args.metrics.oppsQuarter,
                meetings_scheduled_month: args.metrics.meetingsMonth,
                meetings_scheduled_week: args.metrics.meetingsWeek,
                touches_month: args.metrics.touchesMonth,
                touches_week: args.metrics.touchesWeek,
                touches_day: args.metrics.touchesDay,
                active_accounts: args.metrics.activeAccounts,
                pipeline_needed_month: args.metrics.pipelineNeeded,
                benchmark_band: args.band,
                quality_score: args.metrics.qualityScore,
                quality_band: args.qualityLabel
            })
        );
    } catch (err) {
        reportError(err, { op: "quota.saveOutputs" });
    }
}
