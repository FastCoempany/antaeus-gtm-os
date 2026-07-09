import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    LEVERAGE_LABELS,
    type LeverageKey,
    type Platform,
    PLATFORM_LABELS
} from "../lib/types";
import {
    prospectDraft,
    queryCards,
    patchProspectDraft,
    saveProspectFromDraft
} from "../state";
import { saveProspect } from "../lib/cloud-persistence";

const LEVERAGE_KEYS: ReadonlyArray<LeverageKey> = [
    "network-connection",
    "existing-proof-point",
    "market-signal",
    "geographic-advantage",
    "cold"
];

/**
 * ProspectComposer — capture a named prospect tied (optionally) to a
 * source query card. Lives next to the kanban so the operator can push
 * names while looking at the existing pipeline.
 */
export function ProspectComposer(): JSX.Element {
    const draft = prospectDraft.value;
    const cards = queryCards.value;

    function onSubmit(e: Event): void {
        e.preventDefault();
        const p = saveProspectFromDraft();
        if (p) void saveProspect(p);
    }

    return (
        <section class="sw-prospect-composer" aria-label={t("Add prospect")}>
            <header class="sw-section__head">
                <p class="sw-section__kicker">{t("PROSPECTS")}</p>
                <h2 class="sw-section__title">{t("Add a prospect.")}</h2>
                <p class="sw-section__sub">
                    The stronger the entry — contact, leverage, entry
                    point, approach — the further along the board it
                    lands.
                </p>
            </header>

            <form class="sw-pc-form" onSubmit={onSubmit}>
                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">{t("Account name *")}</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder={t("e.g., Meridian Logistics")}
                        value={draft.accountName}
                        onInput={(e) =>
                            patchProspectDraft({
                                accountName: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">{t("Contact name")}</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder={t("e.g., Sarah Chen")}
                        value={draft.contactName}
                        onInput={(e) =>
                            patchProspectDraft({
                                contactName: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">{t("Contact title")}</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder={t("e.g., VP Operations")}
                        value={draft.contactTitle}
                        onInput={(e) =>
                            patchProspectDraft({
                                contactTitle: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">{t("Source query")}</span>
                    <select
                        class="sw-field__control"
                        value={draft.sourceQueryId}
                        onChange={(e) =>
                            patchProspectDraft({
                                sourceQueryId: (e.currentTarget as HTMLSelectElement)
                                    .value
                            })
                        }
                    >
                        <option value="">{t("— None —")}</option>
                        {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                                {labelForCard(c.platform, c.intent || c.query)}
                            </option>
                        ))}
                    </select>
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">{t("Entry point")}</span>
                    <select
                        class="sw-field__control"
                        value={draft.leverage}
                        onChange={(e) =>
                            patchProspectDraft({
                                leverage: (e.currentTarget as HTMLSelectElement)
                                    .value as LeverageKey
                            })
                        }
                    >
                        {LEVERAGE_KEYS.map((k) => (
                            <option key={k} value={k}>
                                {LEVERAGE_LABELS[k]}
                            </option>
                        ))}
                    </select>
                </label>

                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">{t("Entry point")}</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder={t("e.g., Warm intro from advisor at TechCrunch", { class: "body" })}
                        value={draft.entryPoint}
                        onInput={(e) =>
                            patchProspectDraft({
                                entryPoint: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">{t("Approach")}</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder={t("e.g., Reference Acme evidence; lead with EU compliance angle", { class: "body" })}
                        value={draft.approach}
                        onInput={(e) =>
                            patchProspectDraft({
                                approach: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">{t("Research notes")}</span>
                    <textarea
                        class="sw-field__control"
                        rows={3}
                        placeholder={t("What did the research turn up? A real paragraph here advances the prospect further.", { class: "body" })}
                        value={draft.notes}
                        onInput={(e) =>
                            patchProspectDraft({
                                notes: (e.currentTarget as HTMLTextAreaElement)
                                    .value
                            })
                        }
                    />
                </label>

                <div class="sw-pc-actions">
                    <button
                        type="submit"
                        class="sw-btn sw-btn--primary"
                        disabled={!draft.accountName.trim()}
                    >
                        Save prospect
                    </button>
                </div>
            </form>
        </section>
    );
}

function labelForCard(platform: Platform, label: string): string {
    const head = PLATFORM_LABELS[platform];
    const tail = label.length > 38 ? `${label.slice(0, 35)}…` : label;
    return `${head} — ${tail}`;
}
