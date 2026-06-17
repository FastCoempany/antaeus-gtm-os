import type { JSX } from "preact";
import { FormField, Kicker, Select, TextInput, Textarea } from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    currentCompany,
    dealOptions,
    draft,
    linkedDeal,
    matchedAccount,
    setContactName,
    setCustomNotes,
    setLinkedDealId,
    setLinkedinUrl,
    setPersona,
    topSignalHeadline
} from "../../state";
import { PERSONA_KEYS, PERSONA_LABELS, type PersonaKey } from "../../lib/types";

/**
 * WitnessForm — the subordinate controls of the Call Planner bench. The
 * single witness (the named human, the persona, the why-now context, the
 * linked deal) that the agenda object is built from. It serves the
 * object; the object does not serve it (canon §4.11: agenda quality is
 * the link to Discovery + Deal — the form is the quiet half). State
 * flows through the draft signal; the agenda recomputes live.
 */

const PERSONA_OPTIONS = PERSONA_KEYS.map((p: PersonaKey) => ({
    value: p,
    label: PERSONA_LABELS[p]
}));

export function WitnessForm(): JSX.Element {
    const d = draft.value;
    const account = matchedAccount.value;
    const linked = linkedDeal.value;
    const company = currentCompany.value;
    const top = topSignalHeadline.value;
    const deals = dealOptions.value;
    const annotate = showsAnnotations();

    const dealOpts = [
        { value: "", label: t("— Not linked —") },
        ...deals.map((deal) => ({
            value: deal.id,
            label: `${deal.accountName} · ${deal.stage}`
        }))
    ];

    return (
        <div class="cpd-witness">
            <Kicker>{t("THE WITNESS")}</Kicker>

            <FormField label={t("Contact")}>
                <TextInput
                    value={d.contactName}
                    onInput={setContactName}
                    placeholder={t("Name or role", { class: "body" })}
                />
            </FormField>

            <FormField label={t("Persona")}>
                <Select
                    value={d.persona}
                    onChange={(v) => setPersona(v as PersonaKey)}
                    options={PERSONA_OPTIONS}
                />
            </FormField>

            <FormField label={t("LinkedIn URL")}>
                <TextInput
                    value={d.linkedinUrl}
                    onInput={setLinkedinUrl}
                    placeholder={t("linkedin.com/in/…", { class: "body" })}
                />
            </FormField>

            <FormField
                label={t("Why now")}
                microcopy={
                    annotate
                        ? t(
                              "Manual context if there's no live signal yet — what makes this meeting worth running.",
                              { class: "body" }
                          )
                        : undefined
                }
            >
                <Textarea
                    rows={4}
                    value={d.customNotes}
                    onInput={setCustomNotes}
                    placeholder={t("What is making this worth running?", {
                        class: "body"
                    })}
                />
            </FormField>

            <FormField
                label={t("Linked deal")}
                microcopy={
                    deals.length === 0 && annotate
                        ? t("No active deals yet — link one once it exists.", {
                              class: "body"
                          })
                        : undefined
                }
            >
                <Select
                    value={d.linkedDealId}
                    onChange={setLinkedDealId}
                    options={dealOpts}
                />
            </FormField>

            {/* The dossier — what context the witness already carries. */}
            <div class="cpd-dossier">
                <Kicker>{t("DOSSIER")}</Kicker>
                <p class="cpd-dossier__line">
                    {account
                        ? t("Matched to an account with live signals.", {
                              class: "body"
                          })
                        : d.linkedinUrl.trim().length > 0
                          ? t("LinkedIn is standing in for the account.", {
                                class: "body"
                            })
                          : t("No matching account with live signals yet.", {
                                class: "body"
                            })}
                </p>
                {company ? (
                    <p class="cpd-dossier__line">
                        {company}
                        {linked
                            ? ` · $${Number(linked.value || 0).toLocaleString()} ${(linked.stage || "prospect").replace(/-/g, " ")}`
                            : ""}
                    </p>
                ) : null}
                {top ? (
                    <p class="cpd-dossier__line">
                        {t("Top signal:")} <strong>{top}</strong>
                    </p>
                ) : null}
            </div>
        </div>
    );
}
