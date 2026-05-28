/**
 * Deno-side mirror of src/briefing/lib/cost/tracker.ts (B.8).
 *
 * Mirror verbatim. The Node-side file is canonical + vitest-tested;
 * behavior changes caught by vitest must be hand-mirrored here.
 */

export const COST_CEILING_PIPELINE_USD = 3.0;

export const WARN_THRESHOLD = 0.8;
export const THROTTLE_THRESHOLD = 1.0;
export const PAUSE_THRESHOLD = 1.5;

export type CostState = "ok" | "warn" | "throttle" | "paused";

export interface CostSummary {
    readonly weekly_cost_usd: number;
    readonly ceiling_usd: number;
    readonly fraction_of_ceiling: number;
    readonly state: CostState;
    readonly window_start: string;
}

export interface RunCostRow {
    readonly total_cost: number;
    readonly started_at: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computeWeeklyCost(
    runs: ReadonlyArray<RunCostRow>,
    now: Date = new Date()
): number {
    const cutoff = now.getTime() - WEEK_MS;
    let sum = 0;
    for (const r of runs) {
        const t = new Date(r.started_at).getTime();
        if (!Number.isFinite(t) || t < cutoff) continue;
        if (typeof r.total_cost === "number" && Number.isFinite(r.total_cost)) {
            sum += r.total_cost;
        }
    }
    return Math.round(sum * 10000) / 10000;
}

export function determineState(
    weeklyCost: number,
    ceiling: number = COST_CEILING_PIPELINE_USD
): CostState {
    const frac = ceiling > 0 ? weeklyCost / ceiling : 0;
    if (frac >= PAUSE_THRESHOLD) return "paused";
    if (frac >= THROTTLE_THRESHOLD) return "throttle";
    if (frac >= WARN_THRESHOLD) return "warn";
    return "ok";
}

export function buildCostSummary(
    runs: ReadonlyArray<RunCostRow>,
    now: Date = new Date(),
    ceiling: number = COST_CEILING_PIPELINE_USD
): CostSummary {
    const weeklyCost = computeWeeklyCost(runs, now);
    const fraction = ceiling > 0 ? weeklyCost / ceiling : 0;
    return {
        weekly_cost_usd: weeklyCost,
        ceiling_usd: ceiling,
        fraction_of_ceiling: Number(fraction.toFixed(4)),
        state: determineState(weeklyCost, ceiling),
        window_start: new Date(now.getTime() - WEEK_MS).toISOString()
    };
}

export function shouldThrottle(state: CostState): boolean {
    return state === "throttle" || state === "paused";
}

export function shouldPause(state: CostState): boolean {
    return state === "paused";
}

export function stateLabel(state: CostState): string {
    if (state === "ok") return "Within budget";
    if (state === "warn") return "Approaching weekly ceiling";
    if (state === "throttle") return "Throttling — Sonnet substituting for Opus";
    return "Paused — runs skip until next week";
}
