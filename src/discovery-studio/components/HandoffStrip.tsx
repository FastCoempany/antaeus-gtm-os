import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { focusedAccount, nextStepLock } from "../state";
import { hrefToDealWorkspace, hrefToFutureAutopsy } from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room cross-room handoff.
 *
 * Per canon §4.12 Discovery Studio feeds Deal Workspace (active
 * framework, learned facts, stakeholder map, current-state method,
 * trigger event, proof threshold, blockers, next-step lock) +
 * Future Autopsy (failure-pattern clues, unresolved proof gaps,
 * stalled-next-step evidence). Preparing a follow-up call happens here
 * in Discovery Studio itself (Call Planner was retired into this room
 * 2026-07-06, canon §4.11), so there is no "plan the next call" route.
 *
 * Before Phase 2.5 the room had ZERO outbound handoff CTAs — Sarah
 * could finish the call, lock the next step, and have nowhere to
 * click. Added in the Discovery flow audit.
 *
 * Two verb-shape sales moves:
 *   - Push to the deal (primary)         → /deal-workspace/
 *   - Pre-mortem this deal               → /future-autopsy/
 *
 * Both carry continuity wrap (returnTo=/discovery-studio/,
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
        <section class="ds-handoff" aria-label={t("Carry the call forward")}>
            <header class="ds-handoff__head">
                <p class="ds-handoff__kicker">{t("CARRY THE CALL FORWARD")}</p>
                <h2 class="ds-handoff__title">
                    Push the deal, or set up what's next.
                </h2>
                <p class="ds-handoff__sub">{lockStatus}</p>
            </header>
            <nav class="ds-handoff__row" aria-label={t("Cross-room handoff")}>
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
            </nav>
        </section>
    );
}
