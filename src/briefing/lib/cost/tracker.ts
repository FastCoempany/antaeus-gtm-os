/**
 * Cost tracker (B.8) — pure logic.
 *
 * Bounds per-workspace cost at the pipeline layer. Engineering ceilings
 * (not pricing) per Cost Model v0.2 §6 — keep the briefing surface
 * trustworthy by guaranteeing one runaway prompt can't burn the
 * operator's whole week budget on a single Monday auto-run.
 *
 * State model (4 bands):
 *   ok        — < 80% of ceiling. Run normally.
 *   warn      — 80–99%. Surface in footer. Don't degrade yet.
 *   throttle  — 100–149%. Swap Sonnet for Opus on standard draft +
 *               revise + repair (the most expensive calls).
 *   paused    — >= 150%. Skip the run entirely until next week
 *               OR override flag is set.
 *
 * Week boundary is a rolling 7-day window from "now," not calendar
 * weeks. That keeps a Monday burn from being "paid off" by Tuesday's
 * calendar reset.
 *
 * The Deno mirror at supabase/functions/briefing-pipeline/cost/
 * _shared.ts keeps a verbatim copy.
 */

// ─── Ceilings (Tier 1 defaults) ────────────────────────────────

/**
 * Pipeline ceiling in USD per workspace per rolling 7-day window.
 * Tier 1 default per Cost Model v0.2 §6. A typical week is 1 Monday
 * run at ~$0.50 = 17% of ceiling; well under even with twice-weekly
 * runs. Headroom for occasional manual curls + future B.7 harness.
 *
 * Future PR moves ceilings to per-workspace settings; until then the
 * constant is tunable here.
 */
export const COST_CEILING_PIPELINE_USD = 3.0;

export const WARN_THRESHOLD = 0.8;
export const THROTTLE_THRESHOLD = 1.0;
export const PAUSE_THRESHOLD = 1.5;

// ─── Types ─────────────────────────────────────────────────────

export type CostState = "ok" | "warn" | "throttle" | "paused";

export interface CostSummary {
    readonly weekly_cost_usd: number;
    readonly ceiling_usd: number;
    readonly fraction_of_ceiling: number;
    readonly state: CostState;
    /** Rolling 7-day window start, ISO. */
    readonly window_start: string;
}

export interface RunCostRow {
    readonly total_cost: number;
    readonly started_at: string;
}

// ─── Compute ───────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sum total_cost over the last 7 days from `now`. Defensive about
 * malformed rows (non-numeric total_cost → 0; bad timestamps → skip).
 */
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

/**
 * Decide which band the workspace is in. Threshold inclusive at the
 * floor: 80% exactly = warn, 100% exactly = throttle, 150% exactly =
 * paused. The thresholds correspond to fractions of ceiling, not raw
 * dollars.
 */
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

/**
 * Build the full summary for the footer + the pipeline check. Same
 * data shape both sides read.
 */
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

// ─── Predicates the orchestrator + synthesis read ──────────────

export function shouldThrottle(state: CostState): boolean {
    return state === "throttle" || state === "paused";
}

export function shouldPause(state: CostState): boolean {
    return state === "paused";
}

/**
 * Human-readable label for the footer. Same wording the warn/throttle/
 * paused UI uses so the state and the label are tied at the source.
 */
export function stateLabel(state: CostState): string {
    if (state === "ok") return "Within budget";
    if (state === "warn") return "Approaching weekly ceiling";
    if (state === "throttle") return "Throttling — Sonnet substituting for Opus";
    return "Paused — runs skip until next week";
}
