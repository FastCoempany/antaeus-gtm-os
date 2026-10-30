import type { Cause, CauseId } from "./types";
import type { ComputedVitals } from "./vitals";
import { DEFAULT_PREFS, type Prefs } from "./vitals";

/**
 * Deal-risk cause engine. Each rule identifies an observable condition
 * that contributes to the risk assessment. Severity still drives ranking;
 * user-facing labels describe the evidence rather than asserting a cause
 * of loss that the stored data cannot prove.
 */

export interface CauseRule {
    readonly id: CauseId;
    readonly severity: number;
    readonly text: string;
    readonly when: (v: ComputedVitals, prefs: Prefs) => boolean;
}

export const CAUSES: ReadonlyArray<CauseRule> = [
    {
        id: "no_nextstep",
        severity: 9,
        text: "No dated next step is recorded.",
        when: (v) => v.missing.nextstep || !v.nextStepHasDate
    },
    {
        id: "stale_thread",
        severity: 8,
        text: "No recent buyer activity is recorded.",
        when: (v, prefs) => v.staleDays >= prefs.staleWarnDays
    },
    {
        id: "no_champion",
        severity: 8,
        text: "No confirmed champion is recorded.",
        when: (v) => v.missing.champion
    },
    {
        id: "champion_weak",
        severity: 6,
        text: "The recorded champion signal is weak or non-committal.",
        when: (v) => v.gates.champion === "weak"
    },
    {
        id: "no_eb",
        severity: 8,
        text: "No economic buyer is recorded.",
        when: (v) => v.missing.eb
    },
    {
        id: "no_process",
        severity: 8,
        text: "The decision process is not mapped.",
        when: (v) => v.missing.process
    },
    {
        id: "impact_not_real",
        severity: 7,
        text: "Business impact is not quantified or remains vague.",
        when: (v) => v.missing.impact
    },
    {
        id: "usecase_blurry",
        severity: 7,
        text: "The use case is not specific enough to evaluate consistently.",
        when: (v) => v.missing.usecase
    },
    {
        id: "competition_unknown",
        severity: 5,
        text: "The competitor or status quo is not recorded.",
        when: (v) => v.missing.competition
    },
    {
        id: "stage_stuck",
        severity: 8,
        text: "The deal has remained in the current stage longer than the configured stage-age threshold.",
        when: (v, prefs) => v.stageAgeDays > prefs.stageStuckDays
    },
    {
        id: "poc_no_criteria",
        severity: 8,
        text: "The pilot does not have complete success criteria and decision ownership.",
        when: (v) =>
            /poc/.test(v.stage.toLowerCase()) &&
            (v.missing.impact || v.missing.process)
    },
    {
        id: "single_threaded",
        severity: 7,
        text: "Fewer than three stakeholders are recorded as engaged on this deal.",
        when: (v) => v.threading.engaged < 3 && v.value >= 50000
    },
    {
        id: "next_step_overdue",
        severity: 7,
        text: "The recorded next-step date is overdue and has not been updated.",
        when: (v) => v.nextStepDaysAway !== null && v.nextStepDaysAway < 0
    }
] as const;

export function topCauses(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS,
    limit = 5
): ReadonlyArray<Cause> {
    return CAUSES.filter((c) => c.when(vitals, prefs))
        .map((c) => ({ id: c.id, weight: c.severity, label: c.text }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit);
}
