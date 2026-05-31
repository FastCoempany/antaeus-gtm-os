/**
 * Birdseye Float — typed contract (Phase D of the orchestration layer).
 *
 * Per ADR-011 (2026-05-31). The Birdseye Float surfaces ONE ranked
 * "what to look at next" line. A NextMove is what the ranker produces
 * and what the float renders.
 */

/**
 * The ranker's output. Carries everything the float needs to render
 * (label + reason) and route (targetUrl + sourceKind).
 *
 * The single-line discipline is enforced at the ranker boundary: the
 * ranker returns a single best NextMove (or null). The float never
 * shows more than one at a time.
 */
export interface NextMove {
    /** Stable id for dedup / supersession via the writer pattern. */
    readonly id: string;
    /** One-sentence verb-shape label. "Cast a proof for Cascadia Health" */
    readonly label: string;
    /** One-sentence reason. "Stalled 14 days, hot account, no proof on file yet." */
    readonly reason: string;
    /** Composite score 0-100; higher = more pressing. */
    readonly score: number;
    /**
     * Where the float routes on click. MUST include continuity params
     * (returnTo / returnLabel / focusObject / focusRoom / fromMode /
     * fromSurface) so the destination room handles the inbound through
     * the HandoffStrip pattern.
     */
    readonly targetUrl: string;
    /**
     * Where the candidate came from. Used for analytics + future
     * cross-deduping (Briefing Patterns may shadow some sources).
     */
    readonly sourceKind: NextMoveSourceKind;
}

export type NextMoveSourceKind =
    | "observation"
    | "deal-pressure"
    | "hot-signal-account";

/**
 * Result of running the ranker. Always a discriminated union so the
 * float handles the empty case explicitly.
 */
export type RankerResult =
    | { readonly ok: true; readonly move: NextMove }
    | { readonly ok: false; readonly reason: "no-candidates" | "all-voice-failed" };
