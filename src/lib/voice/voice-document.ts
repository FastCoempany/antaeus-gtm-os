/**
 * Voice Document — structured form.
 *
 * Per ADR-009 (2026-05-31), the Briefing's Voice Document (the .md at
 * `deliverables/specs/briefing/signal_console_voice_document_v0.1.md`)
 * is canon for BOTH Briefing synthesis AND workspace-scope observation
 * generators. The .md stays the human-readable spec; this module is
 * the executable form the code reads.
 *
 * Two rule sets merge here:
 *
 *   1. Briefing §5 banned vocabulary — corporate-speak the voice never
 *      uses (leverage / unlock / transform / synergy / etc.)
 *
 *   2. Canon Part III §11 — single-word abstractions that try to do
 *      the work of a sentence (wedge / verdict / the move / decision-
 *      grade / etc.), and the "write sentences out, don't manifesto-
 *      fragment" rule.
 *
 * The merged result is the voice for the entire orchestration layer:
 * Briefing Patterns, workspace observations, future Skills output,
 * any system-authored prose.
 *
 * Generators call `validateObservation(text)` before emitting; the
 * Briefing's synthesis (when it ships in B.X+) calls the same
 * validator on Pattern output. Same gate, same rules.
 *
 * IMPORTANT: a Deno-side duplicate of this module lives at
 * `supabase/functions/heartbeat/voice-document.ts` so the Edge-Function
 * generators can run the same validator without cross-runtime imports.
 * Both files MUST stay in sync. Each file carries a sync-note pointing
 * at the other.
 */

// ─── Hard ban: Briefing §5.1 corporate-speak ───────────────────────────

/**
 * Words that never appear in system-authored output. Case-insensitive
 * match on whole-word boundaries. "Leverage" as a verb is banned; as
 * a noun ("operational leverage") it's also banned because the line
 * is fuzzy enough that allowing it leaks the corporate register.
 *
 * Common inflections are enumerated explicitly ("leverage" + "leveraged"
 * + "leveraging" + "leverages") because base-form mutation (drop -e
 * before -ing, swap -y for -ies) doesn't compress into the whole-word
 * regex. New entries should follow the same pattern.
 */
export const BANNED_CORPORATE_VOCAB: ReadonlyArray<string> = [
    // leverage + inflections
    "leverage",
    "leveraged",
    "leveraging",
    "leverages",
    // unlock + inflections
    "unlock",
    "unlocked",
    "unlocking",
    "unlocks",
    "revolutionize",
    "revolutionized",
    "revolutionizing",
    "revolutionizes",
    "revolutionary",
    // supercharge + inflections
    "supercharge",
    "supercharged",
    "supercharging",
    "supercharges",
    "magic",
    "magical",
    // transform + inflections
    "transform",
    "transformed",
    "transforming",
    "transforms",
    "transformative",
    "transformational",
    "game-changing",
    "game-changer",
    "paradigm shift",
    // synergy + plural
    "synergy",
    "synergies",
    "synergistic",
    "synergistically",
    "best-in-class",
    "world-class",
    "cutting-edge",
    "next-generation",
    "next-gen",
    "robust",
    // seamless + adverb
    "seamless",
    "seamlessly",
    "holistic",
    "holistically",
    "innovative",
    "innovatively",
    // empower + inflections
    "empower",
    "empowered",
    "empowering",
    "empowers",
    "empowerment",
    "ecosystem",
    "ecosystems",
    // streamline + inflections
    "streamline",
    "streamlined",
    "streamlining",
    "streamlines",
    "mission-critical"
];

// ─── Hard ban: canon Part III §11 single-noun abstractions ─────────────

/**
 * Single-word abstractions that try to do the work of a sentence.
 * Canon Part III §11 lists these explicitly. Any code or copy that
 * surfaces these to the operator MUST be rewritten as a full sentence.
 */
export const BANNED_PRODUCT_JARGON: ReadonlyArray<string> = [
    "wedge",
    "verdict",
    "the move",
    "decision-grade",
    "operating truth",
    "command intelligence",
    "field read",
    "loom read",
    "ingot read",
    "recovery cue",
    "output ingot",
    "required correction",
    "operator move",
    "main risk",
    "replacement pressure"
];

// ─── Hard ban: hedge constructions (Briefing §7.4) ─────────────────────

/**
 * Voice-of-no-confidence constructions. The voice commits to a read;
 * if it's wrong the operator provides feedback. These phrases
 * specifically retreat from a read.
 */
export const BANNED_HEDGE_CONSTRUCTIONS: ReadonlyArray<string> = [
    "it's worth noting that",
    "it is worth noting that",
    "it could be argued that",
    "there may be reasons to consider",
    "some observers might suggest",
    "it is possible, though not certain, that",
    "while the evidence is mixed, one interpretation is",
    "one could argue"
];

// ─── Preferred replacements (Briefing §5.3) ────────────────────────────

/**
 * Suggested substitutions when a banned word is caught. Not enforced
 * — generators should write the right phrase the first time. Present
 * for documentation + a future linter that surfaces suggestions.
 */
export const PREFERRED_REPLACEMENTS: Readonly<Record<string, string>> = {
    leverage: "use",
    unlock: "enable",
    supercharge: "improve",
    transform: "reshape",
    "game-changing": "consequential",
    "paradigm shift": "repositioning",
    synergy: "overlap",
    "best-in-class": "the strongest",
    seamless: "direct",
    holistic: "full",
    empower: "enable",
    ecosystem: "set of products",
    streamline: "simplify",
    "mission-critical": "load-bearing"
};

// ─── Structural rules (Briefing §6 + canon §11 plainness target) ───────

/** Maximum hedging adverbs per observation (Briefing §7.3). */
export const MAX_HEDGE_ADVERBS = 3;

const HEDGE_ADVERBS: ReadonlyArray<string> = [
    "may",
    "could",
    "might",
    "possibly",
    "potentially",
    "seems",
    "appears",
    "suggests"
];

// ─── Validator ─────────────────────────────────────────────────────────

export type VoiceViolationCode =
    | "banned_corporate_vocab"
    | "banned_product_jargon"
    | "banned_hedge_construction"
    | "too_many_hedge_adverbs"
    | "empty_text";

export interface VoiceViolation {
    readonly code: VoiceViolationCode;
    readonly message: string;
    readonly offender?: string;
}

export interface VoiceValidation {
    readonly valid: boolean;
    readonly violations: ReadonlyArray<VoiceViolation>;
}

/**
 * Case-insensitive whole-word match. Allows hyphenated phrases like
 * "game-changing" by anchoring on word-character boundaries that
 * include hyphens as part of the word.
 *
 * For inflected forms ("leveraged" / "leveraging" / "synergies"),
 * the banned list itself enumerates the inflections — base-form
 * mutation rules (drop -e before -ing, swap -y for -ies) don't
 * compress into a single regex. Adding the explicit forms is more
 * reliable than a fuzzy stem matcher.
 */
function containsWord(text: string, word: string): boolean {
    const lower = text.toLowerCase();
    const target = word.toLowerCase();
    if (!lower.includes(target)) return false;
    const re = new RegExp(
        `(?:^|[^a-z0-9-])${escapeRegex(target)}(?:$|[^a-z0-9-])`,
        "i"
    );
    return re.test(text);
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countHedgeAdverbs(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;
    for (const adv of HEDGE_ADVERBS) {
        const re = new RegExp(`\\b${adv}\\b`, "gi");
        const matches = lower.match(re);
        if (matches) count += matches.length;
    }
    return count;
}

/**
 * Validate a sentence (or short paragraph) against the voice rules.
 * Returns the full list of violations so generators can log all
 * issues at once, not just the first.
 *
 * Generators that legitimately need a banned word can pass a waiver
 * list (e.g., "the product is literally called Synergy"). Empty for
 * all four Phase B generators.
 */
export function validateObservation(
    text: string,
    waivers: ReadonlyArray<string> = []
): VoiceValidation {
    const violations: VoiceViolation[] = [];
    const waiverSet = new Set(waivers.map((w) => w.toLowerCase()));

    if (!text || !text.trim()) {
        violations.push({
            code: "empty_text",
            message: "Observation text is empty."
        });
        return { valid: false, violations };
    }

    for (const word of BANNED_CORPORATE_VOCAB) {
        if (waiverSet.has(word.toLowerCase())) continue;
        if (containsWord(text, word)) {
            violations.push({
                code: "banned_corporate_vocab",
                message: `Banned corporate-speak: "${word}". Rewrite without it.`,
                offender: word
            });
        }
    }

    for (const phrase of BANNED_PRODUCT_JARGON) {
        if (waiverSet.has(phrase.toLowerCase())) continue;
        if (containsWord(text, phrase)) {
            violations.push({
                code: "banned_product_jargon",
                message: `Banned product jargon: "${phrase}". Canon Part III §11: write the sentence out, don't reach for a single noun.`,
                offender: phrase
            });
        }
    }

    const lower = text.toLowerCase();
    for (const phrase of BANNED_HEDGE_CONSTRUCTIONS) {
        if (lower.includes(phrase)) {
            violations.push({
                code: "banned_hedge_construction",
                message: `Banned hedge construction: "${phrase}". The voice commits to a read.`,
                offender: phrase
            });
        }
    }

    const adverbs = countHedgeAdverbs(text);
    if (adverbs > MAX_HEDGE_ADVERBS) {
        violations.push({
            code: "too_many_hedge_adverbs",
            message: `Too many hedge adverbs (${adverbs} > ${MAX_HEDGE_ADVERBS}). Briefing §7.3.`
        });
    }

    return { valid: violations.length === 0, violations };
}

/**
 * Compact format for log output. Generators that fail validation
 * should log this and EITHER (a) drop the candidate, OR (b) be
 * retired by ID via the `source_generator` column.
 */
export function formatViolations(v: VoiceValidation): string {
    if (v.valid) return "(passes voice rules)";
    return v.violations.map((x) => `${x.code}: ${x.message}`).join(" | ");
}
