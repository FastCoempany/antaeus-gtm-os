import type { JSX } from "preact";
import {
    currentCompany,
    dealOptions,
    draft,
    linkedDeal,
    matchedAccount,
    setContactName,
    setLinkedDealId,
    setLinkedinUrl,
    setPersona,
    setCustomNotes,
    topSignalHeadline
} from "../state";
import {
    PERSONA_KEYS,
    PERSONA_LABELS,
    type PersonaKey
} from "../lib/types";

/**
 * Witness — Wave 3 implementation.
 *
 * The witness column IS the planner's form. Inputs flow through
 * patchDraft + the dedicated setters so the agenda spine + quality
 * recompute live as the operator types.
 *
 * Sticky to the top of the stage so the rep keeps the witness visible
 * while scrolling the agenda.
 */
export function Witness(): JSX.Element {
    const d = draft.value;
    const company = currentCompany.value;
    const account = matchedAccount.value;
    const linked = linkedDeal.value;
    const top = topSignalHeadline.value;
    const deals = dealOptions.value;

    const supportLine = account
        ? "Signal-backed account matched."
        : d.linkedinUrl.trim().length > 0
          ? "LinkedIn URL is carrying the account layer."
          : "No signal-backed account matched yet.";

    return (
        <aside class="cp-witness" aria-label="Witness rail">
            <p class="cp-witness__kicker">CONTACT</p>
            <h2 class="cp-witness__name">
                {d.contactName.trim() || "Add a contact."}
            </h2>
            <p class="cp-witness__meta">
                {company || "Name the contact to start the agenda."}
                {linked
                    ? ` · $${Number(linked.value || 0).toLocaleString()} ${(linked.stage || "prospect").replace(/-/g, " ")}`
                    : null}
            </p>

            <label class="cp-field">
                <span class="cp-field__label">Contact</span>
                <input
                    type="text"
                    class="cp-field__input"
                    placeholder="Name or role"
                    autoComplete="off"
                    value={d.contactName}
                    onInput={(e) =>
                        setContactName(
                            (e.currentTarget as HTMLInputElement).value
                        )
                    }
                />
            </label>

            <fieldset class="cp-personas" aria-label="Persona">
                <legend class="cp-field__label">Persona</legend>
                {PERSONA_KEYS.map((p: PersonaKey) => (
                    <button
                        key={p}
                        type="button"
                        class={`cp-persona-btn${d.persona === p ? " is-active" : ""}`}
                        onClick={() => setPersona(p)}
                        data-cp-persona={p}
                    >
                        {PERSONA_LABELS[p]}
                    </button>
                ))}
            </fieldset>

            <label class="cp-field">
                <span class="cp-field__label">LinkedIn URL</span>
                <input
                    type="url"
                    class="cp-field__input"
                    placeholder="https://linkedin.com/in/…"
                    autoComplete="off"
                    value={d.linkedinUrl}
                    onInput={(e) =>
                        setLinkedinUrl(
                            (e.currentTarget as HTMLInputElement).value
                        )
                    }
                />
            </label>

            <label class="cp-field">
                <span class="cp-field__label">Custom notes (why now)</span>
                <textarea
                    class="cp-field__textarea"
                    rows={4}
                    placeholder="Manual context if no live signal yet — what is making this meeting worth running?"
                    value={d.customNotes}
                    onInput={(e) =>
                        setCustomNotes(
                            (e.currentTarget as HTMLTextAreaElement).value
                        )
                    }
                />
            </label>

            <label class="cp-field">
                <span class="cp-field__label">Linked deal</span>
                <select
                    class="cp-field__select"
                    value={d.linkedDealId}
                    onChange={(e) =>
                        setLinkedDealId(
                            (e.currentTarget as HTMLSelectElement).value
                        )
                    }
                    disabled={deals.length === 0}
                >
                    <option value="">— Not linked —</option>
                    {deals.map((deal) => (
                        <option key={deal.id} value={deal.id}>
                            {deal.accountName} · {deal.stage}
                        </option>
                    ))}
                </select>
                {deals.length === 0 ? (
                    <small class="cp-field__hint">
                        No active deals yet — link one from Deal Workspace once it exists.
                    </small>
                ) : null}
            </label>

            <div class="cp-witness__support">
                <p class="cp-witness__support-kicker">DOSSIER</p>
                <p class="cp-witness__support-line">{supportLine}</p>
                {top ? (
                    <p class="cp-witness__support-line">
                        Top signal: <strong>{top}</strong>
                    </p>
                ) : d.customNotes.trim().length >= 20 ? (
                    <p class="cp-witness__support-line">
                        Manual context is doing the why-now work.
                    </p>
                ) : (
                    <p class="cp-witness__support-line">
                        No live why-now signal visible yet.
                    </p>
                )}
            </div>
        </aside>
    );
}
