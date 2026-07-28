/**
 * v4 reads — the locked daily surface's "Your work" list (canon §4.21,
 * settled design 2026-07-02).
 *
 * Reads the same observations ledger as WorkspaceReads/WeekReadsCard,
 * but presents it the way the locked design does: one flat de-carded
 * list, newest first, each row carrying a short tag chip (age / due /
 * holding) instead of generator-id group headers. Long runs from one
 * generator collapse past three rows — four near-identical "gone
 * quiet" lines read as noise, one line with a count reads as a fact.
 */
import { signal, type Signal } from "@preact/signals";
import {
    dismissObservation,
    listObservations
} from "@/lib/observations/reader";
import {
    EMPTY_BRIEFING_PATTERN_INDEX,
    filterShadowedByBriefing
} from "@/lib/observations/briefing-dedupe";
import type { ObservationView } from "@/lib/observations/types";
import {
    buildObservationHref,
    type ObservationRoute
} from "../../lib/observation-routing";

export type ReadTone = "hot" | "amber" | "forest" | "quiet";

export interface WorkRead {
    readonly id: string;
    readonly text: string;
    readonly tone: ReadTone;
    readonly tag: string;
    readonly route: ObservationRoute | null;
}

export interface CollapsedRun {
    readonly generator: string;
    readonly count: number;
    readonly label: string;
}

export const workReads: Signal<ReadonlyArray<WorkRead>> = signal([]);
export const collapsedRuns: Signal<ReadonlyArray<CollapsedRun>> = signal([]);
export const readsLoaded = signal(false);
export const readsError = signal<string | null>(null);
export const dismissingId = signal<string | null>(null);

/** Strip any namespace prefix ("phase-b/signal-decay" → "signal-decay"). */
function bareGenerator(sourceGenerator: string): string {
    const tail = sourceGenerator.split("/").pop() ?? sourceGenerator;
    return tail.replace(/-/g, "_");
}

function daysIn(text: string): number | null {
    const m = /(\d+)\s+day/.exec(text);
    return m ? Number(m[1]) : null;
}

function toneFor(generator: string, days: number | null): ReadTone {
    if (generator === "deal_decay") return "hot";
    if (generator === "signal_decay") return days !== null && days >= 45 ? "hot" : "amber";
    if (generator === "proof_staleness") return "amber";
    if (generator === "discovery_rhythm") return "amber";
    return "quiet";
}

function tagFor(generator: string, days: number | null): string {
    if (days !== null) return `${days}d`;
    if (generator === "proof_staleness") return "due";
    if (generator === "discovery_rhythm") return "0 logged";
    return "new";
}

const MAX_PER_GENERATOR = 3;

const RUN_LABELS: Record<string, string> = {
    signal_decay: "more accounts gone quiet",
    deal_decay: "more deals sitting still",
    proof_staleness: "more pilots past their readout",
    discovery_rhythm: "more reads on your call rhythm"
};

export function projectReads(rows: ReadonlyArray<ObservationView>): {
    reads: ReadonlyArray<WorkRead>;
    runs: ReadonlyArray<CollapsedRun>;
} {
    const perGenerator = new Map<string, number>();
    const reads: WorkRead[] = [];
    const overflow = new Map<string, number>();
    for (const row of rows) {
        const gen = bareGenerator(row.sourceGenerator);
        const used = perGenerator.get(gen) ?? 0;
        if (used >= MAX_PER_GENERATOR) {
            overflow.set(gen, (overflow.get(gen) ?? 0) + 1);
            continue;
        }
        perGenerator.set(gen, used + 1);
        const days = daysIn(row.observationText);
        reads.push({
            id: row.id,
            text: row.observationText,
            tone: toneFor(gen, days),
            tag: tagFor(gen, days),
            route: buildObservationHref(row)
        });
    }
    const runs: CollapsedRun[] = Array.from(overflow.entries()).map(
        ([generator, count]) => ({
            generator,
            count,
            label: RUN_LABELS[generator] ?? "more reads like these"
        })
    );
    return { reads, runs };
}

export async function refreshReads(): Promise<void> {
    try {
        const rows = await listObservations({ limit: 60 });
        const visible = filterShadowedByBriefing(
            rows,
            EMPTY_BRIEFING_PATTERN_INDEX
        );
        const { reads, runs } = projectReads(visible);
        workReads.value = reads;
        collapsedRuns.value = runs;
        readsError.value = null;
    } catch (err) {
        readsError.value =
            err instanceof Error ? err.message : "Couldn't load your reads.";
    } finally {
        readsLoaded.value = true;
    }
}

export async function dismissRead(id: string): Promise<void> {
    dismissingId.value = id;
    try {
        await dismissObservation(id, "operator dismissed");
        await refreshReads();
    } finally {
        dismissingId.value = null;
    }
}

/** @internal — reset module state between tests. */
export function __resetReadsForTests(): void {
    workReads.value = [];
    collapsedRuns.value = [];
    readsLoaded.value = false;
    readsError.value = null;
    dismissingId.value = null;
}
