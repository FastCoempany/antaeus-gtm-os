import type { AccentRole } from "@/components";
import type {
    ConcessionStep,
    Negotiation,
    NegotiationOutcome
} from "../../lib/types";
import { draft, draftDeal } from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Maps recorded negotiation preparation to display tones and next steps.
 * The score measures field completion, not negotiation quality or actual
 * rehearsal. Stable band identifiers support existing integrations.
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
    improvising: "Walkaway missing",
    drafting: "Preparation incomplete",
    rehearsed: "Ready for review"
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
 * Preparation assessment from draft fields and whether a deal is linked.
 * A missing walkaway position always uses the least-prepared band.
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
    if (!hasWalkaway) gaps.push("Your walkaway position: terms you will not accept");
    if (!hasStarting) gaps.push("Your starting offer");
    if (!hasOpening) gaps.push("Your opening line for the conversation");
    if (!input.dealLinked) gaps.push("A linked deal to associate with the outcome");

    let band: PrepBand;
    let title: string;
    let nextMove: string;

    if (!hasWalkaway) {
        band = "improvising";
        title = "Your walkaway position is not recorded.";
        nextMove =
            "Set your walkaway position: the price or terms you will not accept. Confirm any required approval before the negotiation.";
    } else if (score >= 80) {
        band = "rehearsed";
        title = "Core preparation is recorded. Review any remaining gaps.";
        nextMove = !hasOpening
            ? "Draft the opening line before rehearsing the conversation."
            : input.dealLinked
              ? "Rehearse the pushbacks and confirm which concessions are approved. Record the outcome on the linked deal afterward."
              : "Link the deal to associate it with this preparation and the negotiation outcome.";
    } else {
        band = "drafting";
        title = "Complete the remaining preparation before negotiating.";
        nextMove = !hasStarting
            ? "Set the starting position you plan to offer."
            : !hasOpening
              ? "Draft the opening line for the conversation."
              : "Link the deal to associate it with this preparation and the negotiation outcome.";
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
 * Links this preparation and its next step to the selected Deal Workspace.
 * No handoff is shown until a deal is linked.
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
