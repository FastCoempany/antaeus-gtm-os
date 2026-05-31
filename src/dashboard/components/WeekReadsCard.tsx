import { signal, type Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import { listObservations, dismissObservation } from "@/lib/observations/reader";
import {
    EMPTY_BRIEFING_PATTERN_INDEX,
    filterShadowedByBriefing,
    type BriefingPatternIndex
} from "@/lib/observations/briefing-dedupe";
import type { ObservationView } from "@/lib/observations/types";
import {
    filterByDecayThreshold,
    loadStoredThreshold,
    saveStoredThreshold,
    type DecayThresholdDays
} from "../lib/week-reads-filter";

/**
 * WeekReadsCard — Phase B's surface for workspace-scope observations.
 *
 * Per ADR-009 (2026-05-31). Reads the `observations` ledger via the
 * existing reader, filters by the operator's 14/7 toggle (deal_decay-
 * specific display filter, not generator threshold), filters out
 * rows shadowed by active Briefing Patterns (no-op today; lights up
 * when Patterns ship), and renders the result as a dismissable list.
 *
 * Surface posture: subtle but legible. The card mounts above the
 * main Dashboard rail (MainColumn + SliceRail) — same width as the
 * grid below it. When there are no rows, the card renders the
 * empty-state copy + the toggle (so the operator can switch to 7d
 * to see thinner signals).
 */

// Module-local signal so the card re-renders when state changes
// without re-fetching on every re-mount.
const observationsSignal: Signal<ReadonlyArray<ObservationView>> = signal([]);
const loadingSignal: Signal<boolean> = signal(true);
const errorSignal: Signal<string | null> = signal(null);

// Pattern index is empty today; reserved for when Briefing B.X+ ships
// an active-patterns reader.
const patternIndexSignal: Signal<BriefingPatternIndex> = signal(
    EMPTY_BRIEFING_PATTERN_INDEX
);

async function refresh(): Promise<void> {
    loadingSignal.value = true;
    errorSignal.value = null;
    try {
        const rows = await listObservations({ limit: 40 });
        observationsSignal.value = rows;
    } catch (err) {
        errorSignal.value =
            err instanceof Error
                ? err.message
                : "Couldn't load this week's reads.";
    } finally {
        loadingSignal.value = false;
    }
}

export function WeekReadsCard(): JSX.Element {
    // Lazy init from localStorage so the toggle renders with the
    // operator's stored choice on first paint (no 14d→7d flicker if
    // they previously picked 7d). DEFAULT_DECAY_THRESHOLD is the
    // fallback when storage is empty or unavailable.
    const [threshold, setThreshold] = useState<DecayThresholdDays>(
        () => loadStoredThreshold()
    );
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        void refresh();
    }, []);

    function pickThreshold(t: DecayThresholdDays): void {
        setThreshold(t);
        saveStoredThreshold(t);
    }

    async function handleDismiss(id: string): Promise<void> {
        setBusyId(id);
        try {
            await dismissObservation(id, "operator dismissed");
            await refresh();
        } finally {
            setBusyId(null);
        }
    }

    const all = observationsSignal.value;
    const undeduped = filterShadowedByBriefing(all, patternIndexSignal.value);
    const visible = filterByDecayThreshold(undeduped, threshold);

    return (
        <section class="db-week-reads" aria-label="This week's reads">
            <header class="db-week-reads__head">
                <p class="db-week-reads__kicker">THIS WEEK'S READS</p>
                <h2 class="db-week-reads__title">
                    What the system noticed about your work
                </h2>
                <div class="db-week-reads__toggle" role="group" aria-label="Decay threshold">
                    <button
                        type="button"
                        class={`db-week-reads__pill${threshold === 14 ? " is-active" : ""}`}
                        onClick={() => pickThreshold(14)}
                        aria-pressed={threshold === 14}
                    >
                        14d
                    </button>
                    <button
                        type="button"
                        class={`db-week-reads__pill${threshold === 7 ? " is-active" : ""}`}
                        onClick={() => pickThreshold(7)}
                        aria-pressed={threshold === 7}
                    >
                        7d
                    </button>
                </div>
            </header>

            {errorSignal.value && (
                <div class="db-week-reads__error" role="alert">
                    {errorSignal.value}
                </div>
            )}

            {loadingSignal.value && visible.length === 0 ? (
                <p class="db-week-reads__empty">Loading…</p>
            ) : visible.length === 0 ? (
                <p class="db-week-reads__empty">
                    No reads above the {threshold}-day threshold right now.
                    {threshold === 14 ? " Try 7d for thinner signals." : ""}
                </p>
            ) : (
                <ul class="db-week-reads__list">
                    {visible.map((o) => (
                        <li class="db-week-reads__row" key={o.id}>
                            <p class="db-week-reads__text">
                                {o.observationText}
                            </p>
                            <button
                                type="button"
                                class="db-week-reads__dismiss"
                                onClick={() => void handleDismiss(o.id)}
                                disabled={busyId === o.id}
                                aria-label="Dismiss this read"
                            >
                                {busyId === o.id ? "…" : "Dismiss"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
