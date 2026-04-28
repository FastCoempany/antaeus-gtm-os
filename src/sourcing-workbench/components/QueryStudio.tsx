import type { JSX } from "preact";
import {
    PLATFORM_LABELS,
    PLATFORMS,
    type Platform
} from "../lib/types";
import {
    queryCardDraft,
    queryCards,
    patchQueryCardDraft,
    saveQueryCardFromDraft,
    removeQueryCard
} from "../state";

/**
 * QueryStudio — query card composer + ledger.
 *
 * Per canon §4.6 query cards make platform-specific search reproducible
 * (LinkedIn boolean, Google operator strings, intent-data filters, etc.).
 * The composer is intentionally compact: the room's discipline is to
 * write the query, push prospects out of it, and not polish here.
 */
export function QueryStudio(): JSX.Element {
    const draft = queryCardDraft.value;
    const cards = queryCards.value;

    function onSubmit(e: Event): void {
        e.preventDefault();
        saveQueryCardFromDraft();
    }

    return (
        <section class="sw-querystudio" aria-label="Query studio">
            <header class="sw-section__head">
                <p class="sw-section__kicker">Query studio</p>
                <h2 class="sw-section__title">Cast a query</h2>
                <p class="sw-section__sub">
                    One platform, one query string, one intent. Reproducible
                    rails for the names that come next.
                </p>
            </header>

            <form class="sw-qs-form" onSubmit={onSubmit}>
                <label class="sw-field">
                    <span class="sw-field__label">Platform</span>
                    <select
                        class="sw-field__control"
                        value={draft.platform}
                        onChange={(e) =>
                            patchQueryCardDraft({
                                platform: (e.currentTarget as HTMLSelectElement)
                                    .value as Platform
                            })
                        }
                    >
                        {PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                                {PLATFORM_LABELS[p]}
                            </option>
                        ))}
                    </select>
                </label>

                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">Query string</span>
                    <textarea
                        class="sw-field__control sw-field__control--mono"
                        placeholder='e.g., ("VP Operations" OR "Director Compliance") AND "logistics" AND "EU expansion"'
                        rows={3}
                        value={draft.query}
                        onInput={(e) =>
                            patchQueryCardDraft({
                                query: (e.currentTarget as HTMLTextAreaElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">Intent</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="What are you hoping to surface?"
                        value={draft.intent}
                        onInput={(e) =>
                            patchQueryCardDraft({
                                intent: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field">
                    <span class="sw-field__label">Target ICP</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="e.g., Mid-market freight forwarders, EU"
                        value={draft.targetIcp}
                        onInput={(e) =>
                            patchQueryCardDraft({
                                targetIcp: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <label class="sw-field sw-field--span2">
                    <span class="sw-field__label">Notes</span>
                    <input
                        class="sw-field__control"
                        type="text"
                        placeholder="Refinements, exclusions, context"
                        value={draft.notes}
                        onInput={(e) =>
                            patchQueryCardDraft({
                                notes: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>

                <div class="sw-qs-actions">
                    <button
                        type="submit"
                        class="sw-btn sw-btn--primary"
                        disabled={!draft.query.trim()}
                    >
                        Save query card
                    </button>
                </div>
            </form>

            {cards.length === 0 ? (
                <p class="sw-empty">
                    No query cards yet. Write the first one above — it becomes
                    the source rail for the prospects you push next.
                </p>
            ) : (
                <ul class="sw-qs-list" aria-label="Saved query cards">
                    {cards.map((card) => (
                        <li key={card.id} class="sw-qs-card">
                            <div class="sw-qs-card__head">
                                <span
                                    class={`sw-platform sw-platform--${card.platform}`}
                                >
                                    {PLATFORM_LABELS[card.platform]}
                                </span>
                                <button
                                    type="button"
                                    class="sw-btn sw-btn--ghost-sm"
                                    onClick={() => removeQueryCard(card.id)}
                                    aria-label={`Remove ${card.intent || card.query}`}
                                >
                                    Remove
                                </button>
                            </div>
                            <div class="sw-qs-card__query">{card.query}</div>
                            {card.intent ? (
                                <div class="sw-qs-card__intent">
                                    <span class="sw-mono">Intent</span>{" "}
                                    {card.intent}
                                </div>
                            ) : null}
                            {card.targetIcp ? (
                                <div class="sw-qs-card__icp">
                                    <span class="sw-mono">ICP</span>{" "}
                                    {card.targetIcp}
                                </div>
                            ) : null}
                            {card.notes ? (
                                <div class="sw-qs-card__notes">{card.notes}</div>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
