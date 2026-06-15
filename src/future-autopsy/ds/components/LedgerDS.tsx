import type { JSX } from "preact";
import { Kicker, StatusChip } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { autopsyUniverse, selectDeal, selectedVitals } from "../../state";
import { fmtMoney, riskTone } from "../lib/adapters";

/**
 * LedgerDS — the pinned-case ledger as the FocalRail's rail (canon
 * §4.14: "the deal is pinned as evidence"). Each case is a clickable
 * row carrying the at-risk glyph, the name, the stage, and the risk
 * chip; selecting one drives the focal pinned-case analysis. The
 * active case is marked with the orange selected edge.
 */
export function LedgerDS(): JSX.Element {
    const cases = autopsyUniverse.value;
    const active = selectedVitals.value;

    if (cases.length === 0) {
        return (
            <section class="fad-ledger fad-ledger--empty" aria-label={t("Pinned cases")}>
                <Kicker>{t("PINNED CASES")}</Kicker>
                <p class="fad-ledger__empty">
                    {t(
                        "No deals pinned yet. Open Deal Workspace and push one here to start the pre-mortem.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    return (
        <section class="fad-ledger" aria-label={t("Pinned cases")}>
            <header class="fad-ledger__head">
                <Kicker>{t("PINNED CASES")}</Kicker>
                <span class="fad-ledger__count">
                    {cases.length} {cases.length === 1 ? t("case") : t("cases")}
                </span>
            </header>
            <ul class="fad-ledger__list">
                {cases.map((v) => {
                    const isActive = active?.id === v.id;
                    return (
                        <li key={v.id}>
                            <button
                                type="button"
                                class={`fad-ledger__row${isActive ? " is-active" : ""}`}
                                aria-pressed={isActive}
                                onClick={() => selectDeal(v.id)}
                            >
                                <span class="fad-ledger__mark">
                                    <Icon name="at-risk" size={16} />
                                </span>
                                <span class="fad-ledger__body">
                                    <span class="fad-ledger__name">{v.name}</span>
                                    <span class="fad-ledger__meta">
                                        {v.stage} · {fmtMoney(v.value)}
                                    </span>
                                </span>
                                <StatusChip
                                    label={`Risk ${v.riskScore}`}
                                    tone={riskTone(v.riskScore)}
                                />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
