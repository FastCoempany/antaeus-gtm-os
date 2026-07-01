import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { allDeals, focusedDeal } from "../state";
import {
    hrefToAdvisorDeploy,
    hrefToFutureAutopsy,
    hrefToNegotiation,
    hrefToPocFramework
} from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room cross-room handoff.
 *
 * Per canon §4.13 Deal Workspace feeds Future Autopsy / PoC /
 * Advisor. Before Phase 2.6 those intervention rooms were only
 * reachable via the deal-edit modal — Sarah had no entry point if
 * she was browsing the recovery board generally. Added in the
 * Recovery flow audit.
 *
 * Four verb-shape sales moves with continuity wrap (Phase 4 added
 * Negotiation as the fourth — that triangle Deal Workspace ↔
 * Negotiation ↔ Advisor Deploy is now lit on the high-pressure
 * phase of a deal per canon §4.16b):
 *   - Pre-mortem this deal (primary)   → /future-autopsy/
 *   - Forge the evidence                    → /poc-framework/
 *   - Rehearse the negotiation         → /negotiation/
 *   - Deploy an advisor                → /advisor-deploy/
 *
 * When a focal deal is pinned (focusedDeal signal), focusObject =
 * that deal's account name. When no deal is pinned, the destination
 * room loads at default state (and Sarah picks once she's there).
 */
export function HandoffStrip(): JSX.Element {
    const focal = focusedDeal.value;
    // `focal` is the computed signal value — either a deal or null.
    const focusName = focal?.accountName.trim() || undefined;
    const focusId = focal?.id || undefined;
    const dealCount = allDeals.value.length;
    if (dealCount === 0) {
        // No deals = no recovery to push. Skip the strip; the empty
        // grid above already directs Sarah to load a deal.
        return <></>;
    }

    return (
        <section class="dw-handoff" aria-label={t("Push the recovery forward")}>
            <header class="dw-handoff__head">
                <p class="dw-handoff__kicker">{t("CARRY THE RECOVERY FORWARD")}</p>
                <h2 class="dw-handoff__title">
                    {focal
                        ? `Push ${focal.accountName} into intervention.`
                        : t("Pick an intervention room.")}
                </h2>
                <p class="dw-handoff__sub">
                    {focal
                        ? t("Carries the focal deal into the destination.", { class: "body" })
                        : t(
                              "Pin a deal above first to carry it through, or jump to a room and pick from there.",
                              { class: "body" }
                          )}
                </p>
            </header>
            <nav class="dw-handoff__row" aria-label={t("Cross-room handoff")}>
                <a
                    class="dw-handoff__cta dw-handoff__cta--primary"
                    href={hrefToFutureAutopsy(focusName)}
                    data-dw-handoff="future-autopsy"
                >
                    {t("Pre-mortem this deal")}
                </a>
                <a
                    class="dw-handoff__cta"
                    href={hrefToPocFramework(focusName)}
                    data-dw-handoff="poc-framework"
                >
                    {t("Forge the evidence")}
                </a>
                <a
                    class="dw-handoff__cta"
                    href={hrefToNegotiation(focusId, focusName)}
                    data-dw-handoff="negotiation"
                >
                    {t("Rehearse the negotiation")}
                </a>
                <a
                    class="dw-handoff__cta"
                    href={hrefToAdvisorDeploy(focusName)}
                    data-dw-handoff="advisor-deploy"
                >
                    {t("Deploy an advisor")}
                </a>
            </nav>
        </section>
    );
}
