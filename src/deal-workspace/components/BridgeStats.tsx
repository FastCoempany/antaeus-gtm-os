import type { JSX } from "preact";
import {
    activeDeals,
    lostDeals,
    pipelineValue,
    topActiveDeal,
    wonDeals
} from "../state";

/**
 * BridgeStats — Wave 1 skeleton.
 *
 * The first-fold pressure summary: how many deals are active, how big
 * is the pipeline, how many won/lost so far, what's the highest-value
 * active deal. Reads directly from computed signals.
 *
 * Per canon §4.13, this is the "first-fold should expose pressure
 * fast" surface. Numbers come straight from `activeDeals`,
 * `pipelineValue`, etc. — no separate re-computation.
 */
function fmtMoney(n: number): string {
    return "$" + Number(n || 0).toLocaleString();
}

export function BridgeStats(): JSX.Element {
    const active = activeDeals.value;
    const won = wonDeals.value;
    const lost = lostDeals.value;
    const pipe = pipelineValue.value;
    const top = topActiveDeal.value;

    return (
        <section class="dw-bridge" aria-label="Workspace bridge">
            <div class="dw-bridge__cell">
                <span class="dw-bridge__label">Active</span>
                <span class="dw-bridge__value">{active.length}</span>
            </div>
            <div class="dw-bridge__cell">
                <span class="dw-bridge__label">Pipeline</span>
                <span class="dw-bridge__value">{fmtMoney(pipe)}</span>
            </div>
            <div class="dw-bridge__cell">
                <span class="dw-bridge__label">Won</span>
                <span class="dw-bridge__value">{won.length}</span>
            </div>
            <div class="dw-bridge__cell">
                <span class="dw-bridge__label">Lost</span>
                <span class="dw-bridge__value">{lost.length}</span>
            </div>
            <div class="dw-bridge__cell dw-bridge__cell--wide">
                <span class="dw-bridge__label">Top deal</span>
                <span class="dw-bridge__value">
                    {top
                        ? `${top.accountName} · ${fmtMoney(top.value)}`
                        : "—"}
                </span>
            </div>
        </section>
    );
}
