import type { JSX } from "preact";
import type { AccentRole } from "@/components";
import { Meter } from "@/components";
import { t } from "@/lib/voice/t";
import { costSummary, costSummaryLoaded } from "../../state";
import { stateLabel, type CostState } from "../../lib/cost/tracker";

/**
 * BriefingFooterDS (B.8) — the cost-telemetry strip on the library
 * Meter. The trust signal IS the presence of the bar, so it renders
 * whenever the summary has loaded. The Meter's read sentence carries
 * the spend vs the ceiling; the tone tracks the degradation band
 * (ok blue / warn + throttle amber / paused red).
 */
const STATE_TONE: Record<CostState, AccentRole> = {
    ok: "blue",
    warn: "amber",
    throttle: "amber",
    paused: "red"
};

export function BriefingFooterDS(): JSX.Element | null {
    if (!costSummaryLoaded.value) return null;
    const summary = costSummary.value;
    if (!summary) return null;

    const realPct = (summary.fraction_of_ceiling * 100).toFixed(0);
    const read = `$${summary.weekly_cost_usd.toFixed(2)} of $${summary.ceiling_usd.toFixed(2)} this week · ${realPct}% · ${stateLabel(summary.state)}`;

    return (
        <footer class="bfd-cost" aria-label={t("Cost this week")}>
            <Meter
                ratio={summary.fraction_of_ceiling}
                read={read}
                tone={STATE_TONE[summary.state]}
                label={t("Cost this week")}
            />
        </footer>
    );
}
