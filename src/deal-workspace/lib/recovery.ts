import type { Deal, StageId } from "./deal-shape";
import { isClosed, STAGE_ORDER } from "./deal-shape";

/**
 * Deal-risk ranking derived deterministically from current deal state.
 *
 * The model ranks open deals by three observable factor groups:
 *   - inactivity: days since the last recorded update;
 *   - next-step status: missing, undated, overdue, or due soon;
 *   - close-date timing: overdue or expected in the current quarter.
 *
 * The score is a prioritization heuristic. It does not predict that a deal
 * will be lost on a particular date.
 *
 * Existing scoring behavior is unchanged:
 *   - inactivity: 0 days = 0, >=30 days = 100;
 *   - next step: missing = 60, overdue = 80, due soon = 30;
 *   - close date: current quarter = +30, overdue = +50;
 *   - score >=150 = critical, >=80 = at-risk, otherwise healthy.
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
    if (days >= 30) return { score: 100, cause: `No recorded activity for ${days} days` };
    if (days >= 14) return { score: 70, cause: `${days} days since last recorded activity` };
    if (days >= 7) return { score: 35, cause: `${days} days since last recorded activity` };
    return { score: 0, cause: null };
}

function nextStepScore(deal: Deal): { score: number; cause: string | null } {
    if (!deal.nextStep || deal.nextStep.trim() === "") {
        return { score: 60, cause: "No next step is recorded" };
    }
    if (!deal.nextStepDate) {
        return { score: 30, cause: "The next step has no date" };
    }
    const days = daysUntil(deal.nextStepDate);
    if (days === null) return { score: 30, cause: "The next-step date could not be read" };
    if (days < 0) return { score: 80, cause: `Next step is ${Math.abs(days)} days overdue` };
    if (days <= 3) return { score: 30, cause: `Next step is due in ${days} days` };
    return { score: 0, cause: null };
}

function closeDateScore(deal: Deal): { score: number; cause: string | null } {
    if (!deal.closeDate) return { score: 0, cause: null };
    const days = daysUntil(deal.closeDate);
    if (days === null) return { score: 0, cause: null };
    if (days < 0) return { score: 50, cause: `Expected close date is ${Math.abs(days)} days overdue` };
    if (isThisQuarter(deal.closeDate)) {
        return { score: 30, cause: "Expected close date is in the current quarter" };
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
            return "Set a dated next step with the buyer.";
        }
        return "Confirm or replace the current next step with the buyer.";
    }
    if (lane === "at-risk") {
        if (!deal.nextStep) return "Set a dated next step with the buyer.";
        if (!deal.champion) return "Identify the internal champion and confirm their role.";
        return "Confirm that the current next step is still agreed and dated.";
    }
    if (deal.stage === "prospect" || deal.stage === "discovery") {
        return "Confirm what the buyer needs to evaluate next.";
    }
    return "Review the current next step and keep it dated.";
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
    // Highest risk score first. Ties use later sales stage because more of the
    // recorded buying process has already occurred; this is prioritization,
    // not a claim that the deal is closer to loss.
    return assessments.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return STAGE_ORDER[b.deal.stage] - STAGE_ORDER[a.deal.stage];
    });
}

/** Group ranked assessments by stable internal lane. */
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

/** Stage transition check used by the loss-reason modal trigger. */
export function transitionedToLost(prev: StageId, next: StageId): boolean {
    return prev !== "closed-lost" && next === "closed-lost";
}
