import type { JSX } from "preact";
import {
    accountOptions,
    rack,
    setAccount,
    setContact,
    setPersona,
    setTemperature,
    setTrigger,
    toggleNoAsk
} from "../state";
import {
    PERSONAS,
    PERSONA_LABELS,
    TEMPERATURES,
    TEMPERATURE_LABELS,
    TRIGGER_KEYS,
    type Persona,
    type Temperature,
    type TriggerKey
} from "../lib/types";
import { TRIGGERS } from "../lib/data";

/**
 * Switchboard — Wave 3 implementation. Operator rack form.
 *
 * Per canon §4.8: "no send path without a named strain." The five
 * inputs (account / contact / persona / temperature / trigger) +
 * no-ask toggle drive the generator. The account input is a
 * datalist so Signal Console accounts auto-suggest.
 */
export function Switchboard(): JSX.Element {
    const r = rack.value;
    const accounts = accountOptions.value;

    return (
        <section class="ob-switchboard" aria-label="Operator switchboard">
            <header class="ob-switchboard__header">
                <p class="ob-switchboard__kicker">SWITCHBOARD</p>
                <h2 class="ob-switchboard__title">Set the strain.</h2>
            </header>

            <div class="ob-switchboard__form">
                <Field label="Account">
                    <input
                        list="ob-account-options"
                        type="text"
                        value={r.accountName}
                        placeholder="e.g. Acme Industries"
                        onInput={(e) =>
                            setAccount(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                    />
                    <datalist id="ob-account-options">
                        {accounts.map((a) => (
                            <option key={a.id} value={a.name}>
                                {a.heat ? `heat ${a.heat} · ${a.band}` : ""}
                            </option>
                        ))}
                    </datalist>
                </Field>

                <Field label="Buyer (contact)">
                    <input
                        type="text"
                        value={r.contactName}
                        placeholder="e.g. Sarah Chen, VP Eng"
                        onInput={(e) =>
                            setContact(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                    />
                </Field>

                <Field label="Persona">
                    <select
                        value={r.persona}
                        onChange={(e) =>
                            setPersona(
                                (e.currentTarget as HTMLSelectElement).value as Persona
                            )
                        }
                    >
                        {PERSONAS.map((p) => (
                            <option key={p} value={p}>
                                {PERSONA_LABELS[p]}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Temperature">
                    <select
                        value={r.temperature}
                        onChange={(e) =>
                            setTemperature(
                                (e.currentTarget as HTMLSelectElement).value as Temperature
                            )
                        }
                    >
                        {TEMPERATURES.map((t) => (
                            <option key={t} value={t}>
                                {TEMPERATURE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Trigger">
                    <select
                        value={r.trigger}
                        onChange={(e) =>
                            setTrigger(
                                (e.currentTarget as HTMLSelectElement).value as TriggerKey
                            )
                        }
                    >
                        {TRIGGER_KEYS.map((t) => (
                            <option key={t} value={t}>
                                {TRIGGERS[t].label}
                            </option>
                        ))}
                    </select>
                </Field>

                <div class="ob-switchboard__row">
                    <button
                        type="button"
                        class={`ob-noask${r.noAsk ? " is-active" : ""}`}
                        aria-pressed={r.noAsk}
                        onClick={toggleNoAsk}
                        title="Strip the CTA — generate a value-only touch."
                    >
                        <span class="ob-noask__label">NO-ASK MODE</span>
                        <span class="ob-noask__sub">
                            {r.noAsk ? "ON · value-only touch" : "OFF · CTA included"}
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}

interface FieldProps {
    readonly label: string;
    readonly children: JSX.Element | JSX.Element[];
}

function Field({ label, children }: FieldProps): JSX.Element {
    return (
        <label class="ob-field">
            <span class="ob-field__label">{label}</span>
            {children}
        </label>
    );
}
