/**
 * Voice rules — the deterministic data behind the Quality Gate (B.2c).
 *
 * These constants are the machine-checkable subset of the Voice
 * Document v0.1: the hard-ban vocabulary (§5.1), the banned hedge
 * constructions (§7.4), the marketing-soup phrases the anti-exemplars
 * warn against (§4.1), and the hedging adverbs the gate counts (§7.3).
 *
 * The gate reads these; the synthesis prompts also inject the banned
 * list so the model is told the rules up front (cheaper than letting
 * it fail the gate and re-roll).
 *
 * Canonical reference + vitest-tested. The Deno mirror at
 * supabase/functions/briefing-pipeline/llm/synthesis-shared.ts keeps a
 * verbatim copy — same Node/Deno split as the enrich + cluster layers.
 *
 * Voice Document: deliverables/specs/briefing/signal_console_voice_document_v0.1.md
 */

/** §5.1 hard-ban — these words never appear in output. */
export const BANNED_VOCABULARY: ReadonlyArray<string> = [
    "leverage", // as a verb — see §5.2 note; we ban the lemma and accept the rare false positive
    "unlock",
    "revolutionize",
    "revolutionary",
    "supercharge",
    "magical",
    "transform",
    "transformative",
    "transformational",
    "game-changing",
    "game-changer",
    "paradigm shift",
    "synergy",
    "synergistic",
    "best-in-class",
    "world-class",
    "cutting-edge",
    "next-generation",
    "next-gen",
    "robust",
    "seamless",
    "holistic",
    "innovative",
    "empower",
    "empowerment",
    "mission-critical",
    "streamline"
];

/**
 * §7.4 banned hedge constructions — voice-of-no-confidence phrasing.
 * Matched case-insensitively as substrings.
 */
export const BANNED_HEDGE_CONSTRUCTIONS: ReadonlyArray<string> = [
    "it's worth noting that",
    "it is worth noting that",
    "it could be argued that",
    "there may be reasons to consider",
    "some observers might suggest",
    "it is possible, though not certain, that",
    "while the evidence is mixed, one interpretation is"
];

/**
 * §4.1 marketing-soup openers + filler the anti-exemplars warn against.
 * Banned as analysis openings or anywhere in body.
 */
export const MARKETING_SOUP_PHRASES: ReadonlyArray<string> = [
    "in today's",
    "in today’s",
    "it's no secret that",
    "it is no secret that",
    "have you ever wondered",
    "we've all been there",
    "we have all been there",
    "as a leading",
    "in the fast-paced world",
    "now more than ever",
    "the future of"
];

/** §7.3 hedging adverbs — max 3 across these in one analysis paragraph. */
export const HEDGING_ADVERBS: ReadonlyArray<string> = [
    "may",
    "could",
    "might",
    "possibly",
    "potentially",
    "seems",
    "appears",
    "suggests"
];

export const MAX_HEDGING_ADVERBS = 3;

/** §6.1 pattern name bounds. */
export const PATTERN_NAME_MAX_WORDS = 12;

/** §6.2 analysis paragraph word bounds. */
export const ANALYSIS_MIN_WORDS = 60;
export const ANALYSIS_MAX_WORDS = 240;

/** §6.4 recommended-move count bounds. */
export const MOVES_MIN = 1;
export const MOVES_MAX = 3;

/** The six required question slots (§6.3). */
export const SIX_QUESTION_KEYS: ReadonlyArray<string> = [
    "what_changed",
    "evidence",
    "confidence_rationale",
    "why_it_matters",
    "who_needs_to_know",
    "what_next"
];

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Count whole-word occurrences of each banned/hedge term in text,
 * case-insensitive. Word-boundary matching so "transform" doesn't fire
 * on "platform" and "may" doesn't fire on "Maya" / "maybe".
 */
export function countWholeWord(text: string, term: string): number {
    if (text.length === 0 || term.length === 0) return 0;
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
    const matches = text.match(re);
    return matches ? matches.length : 0;
}

/** Whole-word banned-vocabulary hits across the supplied text. */
export function findBannedVocabulary(text: string): string[] {
    const hits: string[] = [];
    for (const word of BANNED_VOCABULARY) {
        if (countWholeWord(text, word) > 0) hits.push(word);
    }
    return hits;
}

/** Substring hits for banned hedge constructions, case-insensitive. */
export function findBannedHedgeConstructions(text: string): string[] {
    const lower = text.toLowerCase();
    return BANNED_HEDGE_CONSTRUCTIONS.filter((p) => lower.includes(p));
}

/** Substring hits for marketing-soup phrases, case-insensitive. */
export function findMarketingSoup(text: string): string[] {
    const lower = text.toLowerCase();
    return MARKETING_SOUP_PHRASES.filter((p) => lower.includes(p));
}

/** Total hedging-adverb count (whole-word) across the text. */
export function countHedgingAdverbs(text: string): number {
    return HEDGING_ADVERBS.reduce((sum, adv) => sum + countWholeWord(text, adv), 0);
}

/** Word count by whitespace splitting; trims first. */
export function wordCount(text: string): number {
    const t = text.trim();
    if (t.length === 0) return 0;
    return t.split(/\s+/).length;
}
