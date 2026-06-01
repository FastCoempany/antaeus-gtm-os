import { createDataClient } from "@/lib/data-client";
import { dispatchSkill } from "./dispatcher";
import { findSkillById } from "./registry";
import { markFireViewed, readNextPendingFire } from "./schedule-storage";

/**
 * Auto-navigate on arrival — Phase E client-side handler.
 *
 * Per ADR-012 (2026-05-31). On app load, check if there's an unviewed
 * scheduled-skill fire for this workspace. If yes:
 *   1. Look up the skill by id
 *   2. Mark the fire viewed (idempotent — even if dispatch fails)
 *   3. Dispatch the skill (navigates the page)
 *   4. The receiving room's chrome can render a toast acknowledging
 *      which skill fired (separate concern — see Phase E toast spec)
 *
 * Returns a result type so callers can branch on success/no-op/error.
 * Errors never throw — the operator's normal app flow continues even
 * if Phase E machinery hits a snag.
 *
 * Skip conditions (no-op return):
 *   - No pending fire
 *   - Pending fire's skill_id doesn't match a current bundled recipe
 *     (recipe was removed; mark viewed, don't navigate)
 *   - User is already on the URL the skill would route to (avoid an
 *     infinite refresh loop)
 */

export type AutoNavigateResult =
    | { readonly kind: "no-pending-fire" }
    | { readonly kind: "skill-not-found"; readonly skillId: string }
    /**
     * Fire consumed, skill exists, but no navigation happened — either
     * the operator is already on the target room, or the skill's
     * dispatch produced no destination (e.g. a filter-and-route skill
     * whose source has no rows). The toast MUST still show in-place so
     * a consumed fire is never silent. The caller (ScheduledFireToast)
     * renders the toast on the current page.
     */
    | { readonly kind: "toast-in-place"; readonly skillId: string }
    | { readonly kind: "navigated"; readonly skillId: string }
    | { readonly kind: "error"; readonly error: string };

const JUST_FIRED_KEY = "gtmos_scheduled_skill_just_fired";

function setJustFiredMarker(skillId: string): void {
    try {
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(JUST_FIRED_KEY, skillId);
        }
    } catch {
        // sessionStorage disabled — toast won't render on arrival, fine.
    }
}

export interface AutoNavigateOptions {
    /** Override window.location.pathname for tests. */
    readonly currentPath?: string;
    /** Override window.location.assign for tests. */
    readonly navigate?: (url: string) => void;
    /**
     * Gate that resolves once the Supabase auth session is restored, so
     * the RLS-gated pending-fire read doesn't fire unauthenticated.
     * Test seam — defaults to polling currentUserId(). Without this,
     * the handler runs at module-import time (top-level effect in
     * ScheduledFireToast), races session restoration, and the query
     * silently returns zero rows — the auto-navigate would work only
     * when auth happened to be ready early.
     */
    readonly waitForAuthReady?: () => Promise<void>;
}

/** Poll currentUserId until a user is present, or give up after a cap. */
async function defaultWaitForAuthReady(): Promise<void> {
    const MAX_ATTEMPTS = 6;
    const DELAY_MS = 700;
    let data: ReturnType<typeof createDataClient>;
    try {
        data = createDataClient();
    } catch {
        return; // env not configured — proceed best-effort
    }
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            const uid = await data.currentUserId();
            if (uid) return;
        } catch {
            // keep polling — session may still be restoring
        }
        await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    // Gave up; proceed best-effort (read may return nothing, which is
    // the same safe no-op as before).
}

export async function checkAndAutoNavigate(
    opts: AutoNavigateOptions = {}
): Promise<AutoNavigateResult> {
    try {
        // Wait for auth before the RLS-gated read (see option docstring).
        await (opts.waitForAuthReady ?? defaultWaitForAuthReady)();

        const pending = await readNextPendingFire();
        if (!pending) return { kind: "no-pending-fire" };

        const skill = findSkillById(pending.skillId);
        if (!skill) {
            // Mark viewed so we don't re-attempt on every load.
            await markFireViewed(pending.id);
            return { kind: "skill-not-found", skillId: pending.skillId };
        }

        const currentPath =
            opts.currentPath ??
            (typeof window !== "undefined"
                ? window.location.pathname
                : "/");

        // Consume the fire exactly once, regardless of outcome below —
        // this prevents an infinite retry loop AND guarantees we always
        // pair consumption with a visible toast (no silent consumption).
        await markFireViewed(pending.id);

        // If the operator is already on the target room, don't re-route;
        // show the toast in-place instead.
        const targetPath = extractTargetPath(skill.action);
        if (targetPath && currentPath.startsWith(targetPath)) {
            return { kind: "toast-in-place", skillId: pending.skillId };
        }

        // Set the arrival marker first so a successful navigation
        // surfaces the toast on the destination page.
        setJustFiredMarker(pending.skillId);
        const result = await dispatchSkill(skill, {
            navigate: opts.navigate
        });
        if (result.kind === "navigated") {
            return { kind: "navigated", skillId: pending.skillId };
        }
        // Dispatch produced no destination (e.g. filter-and-route with
        // an empty source). We're still on the current page — clear the
        // arrival marker (it was for a navigation that didn't happen)
        // and show the toast in-place so the fire isn't consumed
        // silently.
        consumeJustFiredSkillId();
        return { kind: "toast-in-place", skillId: pending.skillId };
    } catch (err) {
        return {
            kind: "error",
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

function extractTargetPath(action: { kind: string; target?: string }): string | null {
    if (typeof action.target === "string") {
        // Strip query string so /dashboard/?foo=bar matches /dashboard/.
        const q = action.target.indexOf("?");
        return q >= 0 ? action.target.slice(0, q) : action.target;
    }
    return null;
}

/**
 * Read the most-recently-fired skill id from session storage. Used by
 * the destination room's chrome to render a one-shot toast. Returns
 * the id once and clears it (so the toast doesn't render twice).
 */
export function consumeJustFiredSkillId(): string | null {
    try {
        if (typeof sessionStorage === "undefined") return null;
        const id = sessionStorage.getItem(JUST_FIRED_KEY);
        if (id) {
            sessionStorage.removeItem(JUST_FIRED_KEY);
        }
        return id;
    } catch {
        return null;
    }
}
