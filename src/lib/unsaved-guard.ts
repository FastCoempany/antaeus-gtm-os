import { effect, type Signal } from "@preact/signals";

/**
 * Unsaved-changes guard for new-stack rooms.
 *
 * Per ADR-003 §5.5.1 / Phase 5 pre-beta hygiene. The legacy
 * `js/unsaved-guard.js` doesn't transfer 1:1 to the new stack —
 * the equivalent is a signal-driven dirty-state subscription +
 * `beforeunload` handler that fires when a room's draft has
 * uncommitted changes.
 *
 * Usage (per room):
 *
 *     // dirty signal — return true when the form has unsaved
 *     // changes the operator hasn't committed.
 *     const dirty = computed(() => {
 *         const d = draft.value;
 *         return d.account.length > 0 || d.notes.length > 0;
 *     });
 *
 *     // Wire once during room boot. Returns a stop() handle for
 *     // tests + SPA-style cleanup.
 *     const stop = startUnsavedGuard(dirty, "Negotiation");
 *
 * The guard fires the browser's stock confirm dialog ("Leave site?
 * Changes you made may not be saved") via `beforeunload`. It does
 * NOT show an in-app modal — that's deliberate per canon Part III
 * §3 Rule 7 (escalation reserved for real risk; nav-away is the
 * browser's job to confirm).
 */

interface GuardOptions {
    /** Test injection — override the default beforeunload binding. */
    readonly bindTo?: Pick<Window, "addEventListener" | "removeEventListener">;
}

export function startUnsavedGuard(
    dirty: Signal<boolean> | { readonly value: boolean },
    roomLabel: string,
    options: GuardOptions = {}
): () => void {
    const target =
        options.bindTo ??
        (typeof window !== "undefined" ? window : null);
    if (!target) return () => {};

    function handler(event: Event): string | undefined {
        if (!dirty.value) return undefined;
        // Standard beforeunload pattern: setting returnValue + returning
        // a string both trigger the browser's stock confirm. Modern
        // browsers ignore custom messages (privacy hardening) but the
        // confirm itself still appears.
        const message = `${roomLabel}: unsaved changes will be lost.`;
        (event as BeforeUnloadEvent).returnValue = message;
        return message;
    }

    // Subscribe to the dirty signal's lifecycle so the listener is only
    // bound while the room actually has unsaved state. This keeps us
    // out of the browser's "this site is asking" warning when there's
    // nothing to protect.
    let bound = false;
    const dispose = effect(() => {
        const isDirty = dirty.value;
        if (isDirty && !bound) {
            target.addEventListener("beforeunload", handler);
            bound = true;
        } else if (!isDirty && bound) {
            target.removeEventListener("beforeunload", handler);
            bound = false;
        }
    });

    return () => {
        dispose();
        if (bound) {
            target.removeEventListener("beforeunload", handler);
            bound = false;
        }
    };
}
