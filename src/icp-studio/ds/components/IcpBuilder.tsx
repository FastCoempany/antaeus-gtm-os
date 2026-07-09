import type { JSX } from "preact";
import { Button, FormField, Kicker, SegmentedControl, Select, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import {
    draft,
    patchDraft,
    patchProfileDraft,
    profileDirty,
    profileDraft,
    saveDraftAsIcp,
    setCommercialProfile,
    setRole
} from "../../state";
import type { RoleKey } from "../../lib/types";
import {
    BUYER_OPTIONS,
    GEO_OPTIONS,
    INDUSTRY_OPTIONS,
    PAIN_OPTIONS,
    PROOF_WINDOW_OPTIONS,
    SIZE_OPTIONS,
    TRIGGER_OPTIONS,
    type SelectOption
} from "../../lib/options";
import { saveIcp } from "../../lib/cloud-persistence";
import { saveProfile } from "../../lib/profile-persistence";

/**
 * IcpBuilder — the subordinate controls of the Decision Bench. The form
 * that feeds the shaped ICP object: the role, the seven targeting
 * inputs, and the operator's own selling identity. It supports the
 * object; the object does not support it (canon §4.4: builder controls
 * support the object, not the other way around). No worksheet energy —
 * the form is the quiet half. State lives in the draft signal.
 */

const ROLE_OPTIONS: ReadonlyArray<{ readonly key: RoleKey; readonly label: string }> = [
    { key: "founder", label: t("Founder") },
    { key: "firstae", label: t("First AE") }
];

function withPlaceholder(options: ReadonlyArray<SelectOption>): ReadonlyArray<SelectOption> {
    return [{ value: "", label: t("Choose…") }, ...options];
}

function onSaveIcp(): void {
    const icp = saveDraftAsIcp();
    if (icp) void saveIcp(icp);
}

function onSaveProfile(): void {
    const next = profileDraft.value;
    setCommercialProfile(next);
    void saveProfile(next);
}

export function IcpBuilder(): JSX.Element {
    const d = draft.value;
    const canSave = Boolean(
        (d.industry === "custom" ? d.industryCustom.trim() : d.industry) &&
            d.size &&
            (d.buyer === "custom" ? d.buyerCustom.trim() : d.buyer)
    );

    return (
        <div class="icpd-builder">
            <Kicker>{t("SHARPEN THE ICP")}</Kicker>

            {/* A button group, not a single control — NOT wrapped in a
                FormField <label> (a label forwards clicks to its first
                labelable descendant, hijacking the segment selection). */}
            <div class="ds-field">
                <span class="ds-field__label">{t("Operating role")}</span>
                <SegmentedControl<RoleKey>
                    label={t("Operating role")}
                    active={d.role}
                    onChange={setRole}
                    options={ROLE_OPTIONS}
                />
            </div>

            <FormField label={t("Industry")}>
                <Select
                    value={d.industry}
                    onChange={(industry) => patchDraft({ industry })}
                    options={withPlaceholder(INDUSTRY_OPTIONS)}
                />
            </FormField>
            {d.industry === "custom" ? (
                <FormField label={t("Industry name")}>
                    <TextInput
                        value={d.industryCustom}
                        onInput={(industryCustom) => patchDraft({ industryCustom })}
                        placeholder={t("Type the industry", { class: "body" })}
                    />
                </FormField>
            ) : null}

            <FormField label={t("Company size")}>
                <Select
                    value={d.size}
                    onChange={(size) => patchDraft({ size })}
                    options={withPlaceholder(SIZE_OPTIONS)}
                />
            </FormField>

            <FormField label={t("Geography")}>
                <Select
                    value={d.geo}
                    onChange={(geo) => patchDraft({ geo })}
                    options={withPlaceholder(GEO_OPTIONS)}
                />
            </FormField>

            <FormField label={t("Primary buyer")}>
                <Select
                    value={d.buyer}
                    onChange={(buyer) => patchDraft({ buyer })}
                    options={withPlaceholder(BUYER_OPTIONS)}
                />
            </FormField>
            {d.buyer === "custom" ? (
                <FormField label={t("Buyer role")}>
                    <TextInput
                        value={d.buyerCustom}
                        onInput={(buyerCustom) => patchDraft({ buyerCustom })}
                        placeholder={t("Name one owner", { class: "body" })}
                    />
                </FormField>
            ) : null}

            <FormField label={t("Primary pain")}>
                <Select
                    value={d.pain}
                    onChange={(pain) => patchDraft({ pain })}
                    options={withPlaceholder(PAIN_OPTIONS)}
                />
            </FormField>

            <FormField label={t("Trigger")}>
                <Select
                    value={d.trigger}
                    onChange={(trigger) => patchDraft({ trigger })}
                    options={withPlaceholder(TRIGGER_OPTIONS)}
                />
            </FormField>

            <FormField label={t("Evidence window")}>
                <Select
                    value={d.proofWindow}
                    onChange={(proofWindow) => patchDraft({ proofWindow })}
                    options={withPlaceholder(PROOF_WINDOW_OPTIONS)}
                />
            </FormField>

            <FormField
                label={t("Working-list size")}
                microcopy={t("How many accounts you'll work in a 30-day window.", {
                    class: "body"
                })}
            >
                <TextInput
                    type="text"
                    value={d.engineActive}
                    onInput={(engineActive) => patchDraft({ engineActive })}
                    placeholder="60"
                />
            </FormField>

            <Button
                variant="accent"
                onClick={onSaveIcp}
                disabled={!canSave}
                disabledWhy={
                    !canSave
                        ? t("Pick an industry, size, and buyer first.", { class: "body" })
                        : undefined
                }
            >
                {t("Save this ICP")}
            </Button>

            {/* What you sell — the operator's selling identity (ADR-007). */}
            <div class="icpd-profile">
                <Kicker>{t("WHAT YOU SELL")}</Kicker>
                <FormField label={t("Product category")}>
                    <TextInput
                        value={profileDraft.value.productCategory}
                        onInput={(productCategory) => patchProfileDraft({ productCategory })}
                        placeholder={t("e.g. spend management", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("What you sell")}>
                    <TextInput
                        value={profileDraft.value.whatWeSell}
                        onInput={(whatWeSell) => patchProfileDraft({ whatWeSell })}
                        placeholder={t("One plain sentence.", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Value in one line")}>
                    <TextInput
                        value={profileDraft.value.valueProp}
                        onInput={(valueProp) => patchProfileDraft({ valueProp })}
                        placeholder={t("What changes for the buyer.", { class: "body" })}
                    />
                </FormField>
                <Button
                    variant="secondary"
                    onClick={onSaveProfile}
                    disabled={!profileDirty.value}
                    disabledWhy={
                        !profileDirty.value
                            ? t("Saved.", { class: "body" })
                            : undefined
                    }
                >
                    {t("Save what you sell")}
                </Button>
            </div>
        </div>
    );
}
