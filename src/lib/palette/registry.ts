/**
 * Room registry — the canonical list of every room in Antaeus,
 * the data the cmd+K palette filters and routes to.
 *
 * Per canon §4: 20 rooms organized by composition family. Per
 * canon Part III §6: there is no persistent global nav rail
 * ("command-first, not nav-first"). This registry is the data
 * behind the "summoned room access" affordance canon Part II §5
 * implies but never specifies — the palette renders this list
 * filtered by query, navigates via plain href, and otherwise stays
 * invisible.
 *
 * Adding a room: append an entry here. The palette picks it up
 * automatically; no per-room boot wiring required.
 *
 * Removing a room: delete its entry. Any inbound continuity from
 * other rooms is unaffected (handoff URLs are room-pair-specific,
 * not registry-driven).
 *
 * `kicker` matches the canonical room kicker label used in
 * RoomChrome (e.g. "DEAL WORKSPACE"). `family` maps to canon Part
 * II §4 composition families — surfaced in the palette as a quiet
 * group label so Sarah can scan by intent (intervention vs.
 * synthesis vs. live-execution).
 */

export type RoomFamily =
    | "threshold"
    | "command-chamber"
    | "live-instrument"
    | "decision-bench"
    | "diagnosis-table"
    | "system-ledger"
    | "trust-annex";

export const FAMILY_LABEL: Record<RoomFamily, string> = {
    threshold: "Getting started",
    "command-chamber": "Priorities",
    "live-instrument": "Sales activity",
    "decision-bench": "Sales planning",
    "diagnosis-table": "Deal risk",
    "system-ledger": "Analysis and handoff",
    "trust-annex": "Workspace settings"
};

export interface PaletteEntry {
    readonly id: string;
    readonly kicker: string;
    readonly label: string;
    readonly href: string;
    readonly family: RoomFamily;
    /** Optional alt-text keywords surfaced to the filter (e.g. "objection" → Negotiation). */
    readonly keywords?: ReadonlyArray<string>;
    /** One-line description shown under the room name in the palette result. */
    readonly description: string;
}

export const ALL_ROOMS: ReadonlyArray<PaletteEntry> = [
    // ── Threshold ────────────────────────────────────────────────
    {
        id: "welcome",
        kicker: "WELCOME",
        label: "Welcome",
        href: "/welcome/",
        family: "threshold",
        description: "Today's recommended starting point."
    },
    {
        id: "onboarding",
        kicker: "ONBOARDING",
        label: "Onboarding",
        href: "/onboarding/",
        family: "threshold",
        description: "Set up your ICP, role, accounts, deals, and quota."
    },

    // ── Command Chamber ──────────────────────────────────────────
    {
        id: "dashboard",
        kicker: "DASHBOARD",
        label: "Dashboard",
        href: "/dashboard/",
        family: "command-chamber",
        keywords: ["brief", "spotlight", "queue", "ranked"],
        description: "Pipeline, account priorities, activity, and deal risk."
    },

    // ── Live Instrument ──────────────────────────────────────────
    {
        id: "signal-console",
        kicker: "SIGNAL CONSOLE",
        label: "Signal Console",
        href: "/signal-console/",
        family: "live-instrument",
        keywords: ["accounts", "priority", "signals", "radar"],
        description: "Monitor account signals and priority."
    },
    {
        id: "outbound-studio",
        kicker: "OUTBOUND STUDIO",
        label: "Outbound Studio",
        href: "/outbound-studio/",
        family: "live-instrument",
        keywords: ["email", "send-line", "rack", "outreach"],
        description: "Create and manage account-specific outbound messages."
    },
    {
        id: "cold-call-studio",
        kicker: "COLD CALL STUDIO",
        label: "Cold Call Studio",
        href: "/cold-call-studio/",
        family: "live-instrument",
        keywords: ["call", "step", "opener", "ask"],
        description: "Prepare for cold calls and record the outcomes."
    },
    {
        id: "linkedin-playbook",
        kicker: "LINKEDIN PLAYBOOK",
        label: "LinkedIn Playbook",
        href: "/linkedin-playbook/",
        family: "live-instrument",
        keywords: ["cue", "connection", "comment", "give-first"],
        description: "Plan LinkedIn outreach alongside calls and email."
    },
    {
        id: "discovery-studio",
        kicker: "DISCOVERY STUDIO",
        label: "Discovery Studio",
        href: "/discovery-studio/",
        family: "live-instrument",
        // "agenda" / "prep" / "call planner" keep the retired Call
        // Planner findable — its prep work lives here now (canon §4.11).
        keywords: ["framework", "segment", "buyer", "branch", "agenda", "prep", "call planner"],
        description: "Prepare and run a discovery call, with buyer-specific questions and next-step capture."
    },
    {
        id: "advisor-deploy",
        kicker: "CALL IN A FAVOR",
        label: "Call in a Favor",
        href: "/call-in-a-favor/",
        family: "live-instrument",
        keywords: ["backchannel", "advisor", "investor", "introduction", "favor"],
        description: "Request specific help from your network for a deal."
    },
    {
        id: "negotiation",
        kicker: "GETTING TO SIGNED",
        label: "Getting to Signed",
        href: "/getting-to-signed/",
        family: "live-instrument",
        keywords: [
            "cfo",
            "procurement",
            "legal",
            "infosec",
            "pricing",
            "discount",
            "concession",
            "negotiation",
            "terms",
            "objection",
            "indemnification"
        ],
        description: "Manage legal, security, finance, and final approval."
    },

    // ── Decision Bench ───────────────────────────────────────────
    {
        id: "icp-studio",
        kicker: "ICP STUDIO",
        label: "ICP Studio",
        href: "/icp-studio/",
        family: "decision-bench",
        keywords: ["icp", "persona", "fit", "targeting"],
        description: "Define the companies and buyers you sell to."
    },
    {
        id: "territory-architect",
        kicker: "TERRITORY ARCHITECT",
        label: "Territory Architect",
        href: "/territory-architect/",
        family: "decision-bench",
        keywords: ["tier", "focus", "approach", "300-cap"],
        description: "Create and prioritize territory segments."
    },
    {
        id: "sourcing-workbench",
        kicker: "PROSPECTING DESK",
        label: "Prospecting Desk",
        href: "/prospecting-desk/",
        family: "decision-bench",
        keywords: ["prospect", "research", "query", "sourcing"],
        description: "Save target criteria, add companies, and qualify accounts."
    },
    {
        id: "poc-framework",
        kicker: "PILOT DESK",
        label: "Pilot Desk",
        href: "/pilot-desk/",
        family: "decision-bench",
        keywords: ["poc", "pilot", "adoption", "evidence"],
        description: "Plan pilots, measure results, and agree on the next decision."
    },

    // ── Diagnosis Table ──────────────────────────────────────────
    {
        id: "deal-workspace",
        kicker: "DEAL WORKSPACE",
        label: "Deal Workspace",
        href: "/deal-workspace/",
        family: "diagnosis-table",
        keywords: ["deal", "stage", "recovery", "intervention", "pipeline"],
        description: "Review open deals, next steps, and risk factors."
    },
    {
        id: "future-autopsy",
        kicker: "FUTURE AUTOPSY",
        label: "Future Autopsy",
        href: "/future-autopsy/",
        family: "diagnosis-table",
        keywords: ["pre-mortem", "cause", "kill-switch", "verdict"],
        description: "Review deal-loss risk, supporting evidence, and corrective actions."
    },

    // ── System Ledger ────────────────────────────────────────────
    {
        id: "quota-workback",
        kicker: "QUOTA WORKBACK",
        label: "Quota Workback",
        href: "/quota-workback/",
        family: "system-ledger",
        keywords: ["quota", "coverage", "math", "weekly", "targets"],
        description: "Calculate the activity and pipeline required to hit quota."
    },
    {
        id: "founding-gtm",
        kicker: "FOUNDING GTM",
        label: "Founding GTM",
        href: "/founding-gtm/",
        family: "system-ledger",
        keywords: ["handoff", "kit", "hire", "inherit", "synthesis"],
        description: "Document sales patterns and processes for another seller."
    },
    // Briefing is a new composition family per canon §4.21 — an
    // intelligence surface, not a System Ledger. Until the family
    // taxonomy is formally extended (waits on face work hardening per
    // canon §4.21 "Face direction TBD"), it sits here as the closest
    // neighbor by intent: a weekly synthesis the operator reads, not
    // a live instrument or a diagnosis surface.
    {
        id: "briefing",
        kicker: "BRIEFING",
        label: "Briefing",
        href: "/briefing/",
        family: "system-ledger",
        keywords: [
            "briefing",
            "weekly",
            "read",
            "intelligence",
            "patterns",
            "periphery",
            "contrarian",
            "synthesis"
        ],
        description: "Review account and market changes, evidence, and recommendations."
    },
    // Outdoors Events — Live Instrument per ADR-015. The operator's
    // radar for offline gatherings where buyers show up.
    {
        id: "outdoors-events",
        kicker: "OUTDOORS EVENTS",
        label: "Outdoors Events",
        href: "/outdoors-events/",
        family: "live-instrument",
        keywords: [
            "outdoors",
            "events",
            "conference",
            "conferences",
            "mixer",
            "meetup",
            "trade show",
            "gathering",
            "networking"
        ],
        description: "Find events relevant to your target buyers and accounts."
    },

    // ── Trust Annex ──────────────────────────────────────────────
    {
        id: "settings",
        kicker: "SETTINGS",
        label: "Settings",
        href: "/settings/",
        family: "trust-annex",
        keywords: ["export", "backup", "delete", "demo", "category"],
        description: "Backup, restore, demo mode, category, cloud sync."
    }
];

/**
 * Filter the registry by free-text query. Matches against label,
 * kicker, family label, description, and keywords. Returns the
 * registry order on empty query (room families grouped by Part II §4).
 */
export function filterRooms(
    query: string,
    rooms: ReadonlyArray<PaletteEntry> = ALL_ROOMS
): ReadonlyArray<PaletteEntry> {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return rooms;
    return rooms.filter((room) => {
        if (room.label.toLowerCase().includes(q)) return true;
        if (room.kicker.toLowerCase().includes(q)) return true;
        if (FAMILY_LABEL[room.family].toLowerCase().includes(q)) return true;
        if (room.description.toLowerCase().includes(q)) return true;
        if (room.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
        return false;
    });
}
