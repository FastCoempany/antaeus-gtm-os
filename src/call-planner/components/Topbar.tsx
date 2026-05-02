import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { currentCompany, draft } from "../state";

/**
 * Topbar — Wave 1.
 *
 * Per canon §4.11: "the plan is not an agenda; it is the rep's pre-
 * conviction." The topbar carries the kicker + thesis + a live state
 * pill (currently focused company / contact). Wave 3 will feed this
 * the live quality band when the gate engine lands.
 */
export function Topbar(): JSX.Element {
    const d = draft.value;
    const company = currentCompany.value;
    const stateLabel = d.contactName.trim().length >= 2
        ? `Pressure script · ${d.contactName.trim()}`
        : "Pressure script";
    return (
        <header class="cp-topbar" aria-label="Call Planner header">
            <BackButton />
            <p class="cp-topbar__kicker">Calls family · Live instrument</p>
            <h1 class="cp-topbar__title">
                Walk into the call with conviction, not hope.
            </h1>
            <p class="cp-topbar__subtitle">
                One person. One reason now. Three probes. One advance ask.
                The plan must die in the call — not in the planner.
            </p>
            <div class="cp-topbar__meta" role="status">
                <span class="cp-topbar__state">{stateLabel}</span>
                {company ? (
                    <span class="cp-topbar__company">{company}</span>
                ) : null}
            </div>
        </header>
    );
}
