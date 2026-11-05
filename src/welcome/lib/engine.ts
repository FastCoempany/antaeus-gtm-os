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
            copy: "Use this ICP to evaluate which accounts to target.",
            done: counts.icps > 0
        },
        {
            key: "signal",
            label: "First live signal or account saved",
            copy: "Review the saved account and its available signals in Signal Console.",
            done: counts.accounts > 0 || counts.signals > 0
        },
        {
            key: "deal",
            label: "First real deal created",
            copy: "Review this deal in the Dashboard, Deal Workspace, and Pilot Desk.",
            done: counts.deals > 0
        },
        {
            key: "motion",
            label: "First sales activity logged",
            copy: "Calls, outreach, and LinkedIn activity can now be reviewed in the workspace.",
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
        headline = "Define your first ideal customer profile.";
        body =
            "Describe your target customers, their business problems, and the events that could make a purchase relevant.";
    } else if (completed < milestones.length) {
        headline = next
            ? `Next move: ${next.label.toLowerCase()}.`
            : "Complete the remaining setup step.";
        body = next
            ? `Complete this step to add context to the Dashboard recommendations.`
            : "Review the saved details and add evidence as you work.";
    } else {
        headline = "All four setup milestones are complete.";
        body =
            "Review your daily priorities in the Dashboard.";
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
    body: "Describe your target customers, their business problems, and the events that could make a purchase relevant.",
    href: "/icp-studio/",
    cta: "Define the ICP",
    meta: ["targeting criteria", "first input"],
    why: "A documented ICP helps you compare account fit across the sales process.",
    unlocks: "Targeting criteria for account research, outreach, and pipeline review."
};
const ACTION_SIGNAL: Omit<NextAction, "state"> = {
    key: "signal",
    title: "Add one live account.",
    body: "Add a company to review its available signals and decide whether outreach is relevant.",
    href: "/signal-console/",
    cta: "Add the account",
    meta: ["real account", "deep research"],
    why: "Account research needs a named company.",
    unlocks: "Account priority scoring, suggested actions, and context for prospecting and outreach."
};
const ACTION_DEAL: Omit<NextAction, "state"> = {
    key: "deal",
    title: "Add your first live deal.",
    body: "Record an opportunity so you can review deal risk, plan a pilot, and track next steps.",
    href: "/deal-workspace/",
    cta: "Add the deal",
    meta: ["real pipeline", "dashboard unlock"],
    why: "Without a real deal, the rest of the app is working on hypothetical pipeline.",
    unlocks: "Deal-risk review in Future Autopsy, pilot planning in Pilot Desk, and advisor requests in Call in a Favor."
};
const ACTION_MOTION: Omit<NextAction, "state"> = {
    key: "motion",
    title: "Log your first sales activity.",
    body: "Record an outbound message or call so its outcome is available for later review.",
    href: "/outbound-studio/",
    cta: "Log sales activity",
    meta: ["activity trail", "week one"],
    why: "Recorded activity lets you compare actions with their outcomes.",
    unlocks: "Activity evidence for the Readiness assessment and weekly planning."
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
        body: `${name} is already in Signal Console. Use its recorded context to draft an initial message, then log the outcome.`,
        href: `/outbound-studio/?account=${encodeURIComponent(name)}`,
        cta: "Compose outbound",
        meta: ["first real touch", "named account"],
        why: `You named ${name} as your first target — you can now prepare outreach using its recorded context.`,
        unlocks: "An outbound draft and a place to record the outcome after sending."
    };
}
const ACTION_PLANNER: Omit<NextAction, "state"> = {
    key: "planner",
    title: "Prep the next discovery call.",
    body: "Prepare questions and a proposed next step for an active deal.",
    href: "/discovery-studio/",
    cta: "Prepare the discovery call",
    meta: ["call quality", "active deal"],
    why: "You have enough deal context to make the next call a deliberate one.",
    unlocks: "Questions picked for the buyer, a pre-call check, and the next step recorded on the deal."
};
const ACTION_QUOTA: Omit<NextAction, "state"> = {
    key: "quota",
    title: "Set quota and targets.",
    body: "Put your quota number and your average deal size in. The Dashboard starts pointing at the revenue gap, not just activity.",
    href: "/quota-workback/",
    cta: "Set the targets",
    meta: ["system math", "benchmarks"],
    why: "Quota assumptions let you compare planned sales activity with the revenue target.",
    unlocks: "Weekly outreach targets and pipeline coverage calculations."
};
const ACTION_BACKUP: Omit<NextAction, "state"> = {
    key: "backup",
    title: "Export the first backup.",
    body: "Save a backup of the workspace data outside this browser.",
    href: "/settings/",
    cta: "Export now",
    meta: ["durability", "trust"],
    why: "A backup provides a copy you can use if local data is lost.",
    unlocks: "An exported copy of your workspace data."
};
const ACTION_DASHBOARD: Omit<NextAction, "state"> = {
    key: "dashboard",
    title: "Return to the Dashboard.",
    body: "Review the ranked list of recommended actions.",
    href: "/dashboard/",
    cta: "Open the Dashboard",
    meta: ["daily rhythm", "ranked work"],
    why: "The app should now act like a morning briefing for what to work on first.",
    unlocks: "A prioritized starting point for your next work session."
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
