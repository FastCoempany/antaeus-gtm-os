import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    linkedDeals,
    setAskMoment,
    setCounterparty,
    setCounterpartyName,
    setDealId
} from "../state";
import {
    ASK_MOMENT_LABEL,
    COUNTERPARTY_LABEL,
    type AskMoment,
    type CounterpartyRole
} from "../lib/types";

const ROLES: ReadonlyArray<CounterpartyRole> = [
    "cfo",
    "vp_finance",
    "procurement",
    "legal",
    "gc",
    "infosec"
];

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

/**
 * RouteRack — Deal × Counterparty × Person × Ask-moment.
 *
 * Mirrors Advisor Deploy's "Deal × Carrier × Ask moment" routing
 * pattern. Picking a deal + role + name + ask-moment is the whole
 * routing signal — everything below the rack adapts.
 *
 * Phase 4 added the ask-moment selector (10 moments inferred from
 * Discovery Studio's decision-architecture segments) and expanded
 * counterparties from 4 → 6 (added VP Finance + InfoSec).
 */
export function RouteRack(): JSX.Element {
    const d = draft.value;
    const deals = linkedDeals.value;
    return (
        <section class="ng-route-rack" aria-label={t("Negotiation route")}>
            <div class="ng-route-rack__cell">
                <p class="ng-cell__label">{t("Deal")}</p>
                <select
                    class="ng-cell__select"
                    value={d.dealId ?? ""}
                    onChange={(e) => {
                        const v = (e.currentTarget as HTMLSelectElement).value;
                        setDealId(v || null);
                    }}
                >
                    <option value="">{t("Select deal…")}</option>
                    {deals.map((dl) => (
                        <option value={dl.id} key={dl.id}>
                            {dl.accountName} · {dl.stage}
                        </option>
                    ))}
                </select>
            </div>
            <div class="ng-route-rack__cell">
                <p class="ng-cell__label">{t("Counterparty")}</p>
                <div class="ng-role-strip" role="tablist">
                    {ROLES.map((r) => (
                        <button
                            key={r}
                            type="button"
                            role="tab"
                            aria-selected={d.counterparty === r}
                            class={`ng-role-strip__btn${
                                d.counterparty === r ? " is-active" : ""
                            }`}
                            onClick={() => setCounterparty(r)}
                        >
                            {COUNTERPARTY_LABEL[r]}
                        </button>
                    ))}
                </div>
            </div>
            <div class="ng-route-rack__cell">
                <p class="ng-cell__label">{t("Person on the other side")}</p>
                <input
                    type="text"
                    class="ng-cell__input"
                    placeholder={t("Name / title")}
                    value={d.counterpartyName}
                    onInput={(e) =>
                        setCounterpartyName((e.currentTarget as HTMLInputElement).value)
                    }
                />
            </div>
            <div class="ng-route-rack__cell ng-route-rack__cell--full">
                <p class="ng-cell__label">{t("Ask moment")}</p>
                <select
                    class="ng-cell__select"
                    value={d.askMoment}
                    onChange={(e) => {
                        const v = (e.currentTarget as HTMLSelectElement)
                            .value as AskMoment;
                        setAskMoment(v);
                    }}
                >
                    {ASK_MOMENTS.map((m) => (
                        <option key={m} value={m}>
                            {ASK_MOMENT_LABEL[m]}
                        </option>
                    ))}
                </select>
            </div>
        </section>
    );
}
