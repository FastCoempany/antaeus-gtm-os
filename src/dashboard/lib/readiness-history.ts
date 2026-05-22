import { effect } from "@preact/signals";
import { readinessSummary } from "../state";
import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError, trackEvent } from "@/lib/observability";
import type {
    ReadinessSummary,
    Verdict,
    VerdictTransition
} from "@/lib/readiness";
import { detectTransition } from "@/lib/readiness";
import type { Json, ReadinessVerdict } from "@/lib/database-helpers";

/**
 * Verdict-history persister.
 *
 * Subscribes to the live readinessSummary signal and writes a row into
 * `readiness_snapshots` (cloud) on every verdict transition. The full
 * five-level verdict + transition direction goes into the `data`
 * jsonb; the legacy three-value `verdict` column gets a mapped
 * approximation so existing readers (legacy command-intelligence,
 * Welcome anchor) keep working.
 *
 * Idempotency:
 *   - Tracks the last persisted verdict in localStorage so reloads
 *     don't re-write the same row.
 *   - The first observed value (warm boot) does NOT insert a new
 *     snapshot when it matches the cached last-persisted verdict.
 *
 * Founding GTM (Phase 5.B) will subscribe to the same signal to fire
 * the ceremony moment on first upward transition into
 * `inheritable_with_guardrails` (canon §4.19). The history table is
 * the durable record that drives "have we already fired this?"
 *
 * Errors flow through reportError + the cloud-sync retry queue (the
 * one PR #44 wired). A persistence outage never blocks the room.
 */

const LAST_VERDICT_KEY = "gtmos_readiness_last_verdict";

/**
 * Map our five-level verdict onto the legacy three-value enum the DB
 * column constrains. Until a migration expands the enum, the legacy
 * values are the only ones the column accepts; the full new verdict
 * is preserved in the `data` jsonb anyway.
 */
function mapVerdictToColumn(verdict: Verdict): ReadinessVerdict {
    switch (verdict) {
        case "you_are_the_system":
        case "building":
            return "thin";
        case "inheritable_with_guardrails":
            return "partial";
        case "hire_ready":
        case "hire_ready_repeatable":
            return "hire_ready";
    }
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function readLastVerdict(storage: StorageLike | null): Verdict | null {
    if (!storage) return null;
    try {
        const raw = storage.getItem(LAST_VERDICT_KEY);
        if (!raw) return null;
        // Validate against the known set so a stale payload from an
        // older legacy build never poisons the transition detector.
        const known: ReadonlyArray<Verdict> = [
            "you_are_the_system",
            "building",
            "inheritable_with_guardrails",
            "hire_ready",
            "hire_ready_repeatable"
        ];
        return (known as readonly string[]).includes(raw)
            ? (raw as Verdict)
            : null;
    } catch {
        return null;
    }
}

function writeLastVerdict(
    storage: StorageLike | null,
    verdict: Verdict
): void {
    if (!storage) return;
    try {
        storage.setItem(LAST_VERDICT_KEY, verdict);
    } catch {
        // ignore storage errors
    }
}

/** Build the data jsonb payload for one snapshot row. */
function buildSnapshotPayload(
    summary: ReadinessSummary,
    transition: VerdictTransition | null
): Json {
    return {
        verdict: summary.verdict,
        verdict_label: summary.verdictLabel,
        total_score: summary.totalScore,
        next_verdict: summary.nextVerdict,
        gate_blockers: summary.gateBlockers,
        dimensions: summary.dimensions.map((d) => ({
            id: d.id,
            label: d.label,
            score: d.score,
            evidence: d.evidence,
            gaps: d.gaps
        })),
        ...(transition
            ? {
                  transition: {
                      from: transition.from,
                      to: transition.to,
                      direction: transition.direction,
                      at: transition.atIso
                  }
              }
            : {})
    } as unknown as Json;
}

async function persistSnapshot(
    client: DataClient,
    summary: ReadinessSummary,
    transition: VerdictTransition | null
): Promise<void> {
    try {
        const dimensionScores = summary.dimensions.reduce(
            (acc, d) => ({ ...acc, [d.id]: d.score }),
            {} as Record<string, number>
        );
        await client.readinessSnapshots.insert({
            overall_score: summary.totalScore,
            verdict: mapVerdictToColumn(summary.verdict),
            dimension_scores: dimensionScores as unknown as Json,
            data: buildSnapshotPayload(summary, transition)
        });
        trackEvent("readiness_snapshot_written", {
            verdict: summary.verdict,
            total_score: summary.totalScore,
            transition_direction: transition?.direction ?? "initial"
        });
    } catch (err) {
        reportError(err, {
            op: "dashboard.persistReadinessSnapshot",
            verdict: summary.verdict
        });
        // The cloud-sync retry queue (PR #44) doesn't cover
        // readiness_snapshots yet — append-only writes by their
        // nature are safe to drop and recompute on next change.
    }
}

export interface BootHistoryOptions {
    /** Test injection. */
    readonly client?: DataClient;
    /** Test injection. */
    readonly storage?: StorageLike;
    /** Test hook fired on every transition (after persistence). */
    readonly onTransition?: (
        t: VerdictTransition,
        summary: ReadinessSummary
    ) => void;
}

/**
 * Wire the verdict-history effect. Returns a stop() handle so tests
 * can tear it down.
 */
export function bootReadinessHistory(
    options: BootHistoryOptions = {}
): () => void {
    const storage = options.storage ?? safeStorage();
    const lastSeen = { current: readLastVerdict(storage) };
    const isFirstRun = { value: true };

    const dispose = effect(() => {
        const summary = readinessSummary.value;
        const verdict = summary.verdict;

        if (isFirstRun.value) {
            isFirstRun.value = false;
            // Cold-boot: if the cache says we're already at this
            // verdict, do nothing. If the cache is empty (brand-new
            // workspace) OR differs from current, fall through to
            // the transition path so we record an initial baseline.
            if (lastSeen.current === verdict) return;
        } else if (lastSeen.current === verdict) {
            // Steady state: every input churn re-runs this effect, but
            // we only insert a snapshot when the verdict actually
            // changed. Idempotent skip.
            return;
        }

        const previous = lastSeen.current;
        const now = new Date().toISOString();
        const transitionId = `vt_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const transition = previous
            ? detectTransition(previous, verdict, now, transitionId)
            : null;

        // Update the cached "last seen" before persisting so a
        // failure doesn't double-persist on the next tick.
        lastSeen.current = verdict;
        writeLastVerdict(storage, verdict);

        // Lazy-create the cloud client; if env isn't configured we
        // skip silently — the engine still runs locally.
        let client: DataClient | null = null;
        try {
            client = options.client ?? createDataClient();
        } catch {
            return;
        }

        void persistSnapshot(client, summary, transition);

        if (transition && options.onTransition) {
            options.onTransition(transition, summary);
        }
    });

    return dispose;
}
