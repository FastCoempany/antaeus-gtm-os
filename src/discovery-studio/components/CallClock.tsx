import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { callClock, startCallClock, stopCallClock } from "../state";

/**
 * CallClock — Wave 5.
 *
 * The visible call clock per the Lumana on-call control lock guardian
 * spec. Two states:
 *   - clock not started → "Start call" button
 *   - clock running     → live MM:SS elapsed display + "Stop" button
 *
 * The 30-minute reference is shown subtly to anchor pacing without
 * forcing it. When elapsed exceeds 30 min, the display turns amber as
 * a passive nudge; doesn't block continued use.
 *
 * The component owns its own ticking state via useState/useEffect —
 * a lightweight 1-second interval that runs only while the clock is
 * active (no wasted timers on the empty state).
 */
const TARGET_MINUTES = 30;

export function CallClock(): JSX.Element {
    const clock = callClock.value;
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!clock) return undefined;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [clock]);

    if (!clock) {
        return (
            <div class="ds-call-clock ds-call-clock--idle">
                <button
                    type="button"
                    class="ds-call-clock__start"
                    onClick={startCallClock}
                >
                    Start call
                </button>
                <span class="ds-call-clock__hint">
                    {TARGET_MINUTES}-min target
                </span>
            </div>
        );
    }

    const elapsedSec = Math.max(
        0,
        Math.floor((now - clock.startedAt) / 1000)
    );
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    const isOver = minutes >= TARGET_MINUTES;

    return (
        <div
            class={`ds-call-clock${
                isOver ? " ds-call-clock--over" : " ds-call-clock--running"
            }`}
        >
            <span class="ds-call-clock__label">{t("Call clock")}</span>
            <span class="ds-call-clock__time">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
            </span>
            <span class="ds-call-clock__hint">
                / {TARGET_MINUTES}:00 target
            </span>
            <button
                type="button"
                class="ds-call-clock__stop"
                onClick={stopCallClock}
            >
                Stop
            </button>
        </div>
    );
}
