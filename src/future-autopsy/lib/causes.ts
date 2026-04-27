import type { Cause, CauseId } from "./types";
import type { ComputedVitals } from "./vitals";
import { DEFAULT_PREFS, type Prefs } from "./vitals";

/**
 * Phase 4 / Room 4 Wave 2 — failure-pattern cause engine.
 *
 * Faithful port of the legacy `CAUSES` table + `topCauses()` from
 * `js/deal-health.js` lines 369-415. Each cause carries an id,
 * severity weight (drives ranking), narrative text, and a `when`
 * predicate that tests against the computed vitals.
 *
 * `topCauses(vitals, prefs, limit)` returns the highest-severity
 * causes that fire for this deal, sorted by severity desc.
 *
 * Future Autopsy uses this to drive both the causal-pattern narrative
 * (Wave 3 chapters) and the docket countermeasures (Wave 5).
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
        text: "There was never a dated next step, so momentum decayed.",
        when: (v) => v.missing.nextstep || !v.nextStepHasDate
    },
    {
        id: "stale_thread",
        severity: 8,
        text: "The thread went stale and urgency died.",
        when: (v, prefs) => v.staleDays >= prefs.staleWarnDays
    },
    {
        id: "no_champion",
        severity: 8,
        text: "No real champion carried this inside.",
        when: (v) => v.missing.champion
    },
    {
        id: "champion_weak",
        severity: 6,
        text: "Champion signal was weak and non-committal.",
        when: (v) => v.gates.champion === "weak"
    },
    {
        id: "no_eb",
        severity: 8,
        text: "Economic buyer never entered the thread.",
        when: (v) => v.missing.eb
    },
    {
        id: "no_process",
        severity: 8,
        text: "Decision process was never mapped.",
        when: (v) => v.missing.process
    },
    {
        id: "impact_not_real",
        severity: 7,
        text: "Business impact stayed vague.",
        when: (v) => v.missing.impact
    },
    {
        id: "usecase_blurry",
        severity: 7,
        text: "Use case remained blurry.",
        when: (v) => v.missing.usecase
    },
    {
        id: "competition_unknown",
        severity: 5,
        text: "Competition or status quo was never named.",
        when: (v) => v.missing.competition
    },
    {
        id: "stage_stuck",
        severity: 8,
        text: "Stage sat too long without movement.",
        when: (v, prefs) => v.stageAgeDays > prefs.stageStuckDays
    },
    {
        id: "poc_no_criteria",
        severity: 8,
        text: "PoC had no success criteria owner.",
        when: (v) =>
            /poc/.test(v.stage.toLowerCase()) &&
            (v.missing.impact || v.missing.process)
    },
    {
        id: "single_threaded",
        severity: 7,
        text: "Deal is single-threaded with fewer than 3 engaged stakeholders.",
        when: (v) => v.threading.engaged < 3 && v.value >= 50000
    },
    {
        id: "next_step_overdue",
        severity: 7,
        text: "Next step date is past due with no update.",
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
