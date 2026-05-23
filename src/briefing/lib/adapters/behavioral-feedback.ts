import type {
    BehavioralFeedbackState,
    BehavioralFeedbackStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Behavioral Feedback adapter (B.0c shell).
 *
 * Future data source: a `briefing_pattern_feedback` table (already
 * created in B.0a — see migration 20260523180000) carries per-Pattern
 * operator marks (Used / Met / Noise). The adapter aggregates them
 * into the contract's `historical_snr_by_source` /
 * `pain_tag_relevance_weights` / `pattern_themes_promoted` /
 * `pattern_themes_demoted` rollups.
 *
 * The aggregation logic lands in B.8 — that's where the Used / Met /
 * Noise marks feed back into clustering + scoring weights. B.0c just
 * reserves the contract.
 *
 * Until B.8, the adapter returns uninitialized and the pipeline runs
 * with no behavioral weight adjustments — every signal is treated
 * with default priors.
 */
export function getBehavioralFeedbackState(): BehavioralFeedbackState {
    return uninitializedContract<BehavioralFeedbackStateBody>(
        "Behavioral Feedback adapter shell — B.0c. Aggregation lands in B.8."
    );
}
