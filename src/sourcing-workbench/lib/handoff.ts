/**
 * Phase 4 / Room 13 — Sourcing Workbench cross-room handoff.
 *
 * Per canon §4.6 the Sourcing Workbench feeds qualified accounts into
 * Signal Console (downstream) and consumes thesis + tier vocabulary
 * from Territory Architect (upstream). This module owns the URL-builder
 * helpers that thread the canonical continuity params per CLAUDE.md §2:
 *
 *   returnTo, returnLabel, focusObject, focusRoom, fromMode, fromSurface
 *
 * `?account=` is also threaded so destination rooms can auto-select the
 * pushed prospect's account.
 */

const ROOM_HREF = "/sourcing-workbench/";
const ROOM_LABEL = "Sourcing Workbench";

interface HrefOptions {
    readonly href: string;
    readonly focusObject?: string;
    readonly roomLabel?: string;
    readonly account?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildSourcingHref(opts: HrefOptions): string {
    const params = new URLSearchParams();
    params.set("returnTo", ROOM_HREF);
    params.set("returnLabel", ROOM_LABEL);
    if (opts.focusObject) params.set("focusObject", opts.focusObject);
    if (opts.roomLabel) params.set("focusRoom", opts.roomLabel);
    params.set("fromMode", "sourcing");
    params.set("fromSurface", "workbench");
    if (opts.account) params.set("account", opts.account);
    if (opts.extra) {
        for (const [k, v] of Object.entries(opts.extra)) {
            params.set(k, v);
        }
    }
    return `${opts.href}?${params.toString()}`;
}

export function hrefToTerritoryArchitect(opts?: {
    readonly focusObject?: string;
}): string {
    return buildSourcingHref({
        href: "/territory-architect/",
        focusObject: opts?.focusObject,
        roomLabel: "Territory Architect"
    });
}

export function hrefToSignalConsole(opts?: {
    readonly account?: string;
}): string {
    return buildSourcingHref({
        href: "/signal-console/",
        focusObject: opts?.account,
        roomLabel: "Signal Console",
        account: opts?.account
    });
}

export function hrefToOutboundStudio(opts?: {
    readonly account?: string;
}): string {
    return buildSourcingHref({
        href: "/outbound-studio/",
        focusObject: opts?.account,
        roomLabel: "Outbound Studio",
        account: opts?.account
    });
}

/**
 * Read inbound `?account=` from the URL search string. Returns null
 * when the param is absent. Caller (main.tsx) uses this to pre-fill
 * the prospect draft when the operator routed in from Signal Console
 * or Territory Architect.
 */
export function readInboundAccount(search: string): string | null {
    if (!search || typeof search !== "string") return null;
    try {
        const params = new URLSearchParams(
            search.startsWith("?") ? search : `?${search}`
        );
        const account = params.get("account");
        if (account && account.trim()) return account.trim();
    } catch {
        // malformed search string — fall through
    }
    return null;
}
