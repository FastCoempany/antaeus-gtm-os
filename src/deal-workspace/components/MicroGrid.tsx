import type { JSX } from "preact";
import {
    activeDeals,
    lostDeals,
    pipelineValue,
    wonDeals
} from "../state";

/**
 * MicroGrid — 3-cell stat strip below the stage-grid.
 *
 * Deal Workspace audit (2026-05): kept but tightened. Was three
 * stat tiles each with a sentence-shaped sub-line that re-stated
 * what the value already conveyed. Now: label + value, full stop.
 * Operator reads the row in 2 seconds.
 */

function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
}

export function MicroGrid(): JSX.Element {
    const active = activeDeals.value.length;
    const won = wonDeals.value.length;
    const lost = lostDeals.value.length;

    return (
        <section class="dw-micro-grid" aria-label="Workspace truth">
            <div class="dw-micro">
                <p class="dw-micro__label">Active deals</p>
                <p class="dw-micro__value">{active}</p>
            </div>
            <div class="dw-micro">
                <p class="dw-micro__label">Pipeline value</p>
                <p class="dw-micro__value">{fmtMoney(pipelineValue.value)}</p>
            </div>
            <div class="dw-micro">
                <p class="dw-micro__label">Won / lost (closed)</p>
                <p class="dw-micro__value">
                    {won} / {lost}
                </p>
            </div>
        </section>
    );
}
