import type { JSX } from "preact";
import {
    accountOptions,
    draft,
    patchDraft,
    selectedAccountName,
    setSelectedAccount
} from "../state";

/**
 * AccountRow — Wave 1 placeholder.
 *
 * Renders the account selector + contact name input + ghost
 * "Open Signal" handoff. Wave 5 wires the handoff URL through
 * `lib/handoff.ts`. Until then the link is a stub anchor.
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
                <span class="cc-field__label">Human on line</span>
                <input
                    class="cc-field__input"
                    type="text"
                    value={d.contactName}
                    placeholder="Name or role"
                    onInput={(e) =>
                        patchDraft({
                            contactName: (e.currentTarget as HTMLInputElement)
                                .value
                        })
                    }
                />
            </label>
            <div class="cc-account-row__actions" aria-hidden="true">
                {/* Wave 5 wires the live handoff anchors. */}
            </div>
        </section>
    );
}
