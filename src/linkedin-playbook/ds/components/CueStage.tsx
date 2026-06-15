import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, FormField, Kicker, Select, StatusChip, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import { draft, logCue, patchDraft, setDraftActionType } from "../../state";
import { cueScript } from "../../lib/scripts";
import { ACTION_LABELS, ACTION_TYPES, type ActionType } from "../../lib/types";
import { activeCueResolved, cueTone } from "../lib/adapters";

/**
 * CueStage — the live cue, the dominant focal of the Live Instrument
 * (canon §4.10). The cue the motion recommends (or the operator pinned):
 * its title, the public-first console guidance, the exact script, and
 * the form to log the touch. Public cue first; the inbox is never the
 * opening scene.
 */

const flash: Signal<string> = signal("");
function showFlash(msg: string): void {
    flash.value = msg;
    setTimeout(() => (flash.value = ""), 2400);
}

const ACTION_OPTIONS = ACTION_TYPES.map((a) => ({ value: a, label: ACTION_LABELS[a] }));

export function CueStage(): JSX.Element {
    const { cue, motion } = activeCueResolved();
    const d = draft.value;
    const script = cueScript(cue, motion);

    function onLog(): void {
        const entry = logCue();
        showFlash(entry ? t("Cue logged.") : t("Name an account or contact first.", { class: "body" }));
    }

    return (
        <section class="lpd-stage" aria-label={`Cue: ${cue.name}`}>
            <header class="lpd-stage__head">
                <div class="lpd-stage__kicker">
                    <span class="lpd-stage__label">{cue.label}</span>
                    <Kicker>{cue.name}</Kicker>
                    <StatusChip label={ACTION_LABELS[cue.action]} tone={cueTone(cue.index)} />
                </div>
                <h2 class="lpd-stage__title">{cue.title}</h2>
            </header>

            <p class="lpd-stage__copy">{cue.copy}</p>

            <div class="lpd-say">
                <span class="lpd-say__mark">{t("DO")}</span>
                <p class="lpd-say__line">{cue.console}</p>
            </div>

            {script ? (
                <div class="lpd-script">
                    <span class="lpd-script__mark">{t("THE SCRIPT")}</span>
                    <p class="lpd-script__line">{script}</p>
                </div>
            ) : null}

            {/* Log the cue. */}
            <footer class="lpd-log">
                <div class="lpd-log__grid">
                    <FormField label={t("Account")}>
                        <TextInput value={d.accountName} onInput={(accountName) => patchDraft({ accountName })} placeholder={t("Company", { class: "body" })} />
                    </FormField>
                    <FormField label={t("Contact")}>
                        <TextInput value={d.contactName} onInput={(contactName) => patchDraft({ contactName })} placeholder={t("Who", { class: "body" })} />
                    </FormField>
                    <FormField label={t("Touch")}>
                        <Select value={d.actionType} onChange={(a) => setDraftActionType(a as ActionType)} options={ACTION_OPTIONS} />
                    </FormField>
                </div>
                <div class="lpd-log__actions">
                    <Button variant="accent" onClick={onLog}>
                        {t("Log the cue")}
                    </Button>
                    {flash.value ? <span class="lpd-log__flash" role="status">{flash.value}</span> : null}
                </div>
            </footer>
        </section>
    );
}
