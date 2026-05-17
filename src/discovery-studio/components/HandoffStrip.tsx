import type { JSX } from "preact";
import { focusedAccount, nextStepLock } from "../state";
import {
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToFutureAutopsy
} from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room cross-room handoff.
 *
 * Per canon §4.12 Discovery Studio feeds Deal Workspace (active
 * framework, learned facts, stakeholder map, current-state method,
 * trigger event, proof threshold, blockers, next-step lock) +
 * Future Autopsy (failure-pattern clues, unresolved proof gaps,
 * stalled-next-step evidence) + Call Planner (re-prep when the call
 * spawns a follow-up).
 *
 * Before Phase 2.5 the room had ZERO outbound handoff CTAs — Sarah
 * could finish the call, lock the next step, and have nowhere to
 * click. Added in the Discovery flow audit.
 *
 * Three verb-shape sales moves:
 *   - Push to the deal (primary)         → /deal-workspace/
 *   - Pre-mortem this deal               → /future-autopsy/
 *   - Plan the next call                 → /call-planner/
 *
 * All three carry continuity wrap (returnTo=/discovery-studio/,
 * focusObject=account when known, fromMode=room) so destinations
 * land with provenance + focus.
 */
export function HandoffStrip(): JSX.Element {
    const account = focusedAccount.value.trim() || undefined;
    const lock = nextStepLock.value;
    const lockStatus =
        lock.date && lock.owner && lock.purpose
            ? `Next step locked for ${lock.date}.`
            : "Lock the next step above before handing off.";

    return (
        <section class="ds-handoff" aria-label="Carry the call forward">
            <header class="ds-handoff__head">
                <p class="ds-handoff__kicker">CARRY THE CALL FORWARD</p>
                <h2 class="ds-handoff__title">
                    Push the deal, or set up what's next.
                </h2>
                <p class="ds-handoff__sub">{lockStatus}</p>
            </header>
            <nav class="ds-handoff__row" aria-label="Cross-room handoff">
                <a
                    class="ds-handoff__cta ds-handoff__cta--primary"
                    href={hrefToDealWorkspace(account)}
                    data-ds-handoff="deal-workspace"
                >
                    Push to the deal
                </a>
                <a
                    class="ds-handoff__cta"
                    href={hrefToFutureAutopsy(account)}
                    data-ds-handoff="future-autopsy"
                >
                    Pre-mortem this deal
                </a>
                <a
                    class="ds-handoff__cta"
                    href={hrefToCallPlanner(account)}
                    data-ds-handoff="call-planner"
                >
                    Plan the next call
                </a>
            </nav>
        </section>
    );
}
