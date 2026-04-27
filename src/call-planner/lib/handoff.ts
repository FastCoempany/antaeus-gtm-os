/**
 * Phase 4 / Room 9 Wave 5 — cross-room handoff helpers.
 *
 * Faithful TypeScript port of the legacy `buildPlannerRoomHref(href,
 * focusObject, roomLabel)` from `app/discovery-agenda/index.html`
 * line 575-588. Carries the canonical continuity params per CLAUDE.md
 * §2 ("the continuity plumbing — do not break them").
 *
 * Note on `?account=` threading: this is added on top of the legacy's
 * 6 continuity params so destination rooms can pre-select the matched
 * account. The Wave 8 LinkedIn Playbook readInboundAccount only reads
 * `?account=` (not `?focusObject=`) per its Codex P2 fix; the Call
 * Planner mirrors that contract here.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    /** Optional `?account=` so destination rooms auto-select. */
    readonly account?: string;
    /** Optional `?deal=` for the Deal Workspace handoff. */
    readonly deal?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildPlannerHref({
    href,
    focusObject,
    roomLabel,
    account,
    deal,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/app/discovery-agenda/");
    params.set("returnLabel", "Back to Call Planner");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "call-planner");
    if (account) params.set("account", account);
    if (deal) params.set("deal", deal);
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToDiscoveryStudio(focus: string, account: string): string {
    return buildPlannerHref({
        href: "/app/discovery-studio/",
        focusObject: focus || "Call Planner",
        roomLabel: "Discovery Studio",
        account
    });
}

export function hrefToDealWorkspace(
    focus: string,
    account: string,
    deal: string
): string {
    return buildPlannerHref({
        href: "/app/deal-workspace/",
        focusObject: focus || "Call Planner",
        roomLabel: "Deal Workspace",
        account,
        deal
    });
}

export function hrefToSignalConsole(focus: string, account: string): string {
    return buildPlannerHref({
        href: "/app/signal-console/",
        focusObject: focus || "Call Planner",
        roomLabel: "Signal Console",
        account
    });
}

// ─── URL inbound ──────────────────────────────────────────────────────

/**
 * Read the inbound `?account=` URL param and return the contact name
 * to prefill into the planner's draft. Returns null when not present.
 *
 * NOTE: like the LinkedIn Playbook (PR #23 Codex P2 fix), we
 * intentionally do NOT fall back to `?focusObject=` here — focusObject
 * is the destination room's "what's being focused on" semantic, often
 * a generic placeholder string like "Call Planner" that would pollute
 * the contact field if treated as an account name.
 */
export function readInboundAccount(
    search: string = typeof window !== "undefined"
        ? window.location.search
        : ""
): string | null {
    try {
        const p = new URLSearchParams(search);
        const account = p.get("account");
        if (account && account.length > 0) return account;
        return null;
    } catch {
        return null;
    }
}
