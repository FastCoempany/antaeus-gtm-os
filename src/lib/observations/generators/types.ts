/**
 * Workspace-scope observation generators — authoring contract.
 *
 * Per ADR-009 (2026-05-31), Phase B ships four SQL-only generators that
 * read the operator's own workspace state and produce `observations`
 * ledger rows. The Deno-side runtime lives at
 * `supabase/functions/heartbeat/generators/` (Edge Function); each
 * Deno generator delegates its CORE LOGIC to a pure function exported
 * from this directory, so the logic is testable in vitest without a
 * live Supabase connection.
 *
 * The pattern is:
 *
 *   Deno runtime (supabase/functions/heartbeat/generators/deal-decay.ts)
 *     │
 *     ├─ issues the Supabase query
 *     │
 *     └─ passes the rows to:
 *          ↓
 *   Pure function (src/lib/observations/generators/deal-decay.ts)
 *     │
 *     ├─ filters / classifies / formats
 *     │
 *     └─ returns ReadonlyArray<ObservationCandidate>
 *
 * Vitest tests cover the pure function with mock rows. The Deno wrapper
 * is the thin shell that issues the actual query + calls the pure fn.
 * Deno-side duplication of TYPES is intentional and documented at
 * `supabase/functions/heartbeat/index.ts` — same precedent the
 * heartbeat already uses for its writer + types.
 */

/**
 * Foreign-key type discriminator for related_object_type. Matches the
 * FocusedObjectType union in the Deno heartbeat (intentionally
 * duplicated there per the existing pattern).
 */
export type RelatedObjectType =
    | "account"
    | "deal"
    | "signal"
    | "call"
    | "proof"
    | "advisor"
    | "focus"
    | "approach";

export type ObservationConfidence = "high" | "medium" | "low" | null;

/**
 * A candidate observation a generator emits. Mirror of the Deno-side
 * ObservationCandidate; the heartbeat writer transforms this into a
 * row in the `observations` table.
 *
 * The writer dedupes on (workspace_id, source_generator,
 * related_object_type, related_object_id, observation_text), so each
 * generator's candidates carry the entity reference that scopes them.
 * Re-firing with identical text for the same entity is a no-op;
 * different text for the same entity triggers supersession when
 * `supersedesPrior` is true.
 */
export interface ObservationCandidate {
    /** Plain-prose sentence(s). Voice-validated before write. */
    readonly observationText: string;
    /** The entity this observation is about, if any. */
    readonly relatedObjectType?: RelatedObjectType | null;
    readonly relatedObjectId?: string | null;
    /** Generator's confidence in the candidate. */
    readonly confidence?: ObservationConfidence;
    /**
     * When true, the writer marks any prior active observations on
     * (workspace, generator, entity) as superseded before inserting
     * this one. Use this when the observation text evolves over time
     * (e.g., "stalled 14 days" → "stalled 21 days") so the operator
     * doesn't see N stacked rows for the same deal.
     */
    readonly supersedesPrior?: boolean;
}

// NOTE: an earlier draft also exported a GeneratorDescriptor interface
// for per-generator metadata (id + label + voiceWaivers). It was never
// imported by any generator and was deleted in the post-PR-216 cleanup
// pass. Each generator now exports its own `*_GENERATOR_ID` const
// instead, which is the only metadata the heartbeat needs.
