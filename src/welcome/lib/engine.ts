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
            copy: "The rest of the app now has a real target to work against.",
            done: counts.icps > 0
        },
        {
            key: "signal",
            label: "First live signal or account saved",
            copy: "Signal Console now has a real account to read against.",
            done: counts.accounts > 0 || counts.signals > 0
        },
        {
            key: "deal",
            label: "First real deal created",
            copy: "The Dashboard, the recovery board, and the pilot framework all have something real to work with now.",
            done: counts.deals > 0
        },
        {
            key: "motion",
            label: "First motion logged",
            copy: "Calls, touches, and LinkedIn actions are being captured in the app instead of in your head.",
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
            "Pick one definition of who you sell to, what they're dealing with, and why they have to act now. Everything else in the app — signals, outbound, deals — runs against that definition.";
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
    body: "One sharp definition: who you sell to, what they're dealing with, and why they have to act now. The rest of the app runs against that definition.",
    href: "/icp-studio/",
    cta: "Sharpen the ICP",
    meta: ["highest leverage", "first input"],
    why: "An ICP this clear pays back across every other room.",
    unlocks: "Sharper signals, cleaner outbound, and a credible Dashboard brief."
};
const ACTION_SIGNAL: Omit<NextAction, "state"> = {
    key: "signal",
    title: "Add one live account.",
    body: "One real company gets Signal Console warm. Heat, recent signals, and next-move guidance all start firing once a real account is in there.",
    href: "/signal-console/",
    cta: "Add the account",
    meta: ["real account", "deep research"],
    why: "Signal Console can't do its job without one real account to read against.",
    unlocks: "Heat scoring, next-move guidance, and context for sourcing + outbound."
};
const ACTION_DEAL: Omit<NextAction, "state"> = {
    key: "deal",
    title: "Add your first live deal.",
    body: "One real opportunity wakes up the recovery board, PoC planning, and the Dashboard's risk rail.",
    href: "/deal-workspace/",
    cta: "Add the deal",
    meta: ["real pipeline", "dashboard unlock"],
    why: "Without a real deal, the rooms downstream are working on hypothetical pipeline.",
    unlocks: "Future Autopsy, PoC Framework, Advisor Deploy, and a more honest Dashboard."
};
const ACTION_MOTION: Omit<NextAction, "state"> = {
    key: "motion",
    title: "Log the first motion.",
    body: "One outbound touch or one real call so the app starts holding the activity in its own memory instead of yours.",
    href: "/outbound-studio/",
    cta: "Log a motion",
    meta: ["activity trail", "week one"],
    why: "Week one isn't complete until at least one real motion has run through the app.",
    unlocks: "Real Readiness evidence and a clearer weekly rhythm."
};

/**
 * motionActionFor — the motion action, named to the account the operator
 * seeded during onboarding. When a real account exists, working it
 * (composing one outbound touch) is the genuine first move — the same
 * move the Dashboard surfaces — not a generic "log a motion" prompt.
 * The href carries `?account=` so Outbound Studio boots pre-loaded onto
 * that account. Falls back to the generic action when no account is
 * named yet.
 */
function motionActionFor(accountName: string | null): Omit<NextAction, "state"> {
    const name = accountName?.trim();
    if (!name) return ACTION_MOTION;
    return {
        key: "motion",
        title: `Compose outbound to ${name}.`,
        body: `${name} is already in Signal Console. Turn it into a real first touch — the app drafts the line and starts holding the activity instead of your memory.`,
        href: `/outbound-studio/?account=${encodeURIComponent(name)}`,
        cta: "Compose outbound",
        meta: ["first real touch", "named account"],
        why: `You named ${name} as your first target — working it is the real first step, not a second data-entry form.`,
        unlocks: "A drafted outbound line, real Readiness evidence, and a clearer weekly rhythm."
    };
}
const ACTION_PLANNER: Omit<NextAction, "state"> = {
    key: "planner",
    title: "Prep the next discovery call.",
    body: "Turn an active deal into a structured conversation — not a loose note.",
    href: "/call-planner/",
    cta: "Plan the call",
    meta: ["call quality", "active deal"],
    why: "You have enough deal context to make the next call a deliberate one.",
    unlocks: "A stronger agenda and a clean handoff into Discovery Studio."
};
const ACTION_QUOTA: Omit<NextAction, "state"> = {
    key: "quota",
    title: "Set quota and targets.",
    body: "Put your quota number and your average deal size in. The Dashboard starts pointing at the revenue gap, not just activity.",
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
    why: "Week one isn't complete until the workspace can survive a refresh and a bad decision.",
    unlocks: "Safer experimentation and a workspace that feels durable, not lucky."
};
const ACTION_DASHBOARD: Omit<NextAction, "state"> = {
    key: "dashboard",
    title: "Return to the Dashboard.",
    body: "Run the daily rhythm from the ranked list of what needs you most.",
    href: "/dashboard/",
    cta: "Open the Dashboard",
    meta: ["daily rhythm", "ranked work"],
    why: "The app should now act like a morning briefing for what to work on first.",
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
    counts: WorkspaceCounts = EMPTY_COUNTS,
    firstAccountName: string | null = null
): ReadonlyArray<NextAction> {
    const actions: Array<Omit<NextAction, "state">> = [];
    const seen = new Set<string>();
    const push = (a: Omit<NextAction, "state">): void => {
        if (seen.has(a.key)) return;
        seen.add(a.key);
        actions.push(a);
    };

    const hasAccount = counts.accounts > 0 || counts.signals > 0;
    const noMotion = counts.touches + counts.calls === 0;
    const noDeal = counts.deals === 0;

    if (counts.icps === 0) push(ACTION_ICP);
    if (!hasAccount) push(ACTION_SIGNAL);

    // After-access activation: the real GTM first move is account →
    // motion → deal. Once a named account is in the workspace but no
    // motion has run, working that account (compose outbound) is the
    // genuine first move — not typing in a deal that doesn't exist on
    // day one. Motion leads the deal in that one transient state; the
    // milestone ladder (engine §buildMilestones) keeps its deal-then-
    // motion display order. Everywhere else the deal is the more
    // pressing gap, so it leads.
    if (hasAccount && noMotion) {
        push(motionActionFor(firstAccountName));
        if (noDeal) push(ACTION_DEAL);
    } else {
        if (noDeal) push(ACTION_DEAL);
        if (noMotion) push(motionActionFor(firstAccountName));
    }

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
