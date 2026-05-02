import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
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
            <BackButton />
            <p class="fa-topbar__kicker">
                FUTURE AUTOPSY · {DEFAULT_HORIZON_DAYS} days out ·{" "}
                {count > 0 ? `${count} ${dealLabel} pinned` : "no deals pinned"}
            </p>
            <h1 class="fa-topbar__title">The deal is pinned as evidence.</h1>
            <p class="fa-topbar__thesis">
                This room behaves like a lit evidence surface, not a page.
                Bring one failure pattern into focus before any corrective
                route earns legitimacy.
            </p>
        </header>
    );
}
