/**
 * Banned vocabulary — the consolidated registry.
 *
 * The executable form of the banned list in the voice spec (01 §2.2)
 * and the lexicon (07 Part III). It EXTENDS the production voice
 * document (`voice-document.ts`, shared with the heartbeat's Deno
 * duplicate — that file is not modified here) with the bans the
 * design-system pass added on 2026-06-07 and the marketing/sycophancy
 * gates the visitor-face arc retired.
 *
 * Adding or removing a word is a canon change: founder-approved PR
 * that updates this file AND the lexicon (07) together (README Part
 * IV). The lexicon-sync test enforces the pairing.
 */
import {
    BANNED_CORPORATE_VOCAB,
    BANNED_PRODUCT_JARGON,
} from "./voice-document";

/**
 * Tired business metaphors, banned by founder direction 2026-06-07.
 * "Spine" is banned both as abstract metaphor (write the description)
 * and as the old component name (the card's left state-rule is "the
 * gauge"). "Earned" and its inflections read as precious self-
 * congratulation; use "genuine", "holds its place", "warranted".
 */
export const BANNED_BUSINESS_METAPHORS: ReadonlyArray<string> = [
    "spine",
    "spines",
    "earned",
    "earns",
    "earn",
];

/**
 * Marketing-deck language (01 §2.2). Several overlap with the
 * corporate-vocab list in voice-document.ts; duplication here is
 * harmless (the matcher dedupes) and keeps this list readable as the
 * complete marketing gate on its own.
 */
export const BANNED_MARKETING_VOCAB: ReadonlyArray<string> = [
    "ai-powered",
    "world-class",
    "supercharge",
    "supercharged",
    "supercharging",
    "trusted by",
    "best-in-class",
    "next-generation",
    "revolutionary",
    "game-changing",
    "seamless",
    "seamlessly",
    "powerful",
    "robust",
];

/**
 * Sycophantic copy the truth-loyalty test forbids (01 §2.2): anything
 * that rewards activity rather than truth.
 */
export const BANNED_SYCOPHANCY: ReadonlyArray<string> = [
    "great work",
    "you're doing amazing",
    "way to go",
    "awesome",
    "crushing it",
    "you're on fire",
];

/**
 * Completion-shaped labels banned outright as standalone strings
 * (01 §2.3 loop-transformation rule): a bare completion label cannot
 * pair itself with a forward loop. Checked only when the string IS
 * the whole label, not as substrings of prose.
 */
export const BANNED_COMPLETION_LABELS: ReadonlyArray<string> = [
    "done",
    "all done",
    "complete",
    "completed",
    "finished",
    "all caught up",
    "all set",
];

/** The complete substring/word ban list the validator matches. */
export const ALL_BANNED_TERMS: ReadonlyArray<string> = [
    ...new Set([
        ...BANNED_CORPORATE_VOCAB,
        ...BANNED_PRODUCT_JARGON,
        ...BANNED_BUSINESS_METAPHORS,
        ...BANNED_MARKETING_VOCAB,
        ...BANNED_SYCOPHANCY,
    ]),
];
