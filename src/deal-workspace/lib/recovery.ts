import type { Deal, StageId } from "./deal-shape";
import { isClosed, STAGE_ORDER } from "./deal-shape";

/**
 * Recovery ranking — ports the legacy `getRecoveryMoves` logic from
 * `js/deal-health.js` + `app/deal-workspace/index.html` into typed code.
 *
 * The room's mind (canon §4.13) demands: "first-fold should expose
 * pressure fast — which deals will close-lost if I do nothing this week,
 * and what's the smallest corrective move." This module derives that
 * ranking deterministically from deal state.
 *
 * Three ranking signals (highest combined score = most urgent recovery):
 *   - **Staleness** (days since last update): 0 days = 0, ≥30 days = 100
 *   - **Next-step pressure**: missing next-step = 60, overdue = 80,
 *     due-soon = 30
 *   - **Close-date pressure**: in-quarter deals get +30; overdue gets +50
 *
 * Total score caps at 100 per signal, summed (max 290).
 *
 * Lane assignment from the score:
 *   - score >= 150 → critical
 *   - score >= 80  → at-risk
 *   - score < 80   → healthy
 *
 * Already-closed deals (won or lost) are filtered out; they don't need
 * recovery, only post-mortem.
 */

export type RecoveryLane = "healthy" | "at-risk" | "critical";

export interface RecoveryAssessment {
    readonly deal: Deal;
    readonly score: number;
    readonly lane: RecoveryLane;
    readonly causes: ReadonlyArray<string>;
    readonly nextMove: string;
}

const NOW = (): Date => new Date();

function daysBetween(a: string | undefined, ref: Date = NOW()): number {
    if (!a) return 0;
    const t = new Date(a);
    if (Number.isNaN(t.getTime())) return 0;
    return Math.max(0, Math.floor((ref.getTime() - t.getTime()) / 86400000));
}

function daysUntil(d: string | undefined, ref: Date = NOW()): number | null {
    if (!d) return null;
    const t = new Date(d + "T23:59:59");
    if (Number.isNaN(t.getTime())) return null;
    return Math.floor((t.getTime() - ref.getTime()) / 86400000);
}

function isThisQuarter(d: string | undefined, ref: Date = NOW()): boolean {
    if (!d) return false;
    const qStart = new Date(ref.getFullYear(), Math.floor(ref.getMonth() / 3) * 3, 1);
    const qEnd = new Date(qStart);
    qEnd.setMonth(qEnd.getMonth() + 3);
    const dt = new Date(d + "T00:00:00");
    return dt >= qStart && dt < qEnd;
}

function stalenessScore(deal: Deal): { score: number; cause: string | null } {
    const days = daysBetween(deal.updated_at ?? deal.created_at);
    if (days >= 30) return { score: 100, cause: `Stalled ${days} days` };
    if (days >= 14) return { score: 70, cause: `${days} days since last activity` };
    if (days >= 7) return { score: 35, cause: `${days} days since last activity` };
    return { score: 0, cause: null };
}

function nextStepScore(deal: Deal): { score: number; cause: string | null } {
    if (!deal.nextStep || deal.nextStep.trim() === "") {
        return { score: 60, cause: "No next step set" };
    }
    if (!deal.nextStepDate) {
        return { score: 30, cause: "Next step has no date" };
    }
    const days = daysUntil(deal.nextStepDate);
    if (days === null) return { score: 30, cause: "Next step date unparseable" };
    if (days < 0) return { score: 80, cause: `Next step ${Math.abs(days)} days overdue` };
    if (days <= 3) return { score: 30, cause: `Next step due in ${days} days` };
    return { score: 0, cause: null };
}

function closeDateScore(deal: Deal): { score: number; cause: string | null } {
    if (!deal.closeDate) return { score: 0, cause: null };
    const days = daysUntil(deal.closeDate);
    if (days === null) return { score: 0, cause: null };
    if (days < 0) return { score: 50, cause: `Close date ${Math.abs(days)} days overdue` };
    if (isThisQuarter(deal.closeDate)) {
        return { score: 30, cause: "Closing this quarter" };
    }
    return { score: 0, cause: null };
}

function laneFromScore(score: number): RecoveryLane {
    if (score >= 150) return "critical";
    if (score >= 80) return "at-risk";
    return "healthy";
}

function suggestedNextMove(deal: Deal, lane: RecoveryLane): string {
    if (lane === "critical") {
        if (!deal.nextStep) {
            return "Lock a real next step today — anything specific advances this.";
        }
        return "Reinitiate the next step — the deal is stalling.";
    }
    if (lane === "at-risk") {
        if (!deal.nextStep) return "Set a concrete next step with a date.";
        if (!deal.champion) return "Confirm the champion before more activity.";
        return "Tighten the next-step pressure with the buyer.";
    }
    if (deal.stage === "prospect" || deal.stage === "discovery") {
        return "Push toward a proof-threshold conversation.";
    }
    return "Maintain pace; check next-step quality next session.";
}

export function assessDeal(deal: Deal): RecoveryAssessment | null {
    if (isClosed(deal.stage)) return null;
    const stale = stalenessScore(deal);
    const next = nextStepScore(deal);
    const close = closeDateScore(deal);
    const score = stale.score + next.score + close.score;
    const lane = laneFromScore(score);
    const causes = [stale.cause, next.cause, close.cause].filter(
        (c): c is string => c !== null
    );
    return {
        deal,
        score,
        lane,
        causes,
        nextMove: suggestedNextMove(deal, lane)
    };
}

export function rankRecovery(deals: ReadonlyArray<Deal>): ReadonlyArray<RecoveryAssessment> {
    const assessments: RecoveryAssessment[] = [];
    for (const d of deals) {
        const a = assessDeal(d);
        if (a) assessments.push(a);
    }
    // Highest-score first; tiebreak by stage proximity to close (later
    // stages first because they're closer to the cliff).
    return assessments.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return STAGE_ORDER[b.deal.stage] - STAGE_ORDER[a.deal.stage];
    });
}

/** Group ranked assessments by lane. */
export function groupByLane(
    assessments: ReadonlyArray<RecoveryAssessment>
): Record<RecoveryLane, ReadonlyArray<RecoveryAssessment>> {
    const groups: Record<RecoveryLane, RecoveryAssessment[]> = {
        critical: [],
        "at-risk": [],
        healthy: []
    };
    for (const a of assessments) groups[a.lane].push(a);
    return groups;
}

/** Stage-stage progression check used by the loss-reason modal trigger. */
export function transitionedToLost(prev: StageId, next: StageId): boolean {
    return prev !== "closed-lost" && next === "closed-lost";
}
