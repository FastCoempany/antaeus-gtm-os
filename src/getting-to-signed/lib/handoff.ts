/**
 * Negotiation cross-room handoff helpers — Phase 4 of the 2026-05
 * navigation-intelligence roadmap.
 *
 * Canonical writer for the canonical continuity params per CLAUDE.md
 * §2 + deliverables/audit/continuity-params-2026-05.md. Replaces the
 * inline buildNegotiationHref + hrefToDealWorkspace + hrefToAdvisor
 * helpers that previously lived in cross-room.ts — they predated the
 * Phase 2 audit and used a placeholder-string pattern (focusObject
 * defaulted to a literal "Negotiation" string) that violates
 * Invariant 8 (empty focusObject = no param written).
 *
 * Per canon §4.16b Negotiation feeds:
 *   - Deal Workspace (rehearsal outcomes + concession ledger)
 *   - Future Autopsy (loss-pattern feedback — "was the negotiation
 *     already lost before the meeting?")
 *   - Advisor Deploy (backchannel air cover)
 *   - PoC Framework (proof state on the negotiating deal)
 *
 * Per `deliverables/audit/continuity-params-2026-05.md`:
 *   returnTo     = /getting-to-signed/
 *   returnLabel  = "Back to Getting to Signed"
 *   focusObject  = account name (only when there's a real value —
 *                  Invariant 8: no placeholder strings)
 *   focusRoom    = destination room display label
 *   fromMode     = "room"
 *   fromSurface  = "negotiation"
 */

export interface NegotiationHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    /** Optional focused-object name. Empty/whitespace = no param. */
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildNegotiationHref({
    href,
    roomLabel,
    focusObject,
    extra
}: NegotiationHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/getting-to-signed/");
        params.set("returnLabel", "Back to Getting to Signed");
        if (focusObject && focusObject.trim().length > 0) {
            params.set("focusObject", focusObject.trim());
        }
        if (roomLabel) params.set("focusRoom", roomLabel);
        params.set("fromMode", "room");
        params.set("fromSurface", "negotiation");
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToDealWorkspace(
    dealId?: string,
    accountName?: string
): string {
    const path = dealId
        ? `/deal-workspace/?deal=${encodeURIComponent(dealId)}`
        : "/deal-workspace/";
    return buildNegotiationHref({
        href: path,
        roomLabel: "Deal Workspace",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToFutureAutopsy(
    dealId?: string,
    accountName?: string
): string {
    const path = dealId
        ? `/future-autopsy/?deal=${encodeURIComponent(dealId)}`
        : "/future-autopsy/";
    return buildNegotiationHref({
        href: path,
        roomLabel: "Future Autopsy",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToAdvisorDeploy(
    dealId?: string,
    accountName?: string
): string {
    const path = dealId
        ? `/call-in-a-favor/?deal=${encodeURIComponent(dealId)}`
        : "/call-in-a-favor/";
    return buildNegotiationHref({
        href: path,
        roomLabel: "Call in a Favor",
        ...(accountName ? { focusObject: accountName } : {})
    });
}

export function hrefToPocFramework(
    dealId?: string,
    accountName?: string
): string {
    const path = dealId
        ? `/pilot-desk/?deal=${encodeURIComponent(dealId)}`
        : "/pilot-desk/";
    return buildNegotiationHref({
        href: path,
        roomLabel: "Pilot Desk",
        ...(accountName ? { focusObject: accountName } : {})
    });
}
