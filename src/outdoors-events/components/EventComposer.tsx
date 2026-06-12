import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    composerBusy,
    composerError,
    composerOpen,
    closeComposer,
    draft,
    openComposer,
    patchDraft,
    saveDraft
} from "../state";
import {
    OUTDOORS_EVENT_STATUSES,
    STATUS_LABEL,
    type OutdoorsEventStatus
} from "../lib/types";
import { joinTags, parseTags } from "../lib/persistence";

/**
 * EventComposer — top-of-room working console.
 *
 * Closed state: a single "Add an event" call-to-action plus a kicker
 * explaining the room's posture. Open state: inline form for the eight
 * authored fields. Save inserts into the list above the call-to-action
 * for instant feedback.
 */
export function EventComposer(): JSX.Element {
    if (!composerOpen.value) {
        return (
            <section class="oe-composer oe-composer--closed oe-composer--secondary">
                <button
                    type="button"
                    class="oe-composer__open-btn oe-composer__open-btn--ghost"
                    onClick={openComposer}
                >
                    + Add one by hand
                </button>
                <p class="oe-composer__hint">
                    Discovery does the finding. But if you already know
                    about a gathering the system hasn't surfaced — a
                    private invite, a local hang — add it here.
                </p>
            </section>
        );
    }
    const d = draft.value;
    const busy = composerBusy.value;
    const err = composerError.value;
    return (
        <section class="oe-composer oe-composer--open" aria-label={t("New event")}>
            <header class="oe-composer__head">
                <p class="oe-composer__kicker">{t("NEW EVENT")}</p>
                <button
                    type="button"
                    class="oe-composer__close-btn"
                    onClick={closeComposer}
                    aria-label={t("Cancel")}
                    disabled={busy}
                >
                    ×
                </button>
            </header>

            {err ? (
                <p class="oe-composer__error" role="alert">
                    {err}
                </p>
            ) : null}

            <div class="oe-composer__grid">
                <label class="oe-composer__field oe-composer__field--wide">
                    <span class="oe-composer__label">{t("Event name")}</span>
                    <input
                        type="text"
                        class="oe-composer__input"
                        value={d.name}
                        onInput={(e) =>
                            patchDraft({
                                name: (e.target as HTMLInputElement).value
                            })
                        }
                        placeholder={t("e.g. RSA Conference 2026")}
                    />
                </label>

                <label class="oe-composer__field">
                    <span class="oe-composer__label">{t("Kind")}</span>
                    <input
                        type="text"
                        class="oe-composer__input"
                        value={d.kind}
                        onInput={(e) =>
                            patchDraft({
                                kind: (e.target as HTMLInputElement).value
                            })
                        }
                        placeholder={t("conference / mixer / show / hang…", { class: "body" })}
                    />
                </label>

                <label class="oe-composer__field">
                    <span class="oe-composer__label">{t("Where")}</span>
                    <input
                        type="text"
                        class="oe-composer__input"
                        value={d.whereAt}
                        onInput={(e) =>
                            patchDraft({
                                whereAt: (e.target as HTMLInputElement).value
                            })
                        }
                        placeholder={t("San Francisco, CA")}
                    />
                </label>

                <label class="oe-composer__field">
                    <span class="oe-composer__label">{t("Starts")}</span>
                    <input
                        type="date"
                        class="oe-composer__input"
                        value={d.startDate}
                        onInput={(e) =>
                            patchDraft({
                                startDate: (e.target as HTMLInputElement).value
                            })
                        }
                    />
                </label>

                <label class="oe-composer__field">
                    <span class="oe-composer__label">{t("Ends")}</span>
                    <input
                        type="date"
                        class="oe-composer__input"
                        value={d.endDate}
                        onInput={(e) =>
                            patchDraft({
                                endDate: (e.target as HTMLInputElement).value
                            })
                        }
                    />
                </label>

                <label class="oe-composer__field">
                    <span class="oe-composer__label">{t("Status")}</span>
                    <select
                        class="oe-composer__input"
                        value={d.status}
                        onChange={(e) =>
                            patchDraft({
                                status: (e.target as HTMLSelectElement)
                                    .value as OutdoorsEventStatus
                            })
                        }
                    >
                        {OUTDOORS_EVENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                            </option>
                        ))}
                    </select>
                </label>

                <label class="oe-composer__field oe-composer__field--wide">
                    <span class="oe-composer__label">{t("Tags")}</span>
                    <input
                        type="text"
                        class="oe-composer__input"
                        value={joinTags(d.tags)}
                        onInput={(e) =>
                            patchDraft({
                                tags: parseTags(
                                    (e.target as HTMLInputElement).value
                                )
                            })
                        }
                        placeholder={t("CRO, fintech, west-coast — comma-separated")}
                    />
                </label>

                <label class="oe-composer__field oe-composer__field--wide">
                    <span class="oe-composer__label">{t("Source URL")}</span>
                    <input
                        type="url"
                        class="oe-composer__input"
                        value={d.sourceUrl}
                        onInput={(e) =>
                            patchDraft({
                                sourceUrl: (e.target as HTMLInputElement).value
                            })
                        }
                        placeholder={t("https://")}
                    />
                </label>

                <label class="oe-composer__field oe-composer__field--wide">
                    <span class="oe-composer__label">{t("Notes")}</span>
                    <textarea
                        class="oe-composer__textarea"
                        value={d.notes}
                        onInput={(e) =>
                            patchDraft({
                                notes: (e.target as HTMLTextAreaElement).value
                            })
                        }
                        placeholder={t("Who you want to see there, what you're scoping…", { class: "body" })}
                        rows={3}
                    />
                </label>
            </div>

            <div class="oe-composer__actions">
                <button
                    type="button"
                    class="oe-composer__btn oe-composer__btn--ghost"
                    onClick={closeComposer}
                    disabled={busy}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="oe-composer__btn oe-composer__btn--primary"
                    onClick={() => void saveDraft()}
                    disabled={busy}
                >
                    {busy ? "Saving…" : "Save event"}
                </button>
            </div>
        </section>
    );
}
