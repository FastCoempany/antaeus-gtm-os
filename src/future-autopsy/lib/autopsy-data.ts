import type { CauseId, Chapter, CountermeasureTask, WinCondition } from "./types";
import type { ComputedVitals } from "./vitals";

/**
 * Future Autopsy narrative and corrective-action data.
 *
 * Stable cause IDs, win-condition IDs, task IDs, and scoring behavior are
 * preserved. User-facing language separates observed conditions from risk
 * assessment and recommendation instead of presenting a predicted loss as
 * inevitable or claiming that one recorded condition caused an outcome.
 */

// ─── Chapters: cause → observed condition / assessment ─────────────────

export const CHAPTERS: Readonly<Record<CauseId, string>> = {
    no_nextstep: "No dated next step is recorded.",
    stale_thread: "No recent buyer activity is recorded.",
    no_champion: "No confirmed champion is recorded.",
    champion_weak:
        "A champion is named, but their authority or agreed internal actions are not yet clear.",
    no_eb: "No economic buyer or final budget owner is recorded.",
    no_process: "Decision steps and owners are not fully recorded.",
    impact_not_real: "No quantified business impact is recorded.",
    usecase_blurry: "The primary use case or success scope is not specific enough.",
    competition_unknown:
        "The competing alternative or status quo is not recorded.",
    stage_stuck:
        "The deal has remained in the current stage longer than the configured threshold.",
    poc_no_criteria:
        "Pilot success criteria or readout ownership are not fully defined.",
    single_threaded:
        "The deal depends on one active contact.",
    next_step_overdue:
        "The recorded next step is overdue."
};

export function chapterFor(cause: CauseId): Chapter | null {
    const story = CHAPTERS[cause];
    if (!story) return null;
    return { cause, title: cause, story };
}

// ─── Corrected conditions: cause → condition id + text ─────────────────

export const WMAP: Readonly<Record<CauseId, string>> = {
    no_nextstep: "dated_nextstep_set",
    no_eb: "eb_engaged",
    no_process: "process_mapped",
    stage_stuck: "momentum_restored",
    no_champion: "champion_confirmed",
    impact_not_real: "impact_quantified",
    usecase_blurry: "usecase_clarified",
    competition_unknown: "competition_named",
    stale_thread: "thread_reactivated",
    champion_weak: "champion_strengthened",
    single_threaded: "multi_threaded",
    next_step_overdue: "nextstep_refreshed",
    poc_no_criteria: "poc_success_criteria_locked"
};

export const WTEXT: Readonly<Record<string, string>> = {
    dated_nextstep_set: "A dated next step is set and accepted by both sides.",
    eb_engaged: "The economic buyer is identified and the budget path is confirmed.",
    process_mapped: "The decision process is mapped with named steps and owners.",
    momentum_restored: "Recent buyer activity and a dated next step are recorded.",
    champion_confirmed: "Champion role and agreed internal actions are explicit.",
    impact_quantified: "Business impact is quantified.",
    usecase_clarified: "The primary use case and scope are explicit.",
    poc_success_criteria_locked:
        "Pilot success criteria and the readout owner are defined.",
    competition_named: "The competing alternative or status quo is recorded.",
    thread_reactivated: "Recent buyer activity is recorded.",
    champion_strengthened:
        "Champion authority and agreed internal actions are documented.",
    multi_threaded:
        "Three or more stakeholders have defined roles and recent engagement.",
    nextstep_refreshed:
        "The overdue next step has been replaced with a new dated commitment."
};

// ─── Stage / cause assessment leads ─────────────────────────────────────

export const STAGE_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "Current risk is elevated when the use case, quantified impact, internal ownership, or next step is incomplete.",
    evaluation:
        "Current risk is elevated when the use case, quantified impact, internal ownership, or next step is incomplete.",
    poc:
        "Current risk is elevated when pilot success criteria, result ownership, or the approval path are not fully defined.",
    negotiation:
        "Current risk is elevated when legal, procurement, budget ownership, or the decision path contain unresolved dependencies.",
    verbal:
        "A verbal commitment still carries risk when contract, legal, procurement, or approval steps are not fully cleared.",
    _default:
        "Current deal risk is elevated by the recorded conditions below."
};

export const CAUSE_LEADS: Readonly<
    Record<string, Readonly<Record<string, string>>>
> = {
    no_champion: {
        discovery:
            "No confirmed champion is recorded. Without an identified internal owner, there is less evidence that someone is advancing the purchase between meetings.",
        negotiation:
            "A confirmed champion is not recorded during negotiation. That increases risk because no internal owner is documented for resolving approvals or pushback."
    },
    no_eb: {
        negotiation:
            "No economic buyer is recorded during negotiation, so budget ownership and final approval remain unclear.",
        poc:
            "Pilot results do not yet have a recorded economic buyer or budget owner."
    },
    single_threaded: {
        discovery:
            "The deal currently depends on one active contact. That increases risk if the contact becomes unavailable or disengages.",
        negotiation:
            "The deal currently depends on one active contact during a multi-stakeholder approval process."
    },
    stale_thread: {
        discovery:
            "No recent buyer activity is recorded. The longer that inactivity continues, the less current evidence there is that the opportunity remains a priority.",
        _default:
            "No recent buyer activity is recorded. Continued inactivity increases loss risk."
    }
};

export const STAGE_WIN_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "Risk decreases when the use case, quantified impact, internal owner, and dated next step are explicit.",
    evaluation:
        "Risk decreases when the use case, quantified impact, internal owner, and dated next step are explicit.",
    poc:
        "Risk decreases when success criteria, result ownership, executive review, and the next decision are explicit.",
    negotiation:
        "Risk decreases when decision steps, budget authority, legal and procurement dependencies, and owners are documented.",
    verbal:
        "Risk decreases when the remaining contract, legal, procurement, and approval steps are explicit and owned.",
    _default:
        "Risk decreases as the missing evidence, ownership, and next-step gaps are resolved."
};

export function stageLead(stageRaw: string, topCauseId: CauseId | ""): string {
    const causeVar = topCauseId ? CAUSE_LEADS[topCauseId] : undefined;
    if (causeVar) {
        if (causeVar[stageRaw]) return causeVar[stageRaw]!;
        if (causeVar._default) return causeVar._default;
    }
    return STAGE_LEADS[stageRaw] ?? STAGE_LEADS._default!;
}

export function stageWinLead(stageRaw: string): string {
    return STAGE_WIN_LEADS[stageRaw] ?? STAGE_WIN_LEADS._default!;
}

// ─── Corrected-condition extraction ────────────────────────────────────

/**
 * Map top causes onto unique corrected conditions; pad with generic
 * recent-activity/ownership entries until length >= 5. Stable IDs are
 * retained because downstream readers rely on them.
 */
export function winConditionsFor(
    causes: ReadonlyArray<{ readonly id: CauseId }>
): ReadonlyArray<WinCondition> {
    const wins: WinCondition[] = [];
    const seen = new Set<string>();
    for (const c of causes) {
        const wid = WMAP[c.id] ?? "momentum_restored";
        if (seen.has(wid)) continue;
        wins.push({
            id: wid,
            title: wid,
            story: WTEXT[wid] ?? "The identified risk condition has been addressed."
        });
        seen.add(wid);
    }
    while (wins.length < 5) {
        const id = `momentum_${wins.length}`;
        wins.push({
            id,
            title: id,
            story: "A named owner, recent activity, and a dated next step are recorded."
        });
    }
    return wins;
}

// ─── Corrective-action tasks ───────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
});

/**
 * Returns the n-th business day after `now`, formatted "Mon, May 5".
 * Pure: tests pass `now` for determinism.
 */
export function biz(n: number, now: number = Date.now()): string {
    const d = new Date(now);
    let remaining = n;
    while (remaining > 0) {
        d.setUTCDate(d.getUTCDate() + 1);
        const day = d.getUTCDay();
        if (day !== 0 && day !== 6) remaining--;
    }
    return WEEKDAY_FORMATTER.format(d);
}

export const TASKS: ReadonlyArray<CountermeasureTask> = [
    {
        taskId: "get_dated_nextstep",
        label: "Set a dated next step",
        why: "A dated next step creates a concrete buyer commitment.",
        evidence: "Calendar invite accepted with date/time.",
        tab: "overview",
        match: ["no_nextstep", "stale_thread", "stage_stuck", "next_step_overdue"],
        script: () =>
            `If this is still a priority, can we schedule ${biz(1)} or ${biz(2)} for the next step?`
    },
    {
        taskId: "map_decision_process",
        label: "Map decision process and owner",
        why: "Named approval steps and owners reduce process uncertainty.",
        evidence: "Named steps and owner in notes.",
        tab: "qualification",
        match: ["no_process", "stage_stuck"],
        script: () =>
            "What are the steps from here to approval, and who owns each step?"
    },
    {
        taskId: "bring_eb_in",
        label: "Identify and engage the economic buyer",
        why: "Budget ownership and final approval are unclear without the economic buyer.",
        evidence: "Economic buyer attends call and confirms budget path.",
        tab: "qualification",
        match: ["no_eb"],
        script: () =>
            "Who owns final approval and budget, and can we invite them to the next call?"
    },
    {
        taskId: "confirm_champion",
        label: "Confirm champion",
        why: "A confirmed champion provides a documented internal owner for the purchase.",
        evidence: "Champion named with explicit internal actions.",
        tab: "qualification",
        match: ["no_champion", "champion_weak"],
        script: () =>
            "Who is driving this internally day to day, and what will they own before the next step?"
    },
    {
        taskId: "quantify_impact",
        label: "Quantify impact",
        why: "Quantified impact gives the buyer a concrete basis for evaluating the purchase.",
        evidence: "Numeric impact metric documented.",
        tab: "qualification",
        match: ["impact_not_real", "poc_no_criteria"],
        script: () =>
            "Can we agree on one concrete impact metric we will use to judge success?"
    },
    {
        taskId: "clarify_use_case",
        label: "Clarify use case",
        why: "A specific use case keeps stakeholders evaluating the same outcome.",
        evidence: "Use case and scope agreed in writing.",
        tab: "qualification",
        match: ["usecase_blurry"],
        script: () =>
            "Can we confirm the primary use case and scope so everyone evaluates the same outcome?"
    },
    {
        taskId: "name_competition",
        label: "Record competition or status quo",
        why: "Knowing the alternative makes competitive and status-quo risk explicit.",
        evidence: "Status quo and competitor documented.",
        tab: "qualification",
        match: ["competition_unknown"],
        script: () =>
            "Are we replacing a competitor or the status quo?"
    },
    {
        taskId: "surface_risks",
        label: "Record approval risks",
        why: "Recording blockers early gives the team time to address them.",
        evidence: "Top blockers and mitigation plan logged.",
        tab: "overview",
        match: ["stage_stuck"],
        script: () =>
            "What could block approval from here, and who owns each issue?"
    },
    {
        taskId: "set_exec_readout",
        label: "Set executive review",
        why: "An executive review gives decision owners a defined point to review results and next steps.",
        evidence: "Executive review call booked with clear agenda.",
        tab: "overview",
        match: ["poc_no_criteria", "stage_stuck"],
        script: () =>
            "Can we set a 20-minute executive review to align the decision owner, timing, and approval path?"
    },
    {
        taskId: "write_mutual_plan",
        label: "Write mutual action plan",
        why: "A mutual action plan gives both sides shared owners and dates.",
        evidence: "Mutual plan document with owners and dates.",
        tab: "overview",
        match: ["no_nextstep", "no_process"],
        script: () =>
            "I will draft a mutual action plan with owners and dates. Can we review it together?"
    },
    {
        taskId: "multi_thread",
        label: "Engage 3+ stakeholders",
        why: "A deal that depends on one contact is more vulnerable if that person disengages.",
        evidence: "3+ contacts with defined roles and recent engagement.",
        tab: "stakeholders",
        match: ["single_threaded", "no_champion", "no_eb"],
        script: () =>
            "Can you introduce me to the technical evaluator and the person who would approve the budget?"
    }
];

interface ScoredTask {
    readonly task: CountermeasureTask;
    readonly score: number;
}

/**
 * Pick the top N (default 5) corrective actions for a given vitals
 * + cause set. Scoring behavior is unchanged: cause-severity sum +
 * stage-specific boost + value boost.
 */
export function chooseTasks(
    vitals: ComputedVitals,
    causes: ReadonlyArray<{ readonly id: CauseId; readonly weight: number }>,
    options: { readonly highValueUSD?: number; readonly limit?: number } = {}
): ReadonlyArray<CountermeasureTask> {
    const highValueUSD = options.highValueUSD ?? 75000;
    const limit = options.limit ?? 5;
    const sevByCause: Record<string, number> = {};
    for (const c of causes) sevByCause[c.id] = c.weight;

    const stage = vitals.stageRaw;

    function stageBoost(t: CountermeasureTask): number {
        if (
            stage === "poc" &&
            ["set_exec_readout", "quantify_impact", "map_decision_process"].includes(
                t.taskId
            )
        ) {
            return 4;
        }
        if (
            (stage === "negotiation" || stage === "verbal") &&
            ["bring_eb_in", "map_decision_process", "set_exec_readout"].includes(
                t.taskId
            )
        ) {
            return 4;
        }
        if (
            (stage === "discovery" || stage === "evaluation") &&
            ["clarify_use_case", "quantify_impact", "confirm_champion"].includes(
                t.taskId
            )
        ) {
            return 3;
        }
        return 0;
    }

    const valueBoost = vitals.value >= highValueUSD ? 2 : 0;

    const scored: ScoredTask[] = TASKS.map((t) => {
        const causeScore = t.match.reduce(
            (acc, id) => acc + (sevByCause[id] ?? 0),
            0
        );
        return { task: t, score: causeScore + stageBoost(t) + valueBoost };
    }).filter((s) => s.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.task);
}

void DAY_MS;
