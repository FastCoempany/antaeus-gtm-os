import type { JSX } from "preact";
import {
    accountOptions,
    draft,
    patchDraft,
    selectedAccountName,
    setSelectedAccount
} from "../state";
import { hrefToSignalConsole } from "../lib/handoff";

/**
 * AccountRow — Wave 5 implementation.
 *
 * Account select + contact name input + a single ghost CTA back to
 * Signal Console (carries `?account=` so the operator lands on the
 * same row they were on). The destination href is built via
 * `hrefToSignalConsole(account)` so the canonical continuity params
 * (returnTo / returnLabel / focusObject / focusRoom / fromMode /
 * fromSurface) are preserved.
 */
export function AccountRow(): JSX.Element {
    const options = accountOptions.value;
    const selected = selectedAccountName.value ?? "";
    const d = draft.value;

    return (
        <section class="cc-account-row" aria-label="Account context">
            <label class="cc-field">
                <span class="cc-field__label">Account</span>
                <select
                    class="cc-field__select"
                    value={selected}
                    onChange={(e) => {
                        const v = (e.currentTarget as HTMLSelectElement).value;
                        setSelectedAccount(v.length === 0 ? null : v);
                    }}
                >
                    <option value="">Select account…</option>
                    {options.map((a) => (
                        <option key={a.id} value={a.name}>
                            {a.name}
                            {a.heat ? ` · heat ${a.heat}` : ""}
                        </option>
                    ))}
                </select>
            </label>
            <label class="cc-field">
                <span class="cc-field__label">Contact</span>
                <input
                    class="cc-field__input"
                    type="text"
                    value={d.contactName}
                    placeholder="Name or role on the line"
                    onInput={(e) =>
                        patchDraft({
                            contactName: (e.currentTarget as HTMLInputElement)
                                .value
                        })
                    }
                />
            </label>
            <div class="cc-account-row__actions">
                <a
                    class="cc-handoff cc-handoff--ghost"
                    href={hrefToSignalConsole(selected)}
                    data-cc-handoff="signal-console"
                >
                    Back to Signal Console
                </a>
            </div>
        </section>
    );
}
