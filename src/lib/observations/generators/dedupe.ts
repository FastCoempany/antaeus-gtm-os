/**
 * Dedupe key helpers for workspace-scope observation generators.
 *
 * The `observations` writer dedupes on the full tuple (workspace_id,
 * source_generator, related_object_type, related_object_id,
 * observation_text). Generators don't pass an explicit dedupe key —
 * the tuple IS the key.
 *
 * This module provides one helper: `formatDedupeKey()` for log
 * messages + test assertions. It is NOT used at write time (the writer
 * uses the tuple directly via Supabase query filters).
 */

import type { ObservationCandidate } from "./types";

export function formatDedupeKey(
    generatorId: string,
    candidate: ObservationCandidate
): string {
    const type = candidate.relatedObjectType ?? "null";
    const id = candidate.relatedObjectId ?? "null";
    return `${generatorId}:${type}:${id}`;
}
