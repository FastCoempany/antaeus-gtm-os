import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { nextStepLock, setNextStepField, type NextStepLock } from "../state";

/**
 * NextStepDocket — Wave 1 skeleton.
 *
 * Captures the five required fields before the call can hand off cleanly:
 * date, owner, attendees, purpose, reason. The visible end condition.
 *
 * State modes:
 *   - empty:    no fields filled
 *   - partial:  some fields filled; missing required subset
 *   - locked:   date + owner + purpose all filled
 *
 * Wave 2 will wire the proper visual treatment per state + the
 * locked-state styling. Wave 3 wires the handoff button that reads
 * this docket into the postCallPackage signal.
 */
export function NextStepDocket(): JSX.Element {
    const lock = nextStepLock.value;
    const status = computeStatus(lock);

    return (
        <section
            class={`ds-next-step-docket is-${status}`}
            aria-label={t("Next-step docket")}
        >
            <header class="ds-next-step-docket__header">
                Next-step lock
                <span class={`ds-next-step-docket__status is-${status}`}>
                    {status}
                </span>
            </header>
            <div class="ds-next-step-docket__grid">
                <Field
                    field="date"
                    label={t("Date")}
                    value={lock.date}
                    placeholder="2026-05-01"
                />
                <Field
                    field="owner"
                    label={t("Owner")}
                    value={lock.owner}
                    placeholder={t("Buyer-side decision owner")}
                />
                <Field
                    field="attendees"
                    label={t("Attendees")}
                    value={lock.attendees}
                    placeholder={t("Who else will be there")}
                />
                <Field
                    field="purpose"
                    label={t("Purpose")}
                    value={lock.purpose}
                    placeholder={t("Specific outcome to advance")}
                    wide
                />
                <Field
                    field="reason"
                    label={t("Reason")}
                    value={lock.reason}
                    placeholder={t("Why this is the right next step now", { class: "body" })}
                    wide
                />
            </div>
        </section>
    );
}

interface FieldProps {
    field: keyof NextStepLock;
    label: string;
    value: string;
    placeholder: string;
    wide?: boolean;
}

function Field({
    field,
    label,
    value,
    placeholder,
    wide = false
}: FieldProps): JSX.Element {
    return (
        <label
            class={`ds-next-step-docket__field${
                wide ? " ds-next-step-docket__field--wide" : ""
            }`}
        >
            <span class="ds-next-step-docket__field-label">{label}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) =>
                    setNextStepField(
                        field,
                        (e.currentTarget as HTMLInputElement).value
                    )
                }
            />
        </label>
    );
}

function computeStatus(lock: NextStepLock): "empty" | "partial" | "locked" {
    const hasAny =
        lock.date || lock.owner || lock.attendees || lock.purpose || lock.reason;
    if (!hasAny) return "empty";
    if (lock.date && lock.owner && lock.purpose) return "locked";
    return "partial";
}
