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

/**
 * Lightweight metadata each generator publishes about itself.
 * The Deno runtime reads this to register the generator; the src
 * side reads it for documentation + voice spot-checks.
 */
export interface GeneratorDescriptor {
    /**
     * Stable identifier stored in the `source_generator` column.
     * MUST follow `phase-b/<name>` convention so future phases keep
     * the namespace clean and old generators can be retired by ID
     * without ledger-schema changes.
     */
    readonly id: string;
    /** Human-readable name surfaced in voice-rule violation logs. */
    readonly label: string;
    /** The entity class this generator's observations are about. */
    readonly relatedObjectType: RelatedObjectType;
    /**
     * Voice-rule waiver list. Generators that legitimately need a
     * word the global banned-vocab catches (none today) can declare
     * an allowlist here. Empty for all four Phase B generators —
     * canon Part III §11 is the voice for the entire ledger.
     */
    readonly voiceWaivers?: ReadonlyArray<string>;
}
