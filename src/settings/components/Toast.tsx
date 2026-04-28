import type { JSX } from "preact";
import { dismissToast, toast } from "../state";

export function Toast(): JSX.Element | null {
    const t = toast.value;
    if (!t) return null;
    return (
        <div
            class={`st-toast st-toast--${t.tone}`}
            role="status"
            aria-live="polite"
        >
            <span class="st-toast__msg">{t.message}</span>
            <button
                type="button"
                class="st-toast__dismiss"
                onClick={() => dismissToast()}
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}
