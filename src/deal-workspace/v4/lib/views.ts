import type { Deal } from "../../lib/deal-shape";
import {
    rankRecovery,
    type RecoveryAssessment,
    type RecoveryLane
} from "../../lib/recovery";

/**
 * Deal Workspace v4 — the toggleable-views presentation model (canon
 * §4.13, Diagnosis Table). Three views (Focus / Timeline / List) all run
 * off ONE shared recovery engine (`rankRecovery`/`assessDeal`, reused
 * unchanged). This module is the read layer that shapes the ranked
 * assessments for each view — it invents no scoring of its own.
 *
 * The room leads with pressure: which deals will close-lost this week if
 * you do nothing, and the smallest corrective move. Stage is not truth
 * unless a real next step backs it.
 */

export type DwView = "focus" | "timeline" | "list";

export interface LaneMeta {
    readonly key: RecoveryLane;
    readonly cls: string;
    readonly title: string;
    readonly sub: string;
}

export const LANE_META: Record<RecoveryLane, LaneMeta> = {
    critical: { key: "critical", cls: "crit", title: "Slipping now", sub: "act this week or lose them" },
    "at-risk": { key: "at-risk", cls: "risk", title: "At risk", sub: "one thing overdue" },
    healthy: { key: "healthy", cls: "hold", title: "Holding", sub: "on track" }
};

export const LANE_ORDER: ReadonlyArray<RecoveryLane> = ["critical", "at-risk", "healthy"];

export interface HeroModel {
    readonly calm: boolean;
    readonly atRiskCount: number;
    readonly atRiskValue: number;
    readonly liveCount: number;
    readonly pipelineValue: number;
}

/** The hero read: how many deals slip this week + the $ at risk. */
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

/** Ranked assessments (critical-first) — the shared spine for all views. */
export function rankedAssessments(active: ReadonlyArray<Deal>): ReadonlyArray<RecoveryAssessment> {
    return rankRecovery(active);
}

/** Group the ranked assessments by lane, preserving rank within each. */
export function laneGroups(
    active: ReadonlyArray<Deal>
): Record<RecoveryLane, ReadonlyArray<RecoveryAssessment>> {
    const out: Record<RecoveryLane, RecoveryAssessment[]> = { critical: [], "at-risk": [], healthy: [] };
    for (const a of rankRecovery(active)) out[a.lane].push(a);
    return out;
}

/**
 * Timeline horizon position (0–100%) — higher recovery score = sooner
 * it slips = further left. Derived from the shared score, no new math.
 */
export function horizonPercent(assessment: RecoveryAssessment): number {
    // score ~0 (healthy) → far right; high score (critical) → far left.
    const clamped = Math.max(0, Math.min(160, assessment.score));
    return Math.round(4 + (1 - clamped / 160) * 88);
}

export const TIMELINE_ZONES: ReadonlyArray<{ cls: string; zt: string; zs: string; lane: RecoveryLane }> = [
    { cls: "z1", zt: "Slips this week", zs: "act now or lose it", lane: "critical" },
    { cls: "z2", zt: "Slips in ~2 weeks", zs: "one thing overdue", lane: "at-risk" },
    { cls: "z3", zt: "Holding / on track", zs: "nothing needed today", lane: "healthy" }
];

/** The 9 fields the Focus view surfaces — each a gap when unnamed. */
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
