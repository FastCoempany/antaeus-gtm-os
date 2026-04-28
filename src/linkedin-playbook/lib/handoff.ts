/**
 * Phase 4 / Room 8 Wave 5 — cross-room handoff helpers.
 *
 * Faithful TypeScript port of the legacy `buildLinkedInRoomHref(href,
 * focusObject, roomLabel)` from `app/linkedin-playbook/index.html` line
 * 100. Carries the canonical continuity params per CLAUDE.md §2 ("the
 * continuity plumbing — do not break them") plus an `?account=`
 * pass-through so destination rooms can pre-select.
 *
 * Convenience builders for the two booth-read CTAs (Open Signal,
 * Open Outbound). `readInboundAccount(search)` resolves the URL inbound
 * using `?account=` then `?focusObject=` — same precedence as the rest
 * of Phase 4.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    /** Optional `?account=` for the destination room's auto-select. */
    readonly account?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildLinkedInRoomHref({
    href,
    focusObject,
    roomLabel,
    account,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/linkedin-playbook/");
    params.set("returnLabel", "Back to LinkedIn Playbook");
    params.set("focusObject", focusObject || "LinkedIn cue");
    params.set("focusRoom", roomLabel || "LinkedIn Playbook");
    params.set("fromMode", "room");
    params.set("fromSurface", "linkedin-playbook");
    if (account) params.set("account", account);
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToSignalConsole(account: string): string {
    return buildLinkedInRoomHref({
        href: "/signal-console/",
        focusObject: account || "LinkedIn cue",
        roomLabel: "Signal Console",
        account
    });
}

export function hrefToOutboundStudio(account: string): string {
    return buildLinkedInRoomHref({
        href: "/outbound-studio/",
        focusObject: account || "LinkedIn cue",
        roomLabel: "Outbound Studio",
        account
    });
}

// ─── URL inbound ──────────────────────────────────────────────────────

/**
 * Read the inbound `?account=` URL param and return the account name to
 * auto-select. Returns null when not present.
 *
 * NOTE: unlike most other Phase 4 rooms' inbound readers, we intentionally
 * do NOT fall back to `?focusObject=` here. `buildLinkedInRoomHref` defaults
 * `focusObject` to the literal string "LinkedIn cue" when no account is
 * supplied (so the destination room shows a sensible focus label even when
 * we have no real account yet). If this reader fell back to that field, a
 * roundtrip through any cross-room handoff would prefill the cue ledger
 * with the placeholder string and pollute the action log if the operator
 * submitted without correcting it. `?account=` is the only field that
 * carries a real account name and is the only field we trust here.
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
