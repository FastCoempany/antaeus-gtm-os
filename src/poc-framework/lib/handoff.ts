/**
 * Phase 4 / Room 5 Wave 5 — cross-room handoff helpers.
 *
 * Faithful port of the legacy `buildPocRoomHref` (lines 91-99 of
 * `app/poc-framework/index.html`). Builds the deep-link URL into the
 * destination room with the canonical continuity params:
 *
 *   returnTo     = /poc-framework/   (where to come back)
 *   returnLabel  = "Back to PoC Framework"
 *   focusObject  = the account name      (what to highlight)
 *   focusRoom    = the destination room label
 *   fromMode     = "room"
 *   fromSurface  = "poc-framework"
 *
 * Per CLAUDE.md §2: these params are "the continuity plumbing — do
 * not break them." Every consumer-side room reads them to render the
 * "Back to PoC Framework" affordance + restore the focused object.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildPocRoomHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/poc-framework/");
    params.set("returnLabel", "Back to PoC Framework");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "poc-framework");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

/**
 * Convenience builders for the three primary destinations the room
 * routes to (per canon §4.15 flows-out).
 */
export function hrefToDealWorkspace(
    accountName: string,
    dealId?: string
): string {
    return buildPocRoomHref({
        href: "/deal-workspace/",
        focusObject: accountName,
        roomLabel: "Deal Workspace",
        ...(dealId ? { extra: { deal: dealId } } : {})
    });
}

export function hrefToFutureAutopsy(accountName: string): string {
    return buildPocRoomHref({
        href: "/future-autopsy/",
        focusObject: accountName,
        roomLabel: "Future Autopsy"
    });
}

export function hrefToAdvisorDeploy(accountName: string): string {
    return buildPocRoomHref({
        href: "/advisor-deploy/",
        focusObject: accountName,
        roomLabel: "Advisor Deploy"
    });
}

/**
 * Read inbound URL param `?deal=<id>` for auto-populating the linked
 * deal dropdown. Pure: accepts the search string for tests.
 */
export function readInboundDealId(search: string = typeof window !== "undefined" ? window.location.search : ""): string | null {
    try {
        const p = new URLSearchParams(search);
        const id = p.get("deal");
        return id && id.length > 0 ? id : null;
    } catch {
        return null;
    }
}
