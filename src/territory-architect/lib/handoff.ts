/**
 * Territory Architect cross-room handoff helpers.
 *
 * Added in Phase 2.3 (Strategy flow audit). Previously the HandoffStrip
 * wrote raw href strings ("/sourcing-workbench/", "/signal-console/",
 * "/icp-studio/") with no continuity plumbing — destinations couldn't
 * render a "Back to Territory" affordance, focusObject didn't carry,
 * fromMode/fromSurface were absent.
 *
 * Per `deliverables/audit/continuity-params-2026-05.md`:
 *   returnTo     = /territory-architect/
 *   returnLabel  = "Back to Territory Architect"
 *   focusObject  = focused-ICP industry or headline (when known)
 *   focusRoom    = destination room display label
 *   fromMode     = "room"
 *   fromSurface  = "territory-architect"
 */

export interface TerritoryHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    /** Optional focused-object name. Empty = no focusObject written. */
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildTerritoryHref({
    href,
    roomLabel,
    focusObject,
    extra
}: TerritoryHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/territory-architect/");
        params.set("returnLabel", "Back to Territory");
        if (focusObject && focusObject.trim().length > 0) {
            params.set("focusObject", focusObject.trim());
        }
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "territory-architect");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToSourcingWorkbench(focusObject?: string): string {
    return buildTerritoryHref({
        href: "/sourcing-workbench/",
        roomLabel: "Sourcing Workbench",
        ...(focusObject ? { focusObject } : {})
    });
}

export function hrefToSignalConsole(focusObject?: string): string {
    return buildTerritoryHref({
        href: "/signal-console/",
        roomLabel: "Signal Console",
        ...(focusObject ? { focusObject } : {})
    });
}

export function hrefToIcpStudio(focusObject?: string): string {
    return buildTerritoryHref({
        href: "/icp-studio/",
        roomLabel: "ICP Studio",
        ...(focusObject ? { focusObject } : {})
    });
}
