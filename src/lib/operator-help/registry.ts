/**
 * Operator help registry (ADR-018, 2026-06-19).
 *
 * Antaeus supports its own operators the way the product itself talks:
 * calm, plainspoken, contextual — never a chirpy chatbot, never a
 * generic help center (canon §1 emotional territory + §4.20 Trust
 * Annex). Help is room-aware: when the operator opens the "?" in the
 * Wayfinder bar, they get three plain sentences about the room they're
 * actually in — what it's for, the one move it wants, and what to do
 * when it looks empty or wrong — plus one honest channel to a human.
 *
 * The copy is sourced from the canon §4 room minds, written in the
 * plain voice of canon §11 (say it like you'd say it out loud). It is
 * content data, not chrome — the Wayfinder wraps the surrounding labels
 * ("Help", "Email us") in t(); these strings are the answer itself.
 *
 * Adding a room: drop an entry keyed by its path. Anything unlisted
 * falls back to GENERIC — the help affordance is never absent, never
 * a dead end.
 */

export interface HelpEntry {
    /** What this room is for — one plain sentence. */
    readonly whatItIsFor: string;
    /** The one dominant move the room wants right now. */
    readonly theMoveHere: string;
    /** What to do when it looks empty, thin, or wrong. */
    readonly ifStuck: string;
}

/** The fallback when a room has no specific entry yet. */
export const GENERIC_HELP: HelpEntry = {
    whatItIsFor:
        "Each room does one job and hands its work to the next. The bar at the top names the room you're in; the highlighted action is the thing to do first.",
    theMoveHere:
        "Look for the single highlighted move — that's what this room wants from you right now. Everything else is quieter on purpose.",
    ifStuck:
        "If a room looks empty, one upstream thing usually isn't in yet. The empty state names what fills it. Nothing here is graded — you can always come back."
};

/**
 * Per-room help, keyed by the room's path. Lookup matches the longest
 * path prefix, so `/deal-workspace/anything` still resolves.
 */
const REGISTRY: Readonly<Record<string, HelpEntry>> = {
    "/dashboard/": {
        whatItIsFor:
            "The Dashboard ranks everything under pressure and tells you the one thing to act on first, so you never have to choose between rooms.",
        theMoveHere:
            "Take the top move it names, or switch between Read, Focus, and Triage to see the same ranking three ways.",
        ifStuck:
            "If it looks thin, you haven't added enough real accounts or deals yet. Add one and the whole brief sharpens around it."
    },
    "/welcome/": {
        whatItIsFor:
            "Welcome is the on-ramp — it shows what your workspace has so far and the one real move to make next.",
        theMoveHere:
            "Take the highlighted next move. Each one makes a downstream room more useful than it was.",
        ifStuck:
            "Nothing here is graded. Skip anything and come back — the workspace keeps your progress."
    },
    "/onboarding/": {
        whatItIsFor:
            "Onboarding asks six quick questions and seeds your workspace so the Dashboard is already live before you finish.",
        theMoveHere:
            "Answer the step in front of you. Only your role and one ICP line are required — the rest is optional.",
        ifStuck:
            "You can leave any field blank and still finish. Fill the rest later from the rooms themselves."
    },
    "/icp-studio/": {
        whatItIsFor:
            "ICP Studio sharpens the one definition of who you sell to. Every other room filters against it.",
        theMoveHere:
            "Write or tighten the ICP statement. Thinner is better — fewer assumptions, fewer personas.",
        ifStuck:
            "A low score means the definition is still too broad. Name the specific owner, the pain, and the trigger that makes them act now."
    },
    "/territory-architect/": {
        whatItIsFor:
            "Territory Architect turns the ICP into a tiered map of focused buyer groups, with a hard 300-account ceiling that forces real choices.",
        theMoveHere:
            "Name a focus — a group of buyers under the same pressure — and tag accounts into it.",
        ifStuck:
            "The cap is the point. If the ceiling feels tight, that's it forcing you to drop the accounts that don't really fit."
    },
    "/sourcing-workbench/": {
        whatItIsFor:
            "Sourcing Workbench turns a focus into named, researched prospects you can push forward.",
        theMoveHere:
            "Run a query card to find prospects, then research one to qualify it into a real account.",
        ifStuck:
            "Research that doesn't lead to a push is just collecting. Aim to move a clean prospect forward, not to keep polishing it."
    },
    "/signal-console/": {
        whatItIsFor:
            "Signal Console tracks the accounts you're watching and the signals stacking up on each, ranked by heat.",
        theMoveHere:
            "Work the hottest account — the bar points at it. Add accounts by hand or enrich them in bulk.",
        ifStuck:
            "No heat yet means no signals. Add a real account and one reason it came up onto your radar."
    },
    "/outbound-studio/": {
        whatItIsFor:
            "Outbound Studio builds one outbound line at a time from the account, the buyer, the temperature, and the trigger.",
        theMoveHere:
            "Fill the switchboard and generate the send line. Copy it, or log the touch so the app remembers it.",
        ifStuck:
            "If the line feels generic, you're missing a real trigger — name what actually changed for that account."
    },
    "/cold-call-studio/": {
        whatItIsFor:
            "Cold Call Studio walks a live cold call one thread at a time — opener, pressure, evidence, ask — so you narrow instead of explain.",
        theMoveHere:
            "Stay in one thread. Pick what the buyer just said and the room hands you the next line.",
        ifStuck:
            "You don't need the whole script at once. Pull the next thread only when this one resolves."
    },
    "/linkedin-playbook/": {
        whatItIsFor:
            "LinkedIn Playbook uses LinkedIn as air cover, not the opening move — watch, comment, connect, give, then ask.",
        theMoveHere:
            "Take the cue the ladder is on. Earn recognition before you send anything.",
        ifStuck:
            "If acceptance or replies are low, you're asking too early. Give a real read first."
    },
    "/call-planner/": {
        whatItIsFor:
            "Call Planner shapes the next call before it happens — open, reason now, probe, advance ask — so you arrive with conviction.",
        theMoveHere:
            "Fill the four agenda strips for a real account. The plan should get used in the call, not sit here.",
        ifStuck:
            "A thin plan usually means a thin reason-now. Name why this conversation has to happen this week."
    },
    "/discovery-studio/": {
        whatItIsFor:
            "Discovery Studio runs a live discovery call — you speak, branch on what the buyer says, recover, and lock the next step.",
        theMoveHere:
            "Stay in one segment. Pick the buyer's response and follow the branch; jump only when you need to.",
        ifStuck:
            "If the call goes sideways, open the recover rail — it routes you to the segment where the recovery runs."
    },
    "/deal-workspace/": {
        whatItIsFor:
            "Deal Workspace is the recovery board — it shows which deals are closest to going stale and the smallest move to fix each.",
        theMoveHere:
            "Start with the deals under NEEDS INTERVENTION. Open one to see its corrective move.",
        ifStuck:
            "An empty board means no live deals yet. They get created from cold calls and discovery, then land here."
    },
    "/future-autopsy/": {
        whatItIsFor:
            "Future Autopsy pre-mortems a deal before it dies — it names the causal pattern and the route that corrects it.",
        theMoveHere:
            "Pick a pinned case and read the cause. Then run the intervention it points at.",
        ifStuck:
            "If nothing's pinned, there are no deals under enough pressure yet — which is a good problem to have."
    },
    "/poc-framework/": {
        whatItIsFor:
            "PoC Framework turns one pilot into evidence the buyer's boss can act on — a claim, an owner, a metric, and a kill rule.",
        theMoveHere:
            "Forge the four molds for a linked deal. The weakest one is called out for you.",
        ifStuck:
            "Interest isn't evidence until it can be carried without you in the room. Start with the claim and who signs off on it."
    },
    "/advisor-deploy/": {
        whatItIsFor:
            "Advisor Deploy prepares one backchannel ask before you spend external trust, then tracks it coming back as deal movement.",
        theMoveHere:
            "Pick the deal, the advisor, and the ask moment. The room drafts the exact ask.",
        ifStuck:
            "Every ask should return as a deal update or a clear hold. If it can't, it's not ready to send."
    },
    "/negotiation/": {
        whatItIsFor:
            "Negotiation rehearses the procurement, finance, and terms conversation before it happens, so you walk in with positions, not improvised concessions.",
        theMoveHere:
            "Pick the counterparty and the ask moment. Rehearse the opening line and the response to pushback.",
        ifStuck:
            "Every concession should be a deliberate move. If you're about to give one to 'be reasonable,' that's the one to rehearse first."
    },
    "/quota-workback/": {
        whatItIsFor:
            "Quota Workback turns your quota into weekly execution pressure — how many meetings, motions, and deals you actually need.",
        theMoveHere:
            "Put in your quota and average deal size. The room works back to the daily numbers.",
        ifStuck:
            "If the targets feel off, check the win rate and cycle length — they drive the whole calculation."
    },
    "/founding-gtm/": {
        whatItIsFor:
            "Founding GTM is the kit your first hire opens on day one — the authored read of what works, what wins, and where deals leak.",
        theMoveHere:
            "Read the sections that are ready. Each one names something no single room could surface alone.",
        ifStuck:
            "Sections fill as the rest of the workspace gets real. A thin kit means the upstream rooms need more in them first."
    },
    "/briefing/": {
        whatItIsFor:
            "Briefing is your daily check-in for what the system saw — inside your own work, and out in the market you're selling into.",
        theMoveHere:
            "Toggle between Workspace and World. Read what's surfaced; mark what's useful or noise.",
        ifStuck:
            "If a read looks wrong, the evidence behind it is one click away. The system is testing its own assumptions, not just yours."
    },
    "/outdoors-events/": {
        whatItIsFor:
            "Outdoors Events finds the gatherings in your category — conferences, meetups, trade shows — and surfaces them so you don't have to go looking.",
        theMoveHere:
            "Run discovery, then mark the events worth your time. The system finds; you decide.",
        ifStuck:
            "If nothing's surfaced, run discovery once. It reads your product category and searches the world for where buyers gather."
    },
    "/settings/": {
        whatItIsFor:
            "Settings keeps your workspace safe — export, import, cloud sync, and account controls. No drama, just utility.",
        theMoveHere:
            "Export a backup before week one gets messy, or wire cloud sync so the workspace survives this browser.",
        ifStuck:
            "Your data lives on this device until you turn on cloud sync. Export gives you a copy you control either way."
    }
};

/**
 * Resolve help for a path. Matches the longest registered prefix so
 * sub-paths and trailing segments still resolve; falls back to
 * GENERIC so the affordance is never empty.
 */
export function helpForPath(path: string): HelpEntry {
    const clean = path.split("?")[0].split("#")[0];
    let best: HelpEntry | null = null;
    let bestLen = -1;
    for (const [prefix, entry] of Object.entries(REGISTRY)) {
        if (clean.startsWith(prefix) && prefix.length > bestLen) {
            best = entry;
            bestLen = prefix.length;
        }
    }
    return best ?? GENERIC_HELP;
}

/**
 * The honest human channel. A mailto to the support address with a
 * subject naming the room, so a stuck operator reaches a person in one
 * click — never a ticket maze. The address is founder-configurable
 * (ADR-018 §Decision points); the default is the support inbox.
 */
export const SUPPORT_EMAIL = "support@antaeus.app";

export function supportMailto(roomLabel: string): string {
    const label = roomLabel.trim() || "Antaeus";
    const subject = encodeURIComponent(`Help with ${label}`);
    const body = encodeURIComponent(
        `What I was trying to do:\n\n\nWhat happened instead:\n\n\n(Room: ${label})`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
