import type { JSX } from "preact";
import {
    readContinuity,
    safeReturnTo,
    type ContinuityContext
} from "./continuity";
import "./back-button.css";

/**
 * Shared cross-room back-button.
 *
 * Reads `?returnTo=` and `?returnLabel=` from the URL (or from a
 * pre-read context, for tests + SSR). When both are present and
 * returnTo is a safe in-domain path, renders an anchor with the
 * label. Otherwise renders nothing — the room continues to look
 * how it always looks when the operator landed there directly.
 *
 * Style notes:
 * - Inline-block, so it sits inside a topbar row without
 *   forcing a new line.
 * - Uses semantic class names so each room can theme it via the
 *   room's own CSS namespace if needed (the default styles below
 *   are unstyled enough to pick up the room's typography
 *   automatically).
 * - The arrow is a CSS-rendered chevron, not an icon font, so it
 *   loads without a network round-trip.
 *
 * Per CLAUDE.md §2: returnTo / returnLabel / focusObject /
 * focusRoom / fromMode / fromSurface are the canonical continuity
 * plumbing. Do not break them.
 */

export interface BackButtonProps {
    /**
     * Pre-read context. Optional — if omitted, reads from the URL.
     * Useful for tests + when a parent already called readContinuity.
     */
    readonly context?: ContinuityContext;
    /**
     * Default label when the URL provides returnTo but no
     * returnLabel. Each room can pass its preferred fallback (e.g.
     * "Back" or "Return to operator surface").
     */
    readonly fallbackLabel?: string;
    /** Optional class for the anchor, layered on top of `c-back`. */
    readonly className?: string;
}

export function BackButton(props: BackButtonProps): JSX.Element | null {
    const ctx = props.context ?? readContinuity();
    const safe = safeReturnTo(ctx.returnTo);
    if (!safe) return null;
    const label =
        ctx.returnLabel ?? props.fallbackLabel ?? "Back";
    const cls = props.className ? `c-back ${props.className}` : "c-back";
    return (
        <a class={cls} href={safe}>
            <span class="c-back__arrow" aria-hidden="true">
                ←
            </span>
            <span class="c-back__label">{label}</span>
        </a>
    );
}
