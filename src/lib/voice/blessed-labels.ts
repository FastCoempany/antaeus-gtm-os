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

/** Canon Part III §10 — the state vocabulary, exactly as written. */
export const STATE_VOCABULARY: ReadonlyArray<string> = [
    "Ready now",
    "Workable",
    "Thin",
    "Operating",
    "Needs intervention",
    "At risk",
    "Handoff-ready",
    "Partial",
    "Compounding",
    "Still weak",
];

const blessed = new Set(
    [...BLESSED_UI_LABELS, ...STATE_VOCABULARY].map((s) => s.toLowerCase()),
);

/** True when the whole string is a pre-blessed label. */
export function isBlessedLabel(text: string): boolean {
    return blessed.has(text.trim().toLowerCase());
}
