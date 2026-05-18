/**
 * Quota Workback cross-room handoff.
 *
 * Per canon §4.18 the room feeds Dashboard, Outbound Studio, Cold Call
 * Studio, Deal Workspace, Founding GTM, and Readiness with concrete
 * weekly pressure numbers. This module owns the URL builders threading
 * the canonical continuity params per CLAUDE.md §2.
 *
 * Phase 2.7 audit — retired four "Quota pressure plan" focusObject
 * placeholders. Per Invariant 8: empty focus = no param. The
 * placeholder used to leak into the destination's focused-object slot
 * (Outbound Studio's account field would prefill with the literal
 * string). Also retired the `mode=spotlight` Dashboard extra +
 * incorrect focusRoom="Spotlight" (the room is Dashboard, Spotlight
 * is one of its modes).
 */

const ROOM_HREF = "/quota-workback/";
const ROOM_LABEL = "Quota Workback";

interface HrefOptions {
    readonly href: string;
    readonly focusObject?: string;
    readonly roomLabel?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildQuotaHref(opts: HrefOptions): string {
    const params = new URLSearchParams();
    params.set("returnTo", ROOM_HREF);
    params.set("returnLabel", ROOM_LABEL);
    if (opts.focusObject && opts.focusObject.trim().length > 0) {
        params.set("focusObject", opts.focusObject.trim());
    }
    if (opts.roomLabel) params.set("focusRoom", opts.roomLabel);
    params.set("fromMode", "system");
    params.set("fromSurface", "quota-workback");
    if (opts.extra) {
        for (const [k, v] of Object.entries(opts.extra)) {
            params.set(k, v);
        }
    }
    return `${opts.href}?${params.toString()}`;
}

export function hrefToOutboundStudio(): string {
    return buildQuotaHref({
        href: "/outbound-studio/",
        roomLabel: "Outbound Studio"
    });
}

export function hrefToColdCallStudio(): string {
    return buildQuotaHref({
        href: "/cold-call-studio/",
        roomLabel: "Cold Call Studio"
    });
}

export function hrefToDashboard(): string {
    return buildQuotaHref({
        href: "/dashboard/",
        roomLabel: "Dashboard"
    });
}

export function hrefToDealWorkspace(): string {
    return buildQuotaHref({
        href: "/deal-workspace/",
        roomLabel: "Deal Workspace"
    });
}

export function hrefToFoundingGtm(): string {
    return buildQuotaHref({
        href: "/founding-gtm/",
        roomLabel: "Founding GTM"
    });
}
