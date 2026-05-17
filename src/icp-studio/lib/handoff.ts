/**
 * ICP Studio cross-room handoff helpers.
 *
 * ICP Studio is foundational — saved ICPs in `gtmos_icp_analytics`
 * are read by Territory / Sourcing / Signal Console / Outbound /
 * Discovery / Readiness / Handoff Kit. Persistence already publishes
 * the data implicitly. This module adds the explicit handoff CTAs so
 * the operator can navigate to those rooms with continuity preserved.
 *
 * Per `deliverables/audit/continuity-params-2026-05.md` Invariant 8:
 * an empty focusObject is NOT written. The previous
 * `FOCUS_FALLBACK = "ICP wedge"` placeholder propagated a literal
 * string into destination rooms — caught earlier in the LinkedIn
 * Playbook P2 fix. Phase 2.3 retires it here for the same reason.
 */

export interface HandoffOptions {
    readonly href: string;
    /** ICP industry/wedge to propagate. Empty string = no focusObject written. */
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildIcpStudioHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/icp-studio/");
        params.set("returnLabel", "Back to ICP Studio");
        // Empty focusObject = no param written. No placeholder strings.
        if (focusObject && focusObject.trim().length > 0) {
            params.set("focusObject", focusObject.trim());
        }
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "icp-studio");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToTerritoryArchitect(industry: string): string {
    return buildIcpStudioHref({
        href: "/territory-architect/",
        focusObject: industry,
        roomLabel: "Territory Architect"
    });
}

export function hrefToSourcingWorkbench(industry: string): string {
    return buildIcpStudioHref({
        href: "/sourcing-workbench/",
        focusObject: industry,
        roomLabel: "Sourcing Workbench"
    });
}

export function hrefToSignalConsole(industry: string): string {
    return buildIcpStudioHref({
        href: "/signal-console/",
        focusObject: industry,
        roomLabel: "Signal Console"
    });
}

export function hrefToOutboundStudio(industry: string): string {
    return buildIcpStudioHref({
        href: "/outbound-studio/",
        focusObject: industry,
        roomLabel: "Outbound Studio"
    });
}
