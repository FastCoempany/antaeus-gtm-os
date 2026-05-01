import { useState } from "preact/hooks";
import type { JSX } from "preact";
import { buildManualAccount, upsertAccount } from "../state";
import { saveAccount } from "../lib/cloud-persistence";

/**
 * AddAccountForm — manual "add account" composer.
 *
 * Per A3 of the cloud-sync gap closer: the legacy enrichment flow at
 * `/app/signal-console/` writes through to the cloud already, but the
 * new Preact room had no manual-add surface. This minimal form lets
 * the operator type in an account by hand and persist it through the
 * same cloud-persistence pipeline (saveAccount), so cross-device sync
 * + realtime work from the moment of creation.
 *
 * The legacy bulk CSV + AI enrichment flow stays at /app/signal-console/
 * for now; it's a separate larger port.
 */
export function AddAccountForm(): JSX.Element {
    const [open, setOpen] = useState(false);
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
    }

    async function onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            flash("Name is required.");
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
            // Optimistic local upsert first so the grid lights up
            // immediately. saveAccount round-trips and will replace
            // the legacy id with a server uuid on success.
            upsertAccount(account);
            await saveAccount(account);
            flash(`Saved · ${trimmed}`);
            reset();
            setOpen(false);
        } finally {
            setWorking(false);
        }
    }

    if (!open) {
        return (
            <div class="sc-add-trigger">
                <button
                    type="button"
                    class="sc-add-btn"
                    onClick={() => setOpen(true)}
                >
                    + Add account
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
        <form class="sc-add-form" onSubmit={onSubmit}>
            <header class="sc-add-form__head">
                <p class="sc-add-form__kicker">ADD ACCOUNT</p>
                <button
                    type="button"
                    class="sc-add-form__close"
                    onClick={() => {
                        reset();
                        setOpen(false);
                    }}
                    aria-label="Close add-account form"
                >
                    ×
                </button>
            </header>
            <p class="sc-add-form__hint">
                Name is required. Everything else helps the room reason
                about heat + persona match. Bulk CSV + AI enrichment live
                at <code>/app/signal-console/</code>.
            </p>
            <div class="sc-add-form__grid">
                <label class="sc-add-form__field">
                    <span>Account name *</span>
                    <input
                        type="text"
                        value={name}
                        autoFocus
                        onInput={(e) =>
                            setName(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                        placeholder="e.g. Acme Industries"
                    />
                </label>
                <label class="sc-add-form__field">
                    <span>Domain</span>
                    <input
                        type="text"
                        value={domain}
                        onInput={(e) =>
                            setDomain(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                        placeholder="acme.com"
                    />
                </label>
                <label class="sc-add-form__field">
                    <span>Ticker</span>
                    <input
                        type="text"
                        value={ticker}
                        onInput={(e) =>
                            setTicker(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                        placeholder="ACME"
                    />
                </label>
                <label class="sc-add-form__field">
                    <span>Industry</span>
                    <input
                        type="text"
                        value={industry}
                        onInput={(e) =>
                            setIndustry(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                        placeholder="Logistics"
                    />
                </label>
                <label class="sc-add-form__field">
                    <span>HQ</span>
                    <input
                        type="text"
                        value={hq}
                        onInput={(e) =>
                            setHq(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                        placeholder="San Francisco, CA"
                    />
                </label>
                <label class="sc-add-form__field sc-add-form__field--wide">
                    <span>Notes</span>
                    <textarea
                        rows={2}
                        value={notes}
                        onInput={(e) =>
                            setNotes(
                                (e.currentTarget as HTMLTextAreaElement).value
                            )
                        }
                        placeholder="Why this account is on the radar"
                    />
                </label>
            </div>
            <div class="sc-add-form__actions">
                <button
                    type="submit"
                    class="sc-add-btn sc-add-btn--primary"
                    disabled={working || name.trim().length === 0}
                >
                    {working ? "Saving…" : "Save to cloud"}
                </button>
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
                {toast ? (
                    <span class="sc-add-toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </div>
        </form>
    );
}
