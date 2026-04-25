import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { allDeals, closeLossReason, lossReasonTarget } from "../state";
import {
    LOSS_LABELS,
    LOSS_REASONS,
    type Deal,
    type LossReason
} from "../lib/deal-shape";
import { saveDealEdit } from "../lib/persistence";

/**
 * LossReasonModal — Wave 3.
 *
 * Pops up after a save transitions a deal into closed-lost. Captures
 * the reason (5 enum options) + free-text notes and writes them back
 * to the deal row via saveDealEdit. Loss patterns feed Founding GTM /
 * Playbook win-loss section + Future Autopsy intervention.
 */
export function LossReasonModal(): JSX.Element | null {
    const target = lossReasonTarget.value;
    const [reason, setReason] = useState<LossReason | "">("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Reset draft state when a different deal is queued.
        setReason("");
        setNotes("");
        setSaving(false);
    }, [target?.dealId]);

    if (!target) return null;

    async function handleSave(): Promise<void> {
        if (!reason) return;
        const targetId = target?.dealId;
        if (!targetId) return;
        const current = allDeals.value.find((d) => d.id === targetId);
        if (!current) {
            closeLossReason();
            return;
        }
        setSaving(true);
        const next: Deal = {
            ...current,
            lossReason: reason,
            lossNotes: notes.trim() || undefined
        };
        await saveDealEdit(next);
        setSaving(false);
        closeLossReason();
    }

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
                        founding-GTM win/loss section and Future Autopsy.
                    </p>
                    <ul class="dw-loss-reasons">
                        {LOSS_REASONS.map((r) => (
                            <li key={r}>
                                <label class="dw-loss-reasons__option">
                                    <input
                                        type="radio"
                                        name="lossReason"
                                        value={r}
                                        checked={reason === r}
                                        onChange={() => setReason(r)}
                                    />
                                    <span>{LOSS_LABELS[r]}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <label class="dw-form-field dw-form-field--wide">
                        <span class="dw-form-field__label">Notes (optional)</span>
                        <textarea
                            rows={3}
                            value={notes}
                            placeholder="What changed? What would have moved this?"
                            onInput={(e) =>
                                setNotes(
                                    (e.currentTarget as HTMLTextAreaElement).value
                                )
                            }
                        />
                    </label>
                </div>

                <footer class="dw-modal__footer">
                    <button
                        type="button"
                        class="dw-modal__btn dw-modal__btn--ghost"
                        onClick={closeLossReason}
                        disabled={saving}
                    >
                        Skip for now
                    </button>
                    <button
                        type="button"
                        class="dw-modal__btn dw-modal__btn--primary"
                        onClick={handleSave}
                        disabled={!reason || saving}
                    >
                        {saving ? "Saving…" : "Save reason"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
