import type { CauseId, Chapter, CountermeasureTask, WinCondition } from "./types";
import type { ComputedVitals } from "./vitals";

/**
 * Phase 4 / Room 4 Wave 3 — narrative + countermeasure data.
 *
 * Faithful port of the legacy CHAPTERS / WMAP / WTEXT / TASKS /
 * STAGE_LEADS / CAUSE_LEADS / STAGE_WIN_LEADS objects from
 * `app/future-autopsy/index.html` lines 1728-1815. The narrative copy
 * is part of the room's mind (canon §4.14 — must not be flattened).
 */

// ─── Chapters: cause → narrative line ───────────────────────────────────

export const CHAPTERS: Readonly<Record<CauseId, string>> = {
    no_nextstep: "Calendar ambiguity turned every follow-up into a maybe.",
    stale_thread: "Silence signaled low priority internally.",
    no_champion: "Without a champion, you got parked in committee.",
    champion_weak: "Your internal contact could not force the room.",
    no_eb: "Budget authority stayed invisible until it was too late.",
    no_process: "Unknown steps multiplied slippage and rework.",
    impact_not_real: "Without quantified impact, urgency never materialized.",
    usecase_blurry: "Stakeholders did not align on what success meant.",
    competition_unknown:
        "You fought an invisible opponent and lost narrative control.",
    stage_stuck: "Elapsed time became a proxy for hidden no.",
    poc_no_criteria:
        "The pilot produced activity, not decision-ready evidence.",
    single_threaded:
        "One contact got busy and the entire deal went dark.",
    next_step_overdue:
        "The overdue step signaled the deal had already slipped."
};

export function chapterFor(cause: CauseId): Chapter | null {
    const story = CHAPTERS[cause];
    if (!story) return null;
    return { cause, title: cause, story };
}

// ─── Win conditions: cause → mirror win id + text ───────────────────────

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
    dated_nextstep_set: "Dated next step is set and accepted by both sides.",
    eb_engaged: "Economic buyer joined and confirmed budget owner.",
    process_mapped: "Decision process is mapped with owner and steps.",
    momentum_restored: "Thread was touched and calendar momentum restored.",
    champion_confirmed: "Champion role and accountability are explicit.",
    impact_quantified: "Impact is quantified in business terms.",
    usecase_clarified: "Use case is clear and scoped.",
    poc_success_criteria_locked:
        "PoC success criteria and readout owner are defined.",
    competition_named: "Competitor + status quo + our angle are explicit.",
    thread_reactivated: "Silence ended with a concrete exchange.",
    champion_strengthened: "Champion gained authority and internal pull.",
    multi_threaded:
        "Three or more stakeholders are engaged and driving internally.",
    nextstep_refreshed:
        "Overdue next step was resolved with a new commitment."
};

// ─── Stage / cause story leads ──────────────────────────────────────────

export const STAGE_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "45 days later, you lost because use case and impact were never concrete enough to force executive urgency. Stakeholders stayed polite, but no one took ownership of timing.",
    evaluation:
        "45 days later, you lost because use case and impact were never concrete enough to force executive urgency. Stakeholders stayed polite, but no one took ownership of timing.",
    poc: "45 days later, the PoC ended with activity but no decision because success criteria were never locked. Teams debated interpretation, and without a clear owner, procurement had no reason to accelerate.",
    negotiation:
        "45 days later, legal and procurement widened the blast radius because the decision path and budget owner were never tightly controlled. Each unanswered dependency created a new delay.",
    verbal: "45 days later, the verbal commit dissolved because paper process wasn't pre-cleared. Legal found new issues, procurement re-scoped, and the urgency that closed the deal evaporated.",
    _default:
        "45 days later, momentum faded because critical evidence never materialized early enough to force a committed buying process."
};

export const CAUSE_LEADS: Readonly<
    Record<string, Readonly<Record<string, string>>>
> = {
    no_champion: {
        discovery:
            "45 days later, you lost because no one inside the building carried your deal forward. Without an internal champion, your emails went from \"interesting\" to \"low priority\" to silence.",
        negotiation:
            "45 days later, the deal died in procurement because your champion couldn't defend the business case when pushback came. Without someone with authority fighting for you internally, the committee defaulted to no."
    },
    no_eb: {
        negotiation:
            "45 days later, legal sent the contract back with questions nobody could answer because the budget owner was never in the room. The person who could say yes never heard the pitch.",
        poc: "45 days later, the pilot results sat in an email chain because the person who controlled the budget never saw them. Activity without authority is just theater."
    },
    single_threaded: {
        discovery:
            "45 days later, your one contact went on PTO, got reassigned, or simply got busy. The deal had no backup path through the organization, so it went dark permanently.",
        negotiation:
            "45 days later, your single contact couldn't push the deal through a multi-stakeholder approval process alone. Every new reviewer was a cold start."
    },
    stale_thread: {
        discovery:
            "45 days later, the silence that started as \"they're busy\" became permanent. Without regular cadence, your deal lost its slot in their priority stack and never recovered.",
        _default:
            "45 days later, the thread went cold because no one on either side forced the next conversation. Silence became the decision."
    }
};

export const STAGE_WIN_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "45 days later, you won because you forced a concrete use case, quantifiable impact, and a real next step cadence before enthusiasm decayed.",
    evaluation:
        "45 days later, you won because you forced a concrete use case, quantifiable impact, and a real next step cadence before enthusiasm decayed.",
    poc: "45 days later, you won because the PoC had explicit success criteria, an owner, and an executive readout that translated evidence into approval momentum.",
    negotiation:
        "45 days later, you won because decision process and budget authority were mapped early, reducing legal/procurement drag and preserving end-game momentum.",
    verbal: "45 days later, you won because the paper process was pre-cleared before verbal commit, compressing legal review to days instead of weeks.",
    _default:
        "45 days later, you won because evidence tasks were completed early and decision risk was surfaced before it became terminal."
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

// ─── Win-condition extraction ──────────────────────────────────────────

/**
 * Map the top causes onto unique win conditions; pad with generic
 * momentum-restored entries until length ≥ 5 (matches legacy).
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
            story: WTEXT[wid] ?? "Critical win condition satisfied."
        });
        seen.add(wid);
    }
    while (wins.length < 5) {
        const id = `momentum_${wins.length}`;
        wins.push({
            id,
            title: id,
            story: "Momentum restored with named owner and date."
        });
    }
    return wins;
}

// ─── Countermeasure tasks ──────────────────────────────────────────────

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
        label: "Put a date on the next step",
        why: "No calendar anchor means no deal.",
        evidence: "Calendar invite accepted with date/time.",
        tab: "overview",
        match: ["no_nextstep", "stale_thread", "stage_stuck", "next_step_overdue"],
        script: () =>
            `Quick pulse — if this is still a priority, can we lock ${biz(1)} or ${biz(2)}?`
    },
    {
        taskId: "map_decision_process",
        label: "Map decision process + owner",
        why: "Unknown process causes slippage.",
        evidence: "Named steps and owner in notes.",
        tab: "qualification",
        match: ["no_process", "stage_stuck"],
        script: () =>
            "Before we invest more cycles: what are the steps from here to approval, and who owns each step?"
    },
    {
        taskId: "bring_eb_in",
        label: "Bring economic buyer into thread",
        why: "No budget owner means weak control.",
        evidence: "EB attends call and confirms budget path.",
        tab: "qualification",
        match: ["no_eb"],
        script: () =>
            "To make this real, we need the budget owner involved. Who owns approval, and can we invite them to the next call?"
    },
    {
        taskId: "confirm_champion",
        label: "Confirm champion",
        why: "No internal driver, no motion.",
        evidence: "Champion named with explicit internal actions.",
        tab: "qualification",
        match: ["no_champion", "champion_weak"],
        script: () =>
            "Who is driving this internally day-to-day, and can we align on their actions before next step?"
    },
    {
        taskId: "quantify_impact",
        label: "Quantify impact",
        why: "Weak impact kills urgency.",
        evidence: "Numeric impact metric documented.",
        tab: "qualification",
        match: ["impact_not_real", "poc_no_criteria"],
        script: () =>
            "Can we align on one concrete impact metric we will use to judge success?"
    },
    {
        taskId: "clarify_use_case",
        label: "Clarify use case",
        why: "Blur creates stakeholder drift.",
        evidence: "Use case and scope agreed in writing.",
        tab: "qualification",
        match: ["usecase_blurry"],
        script: () =>
            "Can we lock the primary use case and scope so teams evaluate the same outcome?"
    },
    {
        taskId: "name_competition",
        label: "Name competition/status quo",
        why: "Unknown alternative hides risk.",
        evidence: "Status quo and competitor documented.",
        tab: "qualification",
        match: ["competition_unknown"],
        script: () =>
            "Are we replacing a competitor or the status quo? We should name that now."
    },
    {
        taskId: "surface_risks",
        label: "Surface risks early",
        why: "Hidden blockers emerge too late.",
        evidence: "Top blockers and mitigation plan logged.",
        tab: "overview",
        match: ["stage_stuck"],
        script: () =>
            "What could block approval from here so we can de-risk now?"
    },
    {
        taskId: "set_exec_readout",
        label: "Set executive readout",
        why: "Late-stage deals need executive compression.",
        evidence: "Exec readout call booked with clear agenda.",
        tab: "overview",
        match: ["poc_no_criteria", "stage_stuck"],
        script: () =>
            "Let's set a 20-minute exec readout to align decision owner, timing, and approval path."
    },
    {
        taskId: "write_mutual_plan",
        label: "Write mutual action plan",
        why: "Shared plan reduces ambiguity.",
        evidence: "Mutual plan doc with owners and dates.",
        tab: "overview",
        match: ["no_nextstep", "no_process"],
        script: () =>
            "I will draft a mutual action plan with owners and dates; can we review it together?"
    },
    {
        taskId: "multi_thread",
        label: "Engage 3+ stakeholders",
        why: "Single-threaded deals die when your one contact gets busy.",
        evidence: "3+ contacts with defined roles and recent engagement.",
        tab: "stakeholders",
        match: ["single_threaded", "no_champion", "no_eb"],
        script: () =>
            "Can you introduce me to the technical evaluator and the person who would sign off on budget?"
    }
];

interface ScoredTask {
    readonly task: CountermeasureTask;
    readonly score: number;
}

/**
 * Pick the top N (default 5) countermeasure tasks for a given vitals
 * + cause set. Scoring logic ports the legacy `chooseTasks` (lines
 * 1832-1849): cause-severity sum + stage-specific boost + value boost.
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
