import type { JSX } from "preact";
import { actions, draft, patchDraft, stats } from "../state";
import { ACTION_TYPES, ACTION_LABELS, type ActionType } from "../lib/types";

/**
 * CueLedger — Wave 1 placeholder.
 *
 * Wave 4 wires the form submit handler into `logCue(action)` and
 * persists to `gtmos_linkedin_log`. Wave 1 surfaces the form shape +
 * the activity board placeholder so the page lays out.
 */
export function CueLedger(): JSX.Element {
    const d = draft.value;
    const s = stats.value;
    const list = actions.value;
    return (
        <section class="lp-ledger" aria-label="Cue ledger and activity">
            <div class="lp-ledger__form-wrap">
                <p class="lp-ledger__kicker">CUE LEDGER</p>
                <h2 class="lp-ledger__title">
                    Log the touch while the cue is still fresh.
                </h2>
                <p class="lp-ledger__copy">
                    Signal Console points the account, Outbound reinforces
                    the angle, and this ledger proves whether LinkedIn is
                    compounding or stalling.
                </p>
                <form
                    class="lp-ledger__form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        // Wave 4 wires logCue here.
                    }}
                >
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Account</span>
                        <input
                            type="text"
                            class="lp-ledger__input"
                            placeholder="Company name"
                            value={d.accountName}
                            onInput={(e) =>
                                patchDraft({
                                    accountName: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Human</span>
                        <input
                            type="text"
                            class="lp-ledger__input"
                            placeholder="Person name"
                            value={d.contactName}
                            onInput={(e) =>
                                patchDraft({
                                    contactName: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Cue taken</span>
                        <select
                            class="lp-ledger__select"
                            value={d.actionType}
                            onChange={(e) =>
                                patchDraft({
                                    actionType: (
                                        e.currentTarget as HTMLSelectElement
                                    ).value as ActionType
                                })
                            }
                        >
                            {ACTION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {ACTION_LABELS[t]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="submit"
                        class="lp-ledger__submit"
                        disabled
                    >
                        Log cue
                    </button>
                </form>
            </div>
            <div class="lp-ledger__activity">
                <p class="lp-ledger__kicker">CHANNEL MEMORY</p>
                {list.length === 0 ? (
                    <p class="lp-ledger__empty">
                        No LinkedIn cue activity logged yet. Wave 4 wires
                        the activity table over{" "}
                        <code>gtmos_linkedin_log</code>.
                    </p>
                ) : (
                    <p class="lp-ledger__stats" aria-label="Channel stats">
                        {s.total} actions · {s.connections} requests ·{" "}
                        {s.acceptRate}% accept · {s.dms} DMs ·{" "}
                        {s.replyRate}% reply
                    </p>
                )}
            </div>
        </section>
    );
}
