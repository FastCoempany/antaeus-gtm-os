import { useState } from "preact/hooks";
import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { buildManualAccount, upsertAccount } from "../state";
import { saveAccount } from "../lib/cloud-persistence";

/**
 * AddAccountForm — manual "add account" composer.
 *
 * Per A3 of the cloud-sync gap closer + Signal Console audit (2026-05):
 * the operator adds an account in TWO steps:
 *   1) Type the name → save (one-field commit)
 *   2) Optionally expand to add domain / ticker / industry / hq / notes
 *
 * Six fields at once was too heavy for what's typically a fast "drop
 * this on the radar" action. A CRO adds an account the way they add
 * a contact in their phone — name first, fill in the rest later.
 *
 * Variants:
 *   - `embedded` (default false) — when true, renders as the dominant
 *     CTA inside the empty-state card (no toggle, form always open).
 *
 * TODO (post-beta scaling cliff): bulk import via CSV paste + AI
 * enrichment lives at /app/signal-console/ on the legacy stack. A CRO
 * with 40 prospects in a spreadsheet will need this within five
 * minutes of first use. Tracked in the post-beta polish backlog.
 */
export interface AddAccountFormProps {
    readonly embedded?: boolean;
}

export function AddAccountForm(props: AddAccountFormProps = {}): JSX.Element {
    const embedded = props.embedded === true;
    // In embedded mode, the form is always open. Otherwise it toggles.
    const [open, setOpen] = useState(embedded);
    // Expand state: name-only by default; expands when operator clicks
    // "Add details" or after first successful save (so they're invited
    // to enrich without losing context).
    const [expanded, setExpanded] = useState(false);
    const [name, setName] = useState("");
    const [domain, setDomain] = useState("");
    const [ticker, setTicker] = useState("");
    const [industry, setIndustry] = useState("");
    const [hq, setHq] = useState("");
    const [notes, setNotes] = useState("");
    const [working, setWorking] = useState(false);
    const [toast, setToast] = useState<string>("");

    function flash(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    }

    function reset(): void {
        setName("");
        setDomain("");
        setTicker("");
        setIndustry("");
        setHq("");
        setNotes("");
        setExpanded(false);
    }

    async function onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            flash(t("Name is required.", { class: "body" }));
            return;
        }
        setWorking(true);
        try {
            const account = buildManualAccount({
                name: trimmed,
                domain,
                ticker,
                industry,
                hq,
                notes
            });
            upsertAccount(account);
            await saveAccount(account);
            flash(`Saved · ${trimmed}`);
            reset();
            // Embedded: stay open for fast-add of next account.
            // Toggled: close so the operator returns to the grid view.
            if (!embedded) setOpen(false);
        } finally {
            setWorking(false);
        }
    }

    if (!embedded && !open) {
        return (
            <div class="sc-add-trigger">
                <button
                    type="button"
                    class="sc-add-btn sc-add-btn--primary"
                    onClick={() => setOpen(true)}
                >
                    {t("+ Add account")}
                </button>
                {toast ? (
                    <span class="sc-add-toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </div>
        );
    }

    return (
        <form
            class={`sc-add-form${embedded ? " sc-add-form--embedded" : ""}`}
            onSubmit={onSubmit}
        >
            {!embedded ? (
                <header class="sc-add-form__head">
                    <p class="sc-add-form__kicker">{t("ADD ACCOUNT")}</p>
                    <button
                        type="button"
                        class="sc-add-form__close"
                        onClick={() => {
                            reset();
                            setOpen(false);
                        }}
                        aria-label={t("Close add-account form")}
                    >
                        ×
                    </button>
                </header>
            ) : null}

            <label class="sc-add-form__field sc-add-form__field--wide">
                <span>{t("Account name")}</span>
                <input
                    type="text"
                    value={name}
                    autoFocus
                    onInput={(e) =>
                        setName((e.currentTarget as HTMLInputElement).value)
                    }
                    placeholder="e.g. Acme Robotics"
                />
            </label>

            {expanded ? (
                <div class="sc-add-form__grid">
                    <label class="sc-add-form__field">
                        <span>{t("Domain")}</span>
                        <input
                            type="text"
                            value={domain}
                            onInput={(e) =>
                                setDomain(
                                    (e.currentTarget as HTMLInputElement)
                                        .value
                                )
                            }
                            placeholder="acme.com"
                        />
                    </label>
                    <label class="sc-add-form__field">
                        <span>{t("Ticker")}</span>
                        <input
                            type="text"
                            value={ticker}
                            onInput={(e) =>
                                setTicker(
                                    (e.currentTarget as HTMLInputElement)
                                        .value
                                )
                            }
                            placeholder="ACME"
                        />
                    </label>
                    <label class="sc-add-form__field">
                        <span>{t("Industry")}</span>
                        <input
                            type="text"
                            value={industry}
                            onInput={(e) =>
                                setIndustry(
                                    (e.currentTarget as HTMLInputElement)
                                        .value
                                )
                            }
                            placeholder="Logistics"
                        />
                    </label>
                    <label class="sc-add-form__field">
                        <span>{t("HQ")}</span>
                        <input
                            type="text"
                            value={hq}
                            onInput={(e) =>
                                setHq(
                                    (e.currentTarget as HTMLInputElement)
                                        .value
                                )
                            }
                            placeholder="San Francisco, CA"
                        />
                    </label>
                    <label class="sc-add-form__field sc-add-form__field--wide">
                        <span>{t("Why this account's on the radar", { class: "body" })}</span>
                        <textarea
                            rows={2}
                            value={notes}
                            onInput={(e) =>
                                setNotes(
                                    (e.currentTarget as HTMLTextAreaElement)
                                        .value
                                )
                            }
                            placeholder={t("One sentence. Trigger, conversation, or signal that brought them up.", { class: "body" })}
                        />
                    </label>
                </div>
            ) : (
                <button
                    type="button"
                    class="sc-add-form__expand"
                    onClick={() => setExpanded(true)}
                >
                    {t("+ Add details (optional)")}
                </button>
            )}

            <div class="sc-add-form__actions">
                <button
                    type="submit"
                    class="sc-add-btn sc-add-btn--primary"
                    disabled={working || name.trim().length === 0}
                >
                    {working ? t("Saving…") : t("Add account")}
                </button>
                {!embedded ? (
                    <button
                        type="button"
                        class="sc-add-btn sc-add-btn--ghost"
                        onClick={() => {
                            reset();
                            setOpen(false);
                        }}
                        disabled={working}
                    >
                        Cancel
                    </button>
                ) : null}
                {toast ? (
                    <span class="sc-add-toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </div>
        </form>
    );
}
