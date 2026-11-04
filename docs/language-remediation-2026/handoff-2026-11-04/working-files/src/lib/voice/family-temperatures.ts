/**
 * Family temperatures — one voice, eight registers (01 Part III +
 * the visitor register decided 2026-06-08).
 *
 * Use plain business language, evidence beside assessments, and calibrated
 * uncertainty. Family names below are stable technical keys, never labels
 * to teach users. Pacing, sentence length and urgency fit each task without
 * replacing necessary explanation with fragments. The validator reads
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
            "Welcoming and direct; explain setup requirements and what the next action does.",
    },
    "command-chamber": {
        family: "command-chamber",
        maxSentenceWords: 26,
        register:
            "Calm and specific; explain the evidence behind a priority and recommend a concrete next action.",
    },
    "live-instrument": {
        family: "live-instrument",
        maxSentenceWords: 18,
        register:
            "Concise during execution; name the task, current state and next action without dropping necessary context.",
    },
    "decision-bench": {
        family: "decision-bench",
        maxSentenceWords: 26,
        register:
            "Deliberate and precise; name the plan or decision, its missing inputs and the recommended improvement.",
    },
    "diagnosis-table": {
        family: "diagnosis-table",
        maxSentenceWords: 24,
        register:
            "Explain the observed risk factors, distinguish assessment from forecast, and recommend a corrective action.",
    },
    "system-ledger": {
        family: "system-ledger",
        maxSentenceWords: 30,
        register:
            "Summarize evidence, explain the resulting state and identify what would improve it.",
    },
    "trust-annex": {
        family: "trust-annex",
        maxSentenceWords: 24,
        register:
            "Plain utility; state the operation, its scope, the result and any recovery action.",
    },
    visitor: {
        family: "visitor",
        maxSentenceWords: 30,
        register:
            "Explain the product category and useful differences with specific, supportable claims.",
    },
};

export const DEFAULT_FAMILY: VoiceFamily = "command-chamber";
