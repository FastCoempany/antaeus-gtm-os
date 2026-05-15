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
        headline = "The workspace exists, but it still needs first operating truth.";
        body =
            "Start with one ICP, then add either a live signal or a real deal so the app stops briefing an empty system.";
    } else if (completed < milestones.length) {
        headline = "You are moving from setup into a real operating system.";
        body = next
            ? `Next missing anchor: ${next.label}. Once that is live, the dashboard and downstream modules get more believable fast.`
            : "The remaining work is about depth, not setup.";
    } else {
        headline = "The activation anchors are live. Now the job is to keep the system honest.";
        body =
            "Use dashboard, deal review, proof, and handoff as operating rhythm, not just setup confirmation.";
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
    title: "Create your first ICP",
    body: "Start with one sharp wedge. Once one ICP exists, Signal Console, outbound, and discovery stop operating on memory.",
    href: "/icp-studio/",
    cta: "Open ICP Studio",
    meta: ["highest leverage", "targeting truth"],
    why: "The rest of the app compounds off targeting truth before it compounds off activity.",
    unlocks: "Sharper signal research, better sourcing, cleaner outbound, and a more credible dashboard brief."
};
const ACTION_SIGNAL: Omit<NextAction, "state"> = {
    key: "signal",
    title: "Research one live account",
    body: "Add or enrich one real company so the workspace starts reflecting external evidence instead of setup answers.",
    href: "/signal-console/",
    cta: "Open Signal Console",
    meta: ["real account", "deep research"],
    why: "You need one live account before the signal layer can behave like a real intelligence system.",
    unlocks: "Heat logic, next-move guidance, and better context for sourcing and outbound."
};
const ACTION_DEAL: Omit<NextAction, "state"> = {
    key: "deal",
    title: "Create the first live deal",
    body: "One real opportunity activates pipeline review, proof planning, and the Monday command stack.",
    href: "/deal-workspace/",
    cta: "Open Deal Workspace",
    meta: ["pipeline truth", "dashboard unlock"],
    why: "Without a real deal, too many later modules are still briefing hypothetical work.",
    unlocks: "Future autopsy, PoC framework, advisor deployment, and a more honest dashboard."
};
const ACTION_MOTION: Omit<NextAction, "state"> = {
    key: "motion",
    title: "Log the first live motion",
    body: "Capture one outbound touch or one real call so the system starts storing operating memory.",
    href: "/outbound-studio/",
    cta: "Open Outbound Studio",
    meta: ["activity trail", "week one"],
    why: "Week one should include at least one motion so the workspace stops being only configuration plus objects.",
    unlocks: "Readiness evidence, better dashboard state, and a clearer operating rhythm."
};
const ACTION_PLANNER: Omit<NextAction, "state"> = {
    key: "planner",
    title: "Prep the next discovery call",
    body: "Use Call Planner to turn an active deal into a structured conversation, not a loose note.",
    href: "/call-planner/",
    cta: "Open Call Planner",
    meta: ["call quality", "active deal"],
    why: "You already have enough deal truth to make the next call more deliberate.",
    unlocks: "A stronger discovery agenda and a cleaner handoff into Discovery Studio."
};
const ACTION_QUOTA: Omit<NextAction, "state"> = {
    key: "quota",
    title: "Dial in quota and targets",
    body: "Put your quota math and ACV into the system so good stops staying subjective.",
    href: "/quota-workback/",
    cta: "Open Quota Workback",
    meta: ["system math", "benchmarks"],
    why: "The app becomes more credible when activity and readiness are anchored to actual revenue pressure.",
    unlocks: "Better weekly targets, clearer benchmarks, and stronger readiness logic."
};
const ACTION_BACKUP: Omit<NextAction, "state"> = {
    key: "backup",
    title: "Export the first backup",
    body: "Make the workspace durable outside this one browser before the first week gets messy.",
    href: "/settings/",
    cta: "Open Settings",
    meta: ["durability", "trust"],
    why: "Week one is not complete until the workspace can survive refresh, re-login, and a bad decision.",
    unlocks: "Safer experimentation and a system that feels durable instead of lucky."
};
const ACTION_DASHBOARD: Omit<NextAction, "state"> = {
    key: "dashboard",
    title: "Return to Spotlight",
    body: "Use the command stack as the place where the system tells you what matters next.",
    href: "/dashboard/",
    cta: "Open Spotlight",
    meta: ["operating rhythm", "daily command stack"],
    why: "By this point the app should start behaving like a morning operating room, not a collection of tools.",
    unlocks: "Faster daily resets, clearer next moves, and stronger week-one rhythm."
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

    // Phase 6 polish (canon §4.1): cap at 1 primary + 3 ghost per the
    // "one dominant move per surface" rule. Five equal-weight CTAs read
    // as a hallway, not a ranked next-action stack.
    return actions.slice(0, 4).map((action, i) => ({
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
