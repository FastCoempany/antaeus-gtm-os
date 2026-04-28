/**
 * Phase 4 / Room 14 — Quota Workback cross-room handoff.
 *
 * Per canon §4.18 the room feeds Dashboard, Outbound Studio, Cold Call
 * Studio, Deal Workspace, and Readiness with concrete weekly pressure
 * numbers. This module owns the URL builders threading the canonical
 * continuity params per CLAUDE.md §2.
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
    if (opts.focusObject) params.set("focusObject", opts.focusObject);
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
        focusObject: "Quota pressure plan",
        roomLabel: "Outbound Studio"
    });
}

export function hrefToColdCallStudio(): string {
    return buildQuotaHref({
        href: "/cold-call-studio/",
        focusObject: "Quota pressure plan",
        roomLabel: "Cold Call Studio"
    });
}

export function hrefToDashboard(): string {
    return buildQuotaHref({
        href: "/dashboard/",
        focusObject: "Quota pressure plan",
        roomLabel: "Spotlight",
        extra: { mode: "spotlight" }
    });
}

export function hrefToDealWorkspace(): string {
    return buildQuotaHref({
        href: "/deal-workspace/",
        focusObject: "Quota pressure plan",
        roomLabel: "Deal Workspace"
    });
}
