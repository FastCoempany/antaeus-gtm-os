import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { dismissToast, toast } from "../state";

export function Toast(): JSX.Element | null {
    const current = toast.value;
    if (!current) return null;
    return (
        <div
            class={`st-toast st-toast--${current.tone}`}
            role="status"
            aria-live="polite"
        >
            <span class="st-toast__msg">{current.message}</span>
            <button
                type="button"
                class="st-toast__dismiss"
                onClick={() => dismissToast()}
                aria-label={t("Dismiss")}
            >
                ×
            </button>
        </div>
    );
}
