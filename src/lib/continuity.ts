/**
 * Cross-room continuity readers.
 *
 * Per CLAUDE.md §2 the continuity plumbing is six URL params:
 *   returnTo, returnLabel, focusObject, focusRoom, fromMode, fromSurface
 *
 * Each room's `lib/handoff.ts` writes these out. Until 2026-04-28
 * almost no destination read them back — handoffs threw context
 * that disappeared on arrival, and operators had to use the browser
 * back button to return.
 *
 * This module centralizes the reader so every room consumes the
 * same shape, and so a future evolution (signed params, JSON-encoded
 * payloads, query-string size limits) lives in one place.
 */

export interface ContinuityContext {
    /** Full path to navigate back to, e.g. `/quota-workback/`. */
    readonly returnTo: string | null;
    /** Human label for the back button, e.g. "Back to Quota Workback". */
    readonly returnLabel: string | null;
    /** Object the operator is focusing on (account name, deal id, ICP industry, etc). */
    readonly focusObject: string | null;
    /** Display label of the source room. */
    readonly focusRoom: string | null;
    /** "system" | "room" | "sourcing" | etc — the source's mode tag. */
    readonly fromMode: string | null;
    /** Source surface within the room (e.g., "workbench", "spotlight"). */
    readonly fromSurface: string | null;
}

export const EMPTY_CONTINUITY: ContinuityContext = {
    returnTo: null,
    returnLabel: null,
    focusObject: null,
    focusRoom: null,
    fromMode: null,
    fromSurface: null
};

/**
 * Read the canonical continuity params from a URL search string.
 * Defaults to `window.location.search` when called without args (so
 * rooms can `readContinuity()` directly from main.tsx).
 *
 * Returns trimmed strings, with empty strings normalized to null so
 * callers can `if (ctx.returnTo)` without a separate trim check.
 */
export function readContinuity(
    search: string = typeof window !== "undefined" ? window.location.search : ""
): ContinuityContext {
    if (!search || typeof search !== "string") return EMPTY_CONTINUITY;
    let params: URLSearchParams;
    try {
        params = new URLSearchParams(
            search.startsWith("?") ? search : `?${search}`
        );
    } catch {
        return EMPTY_CONTINUITY;
    }

    function get(key: string): string | null {
        const raw = params.get(key);
        if (typeof raw !== "string") return null;
        const trimmed = raw.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return {
        returnTo: get("returnTo"),
        returnLabel: get("returnLabel"),
        focusObject: get("focusObject"),
        focusRoom: get("focusRoom"),
        fromMode: get("fromMode"),
        fromSurface: get("fromSurface")
    };
}

/**
 * Validate that a returnTo is safe to navigate to. Prevents open-
 * redirect attacks where a malicious link could pass an absolute URL
 * pointing off-domain.
 *
 * Accepted: paths starting with `/` (and not `//`, which would be
 * protocol-relative). Everything else returns null.
 */
export function safeReturnTo(returnTo: string | null): string | null {
    if (!returnTo) return null;
    if (!returnTo.startsWith("/")) return null;
    if (returnTo.startsWith("//")) return null;
    return returnTo;
}
