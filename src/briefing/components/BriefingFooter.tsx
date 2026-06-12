import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { costSummary, costSummaryLoaded } from "../state";
import { stateLabel } from "../lib/cost/tracker";
import type { CostState } from "../lib/cost/tracker";

/**
 * BriefingFooter (B.8) — cost telemetry strip at the bottom of the
 * Briefing room.
 *
 * Shows the rolling weekly cost vs the ceiling, the current band
 * (ok / warn / throttle / paused), and a progress bar that fills
 * as the cost climbs. The footer is always rendered when the summary
 * has loaded — never hidden — because the trust signal *is* the
 * presence of the bar, not just the warning.
 *
 * Color treatment per band:
 *   ok       → blue rule (matter-of-fact)
 *   warn     → orange rule (attention)
 *   throttle → orange rule + label (active mitigation)
 *   paused   → red rule + label (runs are skipping)
 */

function barFillClass(state: CostState): string {
    if (state === "paused") return "bf-cost__bar-fill bf-cost__bar-fill--paused";
    if (state === "throttle") return "bf-cost__bar-fill bf-cost__bar-fill--throttle";
    if (state === "warn") return "bf-cost__bar-fill bf-cost__bar-fill--warn";
    return "bf-cost__bar-fill bf-cost__bar-fill--ok";
}

function pillClass(state: CostState): string {
    if (state === "paused") return "bf-cost__pill bf-cost__pill--paused";
    if (state === "throttle") return "bf-cost__pill bf-cost__pill--throttle";
    if (state === "warn") return "bf-cost__pill bf-cost__pill--warn";
    return "bf-cost__pill bf-cost__pill--ok";
}

export function BriefingFooter(): JSX.Element | null {
    if (!costSummaryLoaded.value) return null;
    const summary = costSummary.value;
    if (!summary) return null;

    // Visual cap at 100% so a paused (150%) workspace doesn't render
    // a bar overflowing its container. The label still shows the
    // real fraction so the operator sees the actual overage.
    const fillPct = Math.min(100, summary.fraction_of_ceiling * 100);
    const realPct = (summary.fraction_of_ceiling * 100).toFixed(0);
    const label = stateLabel(summary.state);

    return (
        <footer class="bf-cost" aria-label={t("Cost this week")}>
            <div class="bf-cost__row">
                <span class="bf-cost__kicker">{t("Cost this week")}</span>
                <span class="bf-cost__amount">
                    ${summary.weekly_cost_usd.toFixed(2)} / ${summary.ceiling_usd.toFixed(2)} ·{" "}
                    {realPct}%
                </span>
                <span class={pillClass(summary.state)}>{label}</span>
            </div>
            <div class="bf-cost__bar" role="progressbar" aria-valuenow={fillPct} aria-valuemin={0} aria-valuemax={100}>
                <div class={barFillClass(summary.state)} style={`width: ${fillPct}%`} />
            </div>
        </footer>
    );
}
