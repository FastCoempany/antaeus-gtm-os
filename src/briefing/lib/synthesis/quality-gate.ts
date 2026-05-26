/**
 * Stage 5d Quality Gate (B.2c) — deterministic checks per Voice
 * Document v0.1 §6 + §7.
 *
 * A Pattern only surfaces if it passes every gate check. The gate is
 * pure + deterministic: same Pattern in, same verdict out. The walkthrough
 * §2.6 "Stage 5d Quality Gate" table is the reference set of checks.
 *
 * Canonical reference + vitest-tested; Deno mirror in synthesis-shared.ts.
 */

import {
    ANALYSIS_MAX_WORDS,
    ANALYSIS_MIN_WORDS,
    MAX_HEDGING_ADVERBS,
    MOVES_MAX,
    MOVES_MIN,
    PATTERN_NAME_MAX_WORDS,
    countHedgingAdverbs,
    findBannedHedgeConstructions,
    findBannedVocabulary,
    findMarketingSoup,
    wordCount
} from "./voice-rules";
import type { DraftPattern, GateCheck, GateResult } from "./types";

/**
 * Run the deterministic gate. `validItemIds` is the set of enriched-item
 * ids that actually belong to the cluster — evidence_item_ids must be a
 * non-empty subset (no fabricated citations).
 */
export function runQualityGate(
    pattern: DraftPattern,
    validItemIds: ReadonlyArray<string>
): GateResult {
    const checks: GateCheck[] = [];

    // Combined body text for vocabulary / hedge / soup scans: name +
    // analysis + every six-question slot + every move's action/rationale.
    const sixQ = pattern.six_questions;
    const moveText = pattern.recommended_moves
        .map((m) => `${m.action} ${m.rationale}`)
        .join(" ");
    const fullText = [
        pattern.name,
        pattern.analysis,
        sixQ.what_changed,
        sixQ.evidence,
        sixQ.confidence_rationale,
        sixQ.why_it_matters,
        sixQ.who_needs_to_know,
        sixQ.what_next,
        moveText
    ].join(" \n ");

    // 1. Banned vocabulary.
    const banned = findBannedVocabulary(fullText);
    checks.push({
        name: "banned_vocabulary",
        pass: banned.length === 0,
        detail:
            banned.length === 0
                ? "no banned vocabulary"
                : `banned vocabulary used: ${banned.join(", ")}`
    });

    // 2. Analysis word count 60–240.
    const analysisWords = wordCount(pattern.analysis);
    const lengthOk =
        analysisWords >= ANALYSIS_MIN_WORDS && analysisWords <= ANALYSIS_MAX_WORDS;
    checks.push({
        name: "analysis_length",
        pass: lengthOk,
        detail: `analysis ${analysisWords} words (need ${ANALYSIS_MIN_WORDS}–${ANALYSIS_MAX_WORDS})`
    });

    // 3. Pattern name ≤12 words.
    const nameWords = wordCount(pattern.name);
    checks.push({
        name: "name_word_count",
        pass: nameWords > 0 && nameWords <= PATTERN_NAME_MAX_WORDS,
        detail: `name ${nameWords} words (max ${PATTERN_NAME_MAX_WORDS})`
    });

    // 4. Name is declarative — ends with '.', no '?'.
    const trimmedName = pattern.name.trim();
    const nameDeclarative =
        trimmedName.length > 0 &&
        !trimmedName.includes("?") &&
        trimmedName.endsWith(".");
    checks.push({
        name: "name_declarative",
        pass: nameDeclarative,
        detail: nameDeclarative
            ? "name is declarative"
            : "name must end with a period and contain no question mark"
    });

    // 5. Recommended moves 1–3.
    const moveCount = pattern.recommended_moves.length;
    const movesOk = moveCount >= MOVES_MIN && moveCount <= MOVES_MAX;
    checks.push({
        name: "moves_count",
        pass: movesOk,
        detail: `${moveCount} moves (need ${MOVES_MIN}–${MOVES_MAX})`
    });

    // 6. Each move has a non-empty destination.
    const allMovesRouted = pattern.recommended_moves.every(
        (m) => m.destination.trim().length > 0 && m.action.trim().length > 0
    );
    checks.push({
        name: "moves_routed",
        pass: moveCount === 0 ? false : allMovesRouted,
        detail: allMovesRouted
            ? "all moves have action + destination"
            : "a move is missing its action or routed destination"
    });

    // 7. Six-question slots all non-empty.
    const emptySlots = (Object.keys(sixQ) as Array<keyof typeof sixQ>).filter(
        (k) => sixQ[k].trim().length === 0
    );
    checks.push({
        name: "six_questions_complete",
        pass: emptySlots.length === 0,
        detail:
            emptySlots.length === 0
                ? "all six question slots populated"
                : `empty six-question slots: ${emptySlots.join(", ")}`
    });

    // 8. Hedging adverbs ≤3 in the analysis paragraph.
    const hedges = countHedgingAdverbs(pattern.analysis);
    checks.push({
        name: "hedging_density",
        pass: hedges <= MAX_HEDGING_ADVERBS,
        detail: `${hedges} hedging adverbs in analysis (max ${MAX_HEDGING_ADVERBS})`
    });

    // 9. Banned hedge constructions absent.
    const hedgeConstructions = findBannedHedgeConstructions(fullText);
    checks.push({
        name: "banned_hedge_constructions",
        pass: hedgeConstructions.length === 0,
        detail:
            hedgeConstructions.length === 0
                ? "no banned hedge constructions"
                : `banned hedge constructions: ${hedgeConstructions.join("; ")}`
    });

    // 10. Marketing-soup phrases absent.
    const soup = findMarketingSoup(fullText);
    checks.push({
        name: "marketing_soup",
        pass: soup.length === 0,
        detail:
            soup.length === 0
                ? "no marketing-soup phrases"
                : `marketing-soup phrases: ${soup.join("; ")}`
    });

    // 11. Evidence item ids non-empty + subset of the cluster's items.
    const validSet = new Set(validItemIds);
    const cited = pattern.evidence_item_ids;
    const allCitedValid = cited.length > 0 && cited.every((id) => validSet.has(id));
    const invalidCited = cited.filter((id) => !validSet.has(id));
    checks.push({
        name: "evidence_ids_valid",
        pass: allCitedValid,
        detail: allCitedValid
            ? `all ${cited.length} cited ids belong to the cluster`
            : cited.length === 0
            ? "no evidence item ids cited"
            : `cited ids not in cluster: ${invalidCited.join(", ")}`
    });

    // 12. Confidence in [0, 1].
    const confOk =
        Number.isFinite(pattern.confidence) &&
        pattern.confidence >= 0 &&
        pattern.confidence <= 1;
    checks.push({
        name: "confidence_range",
        pass: confOk,
        detail: confOk
            ? `confidence ${pattern.confidence}`
            : `confidence ${pattern.confidence} outside [0, 1]`
    });

    const failures = checks.filter((c) => !c.pass).map((c) => c.detail);
    return {
        passes: failures.length === 0,
        checks,
        failures
    };
}
