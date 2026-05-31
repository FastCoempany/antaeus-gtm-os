import type { ObservationCandidate } from "./types";

/**
 * `discovery_rhythm` generator — pure function form.
 *
 * Emits at most ONE observation per workspace: a coarse "your
 * discovery cadence is below the floor" signal. Floor = fewer than
 * MIN_CALLS_PER_WEEK logged discovery sessions in the past
 * WEEK_WINDOW_DAYS days.
 *
 * "Coarse" because real cadence math wants the operator's quota
 * inputs (deals/year × calls/deal / weeks/year), but Quota Workback
 * still writes to localStorage today — the heartbeat can't read it.
 * Once Quota Workback retrofits to cloud (Phase 4.5 Tier 2-4), this
 * generator graduates to operator-cadence-aware. Until then, the
 * floor "1 call / 7 days" is good enough to surface a quiet week.
 *
 * Unlike the other Phase B generators, this one is WORKSPACE-scoped,
 * not entity-scoped — there's no specific deal or account to attach
 * it to. relatedObjectType and relatedObjectId are null; supersession
 * is on (workspace, generator) which Phase A's writer already
 * supports via the (null, null) tuple.
 *
 * Ref: ADR-009 §"Four initial generators" — discovery_rhythm.
 */

export const MIN_CALLS_PER_WEEK = 1;
export const WEEK_WINDOW_DAYS = 7;
export const DISCOVERY_RHYTHM_GENERATOR_ID = "phase-b/discovery-rhythm";

/** Subset of `discovery_call_logs` the generator reads. */
export interface DiscoverySessionRecord {
    readonly call_date: string | null;
    readonly created_at: string;
}

export function countCallsInWindow(
    sessions: ReadonlyArray<DiscoverySessionRecord>,
    now: Date
): number {
    const cutoff = now.getTime() - WEEK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    let count = 0;
    for (const s of sessions) {
        // Prefer call_date (the deliberately-recorded date) over
        // created_at (the row insert timestamp).
        const iso = s.call_date ?? s.created_at;
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) continue;
        if (t >= cutoff) count += 1;
    }
    return count;
}

export function deriveDiscoveryRhythmObservations(
    sessions: ReadonlyArray<DiscoverySessionRecord>,
    now: Date
): ReadonlyArray<ObservationCandidate> {
    const recent = countCallsInWindow(sessions, now);
    if (recent >= MIN_CALLS_PER_WEEK) return [];

    const text =
        recent === 0
            ? `No discovery calls were logged in the last ${WEEK_WINDOW_DAYS} days. Discovery is the muscle that compounds; a quiet week shows up later as a thin pipeline.`
            : `Only ${recent} discovery call was logged in the last ${WEEK_WINDOW_DAYS} days. Below the floor for the cadence to compound.`;

    return [
        {
            observationText: text,
            relatedObjectType: null,
            relatedObjectId: null,
            confidence: "medium",
            supersedesPrior: true
        }
    ];
}
