import type { JSX } from "preact";
import {
    activeDeals,
    lostDeals,
    pipelineValue,
    wonDeals
} from "../state";

/**
 * MicroGrid — 3-cell stat grid below the stage-grid per variant-B.
 *
 * Replaces the earlier BridgeStats horizontal stat row. The micro
 * shape (label + value + sub) renders the workspace's three sources
 * of truth: active count, raw pipeline, closed truth (won/lost).
 *
 * Sentence-shaped sub-line per micro keeps the room authored.
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
                <p class="dw-micro__sub">
                    Live opportunities still under pressure.
                </p>
            </div>
            <div class="dw-micro">
                <p class="dw-micro__label">Pipeline</p>
                <p class="dw-micro__value">
                    {fmtMoney(pipelineValue.value)}
                </p>
                <p class="dw-micro__sub">
                    Raw value before stage probability.
                </p>
            </div>
            <div class="dw-micro">
                <p class="dw-micro__label">Closed truth</p>
                <p class="dw-micro__value">
                    {won} / {lost}
                </p>
                <p class="dw-micro__sub">
                    Won versus lost keeps forecast language grounded.
                </p>
            </div>
        </section>
    );
}
