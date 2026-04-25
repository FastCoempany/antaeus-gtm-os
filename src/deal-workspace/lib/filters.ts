import type { DealFilter } from "../state";
import type { RecoveryAssessment } from "./recovery";

/**
 * Filter a ranked recovery list to the subset the operator wants in
 * view. Used by the intervention rail when the filter chips are not
 * "all".
 *
 *   - "all"          → no filter
 *   - "at-risk"      → critical + at-risk lanes only (drops healthy)
 *   - "stalled"      → cause text mentions "stall" or "since last activity"
 *   - "this-quarter" → close date falls inside the current quarter
 */
const QUARTER_MS = 0; // placeholder; quarter math lives in recovery.ts

export function filterAssessments(
    assessments: ReadonlyArray<RecoveryAssessment>,
    filter: DealFilter,
    now: Date = new Date()
): ReadonlyArray<RecoveryAssessment> {
    void QUARTER_MS;
    if (filter === "all") return assessments;
    if (filter === "at-risk") {
        return assessments.filter((a) => a.lane !== "healthy");
    }
    if (filter === "stalled") {
        return assessments.filter((a) =>
            a.causes.some(
                (c) => /stall/i.test(c) || /since last activity/i.test(c)
            )
        );
    }
    if (filter === "this-quarter") {
        return assessments.filter((a) =>
            isThisQuarter(a.deal.closeDate, now)
        );
    }
    return assessments;
}

function isThisQuarter(d: string | undefined, ref: Date): boolean {
    if (!d) return false;
    const qStart = new Date(
        ref.getFullYear(),
        Math.floor(ref.getMonth() / 3) * 3,
        1
    );
    const qEnd = new Date(qStart);
    qEnd.setMonth(qEnd.getMonth() + 3);
    const dt = new Date(d + "T00:00:00");
    return dt >= qStart && dt < qEnd;
}
