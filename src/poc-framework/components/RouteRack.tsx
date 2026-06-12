import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { draft, linkedDeal } from "../state";
import {
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToNegotiation
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
    const negotiationHref = hasAccount
        ? hrefToNegotiation(account, linked?.id)
        : "#";

    return (
        <nav class="poc-route-rack" aria-label={t("Route rack")}>
            <span class="poc-route-rack__kicker">{t("CARRY THE PROOF")}</span>
            <div class="poc-route-rack__list">
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--primary${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={dealHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">
                        Open the deal
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
                    <span class="poc-route-rack__label">{t("Pre-mortem this deal")}</span>
                    <span class="poc-route-rack__reason">
                        Stress-test what would kill this proof.
                    </span>
                </a>
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--ghost${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={advisorHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">{t("Carry to an advisor")}</span>
                    <span class="poc-route-rack__reason">
                        Portable evidence for backchannel asks.
                    </span>
                </a>
                <a
                    class={`poc-route-rack__cta poc-route-rack__cta--ghost${
                        hasAccount ? "" : " is-disabled"
                    }`}
                    href={negotiationHref}
                    aria-disabled={!hasAccount}
                >
                    <span class="poc-route-rack__label">{t("Rehearse the negotiation")}</span>
                    <span class="poc-route-rack__reason">
                        Carry proof state into a pricing or terms conversation.
                    </span>
                </a>
            </div>
        </nav>
    );
}
