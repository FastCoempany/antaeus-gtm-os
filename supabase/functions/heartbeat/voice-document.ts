/**
 * Voice Document — Deno-side executable language rules.
 * Sync source: `src/lib/voice/voice-document.ts`.
 *
 * Directness does not require false certainty. Facts can be categorical;
 * assessments and forecasts should use calibrated language when the evidence
 * does not justify certainty.
 */

export const BANNED_CORPORATE_VOCAB: ReadonlyArray<string> = [
    "leverage", "leveraged", "leveraging", "leverages",
    "unlock", "unlocked", "unlocking", "unlocks",
    "revolutionize", "revolutionized", "revolutionizing", "revolutionizes", "revolutionary",
    "supercharge", "supercharged", "supercharging", "supercharges",
    "magic", "magical",
    "transform", "transformed", "transforming", "transforms", "transformative", "transformational",
    "game-changing", "game-changer", "paradigm shift",
    "synergy", "synergies", "synergistic", "synergistically",
    "best-in-class", "world-class", "cutting-edge", "next-generation", "next-gen", "robust",
    "seamless", "seamlessly", "holistic", "holistically", "innovative", "innovatively",
    "empower", "empowered", "empowering", "empowers", "empowerment",
    "ecosystem", "ecosystems",
    "streamline", "streamlined", "streamlining", "streamlines",
    "mission-critical"
];

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

/**
 * Indirect/metadiscursive qualification. These phrases are banned because they
 * frame the act of qualifying a claim instead of stating evidence + assessment.
 * This is not a ban on `may`, `suggests`, `appears`, or other calibrated terms.
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

export const BANNED_META_HEDGE_CONSTRUCTIONS = BANNED_HEDGE_CONSTRUCTIONS;

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
    "mission-critical": "important"
};

export const UNCERTAINTY_STACK_REVIEW_THRESHOLD = 3;
/** @deprecated Compatibility alias. Do not use as a hard validity cap. */
export const MAX_HEDGE_ADVERBS = UNCERTAINTY_STACK_REVIEW_THRESHOLD;

export type VoiceViolationCode =
    | "banned_corporate_vocab"
    | "banned_product_jargon"
    | "banned_hedge_construction"
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

function containsWord(text: string, word: string): boolean {
    const lower = text.toLowerCase();
    const target = word.toLowerCase();
    if (!lower.includes(target)) return false;
    const re = new RegExp(`(?:^|[^a-z0-9-])${escapeRegex(target)}(?:$|[^a-z0-9-])`, "i");
    return re.test(text);
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validateObservation(
    text: string,
    waivers: ReadonlyArray<string> = []
): VoiceValidation {
    const violations: VoiceViolation[] = [];
    const waiverSet = new Set(waivers.map((w) => w.toLowerCase()));

    if (!text || !text.trim()) {
        return {
            valid: false,
            violations: [{ code: "empty_text", message: "Observation text is empty." }]
        };
    }

    for (const word of BANNED_CORPORATE_VOCAB) {
        if (waiverSet.has(word.toLowerCase())) continue;
        if (containsWord(text, word)) {
            violations.push({
                code: "banned_corporate_vocab",
                message: `Banned corporate-speak: "${word}". Write the business meaning directly.`,
                offender: word
            });
        }
    }

    for (const phrase of BANNED_PRODUCT_JARGON) {
        if (waiverSet.has(phrase.toLowerCase())) continue;
        if (containsWord(text, phrase)) {
            violations.push({
                code: "banned_product_jargon",
                message: `Banned product jargon: "${phrase}". State the underlying business concept explicitly.`,
                offender: phrase
            });
        }
    }

    const lower = text.toLowerCase();
    for (const phrase of BANNED_META_HEDGE_CONSTRUCTIONS) {
        if (lower.includes(phrase)) {
            violations.push({
                code: "banned_hedge_construction",
                message: `Indirect framing: "${phrase}". State the evidence and calibrated assessment directly.`,
                offender: phrase
            });
        }
    }

    return { valid: violations.length === 0, violations };
}

export function formatViolations(v: VoiceValidation): string {
    if (v.valid) return "(passes voice rules)";
    return v.violations.map((x) => `${x.code}: ${x.message}`).join(" | ");
}
