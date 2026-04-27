import type { JSX } from "preact";
import { rack } from "../state";
import {
    hrefToColdCallStudio,
    hrefToLinkedInPlaybook,
    hrefToSignalConsole
} from "../lib/handoff";

/**
 * HandoffStrip — Wave 5 implementation.
 *
 * Three CTAs across the bottom of the room (Rescore signal / Route
 * LinkedIn / Rehearse call). All carry continuity params so the
 * destination room renders a "Back to Outbound Studio" affordance
 * + restores focus on the same account.
 *
 * Disabled when no account is set — the focusObject param needs it.
 */
export function HandoffStrip(): JSX.Element {
    const account = rack.value.accountName.trim();
    const enabled = account.length > 0;
    const signalHref = enabled ? hrefToSignalConsole(account) : "#";
    const linkedinHref = enabled ? hrefToLinkedInPlaybook(account) : "#";
    const callHref = enabled ? hrefToColdCallStudio(account) : "#";

    return (
        <nav class="ob-handoff" aria-label="Cross-room routes">
            <span class="ob-handoff__kicker">RECOVERY CABLES</span>
            <div class="ob-handoff__list">
                <a
                    class={`ob-handoff__cta${enabled ? "" : " is-disabled"}`}
                    href={signalHref}
                    aria-disabled={!enabled}
                >
                    <span class="ob-handoff__label">Rescore signal</span>
                    <span class="ob-handoff__sub">
                        Back to Signal Console for fresh heat.
                    </span>
                </a>
                <a
                    class={`ob-handoff__cta${enabled ? "" : " is-disabled"}`}
                    href={linkedinHref}
                    aria-disabled={!enabled}
                >
                    <span class="ob-handoff__label">Route LinkedIn</span>
                    <span class="ob-handoff__sub">
                        Open the LinkedIn playbook ladder.
                    </span>
                </a>
                <a
                    class={`ob-handoff__cta${enabled ? "" : " is-disabled"}`}
                    href={callHref}
                    aria-disabled={!enabled}
                >
                    <span class="ob-handoff__label">Rehearse call</span>
                    <span class="ob-handoff__sub">
                        Pre-load the cold-call thread.
                    </span>
                </a>
            </div>
        </nav>
    );
}
