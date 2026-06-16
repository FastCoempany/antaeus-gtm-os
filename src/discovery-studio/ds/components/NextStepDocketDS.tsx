import type { JSX } from "preact";
import { FormField, Kicker, StatusChip, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import { nextStepLock, setNextStepField } from "../../state";
import { docketLabel, docketStatus, docketTone } from "../lib/adapters";

/**
 * NextStepDocketDS — the next-step lock (primitive #19) on the library.
 * The five fields (date / owner / attendees / purpose / reason) that
 * have to be filled before the call can hand off cleanly — the visible
 * end condition. The status chip reads empty / partial / locked
 * (locked = date + owner + purpose). The lock engine + the five-field
 * model are unchanged.
 */
export function NextStepDocketDS(): JSX.Element {
    const lock = nextStepLock.value;
    const status = docketStatus(lock);

    return (
        <section class="dsd-docket" aria-label={t("Next-step docket")}>
            <div class="dsd-docket__head">
                <Kicker>{t("NEXT-STEP LOCK")}</Kicker>
                <StatusChip label={docketLabel(status)} tone={docketTone(status)} />
            </div>
            <div class="dsd-docket__grid">
                <FormField label={t("Date")}>
                    <TextInput
                        type="date"
                        value={lock.date}
                        onInput={(date) => setNextStepField("date", date)}
                    />
                </FormField>
                <FormField label={t("Owner")}>
                    <TextInput
                        value={lock.owner}
                        onInput={(owner) => setNextStepField("owner", owner)}
                        placeholder={t("Buyer-side decision owner", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Attendees")}>
                    <TextInput
                        value={lock.attendees}
                        onInput={(attendees) => setNextStepField("attendees", attendees)}
                        placeholder={t("Who else will be there", { class: "body" })}
                    />
                </FormField>
                <div class="dsd-docket__wide">
                    <FormField label={t("Purpose")}>
                        <TextInput
                            value={lock.purpose}
                            onInput={(purpose) => setNextStepField("purpose", purpose)}
                            placeholder={t("Specific outcome to advance", { class: "body" })}
                        />
                    </FormField>
                </div>
                <div class="dsd-docket__wide">
                    <FormField label={t("Reason")}>
                        <TextInput
                            value={lock.reason}
                            onInput={(reason) => setNextStepField("reason", reason)}
                            placeholder={t("Why this is the right next step now", { class: "body" })}
                        />
                    </FormField>
                </div>
            </div>
        </section>
    );
}
