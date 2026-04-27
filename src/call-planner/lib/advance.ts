import type { AgendaQuality, Draft, LinkedDeal } from "./types";

/**
 * Phase 4 / Room 9 Wave 2 — advance-ask copy.
 *
 * Faithful TypeScript port of the legacy `getAdvanceAsk(quality)` from
 * `app/discovery-agenda/index.html` lines 733-744. Returns the two
 * lines rendered in the Advance ask strip:
 *   - `ask`  — the hard ask (varies on whether a deal is linked)
 *   - `note` — the one-line coach (varies on whether the why-now is
 *              live signal vs manual notes vs absent)
 *
 * Pure: takes the quality projection + draft + linked deal explicitly.
 */

export interface AdvanceAsk {
    readonly ask: string;
    readonly note: string;
}

export function getAdvanceAsk(
    quality: AgendaQuality,
    draft: Draft,
    linkedDeal: LinkedDeal | null
): AdvanceAsk {
    const ask = linkedDeal
        ? `Leave with a dated next step and a named internal owner on ${linkedDeal.accountName || "the linked deal"}.`
        : "Leave with a dated next step and then attach the result to a real deal before the day ends.";

    let note: string;
    if (quality.hasSignal) {
        note = "The live pressure is already visible. Convert it into an owned move.";
    } else if (draft.customNotes.trim().length >= 20) {
        note =
            "Manual context is doing the why-now work. Make the ask specific enough to survive the handoff.";
    } else {
        note =
            "If the reason now is still vague, the advance ask will sound vague too.";
    }

    return { ask, note };
}
