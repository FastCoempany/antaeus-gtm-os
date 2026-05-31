import type { JSX } from "preact";
import { signal, effect, type Signal } from "@preact/signals";
import { rankNextMove, shouldFlagOtherRoom } from "./lib/ranker";
import type { NextMove } from "./lib/types";
import {
    loadDealsForRanking,
    loadHotAccountsForRanking,
    loadObservationsForRanking
} from "./lib/context";
import "./birdseye-float.css";

/**
 * BirdseyeFloat — Phase D's surface (ADR-011, 2026-05-31).
 *
 * Floating element anchored bottom-right of every room. Mounted via
 * RoomChrome alongside PaletteTrigger. Default state is a small eye
 * icon with an optional flag dot when there's a higher-priority
 * NextMove than the room the operator is currently on. Click expands
 * to a ~280px drawer showing one ranked line.
 *
 * Hook-free per the canon Phase 4 / Room 9 note (preact:
 * transform-hook-names plugin chokes on typed hooks). Module-level
 * signals + `effect()` for the prefetch-on-mount side effect.
 */

// ─── Module-scoped state ──────────────────────────────────────────────

const openSignal: Signal<boolean> = signal(false);
const moveSignal: Signal<NextMove | null> = signal(null);
const otherRoomFlagSignal: Signal<boolean> = signal(false);
const loadingSignal: Signal<boolean> = signal(true);
const errorSignal: Signal<string | null> = signal(null);

// One-time prefetch on first BirdseyeFloat mount. Guards against
// duplicate fetches if RoomChrome re-mounts during navigation.
let prefetched = false;

function currentRoomHref(): string {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
}

async function refresh(): Promise<void> {
    loadingSignal.value = true;
    errorSignal.value = null;
    try {
        const [observations, deals, hotAccounts] = await Promise.all([
            loadObservationsForRanking(),
            Promise.resolve(loadDealsForRanking()),
            Promise.resolve(loadHotAccountsForRanking())
        ]);
        const room = currentRoomHref();
        const result = rankNextMove({
            observations,
            deals,
            hotAccounts,
            currentRoomHref: room
        });
        moveSignal.value = result.ok ? result.move : null;
        otherRoomFlagSignal.value = shouldFlagOtherRoom({
            observations,
            deals,
            hotAccounts,
            currentRoomHref: room
        });
    } catch (err) {
        errorSignal.value =
            err instanceof Error ? err.message : "Couldn't refresh.";
    } finally {
        loadingSignal.value = false;
    }
}

export function openBirdseye(): void {
    openSignal.value = true;
    void refresh();
}

export function closeBirdseye(): void {
    openSignal.value = false;
}

// Module-scoped effect: kick off the initial fetch once the file is
// loaded (matches Palette.tsx's hook-free side-effect pattern).
effect(() => {
    if (prefetched) return;
    if (typeof window === "undefined") return;
    prefetched = true;
    void refresh();
});

// ─── Render ───────────────────────────────────────────────────────────

export function BirdseyeFloat(): JSX.Element {
    const open = openSignal.value;
    const move = moveSignal.value;
    const flag = otherRoomFlagSignal.value;
    const loading = loadingSignal.value;
    const error = errorSignal.value;

    return (
        <div class="ant-birdseye">
            {open ? (
                <BirdseyeDrawer
                    move={move}
                    loading={loading}
                    error={error}
                />
            ) : null}
            <button
                type="button"
                class={`ant-birdseye__icon${flag ? " has-flag" : ""}${open ? " is-open" : ""}`}
                aria-label={
                    open ? "Close the system's read" : "Open the system's read"
                }
                aria-expanded={open}
                onClick={() => {
                    if (openSignal.value) {
                        closeBirdseye();
                    } else {
                        openBirdseye();
                    }
                }}
            >
                <span class="ant-birdseye__eye" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.6" fill="none">
                        <path d="M2 12 C 5 6 9 4 12 4 C 15 4 19 6 22 12 C 19 18 15 20 12 20 C 9 20 5 18 2 12 Z" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                </span>
                {flag && !open ? <span class="ant-birdseye__flag" aria-hidden="true" /> : null}
            </button>
        </div>
    );
}

interface BirdseyeDrawerProps {
    readonly move: NextMove | null;
    readonly loading: boolean;
    readonly error: string | null;
}

function BirdseyeDrawer(props: BirdseyeDrawerProps): JSX.Element {
    const { move, loading, error } = props;
    return (
        <div
            class="ant-birdseye__drawer"
            role="dialog"
            aria-modal="false"
            aria-label="The system's current read"
        >
            <header class="ant-birdseye__head">
                <p class="ant-birdseye__kicker">BIRDSEYE</p>
                <button
                    type="button"
                    class="ant-birdseye__close"
                    onClick={closeBirdseye}
                    aria-label="Close"
                >
                    ×
                </button>
            </header>
            {error ? (
                <p class="ant-birdseye__error" role="alert">
                    {error}
                </p>
            ) : loading && !move ? (
                <p class="ant-birdseye__empty">Looking…</p>
            ) : move ? (
                <div class="ant-birdseye__move">
                    <p class="ant-birdseye__label">{move.label}</p>
                    <p class="ant-birdseye__reason">{move.reason}</p>
                    <a class="ant-birdseye__cta" href={move.targetUrl}>
                        Open →
                    </a>
                </div>
            ) : (
                <p class="ant-birdseye__empty">
                    Nothing pressing right now. Check back after the next
                    heartbeat tick.
                </p>
            )}
        </div>
    );
}
