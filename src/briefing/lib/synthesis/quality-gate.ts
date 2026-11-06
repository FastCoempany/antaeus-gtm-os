/**
 * Briefing synthesis quality gate.
 *
 * Mechanical checks protect evidence integrity, plain language, routing, and
 * schema completeness. The gate does not reject a pattern merely because an
 * assessment uses calibrated uncertainty language; certainty must follow the
 * evidence, not a word-count rule.
 */

import {
    ANALYSIS_MAX_WORDS,
    ANALYSIS_MIN_WORDS,
    MOVES_MAX,
    MOVES_MIN,
    PATTERN_NAME_MAX_WORDS,
    findBannedHedgeConstructions,
    findBannedVocabulary,
    findMarketingSoup,
    wordCount
} from "./voice-rules";
import type { DraftPattern, GateCheck, GateResult } from "./types";

export function runQualityGate(
    pattern: DraftPattern,
    validItemIds: ReadonlyArray<string>
): GateResult {
    const checks: GateCheck[] = [];
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

    const banned = findBannedVocabulary(fullText);
    checks.push({
        name: "banned_vocabulary",
        pass: banned.length === 0,
        detail:
            banned.length === 0
                ? "no banned vocabulary"
                : `banned vocabulary used: ${banned.join(", ")}`
    });

    const analysisWords = wordCount(pattern.analysis);
    const lengthOk =
        analysisWords >= ANALYSIS_MIN_WORDS && analysisWords <= ANALYSIS_MAX_WORDS;
    checks.push({
        name: "analysis_length",
        pass: lengthOk,
        detail: `analysis ${analysisWords} words (need ${ANALYSIS_MIN_WORDS}–${ANALYSIS_MAX_WORDS})`
    });

    const nameWords = wordCount(pattern.name);
    checks.push({
        name: "name_word_count",
        pass: nameWords > 0 && nameWords <= PATTERN_NAME_MAX_WORDS,
        detail: `name ${nameWords} words (max ${PATTERN_NAME_MAX_WORDS})`
    });

    const trimmedName = pattern.name.trim();
    const nameDeclarative =
        trimmedName.length > 0 &&
        !trimmedName.includes("?") &&
        trimmedName.endsWith(".");
    checks.push({
        name: "name_declarative",
        pass: nameDeclarative,
        detail: nameDeclarative
            ? "name is a declarative sentence"
            : "name must end with a period and contain no question mark"
    });

    const moveCount = pattern.recommended_moves.length;
    const movesOk = moveCount >= MOVES_MIN && moveCount <= MOVES_MAX;
    checks.push({
        name: "moves_count",
        pass: movesOk,
        detail: `${moveCount} moves (need ${MOVES_MIN}–${MOVES_MAX})`
    });

    const allMovesRouted = pattern.recommended_moves.every(
        (m) => m.destination.trim().length > 0 && m.action.trim().length > 0
    );
    checks.push({
        name: "moves_routed",
        pass: moveCount > 0 && allMovesRouted,
        detail: allMovesRouted
            ? "all moves have action + destination"
            : "a move is missing its action or routed destination"
    });

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

    const hedgeConstructions = findBannedHedgeConstructions(fullText);
    checks.push({
        name: "banned_hedge_constructions",
        pass: hedgeConstructions.length === 0,
        detail:
            hedgeConstructions.length === 0
                ? "no indirect/metadiscursive qualification"
                : `indirect qualification: ${hedgeConstructions.join("; ")}`
    });

    const soup = findMarketingSoup(fullText);
    checks.push({
        name: "marketing_soup",
        pass: soup.length === 0,
        detail:
            soup.length === 0
                ? "no marketing-soup phrases"
                : `marketing-soup phrases: ${soup.join("; ")}`
    });

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
