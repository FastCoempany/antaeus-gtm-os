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
            <p class="cp-topbar__kicker">CALLS FAMILY</p>
            <h1 class="cp-topbar__title">Call Planner</h1>
            <p class="cp-topbar__subtitle">
                Build the call so the actual human reveals the real
                pressure. One person. One reason now. Three probes. One
                advance ask.
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
