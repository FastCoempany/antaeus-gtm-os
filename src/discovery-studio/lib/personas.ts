/**
 * Persona-tuned discovery questions.
 *
 * Absorbed from the retired Call Planner room (canon §4.11 → §4.12,
 * 2026-07-06): six buyer lenses × three discovery questions each. The
 * live cockpit layers these on top of the framework-organized question
 * set as a persona lens.
 *
 * The questions keep their literal wrapping double-quotes from the
 * original question bank; render them through `unquoteQuestion`.
 *
 * Pure data + lookup helpers. No signals, no DOM.
 */

export type PersonaKey = "cxo" | "vp" | "ops" | "it" | "finance" | "revops";

export const PERSONA_KEYS: ReadonlyArray<PersonaKey> = [
    "cxo",
    "vp",
    "ops",
    "it",
    "finance",
    "revops"
];

export const PERSONA_LABELS: Readonly<Record<PersonaKey, string>> = {
    cxo: "C-Suite Executive",
    vp: "VP / Director",
    ops: "Operations Leader",
    it: "IT / Engineering Leader",
    finance: "Finance Leader",
    revops: "RevOps Leader"
};

export const QUESTION_BANK: Readonly<Record<PersonaKey, ReadonlyArray<string>>> = {
    cxo: [
        '"From where you sit, what\'s the biggest operational bottleneck right now?"',
        '"How are you thinking about the build vs. buy decision for [area]?"',
        '"What would need to be true for this to become a priority this quarter?"'
    ],
    vp: [
        '"Walk me through how your team handles [process] today."',
        '"Where are you losing the most time or quality in that workflow?"',
        '"If you could fix one thing about your current stack, what would it be?"'
    ],
    ops: [
        '"What does a typical day look like for your team?"',
        '"How much manual work is involved in [process]?"',
        '"What have you tried before to fix this?"'
    ],
    it: [
        '"What does your current architecture look like for [area]?"',
        '"What are the integration requirements that would make or break this?"',
        '"How does your team evaluate new tools from a security standpoint?"'
    ],
    finance: [
        '"How are you currently tracking the ROI on your [area] investments?"',
        '"What does the approval process look like for a purchase at this level?"',
        '"What would make this a clear yes from a financial perspective?"'
    ],
    revops: [
        '"What does your current tech stack look like end-to-end?"',
        '"Where are the biggest gaps in data flow between teams?"',
        '"How are you measuring pipeline efficiency today?"'
    ]
};

/** Look up the question list for a persona; falls back to cxo when unknown. */
export function questionsFor(persona: PersonaKey): ReadonlyArray<string> {
    return QUESTION_BANK[persona] ?? QUESTION_BANK.cxo;
}

/**
 * Strip the legacy literal-quote wrapping from a question string so it
 * renders cleanly as a numbered list item ("01. From where you sit..."
 * rather than "01. \"From where you sit...\""). Mirrors legacy line
 * 1035's regex `q.replace(/^"|"$/g,'')`.
 */
export function unquoteQuestion(q: string): string {
    return q.replace(/^"|"$/g, "");
}
