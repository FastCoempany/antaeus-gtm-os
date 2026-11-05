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
 * BirdseyeFloat — a compact current-analysis surface mounted across rooms.
 * It shows the current highest-priority recommended action and the reason
 * it is ranked first. The product name can remain; the explanatory copy
 * should not rely on `system read` or heartbeat metaphors.
 */

const openSignal: Signal<boolean> = signal(false);
const moveSignal: Signal<NextMove | null> = signal(null);
const otherRoomFlagSignal: Signal<boolean> = signal(false);
const loadingSignal: Signal<boolean> = signal(true);
const errorSignal: Signal<string | null> = signal(null);

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

effect(() => {
    if (prefetched) return;
    if (typeof window === "undefined") return;
    prefetched = true;
    void refresh();
});

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
                aria-label={open ? "Close current analysis" : "Open current analysis"}
                aria-expanded={open}
                onClick={() => {
                    if (openSignal.value) closeBirdseye();
                    else openBirdseye();
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
            aria-label="Current analysis"
        >
            <header class="ant-birdseye__head">
                <p class="ant-birdseye__kicker">BIRDSEYE · CURRENT ANALYSIS</p>
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
                <p class="ant-birdseye__empty">Updating analysis…</p>
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
                    No higher-priority recommended action is available right now. Check again after account, deal, or activity data changes.
                </p>
            )}
        </div>
    );
}
