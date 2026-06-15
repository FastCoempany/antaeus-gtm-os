import type { JSX } from "preact";
import { FormField, TextInput, Textarea } from "@/components";
import { t } from "@/lib/voice/t";
import {
    INDUSTRY_OPTIONS,
    PRODUCT_CATEGORY_OPTIONS,
    ROLE_OPTIONS,
    type IndustryKey,
    type ProductCategoryKey,
    type RoleKey
} from "../../lib/types";
import {
    draft,
    finishAndSeed,
    nextStep,
    patchDraft,
    prevStep,
    seeded,
    validation
} from "../../state";
import { createDataClient } from "@/lib/data-client";
import { persistOnboardingToCloud } from "../../lib/cloud";
import { DsStepShell } from "./DsStepShell";

/**
 * The eight onboarding steps composed on the library (canon §4.3). Each
 * step is intentionally narrow — one dominant move per surface — and
 * writes to the draft on input so a mid-flow refresh never loses work.
 * The selectable role / category / industry options are token-styled
 * option buttons (the library has no selectable-option primitive); a
 * button group is never wrapped in a FormField <label> (it would
 * forward clicks to its first option). Engine, validation, and the
 * finish-and-seed pipeline are unchanged.
 */

function OptionButton(props: {
    readonly selected: boolean;
    readonly label: string;
    readonly copy?: string;
    readonly compact?: boolean;
    readonly role?: "radio" | undefined;
    readonly onClick: () => void;
}): JSX.Element {
    return (
        <button
            type="button"
            {...(props.role ? { role: props.role, "aria-checked": props.selected } : { "aria-pressed": props.selected })}
            class={`obd-option${props.compact ? " obd-option--compact" : ""}${props.selected ? " is-selected" : ""}`}
            onClick={props.onClick}
        >
            <strong class="obd-option__label">{props.label}</strong>
            {props.copy ? <span class="obd-option__copy">{props.copy}</span> : null}
        </button>
    );
}

export function IntroStepDS(): JSX.Element {
    return (
        <DsStepShell
            kicker={t("STEP 1 OF 7 — WELCOME")}
            title={t("Antaeus turns the revenue work you're doing into a clear picture of what's happening.", { class: "body" })}
            subtitle={t("It's not a CRM and it's not an enablement library. Six quick answers and the workspace will already be live.", { class: "body" })}
            onNext={() => nextStep()}
            nextLabel={t("Begin")}
            hideBack
        >
            <ul class="obd-intro">
                <li>
                    <strong>{t("The dashboard wakes up live.")}</strong>{" "}
                    {t("Every answer here turns into a real Brief item before you leave Onboarding.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("You can skip any step except the first.", { class: "body" })}</strong>{" "}
                    {t("The first ask is a one-line ICP — everything else compounds off of it.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("Nothing is sent anywhere.")}</strong>{" "}
                    {t("Everything stays on this device until you wire cloud sync from Settings.", { class: "body" })}
                </li>
            </ul>
        </DsStepShell>
    );
}

export function CompanyStepDS(): JSX.Element {
    const d = draft.value;
    return (
        <DsStepShell
            kicker={t("STEP 2 OF 7 — COMPANY")}
            title={t("Your company name?")}
            subtitle={t("Lowest-friction question first. Everything else stays optional.", { class: "body" })}
            onNext={() => nextStep()}
            onBack={() => prevStep()}
        >
            <FormField
                label={t("Company name")}
                microcopy={t("Doesn't have to be the legal entity — just what your team calls itself.", { class: "body" })}
            >
                <TextInput
                    value={d.companyName}
                    onInput={(companyName) => patchDraft({ companyName })}
                    placeholder={t("e.g., Antaeus GTM", { class: "body" })}
                />
            </FormField>
        </DsStepShell>
    );
}

export function RoleStepDS(): JSX.Element {
    const d = draft.value;
    return (
        <DsStepShell
            kicker={t("STEP 3 OF 7 — ROLE")}
            title={t("Which seat are you in?")}
            subtitle={t("Role decides which surface the Dashboard centers first. Change it anytime from Settings.", { class: "body" })}
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={d.role === null}
        >
            <ul class="obd-options" role="radiogroup" aria-label={t("Role")}>
                {ROLE_OPTIONS.map((r) => (
                    <li key={r.key}>
                        <OptionButton
                            role="radio"
                            selected={d.role === r.key}
                            label={r.label}
                            copy={r.copy}
                            onClick={() => patchDraft({ role: r.key as RoleKey })}
                        />
                    </li>
                ))}
            </ul>
        </DsStepShell>
    );
}

export function CategoryStepDS(): JSX.Element {
    const d = draft.value;
    const canContinue =
        d.productCategory !== null &&
        (d.industryAgnostic || d.industries.length > 0);

    function toggleIndustry(key: IndustryKey): void {
        const exists = d.industries.includes(key);
        patchDraft({
            industries: exists
                ? d.industries.filter((k) => k !== key)
                : [...d.industries, key]
        });
    }
    function setAgnostic(on: boolean): void {
        patchDraft({ industryAgnostic: on, industries: on ? [] : d.industries });
    }

    return (
        <DsStepShell
            kicker={t("STEP 4 OF 7 — CATEGORY")}
            title={t("What do you sell, and who to?", { class: "body" })}
            subtitle={t("Two quick picks. The product category is the shape of what you sell. Industries are the verticals you sell into — pick as many as fit, or mark yourself industry-agnostic.", { class: "body" })}
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={!canContinue}
        >
            <div class="obd-fieldset">
                <p class="obd-legend">{t("The category you sell from")}</p>
                <ul class="obd-options obd-options--grid" role="radiogroup" aria-label={t("Product category")}>
                    {PRODUCT_CATEGORY_OPTIONS.map((c) => (
                        <li key={c.key}>
                            <OptionButton
                                role="radio"
                                compact
                                selected={d.productCategory === c.key}
                                label={c.label}
                                onClick={() =>
                                    patchDraft({ productCategory: c.key as ProductCategoryKey })
                                }
                            />
                        </li>
                    ))}
                </ul>
            </div>
            <div class="obd-fieldset">
                <p class="obd-legend">{t("The industries you sell into")}</p>
                <label class="obd-toggle">
                    <input
                        type="checkbox"
                        checked={d.industryAgnostic}
                        onChange={(e) =>
                            setAgnostic((e.currentTarget as HTMLInputElement).checked)
                        }
                    />
                    <span>{t("We're industry-agnostic — we sell to everyone", { class: "body" })}</span>
                </label>
                {!d.industryAgnostic ? (
                    <ul class="obd-options obd-options--grid" role="group" aria-label={t("Industries")}>
                        {INDUSTRY_OPTIONS.map((i) => (
                            <li key={i.key}>
                                <OptionButton
                                    compact
                                    selected={d.industries.includes(i.key)}
                                    label={i.label}
                                    onClick={() => toggleIndustry(i.key)}
                                />
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </DsStepShell>
    );
}

export function IcpStepDS(): JSX.Element {
    const d = draft.value;
    return (
        <DsStepShell
            kicker={t("STEP 5 OF 7 — ICP")}
            title={t("Write one sharp ICP.")}
            subtitle={t("One sentence is enough. Thin means fewer assumptions, fewer personas — that's the definition every other room runs against.", { class: "body" })}
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={d.icpStatement.trim().length === 0}
        >
            <FormField label={t("Who is this for?")}>
                <Textarea
                    rows={2}
                    value={d.icpStatement}
                    onInput={(icpStatement) => patchDraft({ icpStatement })}
                    placeholder={t("e.g., Mid-market freight forwarders in EU past their first compliance audit.", { class: "body" })}
                />
            </FormField>
            <FormField label={t("What pain do you solve? (optional)", { class: "body" })}>
                <Textarea
                    rows={2}
                    value={d.icpPain}
                    onInput={(icpPain) => patchDraft({ icpPain })}
                    placeholder={t("e.g., Compliance prep is a 3-month manual scramble.", { class: "body" })}
                />
            </FormField>
        </DsStepShell>
    );
}

export function AccountStepDS(): JSX.Element {
    const d = draft.value;
    return (
        <DsStepShell
            kicker={t("STEP 6 OF 7 — FIRST ACCOUNT", { class: "body" })}
            title={t("Pick one company that fits the ICP.", { class: "body" })}
            subtitle={t("Optional, but the workspace feels real once a named account lands in Signal Console.", { class: "body" })}
            onNext={() => nextStep()}
            onBack={() => prevStep()}
        >
            <FormField label={t("Account name (optional)")}>
                <TextInput
                    value={d.firstAccountName}
                    onInput={(firstAccountName) => patchDraft({ firstAccountName })}
                    placeholder={t("e.g., Meridian Logistics", { class: "body" })}
                />
            </FormField>
            <FormField label={t("Why now? One signal that pulled them up (optional)", { class: "body" })}>
                <TextInput
                    value={d.firstAccountSignal}
                    onInput={(firstAccountSignal) => patchDraft({ firstAccountSignal })}
                    placeholder={t("e.g., Just announced EU expansion.", { class: "body" })}
                />
            </FormField>
        </DsStepShell>
    );
}

function numHandler(field: "annualQuota" | "avgDealSize") {
    return (raw: string): void => {
        const cleaned = raw.replace(/[^0-9.]/g, "");
        const n = Number(cleaned);
        if (Number.isFinite(n)) patchDraft({ [field]: n });
    };
}

export function QuotaStepDS(): JSX.Element {
    const d = draft.value;
    const v = validation.value;
    return (
        <DsStepShell
            kicker={t("STEP 7 OF 7 — QUOTA")}
            title={t("What revenue does the year owe?")}
            subtitle={t("Quota Workback turns these into a weekly execution plan. Optional — you can fill it later.", { class: "body" })}
            onNext={() => {
                finishAndSeed();
                // ADR-007: mirror completion + answers to the cloud,
                // fire-and-forget; the synchronous localStorage seed is
                // the immediate path.
                void (async (): Promise<void> => {
                    try {
                        await persistOnboardingToCloud(createDataClient(), draft.value);
                    } catch {
                        // already reported; the local seed covers this session
                    }
                })();
            }}
            onBack={() => prevStep()}
            nextLabel={t("Finish onboarding")}
            nextDisabled={!v.canSeedAnything}
        >
            <div class="obd-form-row">
                <FormField label={t("Annual quota ($)")}>
                    <TextInput
                        value={d.annualQuota ? d.annualQuota.toLocaleString() : ""}
                        onInput={numHandler("annualQuota")}
                        placeholder={t("e.g., 1,200,000", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Avg deal size ($)")}>
                    <TextInput
                        value={d.avgDealSize ? d.avgDealSize.toLocaleString() : ""}
                        onInput={numHandler("avgDealSize")}
                        placeholder={t("e.g., 50,000", { class: "body" })}
                    />
                </FormField>
            </div>
            {v.missingRequired.length > 0 ? (
                <p class="obd-coach">
                    {t("Worth filling:")} {v.missingRequired.join(" · ")}.{" "}
                    {t("None of these block finishing — they make the Dashboard land sharper.", { class: "body" })}
                </p>
            ) : null}
        </DsStepShell>
    );
}

export function CompleteStepDS(): JSX.Element {
    const ok = seeded.value;
    return (
        <DsStepShell
            kicker={t("ONBOARDING COMPLETE")}
            title={t("The workspace is live.")}
            subtitle={
                ok
                    ? t("Your answers seeded an ICP, an account, and a quota plan. Welcome will guide the next real moves.", { class: "body" })
                    : t("Nothing was seeded — but the workspace is yours. Come back anytime.", { class: "body" })
            }
            hideBack
        >
            <div class="obd-complete">
                <a
                    class="ds-btn ds-btn--accent"
                    href="/welcome/?returnTo=%2Fonboarding%2F&returnLabel=Back%20to%20setup&fromMode=threshold&fromSurface=onboarding-complete"
                >
                    {t("Start the first move")}
                </a>
                <p class="obd-complete__alt">
                    {t("Or jump straight to")}{" "}
                    <a href="/dashboard/">{t("the Dashboard")}</a>,{" "}
                    <a href="/quota-workback/">{t("Quota Workback")}</a>,{" "}
                    {t("or")} <a href="/settings/">{t("Settings")}</a>.
                </p>
            </div>
        </DsStepShell>
    );
}
