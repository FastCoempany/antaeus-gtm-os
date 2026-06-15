import type { AccentRole } from "@/components";
import type {
    ConcessionStep,
    Negotiation,
    NegotiationOutcome
} from "../../lib/types";
import { draft, draftDeal } from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Pure adapters — map the Negotiation desk onto the design-system tones
 * the DS surface composes. Negotiation has no scoring engine of its own
 * (it carries seed scripts, not a quality model), so the dominant
 * synthesis the made object needs is a presentation-layer read of one
 * thing only: has the operator actually pre-decided, or are they about
 * to improvise? That is the room's whole point per canon §4.16b —
 * "every concession is a deliberate move, not a reflex." The read
 * rewards the walkaway being set above everything else: the line you
 * won't cross is the one decision that turns a negotiation from a
 * reflex into a plan.
 *
 * This is a derivation off the existing draft signal (the same shape as
 * the today surface's adapters mapping CommandObjects → zones), not a
 * new domain engine. The seed scripts, the persistence, the cross-room
 * handoff, and the cloud sync are untouched.
 */

const COST_TONE: Record<ConcessionStep["cost"], AccentRole | undefined> = {
    free: "green",
    low: "blue",
    mid: "amber",
    high: "red"
};
/** Concession cost → tone. Read top-to-bottom = ascending cost. */
export function costTone(cost: ConcessionStep["cost"]): AccentRole | undefined {
    return COST_TONE[cost];
}

const OUTCOME_TONE: Record<NegotiationOutcome, AccentRole> = {
    held_position: "green",
    moved_one_step: "blue",
    moved_two_plus: "amber",
    walked_away: "amber",
    lost_to_pricing: "red"
};
/** Negotiation outcome → tone. Held = green, lost = red. */
export function outcomeTone(outcome: NegotiationOutcome): AccentRole {
    return OUTCOME_TONE[outcome];
}

export type PrepBand = "improvising" | "drafting" | "rehearsed";

const PREP_TONE: Record<PrepBand, AccentRole> = {
    improvising: "red",
    drafting: "amber",
    rehearsed: "green"
};
export function prepTone(band: PrepBand): AccentRole {
    return PREP_TONE[band];
}

const PREP_LABEL: Record<PrepBand, string> = {
    improvising: "Improvising",
    drafting: "Drafting",
    rehearsed: "Rehearsed"
};

export interface PrepRead {
    readonly score: number;
    readonly band: PrepBand;
    readonly bandLabel: string;
    readonly title: string;
    readonly nextMove: string;
    readonly gaps: ReadonlyArray<string>;
}

export interface PrepInput {
    readonly draft: Negotiation;
    readonly dealLinked: boolean;
}

/**
 * The rehearsal-readiness read. Pure — takes the draft + whether a deal
 * is linked, returns the dominant synthesis. The walkaway gates the
 * band: without the line you won't cross, you're improvising no matter
 * how much else is filled in.
 */
export function computePrepRead(input: PrepInput): PrepRead {
    const d = input.draft;
    const hasWalkaway = d.walkawayPosition.trim().length > 0;
    const hasStarting = d.startingPosition.trim().length > 0;
    const hasOpening = d.openingLine.trim().length > 0;
    const hasPerson = d.counterpartyName.trim().length > 0;

    const score =
        (hasWalkaway ? 35 : 0) +
        (hasStarting ? 25 : 0) +
        (hasOpening ? 20 : 0) +
        (input.dealLinked ? 10 : 0) +
        (hasPerson ? 10 : 0);

    const gaps: string[] = [];
    if (!hasWalkaway) gaps.push("The walkaway — the line you won't cross");
    if (!hasStarting) gaps.push("The starting position you open with");
    if (!hasOpening) gaps.push("The opening line, authored not improvised");
    if (!input.dealLinked) gaps.push("A linked deal for the outcome to land on");

    let band: PrepBand;
    let title: string;
    let nextMove: string;

    if (!hasWalkaway) {
        band = "improvising";
        title = "You haven't set the line you won't cross.";
        nextMove =
            "Decide your walkaway first — below it you walk, and you decide that now, not in the room.";
    } else if (score >= 80) {
        band = "rehearsed";
        title = "Every concession is pre-decided. Walk in.";
        nextMove = input.dealLinked
            ? "Run the pushbacks one more time, then go. The outcome lands on the deal."
            : "Link the deal so the outcome and the ladder land where the pressure lives.";
    } else {
        band = "drafting";
        title = "The positions are forming. Decide the rest before you walk in.";
        nextMove = !hasStarting
            ? "Set the starting position you open with."
            : !hasOpening
              ? "Author the opening line — the actual first words."
              : "Link the deal so the rehearsal lands where the pressure lives.";
    }

    return {
        score,
        band,
        bandLabel: PREP_LABEL[band],
        title,
        nextMove,
        gaps
    };
}

/** The live rehearsal read, off the current draft + linked deal. */
export function prepRead(): PrepRead {
    return computePrepRead({
        draft: draft.value,
        dealLinked: draftDeal.value != null
    });
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the negotiation is rehearsed here so its
 * outcome can land on the deal. Once a deal is linked, the one next move
 * is to carry the rehearsal back into the Deal Workspace where the
 * high-pressure phase actually lives (canon §4.16b triangle). Absent
 * until a deal is on the desk.
 */
export function toPulling(): PullingData | undefined {
    const deal = draftDeal.value;
    if (!deal) return undefined;
    const read = prepRead();
    return {
        verb: "Update the deal",
        object: deal.accountName,
        href: hrefToDealWorkspace(deal.id, deal.accountName),
        reasons: [read.title, read.nextMove]
            .filter((s) => s && s.length > 0)
            .slice(0, 4)
    };
}
