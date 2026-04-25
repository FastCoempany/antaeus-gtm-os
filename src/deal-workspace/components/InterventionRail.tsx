import type { JSX } from "preact";
import { activeDeals } from "../state";
import { groupByLane, rankRecovery } from "../lib/recovery";
import { DealCard } from "./DealCard";

/**
 * InterventionRail — Wave 1 skeleton.
 *
 * Three lanes: Critical, At-risk, Healthy. Each shows ranked deal
 * cards with their lane assignment. Per canon §4.13 this is the
 * "intervention board, not a Kanban" — lane assignment is computed
 * pressure, not user-dragged status.
 *
 * Wave 2 dials up the visual fidelity; Wave 5 adds filter chips
 * (all / at-risk / stalled / this-quarter).
 */
const LANE_TITLES = {
    critical: "Critical",
    "at-risk": "At risk",
    healthy: "Healthy"
} as const;

export function InterventionRail(): JSX.Element {
    const deals = activeDeals.value;
    const ranked = rankRecovery(deals);
    const lanes = groupByLane(ranked);

    if (deals.length === 0) {
        return (
            <section class="dw-intervention" aria-label="Intervention board">
                <p class="dw-intervention__empty">
                    No active deals yet. Create your first deal to start
                    tracking pressure here.
                </p>
            </section>
        );
    }

    return (
        <section class="dw-intervention" aria-label="Intervention board">
            {(["critical", "at-risk", "healthy"] as const).map((lane) => {
                const items = lanes[lane];
                return (
                    <div key={lane} class={`dw-intervention__lane dw-intervention__lane--${lane}`}>
                        <header class="dw-intervention__lane-header">
                            <span class="dw-intervention__lane-title">
                                {LANE_TITLES[lane]}
                            </span>
                            <span class="dw-intervention__lane-count">
                                {items.length}
                            </span>
                        </header>
                        {items.length === 0 ? (
                            <p class="dw-intervention__lane-empty">—</p>
                        ) : (
                            <ul class="dw-intervention__lane-list">
                                {items.map((a) => (
                                    <li key={a.deal.id}>
                                        <DealCard
                                            deal={a.deal}
                                            lane={a.lane}
                                            note={a.causes[0] ?? a.nextMove}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </section>
    );
}
