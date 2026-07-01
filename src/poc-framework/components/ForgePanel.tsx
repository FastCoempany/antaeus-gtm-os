import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    linkedDeal,
    linkedDeals,
    patchDraft,
    saveDraft,
    setDurationDays,
    setOutcome
} from "../state";
import { OUTCOMES, type DurationDays, type Outcome } from "../lib/types";
import { computeQuality } from "../lib/quality";
import { saveProof } from "../lib/cloud-persistence";
import { HeatLedger } from "./HeatLedger";

const OUTCOME_LABELS: Record<Outcome, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    converted: "Converted",
    failed: "Failed"
};

/**
 * ForgePanel — Wave 3 implementation. Left, dark "forge" half.
 *
 * Per canon §4.15: "the proof object gets forged here." The form
 * inputs (account / vendor / owner / success criteria / kill rules /
 * duration / outcome / linked deal) drive computeQuality, which
 * lights up the heat ledger below the form.
 */
export function ForgePanel(): JSX.Element {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const deals = linkedDeals.value;
    const quality = computeQuality(drft, linked);

    return (
        <section class="poc-forge" aria-label={t("Evidence forge")}>
            <header class="poc-forge__header">
                <p class="poc-forge__kicker">{t("FORGE")}</p>
                <h2 class="poc-forge__title">{t("Shape the molds.")}</h2>
            </header>

            <div class="poc-forge__form">
                <Field label={t("Account")}>
                    <input
                        type="text"
                        value={drft.account}
                        placeholder={t("e.g. Acme Industries")}
                        onInput={(e) =>
                            patchDraft({
                                account: (e.currentTarget as HTMLInputElement).value
                            })
                        }
                    />
                </Field>

                <Field label={t("Vendor")}>
                    <input
                        type="text"
                        value={drft.vendor}
                        placeholder={t("Your product")}
                        onInput={(e) =>
                            patchDraft({
                                vendor: (e.currentTarget as HTMLInputElement).value
                            })
                        }
                    />
                </Field>

                <Field label={t("Readout owner")}>
                    <input
                        type="text"
                        value={drft.readoutOwner}
                        placeholder={t("e.g. Sarah Chen, VP Eng")}
                        onInput={(e) =>
                            patchDraft({
                                readoutOwner: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </Field>

                <Field label={t("Linked deal")}>
                    <select
                        value={drft.linkedDealId}
                        onChange={(e) =>
                            patchDraft({
                                linkedDealId: (
                                    e.currentTarget as HTMLSelectElement
                                ).value
                            })
                        }
                    >
                        <option value="">{t("— No linked deal —")}</option>
                        {deals.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.accountName} ({d.stage})
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t("Success criteria (one per line)")} wide>
                    <textarea
                        rows={4}
                        value={drft.successCriteria}
                        placeholder={t("3+ pass/fail criteria the buyer agrees to.", { class: "body" })}
                        onInput={(e) =>
                            patchDraft({
                                successCriteria: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </Field>

                <Field label={t("Kill rules (one per line)")} wide>
                    <textarea
                        rows={3}
                        value={drft.boundaries}
                        placeholder={t("2+ stop conditions — when does the pilot end without a sale?", { class: "body" })}
                        onInput={(e) =>
                            patchDraft({
                                boundaries: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </Field>

                <div class="poc-forge__row">
                    <DurationToggle value={drft.durationDays} />
                    <OutcomeSelect value={drft.outcome} />
                    <button
                        type="button"
                        class="poc-forge__save"
                        disabled={!drft.account.trim()}
                        onClick={() => {
                            const proof = saveDraft();
                            void saveProof(proof);
                        }}
                    >
                        Cast proof
                    </button>
                </div>
            </div>

            <HeatLedger ledger={quality.heat} />
        </section>
    );
}

interface FieldProps {
    readonly label: string;
    readonly wide?: boolean;
    readonly children: JSX.Element | JSX.Element[];
}

function Field({ label, wide, children }: FieldProps): JSX.Element {
    return (
        <label class={`poc-field${wide ? " poc-field--wide" : ""}`}>
            <span class="poc-field__label">{label}</span>
            {children}
        </label>
    );
}

interface DurationProps {
    readonly value: DurationDays;
}

function DurationToggle({ value }: DurationProps): JSX.Element {
    const options: ReadonlyArray<DurationDays> = [7, 14];
    return (
        <div class="poc-toggle" role="group" aria-label={t("Pilot duration")}>
            <span class="poc-field__label">{t("Duration")}</span>
            <div class="poc-toggle__group">
                {options.map((days) => (
                    <button
                        key={days}
                        type="button"
                        class={`poc-toggle__btn${
                            days === value ? " is-active" : ""
                        }`}
                        aria-pressed={days === value}
                        onClick={() => setDurationDays(days)}
                    >
                        {days}d
                    </button>
                ))}
            </div>
        </div>
    );
}

interface OutcomeProps {
    readonly value: Outcome;
}

function OutcomeSelect({ value }: OutcomeProps): JSX.Element {
    return (
        <label class="poc-field">
            <span class="poc-field__label">{t("Outcome")}</span>
            <select
                value={value}
                onChange={(e) =>
                    setOutcome(
                        (e.currentTarget as HTMLSelectElement).value as Outcome
                    )
                }
            >
                {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                        {OUTCOME_LABELS[o]}
                    </option>
                ))}
            </select>
        </label>
    );
}
