import type { JSX } from "preact";
import {
    currentCompany,
    draft,
    matchedAccount,
    topSignalHeadline
} from "../state";

/**
 * Witness — Wave 1 placeholder for the workspace-health-style left rail.
 *
 * Wave 3 fills this with the dossier head (selected contact, persona,
 * company, linked-deal value+stage) + the support lines (signal-backed
 * vs LinkedIn-only / linked-deal status / live signal headline). For
 * Wave 1 it ships a skeleton block so the page lays out.
 */
export function Witness(): JSX.Element {
    const d = draft.value;
    const company = currentCompany.value;
    const account = matchedAccount.value;
    const topSignal = topSignalHeadline.value;
    return (
        <aside class="cp-witness" aria-label="Witness rail">
            <p class="cp-witness__kicker">SELECTED CONTACT</p>
            <h2 class="cp-witness__name">
                {d.contactName.trim() || "Choose the human."}
            </h2>
            <p class="cp-witness__meta">
                {company || "The agenda becomes credible only after the actual witness is named."}
            </p>
            <div class="cp-witness__placeholder">
                <p>
                    Wave 3 wires the dossier head + support lines.
                    {account
                        ? ` Currently matched: ${account.name} (heat ${account.heat}).`
                        : null}
                    {topSignal ? ` Top signal: ${topSignal}.` : null}
                </p>
            </div>
        </aside>
    );
}
