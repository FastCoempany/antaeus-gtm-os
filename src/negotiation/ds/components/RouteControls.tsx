import type { JSX } from "preact";
import {
    FormField,
    Kicker,
    SegmentedControl,
    Select,
    TextInput,
    Textarea
} from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    draft,
    linkedDeals,
    setAskMoment,
    setCounterparty,
    setCounterpartyName,
    setDealId,
    setOpeningLine,
    setStartingPosition,
    setWalkawayPosition
} from "../../state";
import {
    ASK_MOMENT_LABEL,
    COUNTERPARTY_LABEL,
    type AskMoment,
    type CounterpartyRole
} from "../../lib/types";

/**
 * RouteControls — the subordinate controls of the Negotiation bench. The
 * routing (deal × counterparty × person × ask-moment) plus the three
 * positions the operator has ALREADY DECIDED (canon §4.16b): the
 * starting position, the walkaway, the opening line. It serves the
 * rehearsal object; the object does not serve it. State flows through
 * the draft signal; the rehearsal read and the seed scripts recompute
 * live (switching counterparty swaps the pushbacks, switching ask-moment
 * refreshes the opening-line suggestion).
 */

const ROLES: ReadonlyArray<CounterpartyRole> = [
    "cfo",
    "vp_finance",
    "procurement",
    "legal",
    "gc",
    "infosec"
];
const COUNTERPARTY_OPTIONS = ROLES.map((r) => ({
    key: r,
    label: COUNTERPARTY_LABEL[r]
}));

const ASK_MOMENTS: ReadonlyArray<AskMoment> = [
    "pricing_position",
    "discount_request",
    "terms_and_payment",
    "contract_length",
    "auto_renewal",
    "indemnification",
    "security_review",
    "rampup_schedule",
    "expansion_commitment",
    "decision_deadline"
];
const ASK_MOMENT_OPTIONS = ASK_MOMENTS.map((m) => ({
    value: m,
    label: ASK_MOMENT_LABEL[m]
}));

export function RouteControls(): JSX.Element {
    const d = draft.value;
    const deals = linkedDeals.value;
    const annotate = showsAnnotations();

    const dealOpts = [
        { value: "", label: t("— Not linked —") },
        ...deals.map((dl) => ({
            value: dl.id,
            label: `${dl.accountName} · ${dl.stage}`
        }))
    ];

    return (
        <div class="ngd-controls">
            <Kicker>{t("THE ROUTE")}</Kicker>

            <FormField
                label={t("Deal")}
                microcopy={
                    deals.length === 0 && annotate
                        ? t("No active deals yet — link one once it exists.", {
                              class: "body"
                          })
                        : undefined
                }
            >
                <Select
                    value={d.dealId ?? ""}
                    onChange={(v) => setDealId(v || null)}
                    options={dealOpts}
                />
            </FormField>

            {/* A button group, not a single control — rendered with the
                field styling but NOT a <label> (a label forwards clicks
                to its first labelable descendant, which would hijack
                every segment to the first one). */}
            <div class="ds-field">
                <span class="ds-field__label">{t("Counterparty")}</span>
                <SegmentedControl<CounterpartyRole>
                    label={t("Counterparty role")}
                    active={d.counterparty}
                    onChange={setCounterparty}
                    options={COUNTERPARTY_OPTIONS}
                />
            </div>

            <FormField label={t("Person on the other side")}>
                <TextInput
                    value={d.counterpartyName}
                    onInput={setCounterpartyName}
                    placeholder={t("Name or title", { class: "body" })}
                />
            </FormField>

            <FormField
                label={t("Ask moment")}
                microcopy={
                    annotate
                        ? t(
                              "What you're walking in to ask for — it swaps the seed pushbacks and suggests an opening line.",
                              { class: "body" }
                          )
                        : undefined
                }
            >
                <Select
                    value={d.askMoment}
                    onChange={(v) => setAskMoment(v as AskMoment)}
                    options={ASK_MOMENT_OPTIONS}
                />
            </FormField>

            <div class="ngd-controls__positions">
                <Kicker>{t("THE THREE YOU'VE DECIDED")}</Kicker>

                <FormField label={t("Starting position")}>
                    <Textarea
                        rows={3}
                        value={d.startingPosition}
                        onInput={setStartingPosition}
                        placeholder={t("What you open with. List price, full terms.", {
                            class: "body"
                        })}
                    />
                </FormField>

                <FormField
                    label={t("Walkaway")}
                    microcopy={
                        annotate
                            ? t("The line you won't cross. Below this, you walk.", {
                                  class: "body"
                              })
                            : undefined
                    }
                >
                    <Textarea
                        rows={3}
                        value={d.walkawayPosition}
                        onInput={setWalkawayPosition}
                        placeholder={t("Below this, you walk.", { class: "body" })}
                    />
                </FormField>

                <FormField label={t("Opening line")}>
                    <Textarea
                        rows={3}
                        value={d.openingLine}
                        onInput={setOpeningLine}
                        placeholder={t("The actual first words. Authored, not improvised.", {
                            class: "body"
                        })}
                    />
                </FormField>
            </div>
        </div>
    );
}
