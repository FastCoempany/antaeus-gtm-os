/**
 * Phase 4 / Room 11 Wave 5 — cross-room handoff helpers.
 *
 * ICP Studio is foundational — saved ICPs in `gtmos_icp_analytics`
 * are read by Territory / Sourcing / Signal Console / Outbound /
 * Discovery / Readiness / Handoff Kit. Persistence already publishes
 * the data implicitly. Wave 5 just adds the explicit handoff CTAs so
 * the operator can navigate to those rooms with continuity preserved.
 */

export interface HandoffOptions {
    readonly href: string;
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
        if (focusObject) params.set("focusObject", focusObject);
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

const FOCUS_FALLBACK = "ICP wedge";

export function hrefToTerritoryArchitect(industry: string): string {
    return buildIcpStudioHref({
        href: "/territory-architect/",
        focusObject: industry || FOCUS_FALLBACK,
        roomLabel: "Territory Architect"
    });
}

export function hrefToSourcingWorkbench(industry: string): string {
    return buildIcpStudioHref({
        href: "/sourcing-workbench/",
        focusObject: industry || FOCUS_FALLBACK,
        roomLabel: "Sourcing Workbench"
    });
}

export function hrefToSignalConsole(industry: string): string {
    return buildIcpStudioHref({
        href: "/signal-console/",
        focusObject: industry || FOCUS_FALLBACK,
        roomLabel: "Signal Console"
    });
}

export function hrefToOutboundStudio(industry: string): string {
    return buildIcpStudioHref({
        href: "/outbound-studio/",
        focusObject: industry || FOCUS_FALLBACK,
        roomLabel: "Outbound Studio"
    });
}
