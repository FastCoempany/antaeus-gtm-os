import type { JSX } from "preact";
import { autopsyUniverse } from "../state";
import { DEFAULT_HORIZON_DAYS } from "../lib/types";

/**
 * Topbar — kicker + serif thesis title + horizon tag + dynamic count.
 *
 * Per canon §4.14 (Diagnosis Table): forensic light-table posture.
 * The topbar is calm; the work is the pinned-case ledger below it.
 *
 * Avoids the legacy designer-voice leaks (hardcoded "six-case
 * autopsy universe" was removed in `bb4a280`); count is dynamic.
 */
export function Topbar(): JSX.Element {
    const count = autopsyUniverse.value.length;
    const dealLabel = count === 1 ? "deal" : "deals";
    return (
        <header class="fa-topbar">
            <p class="fa-topbar__kicker">
                FUTURE AUTOPSY · WAVE 1 · {DEFAULT_HORIZON_DAYS} days out ·{" "}
                {count > 0 ? `${count} ${dealLabel} pinned` : "no deals pinned"}
            </p>
            <h1 class="fa-topbar__title">Pin the deal as evidence.</h1>
            <p class="fa-topbar__sub">
                Pre-mortem the deal before it dies. Pattern, intervention,
                route. Stage is not truth unless next-step truth backs it
                up.
            </p>
        </header>
    );
}
