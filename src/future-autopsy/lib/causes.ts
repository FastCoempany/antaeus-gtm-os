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
        text: "The next step is missing, briefly described, or undated.",
        when: (v) => v.missing.nextstep || !v.nextStepHasDate
    },
    {
        id: "stale_thread",
        severity: 8,
        text: "The deal record has not been updated recently.",
        when: (v, prefs) => v.staleDays >= prefs.staleWarnDays
    },
    {
        id: "no_champion",
        severity: 8,
        text: "Champion details are missing or brief.",
        when: (v) => v.missing.champion
    },
    {
        id: "champion_weak",
        severity: 6,
        text: "Champion details are brief; confirm their role and agreed actions.",
        when: (v) => v.gates.champion === "weak"
    },
    {
        id: "no_eb",
        severity: 8,
        text: "Economic-buyer details are missing or brief.",
        when: (v) => v.missing.eb
    },
    {
        id: "no_process",
        severity: 8,
        text: "Decision-process details are missing or brief.",
        when: (v) => v.missing.process
    },
    {
        id: "impact_not_real",
        severity: 7,
        text: "Business-impact details are missing or brief.",
        when: (v) => v.missing.impact
    },
    {
        id: "usecase_blurry",
        severity: 7,
        text: "Use-case details are missing or brief.",
        when: (v) => v.missing.usecase
    },
    {
        id: "competition_unknown",
        severity: 5,
        text: "Competitor or status-quo details are missing or brief.",
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
        text: "Pilot impact or decision-process details are missing or brief.",
        when: (v) =>
            /poc/.test(v.stage.toLowerCase()) &&
            (v.missing.impact || v.missing.process)
    },
    {
        id: "single_threaded",
        severity: 7,
        text: "The recorded stakeholder-coverage count is below three.",
        when: (v) => v.threading.engaged < 3 && v.value >= 50000
    },
    {
        id: "next_step_overdue",
        severity: 7,
        text: "The recorded next-step date is overdue and has not been updated.",
        when: (v) => v.nextStepDaysAway !== null && v.nextStepDaysAway < 0
    }
] as const;

/** These rules use record completeness and update dates, not verified buyer behavior. */
function evidenceFor(rule: CauseRule, vitals: ComputedVitals): string {
    if (rule.id === "stale_thread") {
        return `The deal record was last updated ${vitals.staleDays} days ago; this is not a measure of buyer activity.`;
    }
    if (rule.id === "no_nextstep") {
        if (!vitals.hasNextStep) return "No next-step description is recorded.";
        if (!vitals.nextStepHasDate) return "The recorded next step has no date.";
        return "A dated next step is recorded, but its description is brief. Confirm the action and owner.";
    }
    if (rule.id === "no_champion" && vitals.gates.champion === "missing") return "No champion is recorded.";
    if (rule.id === "no_eb" && vitals.gates.eb === "missing") return "No economic buyer is recorded.";
    if (rule.id === "single_threaded") {
        return `The stakeholder-coverage count is ${vitals.threading.engaged}, below the target of three. This count includes named champion and economic-buyer fields.`;
    }
    return rule.text;
}

export function topCauses(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS,
    limit = 5
): ReadonlyArray<Cause> {
    return CAUSES.filter((c) => c.when(vitals, prefs))
        .map((c) => ({ id: c.id, weight: c.severity, label: evidenceFor(c, vitals) }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit);
}
