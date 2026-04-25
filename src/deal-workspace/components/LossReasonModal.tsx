import type { JSX } from "preact";
import { closeLossReason, lossReasonTarget } from "../state";
import { LOSS_LABELS, LOSS_REASONS } from "../lib/deal-shape";

/**
 * LossReasonModal — Wave 1 skeleton.
 *
 * Pops up when a save transitions a deal into closed-lost. Captures
 * the reason (5 enum options) + free-text notes. Per canon §4.13,
 * loss patterns feed Founding GTM / Playbook win-loss section.
 *
 * Wave 1 renders the open/close shell. Wave 3 wires the actual capture
 * + save back to the deal row.
 */
export function LossReasonModal(): JSX.Element | null {
    const target = lossReasonTarget.value;
    if (!target) return null;

    return (
        <div class="dw-modal-overlay is-active" role="dialog" aria-modal="true">
            <div class="dw-modal dw-modal--loss">
                <header class="dw-modal__header">
                    <h2 class="dw-modal__title">
                        Loss reason · {target.accountName}
                    </h2>
                    <button
                        type="button"
                        class="dw-modal__close"
                        onClick={closeLossReason}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </header>

                <div class="dw-modal__body">
                    <p class="dw-modal__hint">
                        Pick the closest reason. Loss patterns feed the
                        founding-GTM win/loss section + drive autopsy
                        intervention.
                    </p>
                    <ul class="dw-loss-reasons">
                        {LOSS_REASONS.map((r) => (
                            <li key={r}>
                                <label class="dw-loss-reasons__option">
                                    <input
                                        type="radio"
                                        name="lossReason"
                                        value={r}
                                        disabled
                                    />
                                    <span>{LOSS_LABELS[r]}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <p class="dw-modal__hint">
                        Wave 3 wires the radio capture + textarea + save back
                        to the deal row.
                    </p>
                </div>

                <footer class="dw-modal__footer">
                    <button
                        type="button"
                        class="dw-modal__btn dw-modal__btn--ghost"
                        onClick={closeLossReason}
                    >
                        Skip for now
                    </button>
                </footer>
            </div>
        </div>
    );
}
