import { t } from "@/lib/voice/t";

/**
 * The motion map — the 22 rooms laid out as the operator's actual GTM
 * motion (enter → strategy → find & watch → work the account → advance
 * the deal → diagnose · hand off). This is the Ground's registry
 * (founder-locked 2026-07-08): it supersedes the Ctrl+K palette
 * registry as the jump surface, with the rename/retire sweep applied —
 * no retired Call Planner; Prospecting Desk / Pilot Desk / Getting to
 * Signed / Call in a Favor under their current names.
 */

export interface MotionRoom {
    readonly id: string;
    readonly label: string;
    /** Spoon-fed one-liner (§13) — what the room is, zero decode. */
    readonly desc: string;
    readonly href: string;
    /** Index into MOTION_STAGES. */
    readonly stage: number;
    readonly keywords?: ReadonlyArray<string>;
}

export const MOTION_STAGES: ReadonlyArray<string> = [
    t("Enter"),
    t("Strategy"),
    t("Find & watch"),
    t("Work the account"),
    t("Advance the deal"),
    t("Diagnose · hand off")
];

export const MOTION_ROOMS: ReadonlyArray<MotionRoom> = [
    { id: "welcome", label: t("Welcome"), desc: t("the morning landing"), href: "/welcome/", stage: 0 },
    { id: "onboarding", label: t("Onboarding"), desc: t("seed the workspace"), href: "/onboarding/", stage: 0 },
    { id: "dashboard", label: t("Dashboard"), desc: t("the one move, ranked"), href: "/dashboard/", stage: 0, keywords: ["command", "board", "standing"] },
    { id: "icp-studio", label: t("ICP Studio"), desc: t("who you sell to"), href: "/icp-studio/", stage: 1, keywords: ["target", "persona", "ideal"] },
    { id: "territory-architect", label: t("Territory Architect"), desc: t("carve the market"), href: "/territory-architect/", stage: 1, keywords: ["tiers", "divisions", "300"] },
    { id: "prospecting-desk", label: t("Prospecting Desk"), desc: t("find real accounts"), href: "/sourcing-workbench/", stage: 1, keywords: ["sourcing", "search", "find", "confirm"] },
    { id: "signal-console", label: t("Signal Console"), desc: t("watch the heat"), href: "/signal-console/", stage: 2, keywords: ["accounts", "signals", "radar", "hot"] },
    { id: "briefing", label: t("Briefing"), desc: t("what the system saw"), href: "/briefing/", stage: 2, keywords: ["reads", "news", "world"] },
    { id: "outdoors-events", label: t("Outdoors Events"), desc: t("where buyers gather"), href: "/outdoors-events/", stage: 2, keywords: ["conference", "events", "travel"] },
    { id: "outbound-studio", label: t("Outbound Studio"), desc: t("the send line"), href: "/outbound-studio/", stage: 3, keywords: ["email", "outreach", "compose"] },
    { id: "cold-call-studio", label: t("Cold Call Studio"), desc: t("walk in ready"), href: "/cold-call-studio/", stage: 3, keywords: ["call", "dial", "phone"] },
    { id: "linkedin-playbook", label: t("LinkedIn Playbook"), desc: t("air cover"), href: "/linkedin-playbook/", stage: 3, keywords: ["social", "connect", "comment"] },
    { id: "discovery-studio", label: t("Discovery Studio"), desc: t("run the live call"), href: "/discovery-studio/", stage: 3, keywords: ["disco", "meeting", "framework"] },
    { id: "deal-workspace", label: t("Deal Workspace"), desc: t("what will slip"), href: "/deal-workspace/", stage: 4, keywords: ["deals", "pipeline", "recovery"] },
    { id: "pilot-desk", label: t("Pilot Desk"), desc: t("run a pilot"), href: "/poc-framework/", stage: 4, keywords: ["poc", "pilot", "adoption"] },
    { id: "getting-to-signed", label: t("Getting to Signed"), desc: t("run to signature"), href: "/negotiation/", stage: 4, keywords: ["negotiation", "terms", "legal", "security", "contract"] },
    { id: "call-in-a-favor", label: t("Call in a Favor"), desc: t("mobilize your people"), href: "/advisor-deploy/", stage: 4, keywords: ["advisor", "favor", "intro", "network"] },
    { id: "future-autopsy", label: t("Future Autopsy"), desc: t("why it will die"), href: "/future-autopsy/", stage: 5, keywords: ["premortem", "autopsy", "risk"] },
    { id: "quota-workback", label: t("Quota Workback"), desc: t("your daily number"), href: "/quota-workback/", stage: 5, keywords: ["quota", "pace", "number", "target"] },
    { id: "readiness", label: t("Readiness Score"), desc: t("inheritable yet?"), href: "/dashboard/?readiness=1", stage: 5, keywords: ["readiness", "hire", "verdict"] },
    { id: "founding-gtm", label: t("Founding GTM"), desc: t("the handoff kit"), href: "/founding-gtm/", stage: 5, keywords: ["handoff", "kit", "hire", "inherit"] },
    { id: "settings", label: t("Settings"), desc: t("keep it safe"), href: "/settings/", stage: 5, keywords: ["backup", "export", "account", "delete"] }
];

/** The room whose href matches the current pathname (you-are-here). */
export function currentRoomId(pathname: string): string | null {
    const clean = pathname.replace(/\/+$/, "/") || "/";
    for (const r of MOTION_ROOMS) {
        const base = r.href.split("?")[0]!;
        if (clean === base || clean.startsWith(base)) return r.id;
    }
    return null;
}

/** Case-insensitive filter over label + desc + keywords. */
export function filterMotionRooms(query: string): ReadonlyArray<MotionRoom> {
    const q = query.trim().toLowerCase();
    if (!q) return MOTION_ROOMS;
    return MOTION_ROOMS.filter(
        (r) =>
            r.label.toLowerCase().includes(q) ||
            r.desc.toLowerCase().includes(q) ||
            (r.keywords ?? []).some((k) => k.includes(q))
    );
}

/** Which room a NextMove target URL points into (for the suggested glow). */
export function roomIdForUrl(url: string): string | null {
    try {
        const path = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0]!;
        return currentRoomId(path.endsWith("/") ? path : `${path}/`);
    } catch {
        return null;
    }
}

/** Jump href with continuity params from the current room. */
export function groundHref(room: MotionRoom, fromPath: string, fromLabel: string): string {
    const base = room.href;
    const sep = base.includes("?") ? "&" : "?";
    const params = new URLSearchParams({
        returnTo: fromPath,
        returnLabel: fromLabel,
        fromMode: "room",
        fromSurface: "ground"
    });
    return `${base}${sep}${params.toString()}`;
}
