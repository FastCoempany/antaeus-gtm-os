import type { JSX } from "preact";
import { autopsyUniverse } from "../state";
import { DEFAULT_HORIZON_DAYS } from "../lib/types";

/**
 * Topbar — kicker + serif headline + horizon tag + dynamic count.
 *
 * Per canon §4.14 (Diagnosis Table): forensic light-table posture.
 * The topbar is calm; the work is the pinned-case ledger below it.
 */
export function Topbar(): JSX.Element {
    const count = autopsyUniverse.value.length;
    const dealLabel = count === 1 ? "deal" : "deals";
    const tail =
        count > 0
            ? `${count} ${dealLabel} pinned`
            : "pin a deal from Deal Workspace";
    return (
        <header class="fa-topbar">
            <p class="fa-topbar__kicker">
                FUTURE AUTOPSY · {DEFAULT_HORIZON_DAYS} days out · {tail}
            </p>
            <h1 class="fa-topbar__title">The deal is pinned as evidence.</h1>
            <p class="fa-topbar__thesis">
                Bring one deal into focus. Decide what kills it — or what
                wins it — in the next {DEFAULT_HORIZON_DAYS} days.
            </p>
        </header>
    );
}
