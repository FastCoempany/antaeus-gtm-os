import type { JSX } from "preact";
import { draft, linkedDeal } from "../state";
import {
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy
} from "../lib/handoff";

/**
 * RouteRack — three CTAs at the bottom of the cast panel.
 *
 * Per canon §4.15 flows-out: proof object into Deal Workspace (risk),
 * Future Autopsy (kill rule), Advisor Deploy (portable evidence).
 *
 * Disabled when no account is set — the continuity params need a
 * focusObject. Linked-deal route gets a ghost button when no deal is
 * picked.
 */
export function RouteRack(): JSX.Element {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const account = drft.account.trim();
    const hasAccount = !!account;
    const dealHref = hasAccount
        ? hrefToDealWorkspace(account, linked?.id)
        : "#";
    const autopsyHref = hasAccount ? hrefToFutureAutopsy(account) : "#";
    const advisorHref = hasAccount ? hrefToAdvisorDeploy(account) : "#";

    return (
        <nav class="poc-route-rack" aria-label="Route rack">
            <span class="poc-route-rack__kicker">CARRY THE PROOF</span>
            <div class="poc-route-rack__list">
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--primary${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={dealHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">
                        Open in Deal Workspace
                    </span>
                    <span class="poc-route-rack__reason">
                        {linked
                            ? `Linked to ${linked.accountName}`
                            : "No deal linked yet"}
                    </span>
                </a>
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--ghost${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={autopsyHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">Pre-mortem in Future Autopsy</span>
                    <span class="poc-route-rack__reason">
                        Test what kills this PoC.
                    </span>
                </a>
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--ghost${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={advisorHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">Carry to Advisor Deploy</span>
                    <span class="poc-route-rack__reason">
                        Portable evidence for backchannel asks.
                    </span>
                </a>
            </div>
        </nav>
    );
}
