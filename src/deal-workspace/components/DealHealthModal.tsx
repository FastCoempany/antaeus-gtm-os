import type { JSX } from "preact";
import { closeDealEditor, editingDeal } from "../state";
import { STAGE_LABELS, STAGE_IDS } from "../lib/deal-shape";

/**
 * DealHealthModal — Wave 1 skeleton.
 *
 * The 9-field deal-health form per canon §4.13: champion, EB, use case,
 * pain, competition, process, notes + forecast + momentum. Plus core
 * fields: account, value, stage, next-step, dates, stakeholders.
 *
 * Wave 1 renders an open/close shell with the top-level fields read-only
 * (just to verify the modal opens/closes correctly). Wave 3 wires the
 * full form + save → data.deals.update.
 */
function fmtMoney(n: number): string {
    return "$" + Number(n || 0).toLocaleString();
}

export function DealHealthModal(): JSX.Element | null {
    const deal = editingDeal.value;
    if (!deal) return null;

    return (
        <div class="dw-modal-overlay is-active" role="dialog" aria-modal="true">
            <div class="dw-modal">
                <header class="dw-modal__header">
                    <h2 class="dw-modal__title">
                        {deal.accountName || "(untitled deal)"}
                    </h2>
                    <button
                        type="button"
                        class="dw-modal__close"
                        onClick={closeDealEditor}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </header>

                <div class="dw-modal__body">
                    <div class="dw-modal__field">
                        <span class="dw-modal__label">Stage</span>
                        <span class="dw-modal__value">
                            {STAGE_LABELS[deal.stage]}
                        </span>
                    </div>
                    <div class="dw-modal__field">
                        <span class="dw-modal__label">Value</span>
                        <span class="dw-modal__value">{fmtMoney(deal.value)}</span>
                    </div>
                    <div class="dw-modal__field">
                        <span class="dw-modal__label">Next step</span>
                        <span class="dw-modal__value">
                            {deal.nextStep || "—"}
                            {deal.nextStepDate ? ` · ${deal.nextStepDate}` : ""}
                        </span>
                    </div>
                    <div class="dw-modal__field">
                        <span class="dw-modal__label">Champion</span>
                        <span class="dw-modal__value">
                            {deal.champion || "—"}
                        </span>
                    </div>
                    <div class="dw-modal__field">
                        <span class="dw-modal__label">Economic Buyer</span>
                        <span class="dw-modal__value">
                            {deal.economicBuyer || "—"}
                        </span>
                    </div>
                    <p class="dw-modal__hint">
                        Wave 3 wires the editable form + save. Stages currently
                        defined: {STAGE_IDS.length}.
                    </p>
                </div>

                <footer class="dw-modal__footer">
                    <button
                        type="button"
                        class="dw-modal__btn dw-modal__btn--ghost"
                        onClick={closeDealEditor}
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
