/**
 * Dimension scorers — five pure functions, each `ReadinessInput → DimensionScore`.
 *
 * Each scorer returns 0-20 with explicit evidence + gap copy so the
 * drawer can render specific reasons under each dimension. The math
 * is intentionally simple: a small number of named contributions,
 * each capped, summed to 20.
 *
 * The shape of each contribution is the same:
 *   - what raw input matters
 *   - a saturating threshold (when "enough" is reached)
 *   - a scaled contribution to the dimension's total
 *
 * Numbers were picked so that the canon §4.17 verdict gates are
 * achievable through realistic operator behavior — not so easy that
 * the verdict floats up on activity, not so harsh that the verdict
 * stays at "Building" forever.
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
 * ICP & targeting — sharpened ICP + a real, populated territory.
 *
 *   ICP exists                +6 (saturated at 1 ICP)
 *   ICP quality score         up to +6 (best ICP qualityScore / 100 * 6)
 *   Territory has accounts    up to +5 (saturates at 30 accounts)
 *   Sourcing pushed prospects up to +3 (saturates at 10 ready prospects)
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
        gaps.push(t("Sharpen ICP — quality below 75/100", { class: "body" }));
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
        gaps.push(t("Build out territory to 30+ accounts", { class: "body" }));
    }

    const pushed = saturate(input.sourcingProspectsReady, 10, 3);
    if (pushed >= 2) {
        evidence.push(
            t("{n} prospects ready/pushed", { class: "body" }).replace(
                "{n}",
                String(input.sourcingProspectsReady)
            )
        );
    } else {
        gaps.push(t("Push 10+ qualified prospects through Sourcing", { class: "body" }));
    }

    return {
        id: "icp",
        label: DIMENSION_LABEL.icp,
        score: clampScore(icpExists + quality + territory + pushed),
        evidence,
        gaps
    };
}

/**
 * Outreach — touches across channels + breadth of accounts touched.
 *
 *   Touches logged             up to +6 (saturates at 30)
 *   Cold calls logged          up to +5 (saturates at 15)
 *   LinkedIn cues logged       up to +4 (saturates at 12)
 *   Distinct accounts touched  up to +5 (saturates at 12)
 */
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
        gaps.push(t("Send 30+ outbound touches", { class: "body" }));
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
            t("{n} LinkedIn cues", { class: "body" }).replace(
                "{n}",
                String(input.linkedinCues)
            )
        );
    } else {
        gaps.push(t("Run 12+ LinkedIn cues", { class: "body" }));
    }

    const breadth = saturate(input.distinctAccountsTouched, 12, 5);
    if (breadth >= 3) {
        evidence.push(
            t("{n} distinct accounts touched", { class: "body" }).replace(
                "{n}",
                String(input.distinctAccountsTouched)
            )
        );
    } else {
        gaps.push(t("Touch 12+ distinct accounts (breadth)", { class: "body" }));
    }

    return {
        id: "outreach",
        label: DIMENSION_LABEL.outreach,
        score: clampScore(touches + calls + cues + breadth),
        evidence,
        gaps
    };
}

/**
 * Discovery — planned calls + advanced outcomes + actual studio sessions.
 *
 *   Call planner sessions      up to +6 (saturates at 8)
 *   Discovery advanced calls   up to +9 (saturates at 6) — the strongest
 *                              signal: an advance means the call moved
 *                              the deal forward, which is the whole point
 *   Discovery Studio sessions  up to +5 (saturates at 5)
 */
export function scoreDiscovery(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const planned = saturate(input.callPlannerSessions, 8, 6);
    if (planned >= 2) {
        evidence.push(
            t("{n} call plans built", { class: "body" }).replace(
                "{n}",
                String(input.callPlannerSessions)
            )
        );
    } else {
        gaps.push(t("Build 8+ call plans in Call Planner", { class: "body" }));
    }

    const advanced = saturate(input.discoveryAdvancedCalls, 6, 9);
    if (advanced >= 3) {
        evidence.push(
            t("{n} calls advanced the deal", { class: "body" }).replace(
                "{n}",
                String(input.discoveryAdvancedCalls)
            )
        );
    } else {
        gaps.push(t("Advance 6+ calls (outcome = advanced)", { class: "body" }));
    }

    const studio = saturate(input.discoveryStudioSessions, 5, 5);
    if (studio >= 2) {
        evidence.push(
            t("{n} discovery sessions", { class: "body" }).replace(
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

/**
 * Deal motion — alive pipeline + serious next-steps + closed wins +
 * losses analyzed (closed-lost without a loss reason is unfinished
 * work, not a learning).
 *
 *   Active deals               up to +6 (saturates at 6)
 *   Deals with named next-step up to +5 (saturates at 5)
 *   Closed-won deals           up to +5 (saturates at 3)
 *   Closed-lost deals analyzed up to +4 (saturates at 3)
 */
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
            t("{n} deals with named next-step", { class: "body" }).replace(
                "{n}",
                String(input.dealsWithNextStep)
            )
        );
    } else {
        gaps.push(t("Name a next-step on every active deal", { class: "body" }));
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
        gaps.push(t("Close 3+ wins", { class: "body" }));
    }

    const analyzed = saturate(input.closedLostDealsAnalyzed, 3, 4);
    if (analyzed >= 2) {
        evidence.push(
            t("{n} losses analyzed (loss reason captured)", { class: "body" }).replace(
                "{n}",
                String(input.closedLostDealsAnalyzed)
            )
        );
    } else {
        gaps.push(t("Capture loss reason on closed-lost deals", { class: "body" }));
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
 * Proof & memory — the artifacts that make the motion *transferable*.
 * This dimension is what separates "lots of activity" from "real
 * institutional memory a hire could inherit."
 *
 *   Cast proofs (PoC Framework)    up to +5 (saturates at 3)
 *   Future Autopsies run           up to +5 (saturates at 3 deals)
 *   Advisor deployments            up to +4 (saturates at 3)
 *   Handoff sections ready         up to +6 (saturates at 5/7)
 */
export function scoreProof(input: ReadinessInput): DimensionScore {
    const evidence: string[] = [];
    const gaps: string[] = [];

    const proofs = saturate(input.castProofs, 3, 5);
    if (proofs >= 2) {
        evidence.push(
            t("{n} pieces of cast evidence", { class: "body" }).replace(
                "{n}",
                String(input.castProofs)
            )
        );
    } else {
        gaps.push(t("Cast 3+ pieces of evidence in PoC Framework", { class: "body" }));
    }

    const autopsies = saturate(input.futureAutopsiesRun, 3, 5);
    if (autopsies >= 2) {
        evidence.push(
            t("{n} deals with autopsy artifacts", { class: "body" }).replace(
                "{n}",
                String(input.futureAutopsiesRun)
            )
        );
    } else {
        gaps.push(t("Run 3+ Future Autopsies (corrective action logged)", { class: "body" }));
    }

    const advisors = saturate(input.advisorDeployments, 3, 4);
    if (advisors >= 2) {
        evidence.push(
            t("{n} advisor deployments", { class: "body" }).replace(
                "{n}",
                String(input.advisorDeployments)
            )
        );
    } else {
        gaps.push(t("Deploy advisors on 3+ deals", { class: "body" }));
    }

    const handoff = saturate(input.handoffSectionsReady, 5, 6);
    if (handoff >= 2) {
        evidence.push(
            t("{n}/7 handoff sections ready", { class: "body" }).replace(
                "{n}",
                String(input.handoffSectionsReady)
            )
        );
    } else {
        gaps.push(t("Compose 5+ Founding GTM sections", { class: "body" }));
    }

    return {
        id: "proof",
        label: DIMENSION_LABEL.proof,
        score: clampScore(proofs + autopsies + advisors + handoff),
        evidence,
        gaps
    };
}

/** Run all five scorers, in canonical order. */
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
