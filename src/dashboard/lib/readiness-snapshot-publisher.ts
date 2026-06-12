import { effect } from "@preact/signals";
import { readinessSummary } from "../state";
import type { ReadinessSummary } from "@/lib/readiness";

/**
 * Readiness snapshot publisher — gives `gtmos_readiness_snapshot` its
 * writer back.
 *
 * The command engine (signal-profile.ts) reads a readiness health
 * summary out of `healthSummaries.readiness`, which the snapshot
 * aggregator fills from the `gtmos_readiness_snapshot` localStorage
 * key. The legacy /app/readiness/ room used to publish that key; when
 * Phase 5.A retired the legacy room (2026-05-01) the writer went with
 * it, and the engine's readiness condition flags have read empty ever
 * since. The 2026-06-08 localStorage inventory audit caught it
 * (deliverables/audit/localstorage-inventory-2026-06-08.md §4).
 *
 * The Dashboard already computes the live verdict on every input
 * change (state.ts readinessSummary, Phase 5.A). This module projects
 * that summary into the legacy snapshot shape the engine expects and
 * writes it back to the key — so the orphaned reader gets a writer
 * that lives where the verdict is actually computed.
 *
 * Shape contract (signal-profile.ts L199-230 reads these):
 *   score            — 0-100 (totalScore)
 *   fragilityScore   — 0-100 (100 - totalScore)
 *   weakestDimension — label of the lowest-scoring dimension
 *   icpWeak / discoveryWeak / outreachWeak / dealsWeak / playbookWeak
 *                    — explicit booleans; a dimension is weak below
 *                      14/20, the same threshold the verdict engine
 *                      uses for its hire-ready gate (verdict.ts).
 *                      `playbookWeak` is the legacy name the engine
 *                      kept for the `proof` dimension.
 */

export const READINESS_SNAPSHOT_KEY = "gtmos_readiness_snapshot";

/** A dimension below this (on the 0-20 scale) reads as weak. */
const WEAK_THRESHOLD = 14;

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export interface ReadinessHealthSnapshot {
    readonly capturedAt: string;
    readonly verdict: string;
    readonly verdictLabel: string;
    readonly score: number;
    readonly fragilityScore: number;
    readonly weakestDimension: string;
    readonly icpWeak: boolean;
    readonly discoveryWeak: boolean;
    readonly outreachWeak: boolean;
    readonly dealsWeak: boolean;
    readonly playbookWeak: boolean;
}

function clamp(n: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, n));
}

function dimensionScore(summary: ReadinessSummary, id: string): number {
    const dim = summary.dimensions.find((d) => d.id === id);
    return dim ? dim.score : 0;
}

/** Project the live ReadinessSummary into the legacy snapshot shape. */
export function buildReadinessHealthSnapshot(
    summary: ReadinessSummary,
    now: Date = new Date()
): ReadinessHealthSnapshot {
    const weakest = summary.dimensions.reduce<
        { label: string; score: number } | null
    >(
        (acc, d) =>
            acc === null || d.score < acc.score
                ? { label: d.label, score: d.score }
                : acc,
        null
    );
    const score = clamp(Math.round(summary.totalScore), 0, 100);
    return {
        capturedAt: now.toISOString(),
        verdict: summary.verdict,
        verdictLabel: summary.verdictLabel,
        score,
        fragilityScore: clamp(100 - score, 0, 100),
        weakestDimension: weakest ? weakest.label : "",
        icpWeak: dimensionScore(summary, "icp") < WEAK_THRESHOLD,
        discoveryWeak: dimensionScore(summary, "discovery") < WEAK_THRESHOLD,
        outreachWeak: dimensionScore(summary, "outreach") < WEAK_THRESHOLD,
        dealsWeak: dimensionScore(summary, "deals") < WEAK_THRESHOLD,
        // The engine kept the legacy `playbook` flag name; the modern
        // dimension underneath it is `proof` (canon §4.17).
        playbookWeak: dimensionScore(summary, "proof") < WEAK_THRESHOLD
    };
}

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

/**
 * Write the snapshot to localStorage. Skips the write when the stored
 * payload already matches (ignoring capturedAt) so storage-event-driven
 * recomputes don't churn the key. Never throws.
 */
export function publishReadinessSnapshot(
    summary: ReadinessSummary,
    storage: StorageLike | null = safeStorage(),
    now: Date = new Date()
): boolean {
    if (!storage) return false;
    try {
        const next = buildReadinessHealthSnapshot(summary, now);
        const existingRaw = storage.getItem(READINESS_SNAPSHOT_KEY);
        if (existingRaw) {
            try {
                const existing = JSON.parse(existingRaw) as Record<
                    string,
                    unknown
                >;
                const { capturedAt: _a, ...existingRest } = existing;
                const { capturedAt: _b, ...nextRest } = next;
                if (JSON.stringify(existingRest) === JSON.stringify(nextRest)) {
                    return false;
                }
            } catch {
                // unparseable existing payload — overwrite it
            }
        }
        storage.setItem(READINESS_SNAPSHOT_KEY, JSON.stringify(next));
        return true;
    } catch {
        return false;
    }
}

/**
 * Subscribe to the live readiness summary and keep the snapshot key
 * current. Returns the effect disposer.
 */
export function bootReadinessSnapshotPublisher(
    storage: StorageLike | null = safeStorage()
): () => void {
    return effect(() => {
        publishReadinessSnapshot(readinessSummary.value, storage);
    });
}
