import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Card, IconButton, SegmentedControl } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { reportError } from "@/lib/observability";
import { showsAnnotations } from "@/lib/density";
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
} from "../../lib/week-reads-filter";

/**
 * WeekReads — Phase B's workspace-scope observations (ADR-009),
 * composed from the design-system library: a Grounded Card carrying the
 * observation glyph, a SegmentedControl for the 14/7 display filter, and
 * each read dismissable via an IconButton. The today-surface counterpart
 * to the legacy `db-week-reads` card — same reader, library shell.
 *
 * State lives in module-level signals (not preact/hooks): the design-
 * system-composed files avoid the hook-name transform, matching the
 * Wayfinder pattern. Reads the observations ledger, filters by the
 * operator's 14/7 toggle (a display filter, not a generator threshold),
 * drops rows shadowed by active Briefing Patterns (no-op until Patterns
 * ship). Empty is directional, never blank (canon Part II §6).
 */

const observationsSignal: Signal<ReadonlyArray<ObservationView>> = signal([]);
const loadingSignal: Signal<boolean> = signal(true);
const errorSignal: Signal<string | null> = signal(null);
const busyIdSignal: Signal<string | null> = signal(null);
const thresholdSignal: Signal<DecayThresholdDays> = signal(loadStoredThreshold());
const patternIndexSignal: Signal<BriefingPatternIndex> = signal(
    EMPTY_BRIEFING_PATTERN_INDEX
);

let started = false;

async function refresh(): Promise<void> {
    loadingSignal.value = true;
    errorSignal.value = null;
    try {
        observationsSignal.value = await listObservations({ limit: 40 });
    } catch (err) {
        // Never surface the raw error to the operator (it leaks internal
        // architecture language — e.g. a Supabase-config message — which
        // canon §10 forbids in the UI). Log it, show a calm read.
        reportError(err, { surface: "dashboard-week-reads" });
        errorSignal.value = t("Couldn't load this week's reads.", {
            class: "body"
        });
    } finally {
        loadingSignal.value = false;
    }
}

type ThresholdKey = "14" | "7";

function pickThreshold(key: ThresholdKey): void {
    const days: DecayThresholdDays = key === "7" ? 7 : 14;
    thresholdSignal.value = days;
    saveStoredThreshold(days);
}

async function handleDismiss(id: string): Promise<void> {
    busyIdSignal.value = id;
    try {
        await dismissObservation(id, "operator dismissed");
        await refresh();
    } finally {
        busyIdSignal.value = null;
    }
}

export function WeekReads(): JSX.Element {
    // First render fires the one-shot ledger load (idempotent across
    // re-mounts — the signals carry the cached result).
    if (!started) {
        started = true;
        void refresh();
    }

    const threshold = thresholdSignal.value;
    const all = observationsSignal.value;
    const undeduped = filterShadowedByBriefing(all, patternIndexSignal.value);
    const visible = filterByDecayThreshold(undeduped, threshold);
    const loading = loadingSignal.value;
    const error = errorSignal.value;
    const busyId = busyIdSignal.value;

    return (
        <Card kicker={t("THIS WEEK'S READS")} icon="observation" tone="blue">
            <div class="dbt-reads__head">
                {showsAnnotations() ? (
                    <p class="dbt-reads__sub">
                        {t("What the system noticed about your work", {
                            class: "body"
                        })}
                    </p>
                ) : null}
                <SegmentedControl<ThresholdKey>
                    label={t("Decay threshold")}
                    active={threshold === 7 ? "7" : "14"}
                    onChange={pickThreshold}
                    options={[
                        { key: "14", label: t("14d") },
                        { key: "7", label: t("7d") }
                    ]}
                />
            </div>

            {error ? (
                <p class="dbt-reads__error" role="alert">
                    {error}
                </p>
            ) : loading && visible.length === 0 ? (
                <p class="dbt-reads__empty">{t("Loading…")}</p>
            ) : visible.length === 0 ? (
                <p class="dbt-reads__empty">
                    {t("No reads above the {days}-day threshold right now.", {
                        class: "body"
                    }).replace("{days}", String(threshold))}
                    {threshold === 14
                        ? " " + t("Try 7d for thinner signals.", { class: "body" })
                        : ""}
                </p>
            ) : (
                <ul class="dbt-reads__list">
                    {visible.map((o) => (
                        <li class="dbt-reads__row" key={o.id}>
                            <span class="dbt-reads__mark">
                                <Icon name="observation" size={16} />
                            </span>
                            <p class="dbt-reads__text">{o.observationText}</p>
                            <IconButton
                                icon="dismiss"
                                label={t("Dismiss this read")}
                                onClick={() => void handleDismiss(o.id)}
                                disabled={busyId === o.id}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
