import type { JSX } from "preact";
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
        saveProspectFromDraft();
    }

    return (
        <section class="sw-prospect-composer" aria-label="Add prospect">
            <header class="sw-section__head">
                <p class="sw-section__kicker">Push a name</p>
                <h2 class="sw-section__title">Add prospect</h2>
                <p class="sw-section__sub">
                    Stage advances automatically when the entry is strong
                    enough — leverage, contact, entry point, approach all
                    compound.
                </p>
            </header>

            <form class="sw-pc-form" onSubmit={onSubmit}>
                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">Account name *</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., Meridian Logistics"
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
                    <span class="sw-field__label">Contact name</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., Sarah Chen"
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
                    <span class="sw-field__label">Contact title</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., VP Operations"
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
                    <span class="sw-field__label">Source query</span>
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
                        <option value="">— None —</option>
                        {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                                {labelForCard(c.platform, c.intent || c.query)}
                            </option>
                        ))}
                    </select>
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">Leverage</span>
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
                    <span class="sw-field__label">Entry point</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., Warm intro from advisor at TechCrunch"
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
                    <span class="sw-field__label">Approach</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., Reference Acme proof; lead with EU compliance angle"
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
                    <span class="sw-field__label">Research notes</span>
                    <textarea
                        class="sw-field__control"
                        rows={3}
                        placeholder="What did the research turn up? At least 40 chars unlocks the full quality bonus."
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
