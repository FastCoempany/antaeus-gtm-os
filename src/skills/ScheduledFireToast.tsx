import type { JSX } from "preact";
import { signal, effect, type Signal } from "@preact/signals";
import { dispatchSkill } from "./lib/dispatcher";
import { checkAndAutoNavigate, consumeJustFiredSkillId } from "./lib/auto-navigate";
import { findSkillById } from "./lib/registry";
import { markFireViewed, readNextPendingFire } from "./lib/schedule-storage";
import "./scheduled-fire-toast.css";

/**
 * ScheduledFireToast — Phase E persistent skill-fire surface.
 *
 * Per ADR-012 + 2026-06-01 founder amendment: the toast PERSISTS until
 * the operator explicitly dismisses or acts on it (option C — no
 * auto-dismiss). It surfaces in three cases:
 *
 *   1. ARRIVAL: the operator was just auto-navigated here from a fired
 *      skill (sessionStorage marker, set on the previous page).
 *   2. TOAST-IN-PLACE: a pending fire was found on this load but the
 *      skill had no destination (or operator already on target room).
 *   3. IN-SESSION FIRE: a heartbeat tick fired a skill while the
 *      operator is sitting on this page. Polled (~30s cadence + on
 *      tab-visible) so the operator sees the data without reloading.
 *
 * The toast is CLICKABLE — clicking the body routes to the skill's
 * destination (so "click the firing → see the data" works for the
 * toast-in-place + in-session cases where no auto-nav happened).
 * The × button dismisses without acting on the fire.
 *
 * Hook-free per canon Phase 4 / Room 9 note. Module-level signals.
 */

interface ToastState {
    readonly fireId: string;
    readonly skillId: string;
    readonly label: string;
}

const toastSignal: Signal<ToastState | null> = signal(null);

let bootstrapped = false;
let pollHandle: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = 30_000;

function showToast(fireId: string, skillId: string): void {
    const skill = findSkillById(skillId);
    if (!skill) return;
    // Replace any current toast — newest fire wins. Dismissed fires
    // stay viewed in the DB (so they don't re-pop on reload).
    toastSignal.value = { fireId, skillId, label: skill.label };
}

function dismissToast(): void {
    toastSignal.value = null;
}

/**
 * Operator clicked the toast body — route to the skill's destination
 * if there is one. Dispatch handles the no-data / missing-source path
 * gracefully (its result is ignored here — we always dismiss after
 * the click). The fire is already marked viewed at this point.
 */
function actOnToast(state: ToastState): void {
    const skill = findSkillById(state.skillId);
    dismissToast();
    if (!skill) return;
    void dispatchSkill(skill);
}

async function bootstrap(): Promise<void> {
    if (bootstrapped) return;
    bootstrapped = true;

    // Case 1: ARRIVAL — fast, local, no auth required.
    const arrivedFrom = consumeJustFiredSkillId();
    if (arrivedFrom) {
        // We don't have the fire id at arrival (it was consumed on the
        // previous page's checkAndAutoNavigate), but the toast doesn't
        // need it — clicking re-dispatches the skill which is
        // idempotent (skill is pure navigation).
        showToast("(arrival)", arrivedFrom);
        startInSessionPoll();
        return;
    }

    // Case 2: TOAST-IN-PLACE — checkAndAutoNavigate handles this.
    const result = await checkAndAutoNavigate();
    if (result.kind === "toast-in-place") {
        showToast("(in-place)", result.skillId);
    }

    // Case 3: arm in-session poll for fires that happen WHILE the
    // operator is on this page. Polling beats opening a websocket
    // for a 30-min cron cadence.
    startInSessionPoll();
}

function startInSessionPoll(): void {
    if (pollHandle !== null) return;
    if (typeof window === "undefined") return;
    pollHandle = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        void pollOnce();
    }, POLL_INTERVAL_MS);
}

let lastSurfacedFireId: string | null = null;

async function pollOnce(): Promise<void> {
    try {
        const pending = await readNextPendingFire();
        if (!pending) return;
        if (pending.id === lastSurfacedFireId) return;
        // Mark viewed so a reload doesn't double-surface it; the toast
        // stays visible until the operator clicks or dismisses.
        await markFireViewed(pending.id);
        lastSurfacedFireId = pending.id;
        showToast(pending.id, pending.skillId);
    } catch {
        // Polling failures are non-blocking — next tick retries.
    }
}

effect(() => {
    if (typeof window === "undefined") return;
    void bootstrap();
});

export function ScheduledFireToast(): JSX.Element | null {
    const toast = toastSignal.value;
    if (!toast) return null;
    return (
        <div
            class="ant-scheduled-toast"
            role="status"
            aria-live="polite"
        >
            <div class="ant-scheduled-toast__head">
                <span class="ant-scheduled-toast__kicker">
                    SCHEDULED SKILL · JUST FIRED
                </span>
                <button
                    type="button"
                    class="ant-scheduled-toast__close"
                    onClick={dismissToast}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
            <button
                type="button"
                class="ant-scheduled-toast__body-btn"
                onClick={() => actOnToast(toast)}
                aria-label={`Open ${toast.label}`}
            >
                <span class="ant-scheduled-toast__label">{toast.label}</span>
                <span class="ant-scheduled-toast__arrow" aria-hidden="true">
                    →
                </span>
            </button>
        </div>
    );
}
