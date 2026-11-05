import type { Deal } from "../../lib/deal-shape";
import {
    rankRecovery,
    type RecoveryAssessment,
    type RecoveryLane
} from "../../lib/recovery";

/**
 * Deal Workspace presentation model.
 *
 * Focus, Timeline, and List all use the same risk-ranking engine. This module
 * only shapes that ranked assessment for display; it does not invent a loss
 * date or probability.
 */

export type DwView = "focus" | "timeline" | "list";

export interface LaneMeta {
    readonly key: RecoveryLane;
    readonly cls: string;
    readonly title: string;
    readonly sub: string;
}

export const LANE_META: Record<RecoveryLane, LaneMeta> = {
    critical: {
        key: "critical",
        cls: "crit",
        title: "High risk",
        sub: "review this week"
    },
    "at-risk": {
        key: "at-risk",
        cls: "risk",
        title: "Elevated risk",
        sub: "review risk factors"
    },
    healthy: {
        key: "healthy",
        cls: "hold",
        title: "Lower risk",
        sub: "no immediate risk action"
    }
};

export const LANE_ORDER: ReadonlyArray<RecoveryLane> = ["critical", "at-risk", "healthy"];

export interface HeroModel {
    readonly calm: boolean;
    readonly atRiskCount: number;
    readonly atRiskValue: number;
    readonly liveCount: number;
    readonly pipelineValue: number;
}

/** Number and value of deals currently outside the lower-risk band. */
export function buildHero(active: ReadonlyArray<Deal>): HeroModel {
    const ranked = rankRecovery(active);
    const atRisk = ranked.filter((a) => a.lane !== "healthy");
    return {
        calm: atRisk.length === 0,
        atRiskCount: atRisk.length,
        atRiskValue: atRisk.reduce((t, a) => t + (a.deal.value || 0), 0),
        liveCount: active.length,
        pipelineValue: active.reduce((t, d) => t + (d.value || 0), 0)
    };
}

/** Ranked assessments, highest risk score first. */
export function rankedAssessments(active: ReadonlyArray<Deal>): ReadonlyArray<RecoveryAssessment> {
    return rankRecovery(active);
}

/** Group the ranked assessments by lane, preserving rank within each. */
export function laneGroups(
    active: ReadonlyArray<Deal>
): Record<RecoveryLane, ReadonlyArray<RecoveryAssessment>> {
    const out: Record<RecoveryLane, RecoveryAssessment[]> = {
        critical: [],
        "at-risk": [],
        healthy: []
    };
    for (const a of rankRecovery(active)) out[a.lane].push(a);
    return out;
}

/**
 * Visual position on the score-derived risk axis. Higher risk score is shown
 * further left. Position is not a time-to-loss estimate.
 */
export function horizonPercent(assessment: RecoveryAssessment): number {
    const clamped = Math.max(0, Math.min(160, assessment.score));
    return Math.round(4 + (1 - clamped / 160) * 88);
}

export const TIMELINE_ZONES: ReadonlyArray<{
    cls: string;
    zt: string;
    zs: string;
    lane: RecoveryLane;
}> = [
    { cls: "z1", zt: "High risk", zs: "review this week", lane: "critical" },
    { cls: "z2", zt: "Elevated risk", zs: "review risk factors", lane: "at-risk" },
    { cls: "z3", zt: "Lower risk", zs: "no immediate risk action", lane: "healthy" }
];

/** Standard deal fields surfaced in Focus view. */
export function nineFields(deal: Deal): ReadonlyArray<{ k: string; v: string }> {
    return [
        { k: "Champion", v: deal.champion ?? "" },
        { k: "Economic buyer", v: deal.economicBuyer ?? "" },
        { k: "Use case", v: deal.useCase ?? "" },
        { k: "Pain", v: deal.pain ?? "" },
        { k: "Competition", v: deal.competition ?? "" },
        { k: "Next step", v: deal.nextStep ? "set" : "" },
        { k: "Decision process", v: deal.decisionProcess ?? "" },
        { k: "Momentum", v: deal.momentum ?? "" }
    ];
}
