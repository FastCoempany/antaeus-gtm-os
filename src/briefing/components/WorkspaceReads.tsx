import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { signal, type Signal } from "@preact/signals";
import {
    dismissObservation,
    listObservations
} from "@/lib/observations/reader";
import {
    EMPTY_BRIEFING_PATTERN_INDEX,
    filterShadowedByBriefing,
    type BriefingPatternIndex
} from "@/lib/observations/briefing-dedupe";
import type { ObservationView } from "@/lib/observations/types";
import { buildObservationHref } from "../lib/observation-routing";

/**
 * WorkspaceReads — the Briefing room's view of workspace-scope
 * observations (per ADR-014).
 *
 * Reads from the same `observations` ledger the Dashboard
 * WeekReadsCard reads from (ADR-009 stream). Renders observations
 * grouped by their source generator (deal_decay, signal_decay,
 * proof_staleness, discovery_rhythm) so the operator can scan by
 * type. Each row is dismissable.
 *
 * This is the daily-fresh side of the room: workspace observations
 * fire on every 30-min heartbeat tick, so what the operator sees here
 * may be different at 9am than at 3pm. Inverse of the World view,
 * which holds steady week-to-week.
 *
 * Hook-free per canon Phase 4 / Room 9 — module-level signals.
 */

const observationsSignal: Signal<ReadonlyArray<ObservationView>> = signal([]);
const loadedSignal: Signal<boolean> = signal(false);
const errorSignal: Signal<string | null> = signal(null);
const dismissingSignal: Signal<string | null> = signal(null);
const patternIndexSignal: Signal<BriefingPatternIndex> = signal(
    EMPTY_BRIEFING_PATTERN_INDEX
);

async function refresh(): Promise<void> {
    try {
        const rows = await listObservations({ limit: 60 });
        observationsSignal.value = rows;
        errorSignal.value = null;
    } catch (err) {
        errorSignal.value =
            err instanceof Error
                ? err.message
                : "Couldn't load your workspace reads.";
    } finally {
        loadedSignal.value = true;
    }
}

async function onDismiss(id: string): Promise<void> {
    dismissingSignal.value = id;
    try {
        await dismissObservation(id, "operator dismissed");
        await refresh();
    } finally {
        dismissingSignal.value = null;
    }
}

interface GroupView {
    readonly key: string;
    readonly label: string;
    readonly rows: ReadonlyArray<ObservationView>;
}

const GENERATOR_LABELS: Record<string, string> = {
    deal_decay: "Deals going stale",
    signal_decay: "Accounts going quiet",
    proof_staleness: "Evidence past its readout",
    discovery_rhythm: "Discovery rhythm"
};

function generatorLabel(key: string): string {
    return GENERATOR_LABELS[key] ?? key.replace(/_/g, " ");
}

function groupByGenerator(
    rows: ReadonlyArray<ObservationView>
): ReadonlyArray<GroupView> {
    const byKey = new Map<string, ObservationView[]>();
    for (const row of rows) {
        const list = byKey.get(row.sourceGenerator) ?? [];
        list.push(row);
        byKey.set(row.sourceGenerator, list);
    }
    return Array.from(byKey.entries()).map(([key, list]) => ({
        key,
        label: generatorLabel(key),
        rows: list
    }));
}

function shortDate(iso: string): string {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
        });
    } catch {
        return iso;
    }
}

export function WorkspaceReads(): JSX.Element {
    // First render kicks off the load. Subsequent renders read the signal.
    if (!loadedSignal.value && !errorSignal.value) {
        void refresh();
    }
    const all = observationsSignal.value;
    const undeduped = filterShadowedByBriefing(all, patternIndexSignal.value);
    const groups = groupByGenerator(undeduped);
    const error = errorSignal.value;

    if (error) {
        return (
            <section
                class="bf-workspace bf-workspace--error"
                aria-label={t("Workspace reads")}
            >
                <p class="bf-workspace__kicker">{t("WORKSPACE")}</p>
                <p class="bf-workspace__error" role="alert">
                    {error}
                </p>
            </section>
        );
    }

    if (!loadedSignal.value) {
        return (
            <section
                class="bf-workspace bf-workspace--loading"
                aria-busy="true"
                aria-label={t("Workspace reads")}
            >
                <p class="bf-workspace__kicker">{t("WORKSPACE")}</p>
                <p class="bf-workspace__loading">{t("Reading your work…")}</p>
            </section>
        );
    }

    if (undeduped.length === 0) {
        return (
            <section class="bf-workspace bf-workspace--empty" aria-label={t("Workspace reads")}>
                <p class="bf-workspace__kicker">{t("WORKSPACE · NOTHING TO SURFACE")}</p>
                <h2 class="bf-workspace__empty-headline">
                    The system has nothing to flag in your work right now.
                </h2>
                <p class="bf-workspace__empty-body">
                    Workspace reads fire on the heartbeat — every 30 minutes
                    against your deals, signals, proofs, and discovery
                    cadence. When something starts decaying, it will show
                    up here.
                </p>
            </section>
        );
    }

    return (
        <section class="bf-workspace" aria-label={t("Workspace reads")}>
            <header class="bf-workspace__head">
                <p class="bf-workspace__kicker">{t("YOUR WORK · THIS WEEK")}</p>
                <p class="bf-workspace__count">
                    {undeduped.length} read{undeduped.length === 1 ? "" : "s"}{" "}
                    surfaced
                </p>
            </header>
            {groups.map((g) => (
                <div class="bf-workspace__group" key={g.key}>
                    <p class="bf-workspace__group-label">
                        {g.label}
                        <span class="bf-workspace__group-count">
                            {g.rows.length}
                        </span>
                    </p>
                    <ul class="bf-workspace__list">
                        {g.rows.map((row) => {
                            const route = buildObservationHref(row);
                            return (
                                <li class="bf-workspace__row" key={row.id}>
                                    {route ? (
                                        <a
                                            class="bf-workspace__row-link"
                                            href={route.href}
                                        >
                                            <span class="bf-workspace__row-text">
                                                {row.observationText}
                                            </span>
                                            <span
                                                class="bf-workspace__row-go"
                                                aria-hidden="true"
                                            >
                                                Open in {route.roomLabel} →
                                            </span>
                                        </a>
                                    ) : (
                                        <p class="bf-workspace__row-text">
                                            {row.observationText}
                                        </p>
                                    )}
                                    <div class="bf-workspace__row-meta">
                                        <span class="bf-workspace__row-when">
                                            {shortDate(row.writtenAt)}
                                        </span>
                                        <button
                                            type="button"
                                            class="bf-workspace__row-dismiss"
                                            onClick={() => void onDismiss(row.id)}
                                            disabled={
                                                dismissingSignal.value === row.id
                                            }
                                            aria-label={t("Dismiss this read")}
                                        >
                                            {dismissingSignal.value === row.id
                                                ? "…"
                                                : "Dismiss"}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </section>
    );
}

/** @internal — reset module state between tests. */
export function __resetWorkspaceReadsForTests(): void {
    observationsSignal.value = [];
    loadedSignal.value = false;
    errorSignal.value = null;
    dismissingSignal.value = null;
    patternIndexSignal.value = EMPTY_BRIEFING_PATTERN_INDEX;
}

/** @internal — seed observations for tests without hitting Supabase. */
export function __seedWorkspaceReadsForTests(
    rows: ReadonlyArray<ObservationView>
): void {
    observationsSignal.value = rows;
    loadedSignal.value = true;
    errorSignal.value = null;
}
