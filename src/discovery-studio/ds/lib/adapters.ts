import { effect, signal } from "@preact/signals";
import type { AccentRole } from "@/components";
import {
    callClock,
    focusedAccount,
    nextStepLock,
    type CompressionMode,
    type NextStepLock
} from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Pure adapters — map the Discovery Studio control face onto the design-
 * system the DS surface composes. The 21 primitives, the 9-framework ×
 * 10-segment spine, and the on-call control laws are the unchanged
 * engine; these only translate discrete chrome state into the library's
 * tones + options, and run a hook-free clock tick (canon §4.12 forbids
 * flattening the primitives, so the dense control face is reused, not
 * rebuilt).
 */

export const COMPRESSION_OPTIONS: ReadonlyArray<{
    key: CompressionMode;
    label: string;
}> = [
    { key: "off", label: "Off" },
    { key: "essentials", label: "Essentials" },
    { key: "emergency", label: "Emergency" }
];

export type DocketStatus = "empty" | "partial" | "locked";

export function docketStatus(lock: NextStepLock): DocketStatus {
    const hasAny =
        lock.date || lock.owner || lock.attendees || lock.purpose || lock.reason;
    if (!hasAny) return "empty";
    if (lock.date && lock.owner && lock.purpose) return "locked";
    return "partial";
}

const DOCKET_TONE: Record<DocketStatus, AccentRole | undefined> = {
    empty: undefined,
    partial: "amber",
    locked: "green"
};
export function docketTone(status: DocketStatus): AccentRole | undefined {
    return DOCKET_TONE[status];
}

const DOCKET_LABEL: Record<DocketStatus, string> = {
    empty: "No lock yet",
    partial: "Partial",
    locked: "Locked"
};
export function docketLabel(status: DocketStatus): string {
    return DOCKET_LABEL[status];
}

// ── Hook-free call-clock tick ────────────────────────────────────────
// A module-level signal driven by a @preact/signals effect (not a
// preact hook) that starts a 1s interval only while the clock is live —
// the same "no wasted timers" behaviour as the legacy useEffect, but
// hook-free so the DS surface transforms cleanly under the test plugin.
export const clockNowMs = signal(Date.now());
let clockTimer: ReturnType<typeof setInterval> | null = null;
effect(() => {
    const live = callClock.value !== null;
    if (live && clockTimer === null) {
        clockNowMs.value = Date.now();
        clockTimer = setInterval(() => {
            clockNowMs.value = Date.now();
        }, 1000);
    } else if (!live && clockTimer !== null) {
        clearInterval(clockTimer);
        clockTimer = null;
    }
});

export const TARGET_MINUTES = 30;

export interface ClockRead {
    readonly live: boolean;
    readonly mmss: string;
    readonly over: boolean;
}

export function clockRead(): ClockRead {
    const clock = callClock.value;
    if (!clock) return { live: false, mmss: "00:00", over: false };
    const elapsedSec = Math.max(
        0,
        Math.floor((clockNowMs.value - clock.startedAt) / 1000)
    );
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    return {
        live: true,
        mmss: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        over: minutes >= TARGET_MINUTES
    };
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the call's output lands on the deal, so
 * once an account is in focus the one next move is to push the call into
 * the Deal Workspace. Absent until a focused account arrives.
 */
export function toPulling(): PullingData | undefined {
    const account = focusedAccount.value.trim();
    if (!account) return undefined;
    const lock = nextStepLock.value;
    const locked = Boolean(lock.date && lock.owner && lock.purpose);
    return {
        verb: "Push to the deal",
        object: account,
        href: hrefToDealWorkspace(account),
        reasons: [
            locked
                ? `Next step locked for ${lock.date}.`
                : "Lock the next step before handing off."
        ]
    };
}
