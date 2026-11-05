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

// ─── Chapters: cause → common pattern + corrective timing ──────────────
//
// Each entry states the pattern deals with this condition commonly follow
// (conditional, general sales knowledge — not a claim about this deal) and
// what to do about it, and when. `chapterFor` puts the observed condition
// from the deal record in front of it.

export const CHAPTERS: Readonly<Record<CauseId, string>> = {
    no_nextstep:
        "When no date is on the calendar, every follow-up tends to become a maybe. Get a dated next step agreed before you end the next conversation.",
    stale_thread:
        "Long silence often means the deal has slipped down the buyer's priority list. Reach out this week with a specific reason to talk, not a check-in.",
    no_champion:
        "Deals without someone inside carrying them often stall in committee. Find who will own this internally before the next step.",
    champion_weak:
        "A contact who likes you but can't win over the rest of the buying group usually can't get a deal through approval. Confirm what they can actually decide, and who they need on side.",
    no_eb:
        "When the budget owner stays out of view, the deal often stalls late, when they finally show up with questions. Get them into a conversation now, not at contract time.",
    no_process:
        "Unknown approval steps tend to surface one at a time, each adding delay. Ask for the full path to signature and an owner for each step while you still have attention.",
    impact_not_real:
        "Without a number the buyer believes, urgency rarely builds and the deal drifts. Agree on one measurable result before you go further.",
    usecase_blurry:
        "When people inside judge success differently, the decision tends to stall in debate. Get one written use case everyone agrees on.",
    competition_unknown:
        "If you don't know what they'd do instead, you can't shape the comparison, and doing nothing often wins by default. Ask directly what else they're considering.",
    stage_stuck:
        "A deal that sits in one stage for too long is often a quiet no that nobody has said yet. Ask plainly what has to happen to move forward, and by when.",
    poc_no_criteria:
        "A pilot without agreed success criteria often produces activity but no decision. Lock the criteria and who signs off on the result before the pilot starts, not at the end.",
    single_threaded:
        "When everything runs through one contact, the deal can go dark the day they get busy or move on. Get introduced to at least two more people now.",
    next_step_overdue:
        "An overdue step left alone often means the deal has already started to slip. Replace it with a new date this week."
};

/**
 * Build the chapter for a cause. `evidence` is the observed condition from
 * the deal record; the chapter's pattern + corrective advice follows it.
 */
export function chapterFor(cause: CauseId, evidence?: string): Chapter | null {
    const pattern = CHAPTERS[cause];
    if (!pattern) return null;
    const story = evidence ? `${evidence} ${pattern}` : pattern;
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

// ─── Stage / cause pattern leads ────────────────────────────────────────
//
// Stated as patterns deals at this stage commonly follow, with the timing
// advice that reverses them. Not a prediction about this specific deal.

export const STAGE_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "Deals at this stage often stall when the use case and impact never get concrete enough to create real urgency — people stay polite, but nobody owns the timing. Pin down the use case, a number, and who owns the decision now, before interest fades.",
    evaluation:
        "Deals in evaluation often stall when the use case and impact never get concrete enough to create real urgency — people stay polite, but nobody owns the timing. Pin down the use case, a number, and who owns the decision now, before interest fades.",
    poc:
        "Pilots often end with activity but no decision when success criteria were never agreed — each side reads the results differently, and procurement has no reason to move. Agree the criteria and the person who signs off before the pilot runs, not after.",
    negotiation:
        "In negotiation, legal and procurement often stretch the timeline when the approval path and budget owner were never mapped — each unanswered question adds another round. Map every remaining approval step and its owner this week.",
    verbal:
        "A verbal yes often comes apart when the paperwork wasn't cleared in advance — legal finds new issues, procurement re-scopes, and the urgency that got you the yes fades. Start legal and procurement now, while the yes is fresh.",
    _default:
        "Deals often lose momentum when a result worth acting on doesn't land early enough to start a real buying process. Get one concrete result in front of the decision owner soon."
};

export const CAUSE_LEADS: Readonly<
    Record<string, Readonly<Record<string, string>>>
> = {
    no_champion: {
        discovery:
            "No champion is recorded. Early deals without someone inside carrying them often fade from \"interesting\" to \"low priority\" to silence. Find who will own this internally before the next step.",
        negotiation:
            "No champion is recorded. In negotiation, deals without someone inside defending the business case often stall in procurement when pushback comes. Find who will fight for this internally before the next approval round."
    },
    no_eb: {
        negotiation:
            "No economic buyer is recorded. Contracts often come back with questions nobody can answer when the budget owner was never in the room. Get the person who can say yes into a conversation before legal goes further.",
        poc:
            "No economic buyer is recorded. Pilot results often sit unread in an email chain when the person who controls the budget never sees them. Book time with the budget owner to review the results before the pilot ends."
    },
    single_threaded: {
        discovery:
            "Fewer than three stakeholders are recorded. Deals that run through a single person often go dark when that person gets busy, takes leave, or moves roles. Get introduced to more people now, while interest is high.",
        negotiation:
            "Fewer than three stakeholders are recorded. One contact rarely carries a deal through a multi-person approval alone — every new reviewer becomes a cold start. Meet the remaining approvers before they see the contract."
    },
    stale_thread: {
        discovery:
            "The deal hasn't been updated recently. Silence that starts as \"they're busy\" often becomes permanent when there's no regular contact. Reach out this week with a specific reason to talk.",
        _default:
            "The deal hasn't been updated recently. Deals often go cold when nobody on either side books the next conversation, and silence turns into the decision. Get the next conversation on the calendar this week."
    }
};

export const STAGE_WIN_LEADS: Readonly<Record<string, string>> = {
    discovery:
        "Deals at this stage tend to move when the seller nails down a concrete use case, a number the buyer believes, and a regular next-step rhythm before enthusiasm cools.",
    evaluation:
        "Deals in evaluation tend to move when the seller nails down a concrete use case, a number the buyer believes, and a regular next-step rhythm before enthusiasm cools.",
    poc:
        "Pilots tend to convert when the success criteria, the owner, and an executive review of the results are agreed up front, so the results turn straight into an approval.",
    negotiation:
        "Negotiations tend to close faster when the approval path and budget owner are mapped early, which cuts down legal and procurement back-and-forth at the end.",
    verbal:
        "A verbal yes tends to hold when the paperwork is cleared before the yes, so legal review takes days instead of weeks.",
    _default:
        "Deals tend to move when a real result lands early and the risks to the decision are raised before they become deal-breakers."
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
