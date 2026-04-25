import type { JSX } from "preact";
import { activeDeals } from "../state";
import { rankRecovery } from "../lib/recovery";
import { openDealEditor } from "../state";
import { STAGE_LABELS } from "../lib/deal-shape";

/**
 * RecoveryQueue — Wave 1 skeleton.
 *
 * The "weakest deals first" panel. Per canon §4.13: "first-fold should
 * expose pressure fast — which deals will close-lost if I do nothing
 * this week, and what's the smallest corrective move."
 *
 * Renders the top 5 ranked at-risk + critical deals with the proposed
 * next move from `assessDeal`. Click a row to open the deal editor
 * (Wave 3 makes the editor functional).
 */
const QUEUE_LIMIT = 5;

function fmtMoney(n: number): string {
    return "$" + Number(n || 0).toLocaleString();
}

export function RecoveryQueue(): JSX.Element {
    const deals = activeDeals.value;
    const ranked = rankRecovery(deals).filter((a) => a.lane !== "healthy");
    const top = ranked.slice(0, QUEUE_LIMIT);

    return (
        <section class="dw-recovery" aria-label="Recovery queue">
            <header class="dw-recovery__header">
                <span class="dw-recovery__kicker">Recovery queue</span>
                <span class="dw-recovery__hint">
                    {ranked.length} deal{ranked.length === 1 ? "" : "s"}{" "}
                    needing intervention
                </span>
            </header>
            {top.length === 0 ? (
                <p class="dw-recovery__empty">
                    No deals are at risk right now. Pipeline is healthy — keep
                    next-step pressure tight.
                </p>
            ) : (
                <ol class="dw-recovery__list">
                    {top.map((a) => (
                        <li key={a.deal.id} class={`dw-recovery__item dw-recovery__item--${a.lane}`}>
                            <button
                                type="button"
                                class="dw-recovery__btn"
                                onClick={() => openDealEditor(a.deal)}
                            >
                                <header class="dw-recovery__btn-header">
                                    <span class="dw-recovery__account">
                                        {a.deal.accountName || "(untitled)"}
                                    </span>
                                    <span class="dw-recovery__stage">
                                        {STAGE_LABELS[a.deal.stage]}
                                    </span>
                                    <span class="dw-recovery__value">
                                        {fmtMoney(a.deal.value)}
                                    </span>
                                </header>
                                {a.causes.length > 0 ? (
                                    <p class="dw-recovery__causes">
                                        {a.causes.join(" · ")}
                                    </p>
                                ) : null}
                                <p class="dw-recovery__next-move">
                                    <strong>Next move:</strong> {a.nextMove}
                                </p>
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
