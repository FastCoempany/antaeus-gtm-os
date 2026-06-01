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
    threshold: "Threshold",
    "command-chamber": "Command Chamber",
    "live-instrument": "Live Instrument",
    "decision-bench": "Decision Bench",
    "diagnosis-table": "Diagnosis Table",
    "system-ledger": "System Ledger",
    "trust-annex": "Trust Annex"
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
        description: "Activation threshold + the first real operating move."
    },
    {
        id: "onboarding",
        kicker: "ONBOARDING",
        label: "Onboarding",
        href: "/onboarding/",
        family: "threshold",
        description: "Seed the workspace — ICP, role, first account, quota."
    },

    // ── Command Chamber ──────────────────────────────────────────
    {
        id: "dashboard",
        kicker: "DASHBOARD",
        label: "Dashboard",
        href: "/dashboard/",
        family: "command-chamber",
        keywords: ["brief", "spotlight", "queue", "ranked"],
        description: "Ranked pressure across the whole workspace."
    },

    // ── Live Instrument ──────────────────────────────────────────
    {
        id: "signal-console",
        kicker: "SIGNAL CONSOLE",
        label: "Signal Console",
        href: "/signal-console/",
        family: "live-instrument",
        keywords: ["accounts", "heat", "signals", "radar"],
        description: "Account heat radar — convert signals to ranked motion."
    },
    {
        id: "outbound-studio",
        kicker: "OUTBOUND STUDIO",
        label: "Outbound Studio",
        href: "/outbound-studio/",
        family: "live-instrument",
        keywords: ["email", "send-line", "rack", "motion"],
        description: "Route one live outbound line — account × buyer × trigger."
    },
    {
        id: "cold-call-studio",
        kicker: "COLD CALL STUDIO",
        label: "Cold Call Studio",
        href: "/cold-call-studio/",
        family: "live-instrument",
        keywords: ["call", "thread", "opener", "ask"],
        description: "Six-thread spine for narrowing pressure live on the call."
    },
    {
        id: "linkedin-playbook",
        kicker: "LINKEDIN PLAYBOOK",
        label: "LinkedIn Playbook",
        href: "/linkedin-playbook/",
        family: "live-instrument",
        keywords: ["cue", "connection", "comment", "give-first"],
        description: "Five-cue ladder for disciplined LinkedIn air cover."
    },
    {
        id: "call-planner",
        kicker: "CALL PLANNER",
        label: "Call Planner",
        href: "/call-planner/",
        family: "live-instrument",
        keywords: ["agenda", "advance-ask", "prep", "probes"],
        description: "Four-stop spine: open / reason now / probe / advance ask."
    },
    {
        id: "discovery-studio",
        kicker: "DISCOVERY STUDIO",
        label: "Discovery Studio",
        href: "/discovery-studio/",
        family: "live-instrument",
        keywords: ["framework", "segment", "buyer", "branch"],
        description: "Live discovery console — ten-segment spine, nine frameworks."
    },
    {
        id: "advisor-deploy",
        kicker: "ADVISOR DEPLOY",
        label: "Advisor Deploy",
        href: "/advisor-deploy/",
        family: "live-instrument",
        keywords: ["backchannel", "advisor", "investor", "introduction"],
        description: "Route one backchannel ask before spending external trust."
    },
    {
        id: "negotiation",
        kicker: "NEGOTIATION",
        label: "Negotiation",
        href: "/negotiation/",
        family: "live-instrument",
        keywords: [
            "cfo",
            "procurement",
            "legal",
            "infosec",
            "pricing",
            "discount",
            "concession",
            "terms",
            "objection",
            "indemnification"
        ],
        description: "Rehearse the conversation — counterparty × ask-moment × ladder."
    },

    // ── Decision Bench ───────────────────────────────────────────
    {
        id: "icp-studio",
        kicker: "ICP STUDIO",
        label: "ICP Studio",
        href: "/icp-studio/",
        family: "decision-bench",
        keywords: ["icp", "persona", "fit", "targeting"],
        description: "Sharpen the ICP every room inherits."
    },
    {
        id: "territory-architect",
        kicker: "TERRITORY ARCHITECT",
        label: "Territory Architect",
        href: "/territory-architect/",
        family: "decision-bench",
        keywords: ["tier", "focus", "approach", "300-cap"],
        description: "Turn the ICP into a tiered territory of strategic bets."
    },
    {
        id: "sourcing-workbench",
        kicker: "SOURCING WORKBENCH",
        label: "Sourcing Workbench",
        href: "/sourcing-workbench/",
        family: "decision-bench",
        keywords: ["prospect", "research", "query", "leverage"],
        description: "Push prospects from query card to qualified account."
    },
    {
        id: "poc-framework",
        kicker: "POC FRAMEWORK",
        label: "PoC Framework",
        href: "/poc-framework/",
        family: "decision-bench",
        keywords: ["proof", "claim", "kill-rule", "metric"],
        description: "Turn a pilot into something the buyer's boss can act on — claim, owner, metric, kill rule."
    },

    // ── Diagnosis Table ──────────────────────────────────────────
    {
        id: "deal-workspace",
        kicker: "DEAL WORKSPACE",
        label: "Deal Workspace",
        href: "/deal-workspace/",
        family: "diagnosis-table",
        keywords: ["deal", "stage", "recovery", "intervention", "pipeline"],
        description: "Recovery board — which deals are weakest, what to do next."
    },
    {
        id: "future-autopsy",
        kicker: "FUTURE AUTOPSY",
        label: "Future Autopsy",
        href: "/future-autopsy/",
        family: "diagnosis-table",
        keywords: ["pre-mortem", "cause", "kill-switch", "verdict"],
        description: "Pre-mortem the deal — causal pattern + corrective route."
    },

    // ── System Ledger ────────────────────────────────────────────
    {
        id: "quota-workback",
        kicker: "QUOTA WORKBACK",
        label: "Quota Workback",
        href: "/quota-workback/",
        family: "system-ledger",
        keywords: ["quota", "coverage", "math", "weekly", "targets"],
        description: "Quota math as weekly execution pressure."
    },
    {
        id: "founding-gtm",
        kicker: "FOUNDING GTM",
        label: "Founding GTM",
        href: "/founding-gtm/",
        family: "system-ledger",
        keywords: ["handoff", "kit", "hire", "inherit", "synthesis"],
        description: "The living onboarding surface a first hire opens on day one."
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
        description: "Weekly read of what's moving — and where your assumptions stop agreeing with the data."
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
        description: "Where buyers gather offline — conferences, mixers, meetups you're watching."
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
