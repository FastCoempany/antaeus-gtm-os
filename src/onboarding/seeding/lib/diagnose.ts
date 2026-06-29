import type { SeedDeal } from "../draft";

/**
 * Deterministic deal diagnosis (ADR-019, slice 5). Reads the judgment the
 * operator just entered and names the risk + the smallest corrective move
 * — the differentiated "this deal is about to die, here's the fix" read,
 * the thing that makes Antaeus not a prettier CRM. No LLM: it's computed
 * from the fields (missing economic buyer, late-stage single-thread, a
 * vague next step). Mirrors the shape of the deal-health engine the
 * Deal Workspace + Future Autopsy already use.
 */

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
    const noSigner = blank(deal.whoSigns) || /not\s+named|unknown|\?/i.test(deal.whoSigns);
    const noChampion = blank(deal.champion);
    const late = isLate(deal.stage);
    const stuckText = deal.stuck.toLowerCase();
    const silent = /silent|no reply|quiet|dark|stalled|no response/.test(stuckText);
    const single = /single|one contact|only talking|one person/.test(stuckText);

    // Red: late and missing the person who signs, or late and gone silent.
    if (late && (noSigner || silent)) {
        const why = noSigner
            ? "no economic buyer named"
            : "it's gone quiet";
        return {
            tone: "red",
            label: "At risk",
            read: `Late stage and ${why}. Deals don't close without the person who signs in the room.`,
            move: noSigner
                ? "Get a name on who signs, and a dated next step, before it goes cold."
                : "Re-open it with a reason to move now — not a check-in."
        };
    }

    // Amber: single-threaded late, or no champion, or no signer earlier.
    if (late && single) {
        return {
            tone: "amber",
            label: "Fragile",
            read: "You're single-threaded this late. One departure or one skeptic kills it.",
            move: "Multi-thread to the buying group before terms land."
        };
    }
    if (noChampion) {
        return {
            tone: "amber",
            label: "No champion",
            read: "Nobody named is fighting for this on the inside. That's the difference between a deal and a hope.",
            move: "Find — or build — one person who'll sell it when you're not in the room."
        };
    }
    if (noSigner) {
        return {
            tone: "amber",
            label: "Early, watch the signer",
            read: "You don't know who signs yet. Find that out before you invest more.",
            move: "Map the economic buyer this week, while the champion's warm."
        };
    }

    // Otherwise: live and reasonably qualified.
    return {
        tone: "green",
        label: "Live",
        read: "Champion named, signer known, nothing screaming. Keep the next step dated.",
        move: "Protect the momentum — confirm the next step before this call ends."
    };
}
