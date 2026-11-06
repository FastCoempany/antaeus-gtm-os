import type { SeedDeal } from "../draft";

/** Deterministic assessment of recorded deal fields. These checks identify
 * missing information and follow-up needs; they do not predict the outcome. */

export type DiagnosisTone = "red" | "amber" | "green";

export interface Diagnosis {
    readonly tone: DiagnosisTone;
    readonly label: string;
    readonly read: string;
    readonly move: string;
}

function isLate(stage: SeedDeal["stage"]): boolean {
    return stage === "proposal" || stage === "negotiation" || stage === "verbal-yes";
}

function blank(s: string): boolean {
    return !s || s.trim().length === 0;
}

export function diagnoseDeal(deal: SeedDeal): Diagnosis {
    // Stage unclear: name it honestly rather than letting them guess.
    if (deal.stage === "unsure") {
        return {
            tone: "amber",
            label: "Stage unclear",
            read: "No deal stage is selected. Confirm the buyer’s current decision process before assigning a stage.",
            move: "Confirm the next buyer action, its owner, and the stage criteria it satisfies."
        };
    }

    const noSigner = blank(deal.whoSigns) || /not\s+named|unknown|\?/i.test(deal.whoSigns);
    const noChampion = blank(deal.champion);
    const late = isLate(deal.stage);
    const stuckText = deal.stuck.toLowerCase();
    const silent = /silent|no reply|quiet|dark|stalled|no response/.test(stuckText);
    const single = /single|one contact|only talking|one person/.test(stuckText);

    // Red: late and missing the person who signs, or late and gone silent.
    if (late && (noSigner || silent)) {
        const why = noSigner
            ? "no signer recorded"
            : "a reported gap in buyer responses";
        return {
            tone: "red",
            label: "At risk",
            read: `This deal is in a late stage with ${why}. This needs review before relying on the planned close date.`,
            move: noSigner
                ? "Confirm who can sign and agree on a dated next step."
                : "Ask whether the buyer’s priorities or timeline have changed and agree on the next action."
        };
    }

    // Amber: single-threaded late, or no champion, or no signer earlier.
    if (late && single) {
        return {
            tone: "amber",
            label: "Single contact",
            read: "The deal is in a late stage and your notes indicate one contact. A change in that person’s availability or support could delay approval.",
            move: "Identify the other decision makers and confirm their approval requirements."
        };
    }
    if (noChampion) {
        return {
            tone: "amber",
            label: "No champion",
            read: "No champion is recorded. The current information does not show who will advocate for the proposal internally.",
            move: "Identify an internal supporter and confirm whether they can help coordinate the buying process."
        };
    }
    if (noSigner) {
        return {
            tone: "amber",
            label: "Signer not recorded",
            read: "No signer is recorded. Confirm the approval process before planning the close.",
            move: "Ask your champion who approves the purchase and who signs the agreement."
        };
    }

    // Otherwise: live and reasonably qualified.
    return {
        tone: "green",
        label: "Key contacts recorded",
        read: "A champion and signer are recorded, and these checks found no additional flag. This does not establish overall deal health.",
        move: "Confirm the next buyer action, owner, and date."
    };
}
