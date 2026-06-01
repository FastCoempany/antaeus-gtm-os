import type { JSX } from "preact";
import { signal, effect, type Signal } from "@preact/signals";
import { checkAndAutoNavigate, consumeJustFiredSkillId } from "./lib/auto-navigate";
import { findSkillById } from "./lib/registry";
import "./scheduled-fire-toast.css";

/**
 * ScheduledFireToast — Phase E destination-room toast (ADR-012).
 *
 * Renders ONCE per app load when the operator just arrived via an
 * auto-navigate from a fired schedule. The toast names the skill
 * that fired and auto-dismisses after a few seconds.
 *
 * Two responsibilities:
 *   1. Run the auto-navigate check on first mount (kicks the
 *      checkAndAutoNavigate handler from auto-navigate.ts). If a
 *      pending fire exists and routes elsewhere, the browser
 *      navigates away — this component never renders.
 *   2. Read the just-fired marker from session storage. If set, the
 *      operator is arriving from a fired skill — render the toast.
 *
 * Hook-free per the canon Phase 4 / Room 9 note. Module-level signal
 * for the toast state.
 */

const toastSignal: Signal<{ id: string; label: string } | null> = signal(null);

let bootstrapped = false;

function showToast(skillId: string): void {
    const skill = findSkillById(skillId);
    if (!skill) return;
    toastSignal.value = { id: skillId, label: skill.label };
    // Auto-dismiss after 6 seconds.
    setTimeout(() => {
        toastSignal.value = null;
    }, 6000);
}

async function bootstrap(): Promise<void> {
    if (bootstrapped) return;
    bootstrapped = true;

    // Step 1 (fast, local, no auth): did we just arrive here from a
    // navigation triggered by a fired skill? The marker is set by the
    // PREVIOUS page before it navigated. Reading it first means the
    // arrival toast doesn't wait on the auth-gated pending-fire check.
    const arrivedFrom = consumeJustFiredSkillId();
    if (arrivedFrom) {
        showToast(arrivedFrom);
        return;
    }

    // Step 2 (auth-gated): is there a pending fire to act on this load?
    // checkAndAutoNavigate either navigates (toast shows on arrival via
    // the marker) or returns toast-in-place when no navigation happened
    // (already-on-target, or the skill had no destination). Either way
    // a consumed fire always surfaces a toast — never silent.
    const result = await checkAndAutoNavigate();
    if (result.kind === "toast-in-place") {
        showToast(result.skillId);
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
        <div class="ant-scheduled-toast" role="status" aria-live="polite">
            <div class="ant-scheduled-toast__head">
                <span class="ant-scheduled-toast__kicker">
                    SCHEDULED SKILL · JUST FIRED
                </span>
                <button
                    type="button"
                    class="ant-scheduled-toast__close"
                    onClick={() => (toastSignal.value = null)}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
            <p class="ant-scheduled-toast__body">{toast.label}</p>
        </div>
    );
}
