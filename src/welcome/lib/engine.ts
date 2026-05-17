import {
    EMPTY_COUNTS,
    type Milestone,
    type NextAction,
    type WorkspaceCounts
} from "./types";

/**
 * buildMilestones — faithful port of the legacy 4-milestone ladder
 * from app/welcome/index.html lines 191-198. Order is locked: ICP →
 * signal/account → deal → motion. The order matters because each
 * unlock makes the next room more believable.
 */
export function buildMilestones(counts: WorkspaceCounts): ReadonlyArray<Milestone> {
    const motionCount = counts.touches + counts.calls;
    return [
        {
            key: "icp",
            label: "First ICP saved",
            copy: "Targeting truth exists for the rest of the system to compound from.",
            done: counts.icps > 0
        },
        {
            key: "signal",
            label: "First live signal or account saved",
            copy: "Signal Console now has real external context to work from.",
            done: counts.accounts > 0 || counts.signals > 0
        },
        {
            key: "deal",
            label: "First real deal created",
            copy: "Dashboard, pipeline review, and downstream proof now have something real to brief.",
            done: counts.deals > 0
        },
        {
            key: "motion",
            label: "First motion logged",
            copy: "Calls, touches, or LinkedIn actions are being captured instead of living in memory.",
            done: motionCount > 0
        }
    ];
}

export interface ActivationModel {
    readonly milestones: ReadonlyArray<Milestone>;
    readonly completed: number;
    readonly total: number;
    readonly headline: string;
    readonly body: string;
    readonly nextMilestone: Milestone | null;
}

export function buildActivationModel(
    counts: WorkspaceCounts = EMPTY_COUNTS
): ActivationModel {
    const milestones = buildMilestones(counts);
    const completed = milestones.filter((m) => m.done).length;
    const nextIdx = milestones.findIndex((m) => !m.done);
    const next = nextIdx >= 0 ? milestones[nextIdx]! : null;

    let headline: string;
    let body: string;
    if (completed === 0) {
        headline = "Define one sharp ICP to start.";
        body =
            "One wedge — who you sell to, what they're feeling, why now. Everything downstream targets against it: signals, outbound, deals.";
    } else if (completed < milestones.length) {
        headline = next
            ? `Next move: ${next.label.toLowerCase()}.`
            : "One more anchor and the workspace is fully live.";
        body = next
            ? `Land this and the Dashboard sharpens around it.`
            : "The remaining work is depth, not setup.";
    } else {
        headline = "All four anchors are live.";
        body =
            "The workspace is operating. Run the daily rhythm from the Dashboard.";
    }

    return {
        milestones,
        completed,
        total: milestones.length,
        headline,
        body,
        nextMilestone: next
    };
}

const ACTION_ICP: Omit<NextAction, "state"> = {
    key: "icp",
    title: "Define your first ICP.",
    body: "One sharp wedge: who you sell to, what they're feeling, why now. Everything downstream targets against it.",
    href: "/icp-studio/",
    cta: "Sharpen the wedge",
    meta: ["highest leverage", "targeting truth"],
    why: "Targeting truth compounds before activity does.",
    unlocks: "Sharper signals, cleaner outbound, and a credible Dashboard brief."
};
const ACTION_SIGNAL: Omit<NextAction, "state"> = {
    key: "signal",
    title: "Add one live account.",
    body: "One real company gets the radar warm. Heat, recent signals, next-move guidance all start firing once an account is in.",
    href: "/signal-console/",
    cta: "Add the account",
    meta: ["real account", "deep research"],
    why: "The signal layer needs one live account to behave like an intelligence system.",
    unlocks: "Heat scoring, next-move guidance, and context for sourcing + outbound."
};
const ACTION_DEAL: Omit<NextAction, "state"> = {
    key: "deal",
    title: "Add your first live deal.",
    body: "One real opportunity wakes up the recovery board, PoC planning, and the Dashboard's risk rail.",
    href: "/deal-workspace/",
    cta: "Add the deal",
    meta: ["pipeline truth", "dashboard unlock"],
    why: "Without a real deal, the downstream rooms are briefing hypothetical work.",
    unlocks: "Future Autopsy, PoC Framework, Advisor Deploy, and a more honest Dashboard."
};
const ACTION_MOTION: Omit<NextAction, "state"> = {
    key: "motion",
    title: "Log the first motion.",
    body: "One outbound touch or one real call so the workspace starts holding operating memory.",
    href: "/outbound-studio/",
    cta: "Log a motion",
    meta: ["activity trail", "week one"],
    why: "Week one is incomplete until at least one motion has run through the system.",
    unlocks: "Readiness evidence and a clearer operating rhythm."
};
const ACTION_PLANNER: Omit<NextAction, "state"> = {
    key: "planner",
    title: "Prep the next discovery call.",
    body: "Turn an active deal into a structured conversation — not a loose note.",
    href: "/call-planner/",
    cta: "Plan the call",
    meta: ["call quality", "active deal"],
    why: "You have enough deal truth to make the next call deliberate.",
    unlocks: "A stronger agenda and a clean handoff into Discovery Studio."
};
const ACTION_QUOTA: Omit<NextAction, "state"> = {
    key: "quota",
    title: "Set quota and targets.",
    body: "Put your quota math and ACV in. The Dashboard starts speaking in revenue pressure, not just activity.",
    href: "/quota-workback/",
    cta: "Set the targets",
    meta: ["system math", "benchmarks"],
    why: "Readiness gets credible when activity is anchored to actual revenue pressure.",
    unlocks: "Weekly touch targets, coverage math, and a sharper Dashboard."
};
const ACTION_BACKUP: Omit<NextAction, "state"> = {
    key: "backup",
    title: "Export the first backup.",
    body: "Make the workspace durable outside this browser before week one gets messy.",
    href: "/settings/",
    cta: "Export now",
    meta: ["durability", "trust"],
    why: "Week one isn't complete until the workspace survives a refresh and a bad decision.",
    unlocks: "Safer experimentation and a workspace that feels durable, not lucky."
};
const ACTION_DASHBOARD: Omit<NextAction, "state"> = {
    key: "dashboard",
    title: "Return to the Dashboard.",
    body: "Run the daily rhythm from the ranked command stack.",
    href: "/dashboard/",
    cta: "Open the Dashboard",
    meta: ["operating rhythm", "daily command stack"],
    why: "The app should now behave like a morning operating room.",
    unlocks: "Faster daily resets and a clearer week-one rhythm."
};

/**
 * buildActions — produces a ranked next-action list of up to 5
 * actions. Faithful to the legacy buildActions() priority order
 * (icp → signal → deal → motion → planner → quota → backup) but
 * trimmed to the rooms that actually exist on the new stack.
 *
 * The first action in the returned list is "Now"; second is "Next";
 * the rest are "Ready".
 */
export function buildActions(
    counts: WorkspaceCounts = EMPTY_COUNTS
): ReadonlyArray<NextAction> {
    const actions: Array<Omit<NextAction, "state">> = [];
    const seen = new Set<string>();
    const push = (a: Omit<NextAction, "state">): void => {
        if (seen.has(a.key)) return;
        seen.add(a.key);
        actions.push(a);
    };

    if (counts.icps === 0) push(ACTION_ICP);
    if (counts.accounts === 0 && counts.signals === 0) push(ACTION_SIGNAL);
    if (counts.deals === 0) push(ACTION_DEAL);
    if (counts.touches + counts.calls === 0) push(ACTION_MOTION);

    if (actions.length < 4 && counts.deals > 0) push(ACTION_PLANNER);
    if (actions.length < 4) push(ACTION_QUOTA);
    if (actions.length < 4) push(ACTION_BACKUP);
    if (actions.length < 4) push(ACTION_DASHBOARD);

    // First-90-seconds audit: on a TRULY EMPTY workspace (no ICPs, no
    // accounts, no signals, no deals, no motion), the operator doesn't
    // need a menu of four options — they need exactly one. Four equal-
    // weight "Create your first…" cards flatten the ranking; the
    // dominant move IS the first ICP. Once any anchor lands, the stack
    // grows back to 1 primary + 3 ghost (canon §4.1).
    const isTrulyEmpty =
        counts.icps === 0 &&
        counts.accounts === 0 &&
        counts.signals === 0 &&
        counts.deals === 0 &&
        counts.touches === 0 &&
        counts.calls === 0;
    const cap = isTrulyEmpty ? 1 : 4;

    return actions.slice(0, cap).map((action, i) => ({
        ...action,
        state: i === 0 ? "now" : i === 1 ? "next" : "ready"
    })) as ReadonlyArray<NextAction>;
}

export function prettyRole(role: string | null): string {
    if (!role) return "Operator";
    const cleaned = role.replace(/[_-]+/g, " ").trim();
    if (!cleaned) return "Operator";
    return cleaned
        .split(/\s+/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
}
