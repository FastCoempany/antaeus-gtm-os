import type { JSX } from "preact";

/**
 * ReframeBanner — ADR-016 transition notice.
 *
 * Visible until the discovery Edge Function ships (PR 2). Explains
 * that the room's job is shifting from "you author events" to
 * "the system finds events for you," and that the manual composer
 * below is a temporary fallback during the wiring.
 *
 * Retires when PR 2 lands and the composer is removed.
 */
export function ReframeBanner(): JSX.Element {
    return (
        <aside class="oe-reframe" role="note" aria-label="Discovery wiring update">
            <p class="oe-reframe__kicker">DISCOVERY WIRING — IN PROGRESS</p>
            <p class="oe-reframe__body">
                This room is becoming a discovery surface: the system reads
                your product category and surfaces events that are direct,
                adjacent, or indirect to it — like Signal Console for
                accounts, but for offline gatherings. The pipeline ships
                next. Until then, the composer below is a fallback so the
                room stays useful.
            </p>
        </aside>
    );
}