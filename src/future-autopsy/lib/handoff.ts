/**
 * Phase 4 / Room 4 Wave 5 — cross-room handoff helpers.
 *
 * Faithful port of the legacy `buildFutureAutopsyRoomHref(href,
 * focusObject, roomLabel)` (lines 1265-1280 of
 * `app/future-autopsy/index.html`). Builds the deep-link URL into the
 * destination room with the canonical continuity params:
 *
 *   returnTo     = /app/future-autopsy/   (where to come back)
 *   returnLabel  = "Back to Future Autopsy"
 *   focusObject  = the deal name           (what to highlight)
 *   focusRoom    = the destination room label
 *   fromMode     = "room"
 *   fromSurface  = "future-autopsy"
 *
 * Per CLAUDE.md §2: these params are "the continuity plumbing — do
 * not break them." Every consumer-side room reads them to render the
 * "Back to Future Autopsy" affordance + restore the focused object.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildFutureAutopsyRoomHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/app/future-autopsy/");
    params.set("returnLabel", "Back to Future Autopsy");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "future-autopsy");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

/**
 * Convenience builders for the four primary destinations the room
 * routes to (Deal Workspace, Call Planner, PoC Framework, Discovery
 * Studio). Per canon §4.14 flows-out: Deal Workspace, Call Planner,
 * Discovery Studio, PoC Framework.
 */

export function hrefToDealWorkspace(accountName: string, dealId?: string): string {
    return buildFutureAutopsyRoomHref({
        href: "/app/deal-workspace/",
        focusObject: accountName,
        roomLabel: "Deal Workspace",
        ...(dealId ? { extra: { deal: dealId } } : {})
    });
}

export function hrefToCallPlanner(accountName: string): string {
    return buildFutureAutopsyRoomHref({
        href: "/app/discovery-agenda/",
        focusObject: accountName,
        roomLabel: "Call Planner",
        extra: { account: accountName }
    });
}

export function hrefToPoC(accountName: string): string {
    return buildFutureAutopsyRoomHref({
        href: "/app/poc-framework/",
        focusObject: accountName,
        roomLabel: "PoC Framework"
    });
}

export function hrefToDiscoveryStudio(accountName: string): string {
    return buildFutureAutopsyRoomHref({
        href: "/app/discovery-studio/",
        focusObject: accountName,
        roomLabel: "Discovery Studio",
        extra: { account: accountName }
    });
}
