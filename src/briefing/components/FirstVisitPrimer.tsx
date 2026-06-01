import type { JSX } from "preact";
import { signal, type Signal } from "@preact/signals";

/**
 * FirstVisitPrimer — the one-time explainer that surfaces above the
 * topbar when the operator opens the Briefing room for the first time.
 *
 * Per ADR-013 follow-up + canon Part II §6 ("every surface must treat
 * empty / sparse / loading states explicitly"): the Briefing room has
 * good "no patterns yet" empty-state copy, but a first-time visitor on
 * a populated workspace still lands on a wall of synthesized reads
 * with no frame for what they're looking at.
 *
 * This component fills that gap. Three short paragraphs name what the
 * room is + the secondary-surface concepts (Watch list, Where the
 * data disagrees, Consider watching) so the operator's first scan has
 * orientation. Dismissable; the dismissal flag persists in
 * localStorage so it never re-appears on this device.
 *
 * Hook-free per canon Phase 4 / Room 9 — module-level signal carries
 * the visible state.
 */

const STORAGE_KEY = "gtmos_briefing_primer_seen_v1";

// Module-level signal — null = "not yet checked storage."
// Renders read storage on first access so test resets work cleanly.
const dismissedSignal: Signal<boolean | null> = signal(null);

function readSeen(): boolean {
    if (typeof window === "undefined") return true;
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
        return true;
    }
}

function writeSeen(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
        // storage disabled — non-blocking. Primer will re-appear next
        // visit. That's a worse experience but not a bug.
    }
}

function dismiss(): void {
    writeSeen();
    dismissedSignal.value = true;
}

export function FirstVisitPrimer(): JSX.Element | null {
    // First read seeds from storage; later reads honor the signal.
    if (dismissedSignal.value === null) {
        dismissedSignal.value = readSeen();
    }
    if (dismissedSignal.value) return null;
    return (
        <aside class="bf-primer" role="note" aria-label="What the Briefing room does">
            <div class="bf-primer__head">
                <p class="bf-primer__kicker">FIRST TIME HERE</p>
                <button
                    type="button"
                    class="bf-primer__close"
                    onClick={dismiss}
                    aria-label="Dismiss primer"
                    title="Dismiss"
                >
                    ×
                </button>
            </div>
            <h2 class="bf-primer__headline">
                This room is what the system saw, not what you told it.
            </h2>
            <p class="bf-primer__body">
                Every Monday at 6 AM Central the pipeline reads the week's
                signals against the accounts, deals, and watchlist entries
                you've named. Then it tells you what's actually moving —
                ranked, with the evidence behind each read and a
                recommended next move that routes to the room where you'd
                act on it.
            </p>
            <ul class="bf-primer__list">
                <li>
                    <strong>Patterns</strong> — the main reads. Click any
                    destination chip to draft a move in the destination
                    room. "Show the work" expands the audit trail.
                </li>
                <li>
                    <strong>Where the data disagrees</strong> — the system
                    challenging an assumption you've stated. Quiet most
                    weeks. Loud when the evidence stops matching.
                </li>
                <li>
                    <strong>Consider watching</strong> — companies the data
                    kept mentioning alongside the ones you've named but
                    that aren't on your watchlist yet.
                </li>
                <li>
                    <strong>Watch list</strong> — your standing orders.
                    Arm a trigger and the system tells you when it fires.
                </li>
            </ul>
            <button
                type="button"
                class="bf-primer__ack"
                onClick={dismiss}
            >
                Got it
            </button>
        </aside>
    );
}

/** @internal — reset module signal between tests. */
export function __resetFirstVisitPrimerForTests(): void {
    dismissedSignal.value = null;
}
