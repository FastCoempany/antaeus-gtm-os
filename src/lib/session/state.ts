/**
 * Phase A orchestration layer (ADR-004) — session state.
 *
 * Preact-signals wrapper around the workspace session. Exposes:
 *   - `session` — live signal of the current session (null until loaded)
 *   - `focusedObject` — computed projection of the focused object
 *   - `isSessionLoaded` — boolean signal, flips once after first load
 *
 * Mutation API lives in `helpers.ts`. This file owns the signal layer
 * + the Realtime subscription that keeps cross-tab consistency.
 *
 * Phase A doesn't auto-mount this into any room. Rooms wire it up
 * progressively in Phase D (birdseye strip) and beyond.
 */

import { computed, signal, type Signal } from "@preact/signals";
import type { WorkspaceSessionView, FocusedObject } from "./types";
import { pickFocusedObject } from "./types";

// ─── Source signals ───────────────────────────────────────────────

/**
 * The current workspace session. `null` until the first load completes
 * or if no session exists yet for this workspace (the helper layer
 * upserts a fresh row on demand).
 */
export const session: Signal<WorkspaceSessionView | null> = signal(null);

/** Flips to `true` after `bootSession()` resolves once. */
export const isSessionLoaded: Signal<boolean> = signal(false);

/**
 * The currently focused object — null when nothing is focused, or when
 * the session hasn't loaded yet, or when the session has incomplete
 * focus fields. Rooms read this; the birdseye strip reads this.
 */
export const focusedObject = computed<FocusedObject | null>(() =>
    pickFocusedObject(session.value)
);

// ─── Test-only seeds ──────────────────────────────────────────────

export function __setSessionForTests(next: WorkspaceSessionView | null): void {
    session.value = next;
    isSessionLoaded.value = next !== null;
}

export function __resetSessionForTests(): void {
    session.value = null;
    isSessionLoaded.value = false;
}
