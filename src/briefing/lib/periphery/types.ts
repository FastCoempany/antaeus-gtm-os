/**
 * Periphery Detection types (B.4).
 *
 * Canon §4.21 + ADR-006: the Briefing's Coverage obligation surfaces
 * entities the operator hasn't named but the data says they should be
 * watching. Stage 3.3b of the Recipe Layer pipeline scores off-watchlist
 * entities via five signals; B.4a ships the two that need no new data
 * substrate — co-occurrence with watched entities, and vocabulary
 * overlap (shared pain/topic tags).
 *
 * The scoring math is pure (no Supabase, no LLM) and lives here so the
 * Node tests + the Deno mirror in supabase/functions can share an
 * authoritative shape. The remaining signals (investor map, hiring,
 * buyer overlap) land in later B.4 PRs once their data sources exist.
 */

/**
 * Minimum-shape enriched item the scoring math needs. The pipeline
 * already produces these fields during Stage 3.3 Enrich; the scoring
 * layer reads them, nothing else.
 */
export interface ScoringItem {
    readonly id: string;
    readonly entities: ReadonlyArray<string>;
    readonly pain_tags: ReadonlyArray<string>;
    readonly topic_tags: ReadonlyArray<string>;
}

export interface ScoringConfig {
    /** Minimum co-occurrence count to even consider a candidate. Default 3. */
    readonly co_min: number;
    /** Vocab overlap below this is reported as 0 in the candidate's reasoning. Default 2. */
    readonly vocab_min: number;
    /** Hard cap on candidates returned per run (precision over recall). Default 5. */
    readonly max_candidates: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
    co_min: 3,
    vocab_min: 2,
    max_candidates: 5
};

/**
 * One off-watchlist entity scored against the run. The pipeline turns
 * this into a row in briefing_periphery_candidates; the UI surfaces it
 * with the reasoning string.
 */
export interface CandidateScore {
    readonly entity_name: string;
    readonly entity_aliases: ReadonlyArray<string>;
    readonly co_occurrence_score: number;
    readonly vocab_overlap_score: number;
    readonly total_score: number;
    readonly supporting_item_ids: ReadonlyArray<string>;
    readonly reasoning: string;
}
