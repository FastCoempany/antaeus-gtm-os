import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
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

// v2 bump: ADR-014 added the Workspace / World framing. Operators who
// dismissed the v1 primer should see the v2 primer once so they discover
// the new view toggle.
const STORAGE_KEY = "gtmos_briefing_primer_seen_v2";

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
        <aside class="bf-primer" role="note" aria-label={t("What the Briefing room does")}>
            <div class="bf-primer__head">
                <p class="bf-primer__kicker">{t("FIRST TIME HERE")}</p>
                <button
                    type="button"
                    class="bf-primer__close"
                    onClick={dismiss}
                    aria-label={t("Dismiss primer")}
                    title={t("Dismiss")}
                >
                    ×
                </button>
            </div>
            <h2 class="bf-primer__headline">
                This room is what the system saw — in your work, and in
                your market.
            </h2>
            <p class="bf-primer__body">
                Open it daily. The toggle at the top picks between two
                views: <strong>{t("Workspace")}</strong> (what's moving in your
                own deals, signals, proofs — refreshed every 30 minutes)
                and <strong>{t("World")}</strong> (what's moving in the market
                you sell into — refreshed Monday mornings).
            </p>
            <ul class="bf-primer__list">
                <li>
                    <strong>{t("Workspace")}</strong> — heartbeat-fresh reads
                    about your deals going stale, accounts going quiet,
                    proofs past their readout. Dismiss what doesn't matter;
                    the rest tells you where to look first.
                </li>
                <li>
                    <strong>{t("World · Patterns")}</strong> — synthesized reads
                    of what's moving in your market. Click any destination
                    chip to draft a move in the destination room. "Show
                    the work" expands the audit trail.
                </li>
                <li>
                    <strong>{t("World · Where the data disagrees")}</strong> —
                    the system challenging an assumption you've stated.
                    Quiet most weeks. Loud when the evidence stops matching.
                </li>
                <li>
                    <strong>{t("World · Consider watching")}</strong> — companies
                    the data kept mentioning alongside the ones you've
                    named but that aren't on your watchlist yet.
                </li>
                <li>
                    <strong>{t("Watch list")}</strong> — your standing orders,
                    shared across both views. Arm a trigger and the system
                    tells you when it fires.
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
