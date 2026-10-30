/**
 * Readiness dimension scorers — five pure functions, each
 * `ReadinessInput → DimensionScore`.
 *
 * Each scorer returns the existing 0–20 internal score plus explicit
 * evidence and next-action copy. The scoring math and thresholds are unchanged;
 * user-facing text names the actual sales activity or documentation required.
 */

import type { DimensionScore, ReadinessInput } from "./types";
import { t } from "@/lib/voice/t";
import { DIMENSION_LABEL } from "./types";

/** Saturating contribution: returns `cap` once `value >= threshold`. */
function saturate(value: number, threshold: number, cap: number): number {
    if (threshold <= 0) return cap;
    if (value <= 0) return 0;
    if (value >= threshold) return cap;
    return Math.round((value / threshold) * cap * 10) / 10;
}

/** Round to integer 0..20 inclusive. */
function clampScore(n: number): number {
    if (n <= 0) return 0;
    if (n >= 20) return 20;
    return Math.round(n);
}

/**
 * ICP & targeting — defined ICP, populated territory, and confirmed prospects.
 */
export function scoreIcp(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const icpExists = input.icpCount > 0 ? 6 : 0;
    if (icpExists > 0) {
        evidence.push(
            t("{n} ICP defined", { class: "body" }).replace(
                "{n}",
                String(input.icpCount)
            )
        );
    } else {
        gaps.push(t("Define your first ICP in ICP Studio", { class: "body" }));
    }

    const quality = saturate(input.bestIcpQualityScore, 100, 6);
    if (quality >= 4.5) {
        evidence.push(
            t("Best ICP quality: {n}/100", { class: "body" }).replace(
                "{n}",
                String(input.bestIcpQualityScore)
            )
        );
    } else if (icpExists > 0) {
        gaps.push(
            t("Complete the missing ICP criteria; current quality is below 75/100", {
                class: "body"
            })
        );
    }

    const territory = saturate(input.territoryAccountCount, 30, 5);
    if (territory >= 4) {
        evidence.push(
            t("{n} accounts in territory", { class: "body" }).replace(
                "{n}",
                String(input.territoryAccountCount)
            )
        );
    } else {
        gaps.push(t("Build the territory to 30+ accounts", { class: "body" }));
    }

    const pushed = saturate(input.sourcingProspectsReady, 10, 3);
    if (pushed >= 2) {
        evidence.push(
            t("{n} qualified prospects confirmed", { class: "body" }).replace(
                "{n}",
                String(input.sourcingProspectsReady)
            )
        );
    } else {
        gaps.push(
            t("Confirm 10+ qualified prospects in Prospecting Desk", { class: "body" })
        );
    }

    return {
        id: "icp",
        label: DIMENSION_LABEL.icp,
        score: clampScore(icpExists + quality + territory + pushed),
        evidence,
        gaps
    };
}

/** Outreach — recorded activity across channels and distinct accounts. */
export function scoreOutreach(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const touches = saturate(input.outboundTouches, 30, 6);
    if (touches >= 3) {
        evidence.push(
            t("{n} outbound touches", { class: "body" }).replace(
                "{n}",
                String(input.outboundTouches)
            )
        );
    } else {
        gaps.push(t("Record 30+ outbound touches", { class: "body" }));
    }

    const calls = saturate(input.coldCallsLogged, 15, 5);
    if (calls >= 3) {
        evidence.push(
            t("{n} cold calls logged", { class: "body" }).replace(
                "{n}",
                String(input.coldCallsLogged)
            )
        );
    } else {
        gaps.push(t("Log 15+ cold calls", { class: "body" }));
    }

    const cues = saturate(input.linkedinCues, 12, 4);
    if (cues >= 2) {
        evidence.push(
            t("{n} LinkedIn outreach actions logged", { class: "body" }).replace(
                "{n}",
                String(input.linkedinCues)
            )
        );
    } else {
        gaps.push(t("Log 12+ LinkedIn outreach actions", { class: "body" }));
    }

    const breadth = saturate(input.distinctAccountsTouched, 12, 5);
    if (breadth >= 3) {
        evidence.push(
            t("{n} distinct accounts contacted", { class: "body" }).replace(
                "{n}",
                String(input.distinctAccountsTouched)
            )
        );
    } else {
        gaps.push(t("Contact 12+ distinct accounts", { class: "body" }));
    }

    return {
        id: "outreach",
        label: DIMENSION_LABEL.outreach,
        score: clampScore(touches + calls + cues + breadth),
        evidence,
        gaps
    };
}

/** Discovery — prepared calls, recorded outcomes, and Discovery Studio use. */
export function scoreDiscovery(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const planned = saturate(input.callPlannerSessions, 8, 6);
    if (planned >= 2) {
        evidence.push(
            t("{n} call plans recorded", { class: "body" }).replace(
                "{n}",
                String(input.callPlannerSessions)
            )
        );
    } else {
        gaps.push(t("Prepare 8+ discovery call plans", { class: "body" }));
    }

    const advanced = saturate(input.discoveryAdvancedCalls, 6, 9);
    if (advanced >= 3) {
        evidence.push(
            t("{n} discovery calls recorded with outcome 'advanced'", { class: "body" }).replace(
                "{n}",
                String(input.discoveryAdvancedCalls)
            )
        );
    } else {
        gaps.push(
            t("Record 6+ discovery calls with outcome 'advanced'", { class: "body" })
        );
    }

    const studio = saturate(input.discoveryStudioSessions, 5, 5);
    if (studio >= 2) {
        evidence.push(
            t("{n} Discovery Studio sessions", { class: "body" }).replace(
                "{n}",
                String(input.discoveryStudioSessions)
            )
        );
    } else {
        gaps.push(t("Run 5+ Discovery Studio sessions", { class: "body" }));
    }

    return {
        id: "discovery",
        label: DIMENSION_LABEL.discovery,
        score: clampScore(planned + advanced + studio),
        evidence,
        gaps
    };
}

/** Deal management — active pipeline, next steps, wins, and analyzed losses. */
export function scoreDeals(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const active = saturate(input.activeDeals, 6, 6);
    if (active >= 2) {
        evidence.push(
            t("{n} active deals", { class: "body" }).replace(
                "{n}",
                String(input.activeDeals)
            )
        );
    } else {
        gaps.push(t("Build pipeline to 6+ active deals", { class: "body" }));
    }

    const stepped = saturate(input.dealsWithNextStep, 5, 5);
    if (stepped >= 2) {
        evidence.push(
            t("{n} deals with a recorded next step", { class: "body" }).replace(
                "{n}",
                String(input.dealsWithNextStep)
            )
        );
    } else {
        gaps.push(t("Record a next step on every active deal", { class: "body" }));
    }

    const won = saturate(input.closedWonDeals, 3, 5);
    if (won >= 2) {
        evidence.push(
            t("{n} closed-won deals", { class: "body" }).replace(
                "{n}",
                String(input.closedWonDeals)
            )
        );
    } else {
        gaps.push(t("Record 3+ closed-won deals", { class: "body" }));
    }

    const analyzed = saturate(input.closedLostDealsAnalyzed, 3, 4);
    if (analyzed >= 2) {
        evidence.push(
            t("{n} closed-lost deals with a recorded loss reason", { class: "body" }).replace(
                "{n}",
                String(input.closedLostDealsAnalyzed)
            )
        );
    } else {
        gaps.push(t("Record a loss reason on closed-lost deals", { class: "body" }));
    }

    return {
        id: "deals",
        label: DIMENSION_LABEL.deals,
        score: clampScore(active + stepped + won + analyzed),
        evidence,
        gaps
    };
}

/**
 * Pilot evidence & handoff — artifacts and documented outcomes another seller
 * can inspect rather than relying on founder memory.
 */
export function scoreProof(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const proofs = saturate(input.castProofs, 3, 5);
    if (proofs >= 2) {
        evidence.push(
            t("{n} pilot evidence records", { class: "body" }).replace(
                "{n}",
                String(input.castProofs)
            )
        );
    } else {
        gaps.push(t("Record results from 3+ pilots", { class: "body" }));
    }

    const autopsies = saturate(input.futureAutopsiesRun, 3, 5);
    if (autopsies >= 2) {
        evidence.push(
            t("{n} deal-risk reviews completed", { class: "body" }).replace(
                "{n}",
                String(input.futureAutopsiesRun)
            )
        );
    } else {
        gaps.push(
            t("Complete deal-risk reviews for 3+ deals in Future Autopsy", {
                class: "body"
            })
        );
    }

    const advisors = saturate(input.advisorDeployments, 3, 4);
    if (advisors >= 2) {
        evidence.push(
            t("{n} Call in a Favor requests logged", { class: "body" }).replace(
                "{n}",
                String(input.advisorDeployments)
            )
        );
    } else {
        gaps.push(
            t("Use Call in a Favor on 3+ deals and record the outcomes", {
                class: "body"
            })
        );
    }

    const handoff = saturate(input.handoffSectionsReady, 5, 6);
    if (handoff >= 2) {
        evidence.push(
            t("{n}/7 sales handoff sections ready", { class: "body" }).replace(
                "{n}",
                String(input.handoffSectionsReady)
            )
        );
    } else {
        gaps.push(t("Complete 5+ Founding GTM handoff sections", { class: "body" }));
    }

    return {
        id: "proof",
        label: DIMENSION_LABEL.proof,
        score: clampScore(proofs + autopsies + advisors + handoff),
        evidence,
        gaps
    };
}

/** Run all five scorers in stable internal order. */
export function scoreAllDimensions(
    input: ReadinessInput
): ReadonlyArray<DimensionScore> {
    return [
        scoreIcp(input),
        scoreOutreach(input),
        scoreDiscovery(input),
        scoreDeals(input),
        scoreProof(input)
    ];
}
