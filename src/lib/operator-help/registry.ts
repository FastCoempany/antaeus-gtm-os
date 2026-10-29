/**
 * Operator help registry (ADR-018, 2026-06-19).
 *
 * Help is room-aware and literal. Each entry explains what the room does,
 * the next useful action, and what to check when the room is empty or the
 * output looks wrong. Avoid private product metaphors and avoid claiming
 * that a recommendation proves causality or predicts an outcome.
 */

export interface HelpEntry {
    /** What this room is for — one plain sentence. */
    readonly whatItIsFor: string;
    /** The most useful next action in the room. */
    readonly theMoveHere: string;
    /** What to check when the room is empty, incomplete, or unexpected. */
    readonly ifStuck: string;
}

/** The fallback when a room has no specific entry yet. */
export const GENERIC_HELP: HelpEntry = {
    whatItIsFor:
        "Each room handles a specific part of the sales workflow and can pass relevant information to other rooms.",
    theMoveHere:
        "Start with the primary action shown in the room. Supporting actions remain available when you need them.",
    ifStuck:
        "If the room is empty or incomplete, check the empty-state message for the upstream data or setup it requires."
};

/**
 * Per-room help, keyed by the room's path. Lookup matches the longest
 * path prefix, so `/deal-workspace/anything` still resolves.
 */
const REGISTRY: Readonly<Record<string, HelpEntry>> = {
    "/dashboard/": {
        whatItIsFor:
            "The Dashboard summarizes current activity, deal risk, and recommended actions across the workspace.",
        theMoveHere:
            "Review the highest-priority item first, or switch views to inspect the same workspace data from a different angle.",
        ifStuck:
            "If the Dashboard is sparse, add or update real accounts, deals, and activity records so it has current information to summarize."
    },
    "/welcome/": {
        whatItIsFor:
            "Welcome shows the current setup state of your workspace and the next available setup or workflow action.",
        theMoveHere:
            "Use the highlighted action to continue setup or enter the next relevant room.",
        ifStuck:
            "You can skip optional setup items and return later. Completed information remains in the workspace."
    },
    "/onboarding/": {
        whatItIsFor:
            "Onboarding collects the initial information Antaeus uses to configure the workspace.",
        theMoveHere:
            "Answer the current step. Only the required fields must be completed before you continue.",
        ifStuck:
            "Leave optional fields blank if you do not know them yet. You can update them later from the relevant rooms."
    },
    "/icp-studio/": {
        whatItIsFor:
            "ICP Studio defines the accounts and buyers you intend to target so other rooms can use the same criteria.",
        theMoveHere:
            "Review the ICP statement and make the account, buyer, pain, and trigger criteria as specific as the available evidence supports.",
        ifStuck:
            "If the definition remains broad, add the specific buyer role, business problem, and triggering condition you actually intend to pursue."
    },
    "/territory-architect/": {
        whatItIsFor:
            "Territory Architect organizes target accounts into focused groups and limits the active territory to 300 accounts.",
        theMoveHere:
            "Define a focused buyer group and assign the accounts that match it.",
        ifStuck:
            "If the account limit is reached, remove lower-priority accounts or tighten the criteria for the group."
    },
    "/prospecting-desk/": {
        whatItIsFor:
            "Prospecting Desk stores target searches, lets you add companies, and requires three qualification checks before an account can be sent to Signal Console.",
        theMoveHere:
            "Save the target criteria, add a relevant company, then complete its qualification checks.",
        ifStuck:
            "This room does not run a live company search. Use the saved criteria while researching elsewhere, then add the companies you want to evaluate here."
    },
    "/signal-console/": {
        whatItIsFor:
            "Signal Console tracks watched accounts and ranks recent account signals using the room's priority model.",
        theMoveHere:
            "Review the highest-priority watched account and inspect the signals that produced its current ranking.",
        ifStuck:
            "If no account has current signals, add or update a watched account and verify that its signal sources are available."
    },
    "/outbound-studio/": {
        whatItIsFor:
            "Outbound Studio drafts one account-specific outreach message using the account, contact, outreach stage, and reason for outreach.",
        theMoveHere:
            "Confirm the account and contact context, review the draft, then copy or log the message you actually use.",
        ifStuck:
            "If the draft is generic, add a specific account signal or a clearly stated trigger before generating it again."
    },
    "/cold-call-studio/": {
        whatItIsFor:
            "Cold Call Studio helps you prepare for a cold call, respond to common buyer reactions, and record the outcome afterward.",
        theMoveHere:
            "Review the call plan before dialing, then use the relevant response prompt if the buyer raises a common objection or pushback.",
        ifStuck:
            "Use only the prompt that matches what the buyer actually said. You do not need to follow every section in order."
    },
    "/linkedin-playbook/": {
        whatItIsFor:
            "LinkedIn Playbook uses LinkedIn as a supporting outreach channel alongside calls and email.",
        theMoveHere:
            "Complete the current LinkedIn action for the account, such as reviewing, commenting, connecting, or sending useful information.",
        ifStuck:
            "If there has been little or no interaction, use a useful non-promotional touch before making a meeting request."
    },
    "/call-planner/": {
        whatItIsFor:
            "Call Planner organizes the account context, reason for the call, questions, and intended next step before a scheduled conversation.",
        theMoveHere:
            "Complete the planning fields for a real account and use them during the call.",
        ifStuck:
            "If the plan is thin, clarify the current business reason for the conversation and the specific next step you want to discuss."
    },
    "/discovery-studio/": {
        whatItIsFor:
            "Discovery Studio supports a live discovery call with question paths, notes, objection handling, and next-step capture.",
        theMoveHere:
            "Use the question path that matches the current part of the conversation and record what the buyer actually says.",
        ifStuck:
            "If the conversation changes direction, move to the relevant question section or objection prompt rather than forcing the previous path."
    },
    "/deal-workspace/": {
        whatItIsFor:
            "Deal Workspace ranks open deals using inactivity, next-step, and close-date risk factors and shows the factors behind each score.",
        theMoveHere:
            "Review the highest-risk deal, inspect the recorded risk factors, and update the next step or deal information where needed.",
        ifStuck:
            "An empty workspace means no open deals are currently recorded. Add a deal or create one through an upstream workflow."
    },
    "/future-autopsy/": {
        whatItIsFor:
            "Future Autopsy reviews conditions associated with deal-loss risk and generates a pre-mortem scenario from the information currently recorded.",
        theMoveHere:
            "Select a deal, review the evidence behind the risk assessment, and choose an action that addresses a documented condition.",
        ifStuck:
            "If no deal is available, add or update open deals first. The room should not infer a cause that is not supported by the recorded evidence."
    },
    "/pilot-desk/": {
        whatItIsFor:
            "Pilot Desk defines a pilot claim, owner, success measure, and stop condition for a linked deal.",
        theMoveHere:
            "Complete the four pilot fields and make sure each one can be verified by the buyer and your team.",
        ifStuck:
            "If the pilot still depends on general interest, define the specific result to measure and who will confirm whether it was achieved."
    },
    "/call-in-a-favor/": {
        whatItIsFor:
            "Call in a Favor prepares an advisor or relationship-based request for a specific deal and records what happened afterward.",
        theMoveHere:
            "Choose the deal, the person you are asking, and the specific help you need before sending the request.",
        ifStuck:
            "Make the request specific enough that the outcome can be recorded as an introduction, information, a decline, or another concrete result."
    },
    "/getting-to-signed/": {
        whatItIsFor:
            "Getting to Signed helps you prepare for procurement, finance, legal, security, and commercial negotiation before the conversation happens.",
        theMoveHere:
            "Choose the current approval or negotiation issue and review the position you intend to take before the next conversation.",
        ifStuck:
            "If you are considering a concession, state what you would give, what you need in return, and who has authority to approve it."
    },
    "/quota-workback/": {
        whatItIsFor:
            "Quota Workback converts an annual revenue target and your conversion assumptions into modeled monthly and daily requirements, then compares the target with recorded closed revenue and open pipeline.",
        theMoveHere:
            "Enter the annual target and typical deal size, then review the assumptions, activity requirements, and pipeline coverage calculation.",
        ifStuck:
            "If the requirements look unrealistic, review the conversion assumptions, working days, and the benchmark selected for your ACV band."
    },
    "/founding-gtm/": {
        whatItIsFor:
            "Founding GTM summarizes observed patterns across the workspace so a new seller can see what has been tried, what has been associated with wins or losses, and how much evidence supports each section.",
        theMoveHere:
            "Review the sections with enough data and use the cited records before treating any pattern as a repeatable rule.",
        ifStuck:
            "Sections remain limited when the sample is small. Add more real activity and outcomes rather than treating a thin sample as a conclusion."
    },
    "/briefing/": {
        whatItIsFor:
            "Briefing summarizes recent workspace and market evidence, with confidence and supporting sources for generated analyses.",
        theMoveHere:
            "Review the current analyses and open the supporting evidence for any conclusion that affects a decision.",
        ifStuck:
            "If an analysis looks wrong, inspect its cited evidence, confidence, and source coverage before accepting or dismissing it."
    },
    "/outdoors-events/": {
        whatItIsFor:
            "Outdoors Events searches for currently scheduled conferences, trade shows, summits, meetups, and similar events relevant to your category or buyers.",
        theMoveHere:
            "Run event discovery, review the returned sources, and mark the events that are relevant to your territory or buyer strategy.",
        ifStuck:
            "If no useful events are returned, review the product category and buyer context used for discovery or add a known event manually."
    },
    "/settings/": {
        whatItIsFor:
            "Settings manages workspace export, restore, cloud-sync status, activity-capture options, preferences, and account controls.",
        theMoveHere:
            "Review the current sync status and export a backup when you want a portable copy of the workspace.",
        ifStuck:
            "Use the status shown in Settings to confirm what is currently synced. Export remains available when you want a separate backup copy."
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

/** Human support channel used by the room-aware help panel. */
export const SUPPORT_EMAIL = "support@antaeus.app";

export function supportMailto(roomLabel: string): string {
    const label = roomLabel.trim() || "Antaeus";
    const subject = encodeURIComponent(`Help with ${label}`);
    const body = encodeURIComponent(
        `What I was trying to do:\n\n\nWhat happened instead:\n\n\n(Room: ${label})`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
