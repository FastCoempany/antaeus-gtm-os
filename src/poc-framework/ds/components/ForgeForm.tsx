import type { JSX } from "preact";
import {
    Button,
    FormField,
    Kicker,
    SegmentedControl,
    Select,
    TextInput,
    Textarea
} from "@/components";
import { t } from "@/lib/voice/t";
import {
    draft,
    linkedDeals,
    patchDraft,
    saveDraft,
    setDurationDays,
    setOutcome
} from "../../state";
import {
    OUTCOMES,
    type DurationDays,
    type Outcome
} from "../../lib/types";
import { saveProof } from "../../lib/cloud-persistence";

/**
 * ForgeForm — the subordinate controls of the PoC Decision Bench. The
 * forge that shapes the molds: account, vendor, readout owner, the linked
 * deal, the success criteria, the kill rules, the window, the outcome. It
 * serves the proof object; the object does not serve it (canon §4.15:
 * builder controls support the object). State flows through the draft
 * signal; the cast recomputes live.
 */

const OUTCOME_LABELS: Record<Outcome, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    converted: "Converted",
    failed: "Failed"
};
const OUTCOME_OPTS = OUTCOMES.map((o) => ({ value: o, label: OUTCOME_LABELS[o] }));
const DURATION_OPTS: ReadonlyArray<{ key: string; label: string }> = [
    { key: "7", label: t("7-day") },
    { key: "14", label: t("14-day") }
];

function onCast(): void {
    const proof = saveDraft();
    void saveProof(proof);
}

export function ForgeForm(): JSX.Element {
    const d = draft.value;
    const deals = linkedDeals.value;
    const dealOpts = [
        { value: "", label: t("— No linked deal —") },
        ...deals.map((deal) => ({
            value: deal.id,
            label: `${deal.accountName} (${deal.stage})`
        }))
    ];

    return (
        <div class="pocd-forge">
            <Kicker>{t("FORGE THE PROOF")}</Kicker>

            <FormField label={t("Account")}>
                <TextInput
                    value={d.account}
                    onInput={(account) => patchDraft({ account })}
                    placeholder={t("e.g. Acme Industries", { class: "body" })}
                />
            </FormField>

            <FormField label={t("Vendor")}>
                <TextInput
                    value={d.vendor}
                    onInput={(vendor) => patchDraft({ vendor })}
                    placeholder={t("Your product", { class: "body" })}
                />
            </FormField>

            <FormField label={t("Readout owner")}>
                <TextInput
                    value={d.readoutOwner}
                    onInput={(readoutOwner) => patchDraft({ readoutOwner })}
                    placeholder={t("e.g. Sarah Chen, VP Eng", { class: "body" })}
                />
            </FormField>

            <FormField label={t("Linked deal")}>
                <Select
                    value={d.linkedDealId}
                    onChange={(linkedDealId) => patchDraft({ linkedDealId })}
                    options={dealOpts}
                />
            </FormField>

            <FormField
                label={t("Success criteria")}
                microcopy={t("One per line — 3+ pass/fail criteria the buyer agrees to.", { class: "body" })}
            >
                <Textarea
                    rows={4}
                    value={d.successCriteria}
                    onInput={(successCriteria) => patchDraft({ successCriteria })}
                    placeholder={t("What has to be true for this to pass?", { class: "body" })}
                />
            </FormField>

            <FormField
                label={t("Kill rules")}
                microcopy={t("One per line — 2+ stop conditions for when the pilot ends without a sale.", { class: "body" })}
            >
                <Textarea
                    rows={3}
                    value={d.boundaries}
                    onInput={(boundaries) => patchDraft({ boundaries })}
                    placeholder={t("When does this stop?", { class: "body" })}
                />
            </FormField>

            {/* A button group, not a single control — NOT wrapped in a
                FormField <label> (a label forwards clicks to its first
                labelable descendant, hijacking the segment selection). */}
            <div class="ds-field">
                <span class="ds-field__label">{t("Pilot window")}</span>
                <SegmentedControl<string>
                    label={t("Pilot window")}
                    active={String(d.durationDays)}
                    onChange={(v) => setDurationDays(Number(v) as DurationDays)}
                    options={DURATION_OPTS}
                />
            </div>

            <FormField label={t("Outcome")}>
                <Select
                    value={d.outcome}
                    onChange={(v) => setOutcome(v as Outcome)}
                    options={OUTCOME_OPTS}
                />
            </FormField>

            <Button
                variant="accent"
                onClick={onCast}
                disabled={d.account.trim().length === 0}
                disabledWhy={
                    d.account.trim().length === 0
                        ? t("Name the account first.", { class: "body" })
                        : undefined
                }
            >
                {t("Cast the proof")}
            </Button>
        </div>
    );
}
