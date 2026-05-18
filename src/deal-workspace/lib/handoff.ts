/**
 * Deal Workspace cross-room handoff helpers.
 *
 * Added in Phase 2.6 (Recovery flow audit). Before this PR the room
 * had ZERO outbound handoff strip — Sarah could browse the recovery
 * board, see the at-risk deals, and have no entry point into the
 * intervention rooms (Future Autopsy / PoC Framework / Advisor
 * Deploy) without first opening a specific deal's edit modal. Same
 * gap Discovery Studio had until Phase 2.5 added its HandoffStrip.
 *
 * Per canon §4.13 Deal Workspace feeds:
 *   - Future Autopsy (deal pressure → pre-mortem)
 *   - PoC Framework (proof state on the deal)
 *   - Advisor Deploy (advisor route on the deal)
 *   - Dashboard (pressure into command-intelligence rail)
 *
 * Per `deliverables/audit/continuity-params-2026-05.md`:
 *   returnTo     = /deal-workspace/
 *   returnLabel  = "Back to Deal Workspace"
 *   focusObject  = account name (when a focal deal is selected)
 *   focusRoom    = destination room display label
 *   fromMode     = "room"
 *   fromSurface  = "deal-workspace"
 */

export interface DealWorkspaceHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    /** Optional focused-object name. Empty/whitespace = no param. */
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildDealWorkspaceHref({
    href,
    roomLabel,
    focusObject,
    extra
}: DealWorkspaceHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/deal-workspace/");
        params.set("returnLabel", "Back to Deal Workspace");
        if (focusObject && focusObject.trim().length > 0) {
            params.set("focusObject", focusObject.trim());
        }
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "deal-workspace");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToFutureAutopsy(accountName?: string): string {
    return buildDealWorkspaceHref({
        href: "/future-autopsy/",
        roomLabel: "Future Autopsy",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToPocFramework(accountName?: string): string {
    return buildDealWorkspaceHref({
        href: "/poc-framework/",
        roomLabel: "PoC Framework",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToAdvisorDeploy(accountName?: string): string {
    return buildDealWorkspaceHref({
        href: "/advisor-deploy/",
        roomLabel: "Advisor Deploy",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToCallPlanner(accountName?: string): string {
    return buildDealWorkspaceHref({
        href: "/call-planner/",
        roomLabel: "Call Planner",
        ...(accountName ? { focusObject: accountName, extra: { account: accountName } } : {})
    });
}

/**
 * Phase 4 — Negotiation handoff. When a focal deal is selected, the
 * deal id threads through as `?deal=` so Negotiation's URL-inbound
 * auto-selects it; account name lands as focusObject for the topbar
 * kicker.
 */
export function hrefToNegotiation(
    dealId?: string,
    accountName?: string
): string {
    const path = dealId
        ? `/negotiation/?deal=${encodeURIComponent(dealId)}`
        : "/negotiation/";
    return buildDealWorkspaceHref({
        href: path,
        roomLabel: "Negotiation",
        ...(accountName ? { focusObject: accountName } : {})
    });
}
