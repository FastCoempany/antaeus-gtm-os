import type { Advisor, AdvisorDeal, Deployment, MomentId } from "./types";
import { getCooldownStatus } from "./cooldown";

/**
 * Phase 4 / Room 10 Wave 2 — recommend logic.
 *
 * Three pure functions ported from `js/advisor-deploy-backchannel.js`:
 *   - advisorsForDeal (lines 156-161) — substring match against
 *     `deal.accountName` for any advisor.companies entry
 *   - recommendedMomentForDeal (lines 179-196) — stage + nextStep +
 *     EB/champion/decisionProcess gates pick the right ask-moment
 *   - recommendedAdvisor (lines 208-215) — exact match (cooldown OK)
 *     beats exact match (cooling) beats first registered advisor
 */

function normalize(value: string | null | undefined): string {
    return String(value ?? "").trim().toLowerCase();
}

/**
 * Advisors whose `companies` list contains an entry matching the deal's
 * account name (case-insensitive exact match). Mirrors legacy
 * `advisorsForDeal` behavior.
 */
export function advisorsForDeal(
    advisors: ReadonlyArray<Advisor>,
    deal: AdvisorDeal | null
): ReadonlyArray<Advisor> {
    if (!deal) return [];
    const account = normalize(deal.accountName);
    if (!account) return [];
    return advisors.filter((a) =>
        a.companies.some((c) => normalize(c) === account)
    );
}

/**
 * Pick the best moment id for a deal based on its stage + EB / champion
 * / next-step state. Faithful port of legacy lines 179-196.
 *
 *   - prospect → intro
 *   - discovery + no EB → eb_bridge; else intro
 *   - evaluation/poc + (no nextStepDate OR nextStepDate < now) → poc_stall
 *   - evaluation/poc + nextStepDate in future → reference
 *   - negotiation/verbal + nextStep mentions procurement/legal/security → procurement
 *   - negotiation/verbal + (no decisionProcess OR no EB) → board_decision
 *   - negotiation/verbal + otherwise → reference
 *   - closed-won → renewal
 *   - default → intro
 */
export function recommendedMomentForDeal(
    deal: AdvisorDeal | null,
    now: number = Date.now()
): MomentId {
    if (!deal) return "intro";
    const stage = String(deal.stage || "prospect");
    const nextStep = String(deal.nextStep || "").toLowerCase();
    if (stage === "prospect") return "intro";
    if (stage === "discovery" && !deal.economicBuyer) return "eb_bridge";
    if (stage === "evaluation" || stage === "poc") {
        const nextDate = deal.nextStepDate
            ? Date.parse(deal.nextStepDate)
            : NaN;
        if (!Number.isFinite(nextDate) || nextDate < now) return "poc_stall";
        return "reference";
    }
    if (stage === "negotiation" || stage === "verbal") {
        if (
            nextStep.indexOf("procurement") >= 0 ||
            nextStep.indexOf("legal") >= 0 ||
            nextStep.indexOf("security") >= 0
        ) {
            return "procurement";
        }
        if (!deal.decisionProcess || !deal.economicBuyer) {
            return "board_decision";
        }
        return "reference";
    }
    if (stage === "closed-won") return "renewal";
    return "intro";
}

/**
 * Pick the recommended advisor for a deal:
 *   1. exact-company match with cooldown OK (legacy line 209)
 *   2. exact-company match (any cooldown state) (line 211)
 *   3. first registered advisor (line 213)
 *   4. null when registry is empty
 */
export function recommendedAdvisor(
    advisors: ReadonlyArray<Advisor>,
    deployments: ReadonlyArray<Deployment>,
    deal: AdvisorDeal | null,
    now: number = Date.now()
): Advisor | null {
    const exact = advisorsForDeal(advisors, deal);
    const exactAvailable = exact.filter(
        (a) => getCooldownStatus(a, deployments, now).ok
    );
    if (exactAvailable.length > 0) return exactAvailable[0]!;
    if (exact.length > 0) return exact[0]!;
    if (advisors.length > 0) return advisors[0]!;
    return null;
}
