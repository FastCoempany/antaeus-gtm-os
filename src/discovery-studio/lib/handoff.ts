/**
 * Discovery Studio cross-room handoff helpers.
 *
 * Added in Phase 2.5 (Discovery flow audit). Before this PR the room
 * had ZERO outbound handoff — Sarah could land in Discovery from Call
 * Planner, run the call, lock a next step, capture learned truth +
 * worked nodes, then have nowhere to click. The deal forward-move
 * (canon §4.12 — "Discovery Studio feeds Deal Workspace") was
 * implicit only; no UI affordance existed.
 *
 * This module owns the writer + 3 destination builders per canon
 * §4.12 flows-out (Deal Workspace + Call Planner + Future Autopsy).
 *
 * Per `deliverables/audit/continuity-params-2026-05.md`:
 *   returnTo     = /discovery-studio/
 *   returnLabel  = "Back to Discovery"
 *   focusObject  = account name (when known)
 *   focusRoom    = destination room display label
 *   fromMode     = "room"
 *   fromSurface  = "discovery-studio"
 */

export interface DiscoveryHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    /** Optional focused-object name. Empty/whitespace = no param written. */
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildDiscoveryHref({
    href,
    roomLabel,
    focusObject,
    extra
}: DiscoveryHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/discovery-studio/");
        params.set("returnLabel", "Back to Discovery");
        if (focusObject && focusObject.trim().length > 0) {
            params.set("focusObject", focusObject.trim());
        }
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "discovery-studio");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToDealWorkspace(accountName?: string): string {
    return buildDiscoveryHref({
        href: "/deal-workspace/",
        roomLabel: "Deal Workspace",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToFutureAutopsy(accountName?: string): string {
    return buildDiscoveryHref({
        href: "/future-autopsy/",
        roomLabel: "Future Autopsy",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToCallPlanner(accountName?: string): string {
    return buildDiscoveryHref({
        href: "/call-planner/",
        roomLabel: "Call Planner",
        ...(accountName ? { focusObject: accountName, extra: { account: accountName } } : {})
    });
}
