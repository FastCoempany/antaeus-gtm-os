import { t } from "@/lib/voice/t";

/**
 * Workspace-map registry — the rooms laid out in sales-process order
 * (enter → strategy → find & watch → work the account → advance the
 * deal → diagnose · hand off). The internal Ground identifiers remain
 * stable for routing and continuity, but user-facing descriptions use
 * ordinary functional language rather than private Antaeus vocabulary.
 */

export interface MotionRoom {
    readonly id: string;
    readonly label: string;
    /** Plain functional description of what the room does. */
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
    { id: "welcome", label: t("Welcome"), desc: t("today's recommended starting point"), href: "/welcome/", stage: 0 },
    { id: "onboarding", label: t("Onboarding"), desc: t("set up the workspace"), href: "/onboarding/", stage: 0 },
    { id: "dashboard", label: t("Dashboard"), desc: t("pipeline, priorities, activity, and deal risk"), href: "/dashboard/", stage: 0, keywords: ["command", "board", "standing"] },
    { id: "icp-studio", label: t("ICP Studio"), desc: t("define the companies and buyers you sell to"), href: "/icp-studio/", stage: 1, keywords: ["target", "persona", "ideal"] },
    { id: "territory-architect", label: t("Territory Architect"), desc: t("create and prioritize territory segments"), href: "/territory-architect/", stage: 1, keywords: ["tiers", "segments", "300"] },
    { id: "prospecting-desk", label: t("Prospecting Desk"), desc: t("find accounts that match your ICP"), href: "/prospecting-desk/", stage: 1, keywords: ["sourcing", "search", "find", "confirm"] },
    { id: "signal-console", label: t("Signal Console"), desc: t("monitor account signals and priority"), href: "/signal-console/", stage: 2, keywords: ["accounts", "signals", "priority"] },
    { id: "briefing", label: t("Briefing"), desc: t("review changes in your accounts, deals, and market"), href: "/briefing/", stage: 2, keywords: ["analysis", "news", "world"] },
    { id: "outdoors-events", label: t("Outdoors Events"), desc: t("find events where target buyers may be present"), href: "/outdoors-events/", stage: 2, keywords: ["conference", "events", "travel"] },
    { id: "outbound-studio", label: t("Outbound Studio"), desc: t("create and manage outbound messages"), href: "/outbound-studio/", stage: 3, keywords: ["email", "outreach", "compose"] },
    { id: "cold-call-studio", label: t("Cold Call Studio"), desc: t("prepare and run cold calls"), href: "/cold-call-studio/", stage: 3, keywords: ["call", "dial", "phone"] },
    { id: "linkedin-playbook", label: t("LinkedIn Playbook"), desc: t("plan LinkedIn outreach"), href: "/linkedin-playbook/", stage: 3, keywords: ["social", "connect", "comment"] },
    { id: "discovery-studio", label: t("Discovery Studio"), desc: t("prepare and run discovery"), href: "/discovery-studio/", stage: 3, keywords: ["disco", "meeting", "framework"] },
    { id: "deal-workspace", label: t("Deal Workspace"), desc: t("review open deals, next steps, and risk"), href: "/deal-workspace/", stage: 4, keywords: ["deals", "pipeline", "recovery"] },
    { id: "pilot-desk", label: t("Pilot Desk"), desc: t("plan and evaluate pilots"), href: "/pilot-desk/", stage: 4, keywords: ["poc", "pilot", "adoption"] },
    { id: "getting-to-signed", label: t("Getting to Signed"), desc: t("manage legal, security, finance, and final approval"), href: "/getting-to-signed/", stage: 4, keywords: ["negotiation", "terms", "legal", "security", "contract"] },
    { id: "call-in-a-favor", label: t("Call in a Favor"), desc: t("use your network to help move a deal"), href: "/call-in-a-favor/", stage: 4, keywords: ["advisor", "favor", "intro", "network"] },
    { id: "future-autopsy", label: t("Future Autopsy"), desc: t("identify deals with high loss risk and why"), href: "/future-autopsy/", stage: 5, keywords: ["premortem", "autopsy", "risk"] },
    { id: "quota-workback", label: t("Quota Workback"), desc: t("calculate activity and pipeline required to hit quota"), href: "/quota-workback/", stage: 5, keywords: ["quota", "pace", "number", "target"] },
    { id: "readiness", label: t("Readiness Score"), desc: t("can another seller run the sales process?"), href: "/dashboard/?readiness=1", stage: 5, keywords: ["readiness", "hire", "ready"] },
    { id: "founding-gtm", label: t("Founding GTM"), desc: t("document the sales process for another seller"), href: "/founding-gtm/", stage: 5, keywords: ["handoff", "documentation", "hire"] },
    { id: "settings", label: t("Settings"), desc: t("manage workspace data and account settings"), href: "/settings/", stage: 5, keywords: ["backup", "export", "account", "delete"] }
];

/** The room whose href matches the current pathname (you-are-here). */
export function currentRoomId(pathname: string): string | null {
    // Normalize to a trailing slash so "/dashboard" matches "/dashboard/".
    const clean = `${pathname.replace(/\/+$/, "")}/`;
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

/** Which room a NextMove target URL points into (for the suggested highlight). */
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
    return withContinuity(room.href, fromPath, fromLabel);
}

/**
 * Append the canonical continuity params to any target URL that does not
 * already carry them. `fromSurface=ground` remains an internal/stable
 * telemetry value even though the user-facing surface is Workspace map.
 */
export function withContinuity(url: string, fromPath: string, fromLabel: string): string {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    if (!params.has("returnTo")) params.set("returnTo", fromPath);
    if (!params.has("returnLabel")) params.set("returnLabel", fromLabel);
    if (!params.has("fromMode")) params.set("fromMode", "room");
    params.set("fromSurface", "ground");
    return `${base}?${params.toString()}`;
}
