import type { JSX } from "preact";
import { FormField, Kicker, Select, TextInput, Toggle } from "@/components";
import { t } from "@/lib/voice/t";
import {
    rack,
    setAccount,
    setContact,
    setNextQuestion,
    setPersona,
    setTemperature,
    setTrigger,
    toggleNoAsk
} from "../../state";
import {
    PERSONA_LABELS,
    PERSONAS,
    TEMPERATURE_LABELS,
    TEMPERATURES,
    TRIGGER_KEYS,
    type Persona,
    type Temperature,
    type TriggerKey
} from "../../lib/types";
import { TRIGGERS } from "../../lib/data";

/**
 * OperatorRack — the subordinate controls of the Live Instrument
 * console (canon §4.8): the rack that routes the line. Account, contact,
 * persona, temperature, trigger, the buyer question, and the no-ask
 * toggle. Every change re-routes the line live. The controls are real
 * and proximal; the line they shape is the dominant readout.
 */

const PERSONA_OPTIONS = PERSONAS.map((p) => ({ value: p, label: PERSONA_LABELS[p] }));
const TEMP_OPTIONS = TEMPERATURES.map((tm) => ({ value: tm, label: TEMPERATURE_LABELS[tm] }));
const TRIGGER_OPTIONS = TRIGGER_KEYS.map((k) => ({ value: k, label: TRIGGERS[k].label }));

export function OperatorRack(): JSX.Element {
    const r = rack.value;
    return (
        <div class="osd-rack">
            <Kicker>{t("ROUTE THE LINE")}</Kicker>
            <FormField label={t("Account")}>
                <TextInput value={r.accountName} onInput={setAccount} placeholder={t("Company name", { class: "body" })} />
            </FormField>
            <FormField label={t("Contact")}>
                <TextInput value={r.contactName} onInput={setContact} placeholder={t("Who you're writing to", { class: "body" })} />
            </FormField>
            <FormField label={t("Buyer")}>
                <Select value={r.persona} onChange={(p) => setPersona(p as Persona)} options={PERSONA_OPTIONS} />
            </FormField>
            <FormField label={t("Temperature")}>
                <Select value={r.temperature} onChange={(tm) => setTemperature(tm as Temperature)} options={TEMP_OPTIONS} />
            </FormField>
            <FormField label={t("Trigger")}>
                <Select value={r.trigger} onChange={(k) => setTrigger(k as TriggerKey)} options={TRIGGER_OPTIONS} />
            </FormField>
            <FormField label={t("Next question")} microcopy={t("The one thing you want them to answer.", { class: "body" })}>
                <TextInput value={r.nextQuestion ?? ""} onInput={setNextQuestion} placeholder={t("Optional", { class: "body" })} />
            </FormField>
            <div class="osd-rack__toggle">
                <Toggle pressed={r.noAsk} onToggle={() => toggleNoAsk()} label={t("No-ask mode")} />
                <span class="osd-rack__toggle-label">{t("No-ask mode — value only, no CTA", { class: "body" })}</span>
            </div>
        </div>
    );
}
