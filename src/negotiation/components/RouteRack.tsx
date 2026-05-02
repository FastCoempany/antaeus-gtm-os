import type { JSX } from "preact";
import {
    draft,
    linkedDeals,
    setCounterparty,
    setCounterpartyName,
    setDealId
} from "../state";
import {
    COUNTERPARTY_LABEL,
    type CounterpartyRole
} from "../lib/types";

const ROLES: ReadonlyArray<CounterpartyRole> = [
    "cfo",
    "procurement",
    "legal",
    "gc"
];

/**
 * RouteRack — the 3-cell routing surface (Deal × Counterparty × Person)
 * that mirrors Advisor Deploy's route bar pattern. Picking a deal +
 * role + name is the whole "ask-routing" signal — everything below
 * the rack adapts to that selection.
 */
export function RouteRack(): JSX.Element {
    const d = draft.value;
    const deals = linkedDeals.value;
    return (
        <section class="ng-route-rack" aria-label="Negotiation route">
            <div class="ng-route-rack__cell">
                <p class="ng-cell__label">Deal</p>
                <select
                    class="ng-cell__select"
                    value={d.dealId ?? ""}
                    onChange={(e) => {
                        const v = (e.currentTarget as HTMLSelectElement).value;
                        setDealId(v || null);
                    }}
                >
                    <option value="">Select deal…</option>
                    {deals.map((dl) => (
                        <option value={dl.id} key={dl.id}>
                            {dl.accountName} · {dl.stage}
                        </option>
                    ))}
                </select>
            </div>
            <div class="ng-route-rack__cell">
                <p class="ng-cell__label">Counterparty</p>
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
                <p class="ng-cell__label">Person on the other side</p>
                <input
                    type="text"
                    class="ng-cell__input"
                    placeholder="Name / title"
                    value={d.counterpartyName}
                    onInput={(e) =>
                        setCounterpartyName((e.currentTarget as HTMLInputElement).value)
                    }
                />
            </div>
        </section>
    );
}
