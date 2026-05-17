import type { JSX } from "preact";
import { autopsyUniverse, selectedVitals, selectDeal } from "../state";

function fmtMoney(n: number): string {
    if (!n) return "$0";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${Math.round(n)}`;
}

/**
 * Ledger — Wave 1 row list of pinned cases.
 *
 * Per canon §4.14 the ledger is "where the deal is pinned as
 * evidence." Each row carries the account name + value + risk score
 * + stage and is selectable; the selected row drives the pinned-case
 * panel above.
 *
 * Wave 3 will inject the real ranker (riskScore + staleDays + value
 * + stage urgency); Wave 1 sorts by riskScore alone, which is a
 * faithful first cut.
 */
export function Ledger(): JSX.Element {
    const cases = autopsyUniverse.value;
    const active = selectedVitals.value;

    if (cases.length === 0) {
        return (
            <section class="fa-ledger fa-ledger--empty" aria-label="Pinned-case ledger">
                <p class="fa-ledger__empty">
                    No deals pinned yet. Open Deal Workspace and push one
                    here to start the autopsy.
                </p>
            </section>
        );
    }

    return (
        <section class="fa-ledger" aria-label="Pinned-case ledger">
            <header class="fa-ledger__header">
                <span class="fa-ledger__kicker">PINNED CASES</span>
                <span class="fa-ledger__count">
                    {cases.length} live case{cases.length === 1 ? "" : "s"}
                </span>
            </header>
            <ul class="fa-ledger__list">
                {cases.map((v, i) => {
                    const isActive = active?.id === v.id;
                    return (
                        <li key={v.id}>
                            <button
                                type="button"
                                class={`fa-ledger__row${isActive ? " is-active" : ""}`}
                                aria-pressed={isActive}
                                onClick={() => selectDeal(v.id)}
                            >
                                <span class="fa-ledger__rank">
                                    {i + 1}.
                                </span>
                                <span class="fa-ledger__name">{v.name}</span>
                                <span class="fa-ledger__stage">{v.stage}</span>
                                <span class="fa-ledger__value">
                                    {fmtMoney(v.value)}
                                </span>
                                <span class="fa-ledger__risk">
                                    Risk {v.riskScore}/100
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
