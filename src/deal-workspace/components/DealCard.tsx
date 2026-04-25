import type { JSX } from "preact";
import type { Deal } from "../lib/deal-shape";
import { STAGE_LABELS } from "../lib/deal-shape";
import { openDealEditor } from "../state";

interface DealCardProps {
    readonly deal: Deal;
    /** Optional lane tag to color-code the left edge. */
    readonly lane?: "healthy" | "at-risk" | "critical";
    /** Optional overlay text from the recovery assessment. */
    readonly note?: string;
}

function fmtMoney(n: number): string {
    return "$" + Number(n || 0).toLocaleString();
}

/**
 * DealCard — Wave 1 skeleton.
 *
 * One ticket on the intervention rail. Shows account name, value,
 * stage, next-step, and a lane-colored left edge if assigned.
 *
 * Click opens the deal-health modal (Wave 3 wires the actual modal
 * fields; Wave 1 just sets the editing signal).
 */
export function DealCard({ deal, lane, note }: DealCardProps): JSX.Element {
    return (
        <button
            type="button"
            class={`dw-card${lane ? ` dw-card--${lane}` : ""}`}
            onClick={() => openDealEditor(deal)}
        >
            <header class="dw-card__header">
                <span class="dw-card__account">{deal.accountName || "(untitled)"}</span>
                <span class="dw-card__value">{fmtMoney(deal.value)}</span>
            </header>
            <div class="dw-card__row">
                <span class="dw-card__stage">{STAGE_LABELS[deal.stage]}</span>
                {deal.momentum ? (
                    <span class={`dw-card__momentum dw-card__momentum--${deal.momentum}`}>
                        {deal.momentum}
                    </span>
                ) : null}
            </div>
            {deal.nextStep ? (
                <p class="dw-card__next-step">
                    <span class="dw-card__next-step-label">Next:</span>{" "}
                    {deal.nextStep}
                    {deal.nextStepDate ? (
                        <span class="dw-card__next-step-date">
                            {" · "}
                            {deal.nextStepDate}
                        </span>
                    ) : null}
                </p>
            ) : (
                <p class="dw-card__next-step dw-card__next-step--missing">
                    No next step set
                </p>
            )}
            {note ? <p class="dw-card__note">{note}</p> : null}
        </button>
    );
}
