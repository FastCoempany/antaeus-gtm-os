import { effect, signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, FormField, Modal, Select, Textarea } from "@/components";
import { t } from "@/lib/voice/t";
import { allDeals, closeLossReason, lossReasonTarget } from "../../state";
import { LOSS_LABELS, LOSS_REASONS, type Deal, type LossReason } from "../../lib/deal-shape";
import { saveDealEdit } from "../../lib/persistence";

/**
 * LossReasonModalDS — the loss-reason capture (canon §4.13), library-
 * composed on the Modal. Pops after a save transitions a deal into
 * closed-lost; the reason + notes write back via saveDealEdit and feed
 * Founding GTM's win/loss section + Future Autopsy. Signals-based (not
 * preact/hooks), reset per target via an effect.
 */

const reason: Signal<LossReason | ""> = signal("");
const notes: Signal<string> = signal("");
const saving: Signal<boolean> = signal(false);
let syncedId: string | null = null;

effect(() => {
    const id = lossReasonTarget.value?.dealId ?? null;
    if (id !== syncedId) {
        syncedId = id;
        reason.value = "";
        notes.value = "";
        saving.value = false;
    }
});

const REASON_OPTIONS = [
    { value: "", label: t("Pick the closest reason…") },
    ...LOSS_REASONS.map((r) => ({ value: r, label: LOSS_LABELS[r] }))
];

async function handleSave(): Promise<void> {
    const target = lossReasonTarget.value;
    const r = reason.value;
    if (!target || !r) return;
    const current = allDeals.value.find((d) => d.id === target.dealId);
    if (!current) {
        closeLossReason();
        return;
    }
    saving.value = true;
    const next: Deal = { ...current, lossReason: r, lossNotes: notes.value.trim() || undefined };
    await saveDealEdit(next);
    saving.value = false;
    closeLossReason();
}

export function LossReasonModalDS(): JSX.Element | null {
    const target = lossReasonTarget.value;
    if (!target) return null;
    const busy = saving.value;

    return (
        <Modal
            open
            onClose={closeLossReason}
            label={`${t("Loss reason")} · ${target.accountName}`}
            confirm={
                <Button
                    variant="accent"
                    onClick={() => void handleSave()}
                    disabled={!reason.value || busy}
                >
                    {busy ? t("Saving…") : t("Save the reason")}
                </Button>
            }
        >
            <div class="dwd-loss">
                <p class="ds-kicker">{`${t("LOSS REASON")} · ${target.accountName}`}</p>
                <p class="dwd-loss__hint">
                    {t(
                        "Pick the closest reason. Loss patterns feed the founding-GTM win/loss section and Future Autopsy.",
                        { class: "body" }
                    )}
                </p>
                <FormField label={t("Reason")}>
                    <Select
                        value={reason.value}
                        onChange={(r) => (reason.value = r as LossReason | "")}
                        options={REASON_OPTIONS}
                    />
                </FormField>
                <FormField label={t("Notes (optional)")}>
                    <Textarea
                        rows={3}
                        value={notes.value}
                        onInput={(v) => (notes.value = v)}
                        placeholder={t("What changed? What would have moved this?", { class: "body" })}
                    />
                </FormField>
            </div>
        </Modal>
    );
}
