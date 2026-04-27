import { getAdvanceAsk } from "./advance";
import { questionsFor, unquoteQuestion } from "./personas";
import { evaluateQuality, type QualityInputs } from "./quality";
import type {
    Draft,
    LinkedDeal,
    MatchedAccount,
    PersonaKey
} from "./types";
import { PERSONA_LABELS } from "./types";

/**
 * Phase 4 / Room 9 Wave 2 — agenda brief generator.
 *
 * Faithful TypeScript port of the legacy `getAgendaBriefText()` from
 * `app/discovery-agenda/index.html` lines 746-775. Produces the multi-
 * line plain-text brief the operator copies to clipboard for use in
 * external tools (Notion, Granola, etc.).
 *
 * Pure: takes the full inputs explicitly. The opener line varies on
 * whether a top signal headline exists; the reason-now line picks
 * between top signal / custom notes / fallback "no durable why-now
 * yet"; the probe section uses the persona-specific questions.
 */

export interface BriefInputs extends QualityInputs {
    readonly draft: Draft;
    readonly matchedAccount: MatchedAccount | null;
    readonly linkedDeal: LinkedDeal | null;
}

function openerLine(topSignal: string): string {
    if (topSignal) {
        return `I noticed ${topSignal.toLowerCase()} and wanted to understand how that is changing priorities on your side.`;
    }
    return "Thanks for making time. I wanted to start with how your team is handling this workflow today and where the handoff is breaking.";
}

function reasonNowLine(topSignal: string, customNotes: string): string {
    if (topSignal) return topSignal;
    if (customNotes.trim().length > 0) return customNotes;
    return "No durable why-now angle yet.";
}

function companyLabel(
    matchedAccount: MatchedAccount | null,
    linkedDeal: LinkedDeal | null
): string {
    if (matchedAccount) return matchedAccount.name;
    if (linkedDeal) return linkedDeal.accountName;
    return "No account context yet";
}

function personaLabel(persona: PersonaKey): string {
    return PERSONA_LABELS[persona] ?? "No persona";
}

export function buildAgendaBrief(inputs: BriefInputs): string {
    const quality = evaluateQuality(inputs);
    const advance = getAdvanceAsk(quality, inputs.draft, inputs.linkedDeal);
    const topSignal = inputs.matchedAccount?.topSignal?.headline ?? "";
    const company = companyLabel(inputs.matchedAccount, inputs.linkedDeal);
    const lines: string[] = [
        "Call Planner Brief",
        `Contact: ${inputs.draft.contactName.trim() || "No person selected"}`,
        `Persona: ${personaLabel(inputs.draft.persona)}`,
        `Company: ${company}`,
        inputs.linkedDeal
            ? `Linked deal: ${inputs.linkedDeal.accountName || "Linked deal"}`
            : "Linked deal: none",
        "",
        "Opener:",
        openerLine(topSignal),
        "",
        "Reason now:",
        reasonNowLine(topSignal, inputs.draft.customNotes),
        "",
        "Probe questions:"
    ];
    const probes = questionsFor(inputs.draft.persona);
    probes.forEach((q, i) => {
        lines.push(`${i + 1}. ${unquoteQuestion(q)}`);
    });
    lines.push("");
    lines.push("Advance ask:");
    lines.push(advance.ask);
    lines.push(advance.note);
    return lines.join("\n");
}
