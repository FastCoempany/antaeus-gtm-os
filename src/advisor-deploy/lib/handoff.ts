/**
 * Phase 4 / Room 10 Wave 5 — cross-room handoff helpers.
 *
 * Faithful TypeScript port of legacy `buildAdvisorRoomHref(href,
 * focusObject, roomLabel)` (lines 561-576). Builds the deep-link URL
 * with the canonical continuity params per CLAUDE.md §2 ("the
 * continuity plumbing — do not break them").
 *
 * Three convenience builders for the "Desk read" sheet's CTA strip:
 * Open Deal Workspace / Open Future Autopsy / Open PoC Framework, all
 * threading the active deal's id via `?deal=`.
 *
 * `readInboundDealId(search)` reads `?deal=` then falls back to
 * `?focusObject=` for legacy parity with the prior room's URL inbound.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildAdvisorRoomHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/advisor-deploy/");
        params.set("returnLabel", "Back to Advisor Deploy");
        if (focusObject) params.set("focusObject", focusObject);
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "advisor-deploy");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToDealWorkspace(
    dealId: string,
    accountName: string
): string {
    const path = dealId
        ? `/deal-workspace/?deal=${encodeURIComponent(dealId)}`
        : "/deal-workspace/";
    return buildAdvisorRoomHref({
        href: path,
        focusObject: accountName || "Advisor deployment",
        roomLabel: "Deal Workspace"
    });
}

export function hrefToFutureAutopsy(
    dealId: string,
    accountName: string
): string {
    const path = dealId
        ? `/future-autopsy/?deal=${encodeURIComponent(dealId)}`
        : "/future-autopsy/";
    return buildAdvisorRoomHref({
        href: path,
        focusObject: accountName || "Advisor deployment",
        roomLabel: "Future Autopsy"
    });
}

export function hrefToPocFramework(
    dealId: string,
    accountName: string
): string {
    const path = dealId
        ? `/poc-framework/?deal=${encodeURIComponent(dealId)}`
        : "/poc-framework/";
    return buildAdvisorRoomHref({
        href: path,
        focusObject: accountName || "Advisor deployment",
        roomLabel: "PoC Framework"
    });
}

// ─── URL inbound ──────────────────────────────────────────────────────

/**
 * Read the inbound URL params (`?deal=` then fallback `?focusObject=`)
 * and return the deal id to auto-select. Returns null when neither is
 * present. Mirrors legacy line 226.
 */
export function readInboundDealId(
    search: string = typeof window !== "undefined"
        ? window.location.search
        : ""
): string | null {
    try {
        const p = new URLSearchParams(search);
        const deal = p.get("deal");
        if (deal && deal.length > 0) return deal;
        const focus = p.get("focusObject");
        if (focus && focus.length > 0) return focus;
        return null;
    } catch {
        return null;
    }
}
