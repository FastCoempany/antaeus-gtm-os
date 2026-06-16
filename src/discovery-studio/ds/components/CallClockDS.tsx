import type { JSX } from "preact";
import { Button, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { startCallClock, stopCallClock } from "../../state";
import { TARGET_MINUTES, clockRead } from "../lib/adapters";

/**
 * CallClockDS — the visible call clock (canon §4.12 on-call control
 * law) on the library. Hook-free: the 1-second tick is a module-level
 * @preact/signals effect in adapters.ts, not a preact hook. Idle → a
 * "Start call" Button; live → the MM:SS elapsed (amber chip past the
 * 30-minute target) + a Stop Button. The clock anchors pacing without
 * forcing it.
 */
export function CallClockDS(): JSX.Element {
    const read = clockRead();

    if (!read.live) {
        return (
            <div class="dsd-clock dsd-clock--idle">
                <Button variant="secondary" onClick={startCallClock}>
                    {t("Start call")}
                </Button>
                <span class="dsd-clock__hint">{`${TARGET_MINUTES}-min target`}</span>
            </div>
        );
    }

    return (
        <div class="dsd-clock dsd-clock--live">
            <span class="dsd-clock__kicker">{t("CALL CLOCK")}</span>
            <span class={`dsd-clock__time${read.over ? " is-over" : ""}`}>
                {read.mmss}
            </span>
            <span class="dsd-clock__hint">{`/ ${TARGET_MINUTES}:00`}</span>
            {read.over ? <StatusChip label={t("Over target")} tone="amber" /> : null}
            <Button variant="ghost" onClick={stopCallClock}>
                {t("Stop")}
            </Button>
        </div>
    );
}
