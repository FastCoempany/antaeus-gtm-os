/**
 * Phase 2.2 Wave — Dashboard's cross-room handoff writer.
 *
 * Dashboard's snapshot aggregator (`signalSnapshotToMoveCards` +
 * `dealSnapshotToRiskCards`) used to hard-code action hrefs without
 * any continuity plumbing: `/signal-console/` for moves, raw
 * `/deal-workspace/?focusObject=...` for risks. Two seam-test
 * failures fell out:
 *   - The dominant CTA went to the wrong room (move cards routed to
 *     Signal Console when the operator's intent was outbound — the
 *     room that composes the move).
 *   - Continuity params (`returnTo`, `returnLabel`, `fromMode`,
 *     `fromSurface`) were absent, so the destination's back-button
 *     either didn't render or pointed at the global root.
 *
 * Per `deliverables/audit/continuity-params-2026-05.md` Invariant 1:
 * "no room may construct a cross-room href by string concatenation."
 * Everything outbound from Dashboard now flows through here.
 */

export interface DashboardHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildDashboardHref({
    href,
    roomLabel,
    focusObject,
    extra
}: DashboardHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/dashboard/");
    params.set("returnLabel", "Back to Dashboard");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "command");
    params.set("fromSurface", "dashboard");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

/**
 * Convenience builders for the destinations Dashboard's ranked-card
 * engine routes to.
 *
 * Sarah's hand-reach intent on a move card titled "Outbound to {X}"
 * is to compose outbound — so the dominant CTA lands in Outbound
 * Studio with the account already in the operator rack, not in
 * Signal Console where she'd have to re-pick.
 *
 * On a risk card titled "{Deal name}" her intent is to open the
 * deal at the gate that's broken — so the CTA lands in Deal
 * Workspace with the deal focused.
 */

export function hrefToOutboundForAccount(accountName: string): string {
    return buildDashboardHref({
        href: "/outbound-studio/",
        roomLabel: "Outbound Studio",
        focusObject: accountName,
        extra: { account: accountName }
    });
}

export function hrefToSignalForAccount(accountName: string): string {
    return buildDashboardHref({
        href: "/signal-console/",
        roomLabel: "Signal Console",
        focusObject: accountName,
        extra: { account: accountName }
    });
}

export function hrefToDealForDeal(dealId: string, dealName?: string): string {
    return buildDashboardHref({
        href: "/deal-workspace/",
        roomLabel: "Deal Workspace",
        ...(dealName ? { focusObject: dealName } : {}),
        ...(dealId ? { extra: { deal: dealId } } : {})
    });
}

export function hrefToFutureAutopsyForDeal(
    dealId: string,
    dealName?: string
): string {
    return buildDashboardHref({
        href: "/future-autopsy/",
        roomLabel: "Future Autopsy",
        ...(dealName ? { focusObject: dealName } : {}),
        ...(dealId ? { extra: { deal: dealId } } : {})
    });
}

export function hrefToCallPlannerForAccount(accountName: string): string {
    return buildDashboardHref({
        href: "/call-planner/",
        roomLabel: "Call Planner",
        focusObject: accountName,
        extra: { account: accountName }
    });
}
