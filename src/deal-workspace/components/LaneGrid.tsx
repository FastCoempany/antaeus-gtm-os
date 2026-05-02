import type { JSX } from "preact";
import { activeDeals } from "../state";
import { groupByLane, rankRecovery } from "../lib/recovery";

/**
 * LaneGrid — 3-lane summary strip per variant-B.
 *
 * Now / Next / Keep honest. Each lane is sentence-shaped — a state
 * label + headline + copy + meta count pair. This is the room's
 * read of the board's three operating moments at a glance.
 */
export function LaneGrid(): JSX.Element {
    const all = activeDeals.value;
    const ranked = rankRecovery(all);
    const lanes = groupByLane(ranked);

    const recoveryItems = lanes.critical.length + lanes["at-risk"].length;
    const healthyCount = lanes.healthy.length;

    let topActive = all[0] ?? null;
    for (const d of all) {
        if ((d.value || 0) > (topActive?.value || 0)) topActive = d;
    }

    let stalledCount = 0;
    for (const r of ranked) {
        if (r.causes.some((c) => /stalled|days/i.test(c))) stalledCount += 1;
    }

    return (
        <section class="dw-lane-grid" aria-label="Three operating moments">
            <div class="dw-lane">
                <p class="dw-lane__state">Now</p>
                <p class="dw-lane__headline">
                    Recover the weakest live thread
                </p>
                <p class="dw-lane__copy">
                    The board is only as honest as the deals with no dated
                    next step, overdue motion, or thin qualification.
                </p>
                <p class="dw-lane__meta">
                    <span>
                        {recoveryItems} recovery{" "}
                        {recoveryItems === 1 ? "item" : "items"}
                    </span>
                    <span>{healthyCount} healthy</span>
                </p>
            </div>
            <div class="dw-lane">
                <p class="dw-lane__state">Next</p>
                <p class="dw-lane__headline">
                    Tighten the best live opportunity
                </p>
                <p class="dw-lane__copy">
                    Use the top-valued live deal as the forcing function.
                    If it can't survive qualification pressure, the rest of
                    the board is decorative.
                </p>
                <p class="dw-lane__meta">
                    <span>{topActive?.accountName ?? "—"}</span>
                    <span>
                        {topActive?.value
                            ? `$${Math.round((topActive.value || 0) / 1000)}k`
                            : "—"}
                    </span>
                </p>
            </div>
            <div class="dw-lane">
                <p class="dw-lane__state">Keep honest</p>
                <p class="dw-lane__headline">
                    Don't let stage outrun next-step truth
                </p>
                <p class="dw-lane__copy">
                    A stage without a dated move is just optimism. Keep the
                    close path and stakeholder map in sync with reality.
                </p>
                <p class="dw-lane__meta">
                    <span>
                        {all.filter((d) => !d.nextStep || !d.nextStep.trim())
                            .length}{" "}
                        next-step gaps
                    </span>
                    <span>{stalledCount} stalled 7d+</span>
                </p>
            </div>
        </section>
    );
}
