/**
 * Phase 4 / Room 3 Wave 5 — cross-room handoff helpers.
 *
 * Faithful port of the legacy `buildSignalRoomHref(href, focusObject,
 * roomLabel)` function (lines 1110-1123 of app/signal-console/index.html).
 * Builds the deep-link URL into the destination room with the canonical
 * continuity params:
 *
 *   returnTo     = /signal-console/   (where to come back)
 *   returnLabel  = "Back to Signal Console"
 *   focusObject  = the account name        (what to highlight)
 *   focusRoom    = the destination room label
 *   fromMode     = "room"
 *   fromSurface  = "signal-console"
 *
 * Per CLAUDE.md §2, these params are "the continuity plumbing. Do not
 * break them." Every consumer-side room reads them to render the
 * "Back to Signal Console" affordance + restore the focused object.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildSignalRoomHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/signal-console/");
    params.set("returnLabel", "Back to Signal Console");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "signal-console");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

/**
 * Convenience builders for the three primary destinations the room
 * routes to. Per canon §4.7 flows-out: ranked accounts into Outbound
 * Studio + Cold Call Studio + LinkedIn Playbook + Deal Workspace +
 * Discovery Studio. Wave 5 ships the four most-used handoffs;
 * additional destinations get added per-need.
 */
export function hrefToOutbound(accountName: string, temperature?: string): string {
    return buildSignalRoomHref({
        href: "/outbound-studio/",
        focusObject: accountName,
        roomLabel: "Outbound Studio",
        ...(temperature ? { extra: { account: accountName, temperature } } : { extra: { account: accountName } })
    });
}

export function hrefToDealWorkspace(accountName: string): string {
    return buildSignalRoomHref({
        href: "/deal-workspace/",
        focusObject: accountName,
        roomLabel: "Deal Workspace"
    });
}

export function hrefToDiscoveryAgenda(accountName: string): string {
    return buildSignalRoomHref({
        href: "/call-planner/",
        focusObject: accountName,
        roomLabel: "Call Planner",
        extra: { account: accountName }
    });
}

export function hrefToColdCall(accountName: string): string {
    return buildSignalRoomHref({
        href: "/cold-call-studio/",
        focusObject: accountName,
        roomLabel: "Cold Call Studio",
        extra: { account: accountName }
    });
}
