/**
 * Phase 4 / Room 4 — Future Autopsy domain types.
 *
 * Per CLAUDE.md §4.14 the Future Autopsy is a Diagnosis Table family
 * room and a named premium asset. Mind: "the deal is pinned as
 * evidence" — forensic light-table posture. Pre-mortem the deal
 * before it dies; show causal pattern + corrective route.
 *
 * Field names mirror the legacy `js/deal-health.js` + the legacy
 * `app/future-autopsy/index.html` runtime so existing data flows in
 * without translation.
 */

import type { StageId } from "@/deal-workspace/lib/deal-shape";

/**
 * Vitals — the per-deal computed health record. Produced from a Deal
 * by Wave 2's deal-health port. The legacy `dh.computeVitals()`
 * returns the same shape; downstream rooms (Future Autopsy, Dashboard,
 * Readiness) read these fields directly.
 */
export interface Vitals {
    readonly id: string;
    readonly name: string;
    readonly value: number;
    readonly stageRaw: StageId | string;
    readonly stage: string;
    readonly qualScore: number;
    readonly riskScore: number;
    readonly staleDays: number;
    readonly isClosed: boolean;
    readonly hasNextStep: boolean;
    readonly nextStepDate?: string;
    readonly closeDate?: string;
    readonly champion?: string;
    readonly economicBuyer?: string;
    readonly useCase?: string;
    readonly pain?: string;
    readonly competition?: string;
}

/**
 * Cause IDs — the failure-pattern vocabulary the room speaks. Cause
 * IDs map onto chapters (the narrative), win conditions (the corrective
 * route), and countermeasure tasks (the docket).
 *
 * Derived verbatim from the legacy `dh.topCauses()` output domain.
 */
export const CAUSE_IDS = [
    "no_nextstep",
    "next_step_overdue",
    "stage_stuck",
    "no_champion",
    "champion_weak",
    "no_eb",
    "no_process",
    "usecase_blurry",
    "impact_not_real",
    "competition_unknown",
    "single_threaded",
    "stale_thread",
    "poc_no_criteria",
    "proof_thin"
] as const;
export type CauseId = (typeof CAUSE_IDS)[number] | string;

export interface Cause {
    readonly id: CauseId;
    readonly weight: number;
    readonly label?: string;
}

/**
 * Verdict mode — the docket's posture. Matches the legacy
 * `currentVerdictMode` state.
 *
 *   left      = "If left alone" — the failure path; red docket
 *   corrected = "If corrected"  — the recovery path; green docket
 */
export type VerdictMode = "left" | "corrected";

/**
 * Forensic sheet — which tab inside the pinned-case sheet rack is
 * visible. Matches the legacy `currentForensicSheet` state.
 *
 * Wave 4 wires the three default sheets: pattern (causal narrative),
 * proof (proof-thin diagnosis), and symptom (specific deal-state
 * evidence rows).
 */
export type ForensicSheetKey = "pattern" | "proof" | "symptom";

/**
 * Chapter — the narrative payload attached to a cause. Hardcoded in
 * the legacy room (line 1863-1880); ported into a typed map in Wave 3.
 */
export interface Chapter {
    readonly cause: CauseId;
    readonly title: string;
    readonly story: string;
}

/**
 * Win condition — the corrective-route payload. Mirrors the legacy
 * WTEXT/WMAP pair.
 */
export interface WinCondition {
    readonly id: string;
    readonly title: string;
    readonly story: string;
}

/**
 * Countermeasure task — one item in the docket. Each task carries a
 * matcher (which causes it applies to), a why/evidence narrative pair,
 * and an inline conversation script the operator can copy.
 *
 * Mirrors the legacy TASKS array (line 1759-1771).
 */
export interface CountermeasureTask {
    readonly taskId: string;
    readonly label: string;
    readonly why: string;
    readonly evidence: string;
    readonly tab?: string;
    readonly match: ReadonlyArray<CauseId>;
    readonly script?: (vitals: Vitals) => string;
}

/**
 * AutopsyDoc — the full diagnosis output for a single pinned case.
 * Produced by Wave 3's `generateAutopsy(vitals)`.
 */
export interface AutopsyDoc {
    readonly deal: Vitals;
    readonly horizonDays: number;
    readonly causes: ReadonlyArray<Cause>;
    readonly chapters: ReadonlyArray<Chapter>;
    readonly winConditions: ReadonlyArray<WinCondition>;
    readonly countermeasures: ReadonlyArray<CountermeasureTask>;
    readonly killSwitch: string;
}

/**
 * Action-plan slot — the route rack at the bottom of the pinned-case
 * panel. Each slot is a route into another room with the canonical
 * continuity params attached.
 */
export interface ActionRoute {
    readonly label: string;
    readonly href: string;
    readonly roomLabel: string;
    readonly tone?: "primary" | "secondary" | "tertiary";
    readonly reason?: string;
}

export interface ActionPlan {
    readonly primary: ActionRoute | null;
    readonly secondary: ActionRoute | null;
    readonly tertiary: ActionRoute | null;
}

/**
 * Task completion log — persisted to `gtmos_autopsy_log_v1`. The
 * legacy room's only persistent state.
 */
export interface TaskCompletionEntry {
    readonly done: boolean;
    readonly doneAt?: string;
}

export interface TaskLogPerDeal {
    readonly lastRunAt?: string;
    readonly tasks: Readonly<Record<string, TaskCompletionEntry>>;
}

export type TaskLog = Readonly<Record<string, TaskLogPerDeal>>;

/** Default horizon for the autopsy room — 45 days out. */
export const DEFAULT_HORIZON_DAYS = 45;

/** Maximum cases pinned to the ledger at once. */
export const MAX_LEDGER_CASES = 6;
