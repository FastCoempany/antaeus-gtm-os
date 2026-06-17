import type { JSX } from "preact";
import { Button, FormField, Kicker, Select, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import {
    accountDraft,
    allocation,
    approachDraft,
    focusDraft,
    focuses,
    patchAccountDraft,
    patchApproachDraft,
    patchThesisDraft,
    saveAccountFromDraft,
    saveApproachFromDraft,
    saveThesisFromDraft
} from "../../state";
import { ACCOUNT_CEILING, TIER_IDS, TIER_LABELS } from "../../lib/types";
import {
    saveAccount,
    saveApproach,
    saveThesis
} from "../../lib/cloud-persistence";

/**
 * TerritoryBuilder — the subordinate controls of the Decision Bench. The
 * three builders that shape the territory: name a focus (the strategic
 * bet), give it an approach (the talk-track), and add accounts under it.
 * The forms support the territory object; they don't dominate it (canon
 * §4.5). State lives in the three draft signals.
 */

const TIER_OPTIONS = TIER_IDS.map((tier) => ({
    value: tier,
    label: TIER_LABELS[tier]
}));

function focusOptions(): ReadonlyArray<{ value: string; label: string }> {
    return [
        { value: "", label: t("Choose a focus…") },
        ...focuses.value.map((f) => ({ value: f.id, label: f.title }))
    ];
}

function onSaveFocus(): void {
    const f = saveThesisFromDraft();
    if (f) void saveThesis(f);
}
function onSaveApproach(): void {
    const a = saveApproachFromDraft();
    if (a) void saveApproach(a);
}
function onSaveAccount(): void {
    const a = saveAccountFromDraft();
    if (a) void saveAccount(a);
}

export function TerritoryBuilder(): JSX.Element {
    const fd = focusDraft.value;
    const ad = approachDraft.value;
    const acd = accountDraft.value;
    const atCeiling = allocation.value.total >= ACCOUNT_CEILING;

    return (
        <div class="tad-builder">
            {/* Focus — the strategic bet. */}
            <section class="tad-form">
                <Kicker>{t("NAME A FOCUS")}</Kicker>
                <FormField label={t("Focus")}>
                    <TextInput
                        value={fd.title}
                        onInput={(title) => patchThesisDraft({ title })}
                        placeholder={t("Who you're going after", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Pressure now")}>
                    <TextInput
                        value={fd.pressure}
                        onInput={(pressure) => patchThesisDraft({ pressure })}
                        placeholder={t("Why this group is moving now", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Segment")}>
                    <TextInput
                        value={fd.segment}
                        onInput={(segment) => patchThesisDraft({ segment })}
                        placeholder={t("Industry / size / geo", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Why you")}>
                    <TextInput
                        value={fd.whyUs}
                        onInput={(whyUs) => patchThesisDraft({ whyUs })}
                        placeholder={t("Why you're the right team", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Tier")}>
                    <Select
                        value={fd.tier}
                        onChange={(tier) => patchThesisDraft({ tier: tier as typeof fd.tier })}
                        options={TIER_OPTIONS}
                    />
                </FormField>
                <Button
                    variant="accent"
                    onClick={onSaveFocus}
                    disabled={!fd.title.trim()}
                    disabledWhy={!fd.title.trim() ? t("Name the focus first.", { class: "body" }) : undefined}
                >
                    {t("Save the focus")}
                </Button>
            </section>

            {/* Approach — the talk-track for a focus. */}
            <section class="tad-form">
                <Kicker>{t("ADD AN APPROACH")}</Kicker>
                <FormField label={t("For which focus")}>
                    <Select
                        value={ad.focusId}
                        onChange={(focusId) => patchApproachDraft({ focusId })}
                        options={focusOptions()}
                    />
                </FormField>
                <FormField label={t("Approach")}>
                    <TextInput
                        value={ad.name}
                        onInput={(name) => patchApproachDraft({ name })}
                        placeholder={t("e.g. procurement-led intro", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Trigger")}>
                    <TextInput
                        value={ad.trigger}
                        onInput={(trigger) => patchApproachDraft({ trigger })}
                        placeholder={t("When to use it", { class: "body" })}
                    />
                </FormField>
                <Button
                    variant="secondary"
                    onClick={onSaveApproach}
                    disabled={!ad.name.trim() || !ad.focusId}
                    disabledWhy={
                        !ad.name.trim() || !ad.focusId
                            ? t("Pick a focus and name the approach.", { class: "body" })
                            : undefined
                    }
                >
                    {t("Save the approach")}
                </Button>
            </section>

            {/* Account — fills a focus, against the 300-cap. */}
            <section class="tad-form">
                <Kicker>{t("ADD AN ACCOUNT")}</Kicker>
                <FormField label={t("For which focus")}>
                    <Select
                        value={acd.focusId}
                        onChange={(focusId) => patchAccountDraft({ focusId })}
                        options={focusOptions()}
                    />
                </FormField>
                <FormField label={t("Account")}>
                    <TextInput
                        value={acd.name}
                        onInput={(name) => patchAccountDraft({ name })}
                        placeholder={t("Company name", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Tier")}>
                    <Select
                        value={acd.tier}
                        onChange={(tier) => patchAccountDraft({ tier: tier as typeof acd.tier })}
                        options={TIER_OPTIONS}
                    />
                </FormField>
                <Button
                    variant="secondary"
                    onClick={onSaveAccount}
                    disabled={!acd.name.trim() || !acd.focusId || atCeiling}
                    disabledWhy={
                        atCeiling
                            ? t("At the 300 ceiling. Retier or close one first.", { class: "body" })
                            : !acd.name.trim() || !acd.focusId
                              ? t("Pick a focus and name the account.", { class: "body" })
                              : undefined
                    }
                >
                    {t("Add the account")}
                </Button>
            </section>
        </div>
    );
}
