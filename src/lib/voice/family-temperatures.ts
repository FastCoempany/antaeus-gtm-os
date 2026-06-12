/**
 * Family temperatures — one voice, eight registers (01 Part III +
 * the visitor register decided 2026-06-08).
 *
 * The Antaeus voice is one voice: the peer operator with a decade of
 * B2B sales scars, plain English, declarative over hedged. What
 * changes per composition family is the temperature — pacing, sentence
 * length, urgency — calibrated to the room's job. The validator reads
 * the family from the string's declared context and applies that
 * family's thresholds.
 *
 * The eighth entry, `visitor`, is the brand register (scoping doc
 * §2.7): how Antaeus speaks to a prospect on marketing surfaces. Same
 * banned list, same claim anchor; more positioning-aware, slightly
 * longer sentences allowed.
 */

export type VoiceFamily =
    | "threshold"
    | "command-chamber"
    | "live-instrument"
    | "decision-bench"
    | "diagnosis-table"
    | "system-ledger"
    | "trust-annex"
    | "visitor";

export interface FamilyTemperature {
    readonly family: VoiceFamily;
    /** Max words per sentence before the speakability warning fires. */
    readonly maxSentenceWords: number;
    /** One line a builder reads to know the register. */
    readonly register: string;
}

export const FAMILY_TEMPERATURES: Readonly<
    Record<VoiceFamily, FamilyTemperature>
> = {
    threshold: {
        family: "threshold",
        maxSentenceWords: 22,
        register:
            "Invitational and confidence-building; short, warm-but-not-friendly sentences that move the operator into real work.",
    },
    "command-chamber": {
        family: "command-chamber",
        maxSentenceWords: 26,
        register:
            "Calm, ranked, precise — a sharp operator telling you what they see and the one move they would make.",
    },
    "live-instrument": {
        family: "live-instrument",
        maxSentenceWords: 18,
        register:
            "Tense and immediate; the shortest sentences in the product, because the operator is mid-action.",
    },
    "decision-bench": {
        family: "decision-bench",
        maxSentenceWords: 26,
        register:
            "Deliberate and exacting; speaks about the object being sharpened and what got stronger.",
    },
    "diagnosis-table": {
        family: "diagnosis-table",
        maxSentenceWords: 24,
        register:
            "Severe and corrective; names the decay plainly and the smallest move that changes the trajectory.",
    },
    "system-ledger": {
        family: "system-ledger",
        maxSentenceWords: 30,
        register:
            "Settled and synthesizing; reconciles evidence into one state and what would move it next.",
    },
    "trust-annex": {
        family: "trust-annex",
        maxSentenceWords: 24,
        register:
            "Plainspoken utility; no drama, clear recovery moves, nothing that performs.",
    },
    visitor: {
        family: "visitor",
        maxSentenceWords: 30,
        register:
            "The brand register: speaking to a prospect, positioning-aware, can name the category and the enemy — and still zero deck-speak; the claim (01 §2.6) is the anchor.",
    },
};

export const DEFAULT_FAMILY: VoiceFamily = "command-chamber";
