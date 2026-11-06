/**
 * Blessed labels — the allowlist for short surface strings (01 §2.3).
 *
 * Two sets: common UI nouns approved for label use without per-
 * instance re-litigation, and the canon Part III §10 state vocabulary,
 * which is canonical and pre-blessed. Adding to either list is a
 * canon change (founder-approved PR; README Part IV).
 */

export const BLESSED_UI_LABELS: ReadonlyArray<string> = [
    "OK",
    "Yes",
    "No",
    "Cancel",
    "Next",
    "Previous",
    "More",
    "Less",
    "Back",
    "Close",
];

/**
 * Canon Part III §10 — the state vocabulary, exactly as written there
 * (aligned to COPY_STANDARD §13/§17/§20 on 2026-11-05). A state names an
 * observable condition. Retired as primary labels: Thin, Compounding,
 * Still weak, Workable, Operating, Handoff-ready.
 */
export const STATE_VOCABULARY: ReadonlyArray<string> = [
    "Ready now",
    "At risk",
    "Needs intervention",
    "Partially complete",
    "Incomplete",
    "Meets requirement",
    "Below requirement",
    "Founder-dependent",
    "Partially documented",
    "Usable with founder support",
    "Hire-ready",
    "Hire-ready and repeatable",
];

const blessed = new Set(
    [...BLESSED_UI_LABELS, ...STATE_VOCABULARY].map((s) => s.toLowerCase()),
);

/** True when the whole string is a pre-blessed label. */
export function isBlessedLabel(text: string): boolean {
    return blessed.has(text.trim().toLowerCase());
}
