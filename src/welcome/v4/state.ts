import { signal, type Signal } from "@preact/signals";
import { buildLanding, markWelcomeSeen, type Landing } from "./lib/landing";

/**
 * Welcome v4 state (canon §4.1 — the flow's landing).
 *
 * The landing model is computed ONCE from the seeded workspace on first
 * render, so the lifecycle (day-one vs re-entry) is captured before the
 * seen-marker is written. Hook-free — module-level signals only.
 */
export const landing: Signal<Landing | null> = signal(null);

let inited = false;

export function initWelcomeV4(): void {
    if (inited) return;
    inited = true;
    landing.value = buildLanding();
    // Mark seen AFTER capturing the lifecycle, so this visit reads
    // day-one and the next reads re-entry.
    markWelcomeSeen();
}

/** @internal test reset. */
export function __resetWelcomeV4ForTests(): void {
    inited = false;
    landing.value = null;
}
