import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { draft, draftDeal } from "../state";
import {
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToPocFramework
} from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room cross-room handoff for Negotiation.
 *
 * Per canon §4.16b Negotiation feeds Deal Workspace (rehearsal
 * outcomes + concession ledger), Future Autopsy (loss-pattern
 * feedback), Advisor Deploy (backchannel air cover), PoC Framework
 * (proof state on the negotiating deal).
 *
 * Four verb-shape sales moves with continuity wrap:
 *   - Update the deal (primary)        → /deal-workspace/?deal=…
 *   - Pre-mortem this deal             → /future-autopsy/?deal=…
 *   - Carry to an advisor              → /advisor-deploy/?deal=…
 *   - Sharpen the evidence                → /poc-framework/?deal=…
 *
 * When a focal deal is pinned (draftDeal signal), focusObject =
 * that deal's account name and `?deal=` threads through. When no
 * deal is pinned, the destination room loads at default state per
 * Invariant 8.
 */
export function HandoffStrip(): JSX.Element {
    const deal = draftDeal.value;
    const dealId = draft.value.dealId ?? undefined;
    const accountName = deal?.accountName?.trim() || undefined;

    return (
        <section class="ng-handoff" aria-label={t("Carry the negotiation forward")}>
            <header class="ng-handoff__head">
                <p class="ng-handoff__kicker">{t("CARRY THE NEGOTIATION FORWARD")}</p>
                <h2 class="ng-handoff__title">
                    {accountName
                        ? `Push the ${accountName} rehearsal into the deal.`
                        : "Push this rehearsal back into the deal."}
                </h2>
                <p class="ng-handoff__sub">
                    {dealId
                        ? "Outcome + concession ledger lands on the linked deal. The other rooms inherit the deal context."
                        : "Link a deal in the rack above first, or jump to a room and pick once you're there."}
                </p>
            </header>
            <nav class="ng-handoff__row" aria-label={t("Cross-room handoff")}>
                <a
                    class="ng-handoff__cta ng-handoff__cta--primary"
                    href={hrefToDealWorkspace(dealId, accountName)}
                    data-ng-handoff="deal-workspace"
                >
                    Update the deal
                </a>
                <a
                    class="ng-handoff__cta"
                    href={hrefToFutureAutopsy(dealId, accountName)}
                    data-ng-handoff="future-autopsy"
                >
                    Pre-mortem this deal
                </a>
                <a
                    class="ng-handoff__cta"
                    href={hrefToAdvisorDeploy(dealId, accountName)}
                    data-ng-handoff="advisor-deploy"
                >
                    Carry to an advisor
                </a>
                <a
                    class="ng-handoff__cta"
                    href={hrefToPocFramework(dealId, accountName)}
                    data-ng-handoff="poc-framework"
                >
                    Sharpen the evidence
                </a>
            </nav>
        </section>
    );
}
