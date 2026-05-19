import type { JSX } from "preact";
import { currentCompany, draft } from "../state";

/**
 * Topbar — Call Planner header.
 *
 * Per canon §4.11 the room prepares the shape of the next call. The
 * topbar carries a contextual kicker (focused contact when one is set)
 * plus the room headline line. The state pill shows the company link so
 * the operator can confirm at a glance which account the agenda is
 * pointed at.
 */
export function Topbar(): JSX.Element {
    const d = draft.value;
    const company = currentCompany.value;
    const contact = d.contactName.trim();
    // Phase 2.4 audit — kicker tail reflects what the planner is
    // pointed at (company + contact when known). Was just
    // "CALL PLANNER" with no contextual signal.
    const parts: string[] = ["CALL PLANNER"];
    if (company) parts.push(`for ${company}`);
    if (contact.length >= 2) parts.push(contact);
    const kicker = parts.join(" · ");
    return (
        <header class="cp-topbar" aria-label="Call Planner header">
            <p class="cp-topbar__kicker">{kicker}</p>
            <h1 class="cp-topbar__title">
                Walk into the call with conviction, not hope.
            </h1>
            {company ? (
                <p class="cp-topbar__on-radar" role="status">
                    On the agenda: <strong>{company}</strong>
                </p>
            ) : null}
        </header>
    );
}
