import type { AccentRole } from "@/components";
import type { AgendaQuality, QualityBand } from "../../lib/types";
import { evaluateQuality } from "../../lib/quality";
import { getAdvanceAsk } from "../../lib/advance";
import { questionsFor, unquoteQuestion } from "../../lib/personas";
import { draft, linkedDeal, matchedAccount, topSignalHeadline } from "../../state";
import { hrefToDiscoveryStudio } from "../../lib/handoff";

/**
 * Pure adapters — map the Call Planner quality + agenda engine onto the
 * design-system components the DS surface composes. The quality model,
 * the persona banks, and the advance-ask engine are untouched. These
 * translate the band into tone, compose the four agenda stops, and route
 * the prepared plan into Discovery Studio.
 */

const BAND_TONE: Record<QualityBand, AccentRole> = {
    credible: "green",
    workable: "blue",
    thin: "red"
};
export function bandTone(band: QualityBand): AccentRole {
    return BAND_TONE[band];
}

/** The live agenda quality, from the current draft + matched account/deal. */
export function agendaQuality(): AgendaQuality {
    return evaluateQuality({
        draft: draft.value,
        matchedAccount: matchedAccount.value,
        linkedDeal: linkedDeal.value
    });
}

// The opener / reason-now lines mirror brief.ts's private helpers (kept
// in sync) so the four stops render as distinct strips, not one blob.
function openerLine(topSignal: string): string {
    return topSignal
        ? `I noticed ${topSignal.toLowerCase()} and wanted to understand how that is changing priorities on your side.`
        : "Thanks for making time. I wanted to start with how your team is handling this workflow today and where the handoff is breaking.";
}
function reasonNowLine(topSignal: string, customNotes: string): string {
    if (topSignal) return topSignal;
    if (customNotes.trim().length > 0) return customNotes;
    return "No durable why-now angle yet.";
}

export interface AgendaStops {
    readonly opener: string;
    readonly reasonNow: string;
    readonly probes: ReadonlyArray<string>;
    readonly advanceAsk: string;
    readonly advanceNote: string;
}

/** The four agenda stops — Open / Reason now / Probe / Advance ask. */
export function agendaStops(): AgendaStops {
    const d = draft.value;
    const top = topSignalHeadline.value;
    const quality = agendaQuality();
    const advance = getAdvanceAsk(quality, d, linkedDeal.value);
    return {
        opener: openerLine(top),
        reasonNow: reasonNowLine(top, d.customNotes),
        probes: questionsFor(d.persona).map(unquoteQuestion),
        advanceAsk: advance.ask,
        advanceNote: advance.note
    };
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the plan exists to die in the call (get
 * used), so once a contact is named the one next move is to run discovery
 * with the plan loaded. Absent until the witness names a person.
 */
export function toPulling(): PullingData | undefined {
    const d = draft.value;
    if (!d.contactName.trim()) return undefined;
    const company = matchedAccount.value?.name ?? linkedDeal.value?.accountName ?? "";
    const quality = agendaQuality();
    return {
        verb: "Run discovery",
        object: d.contactName.trim(),
        href: hrefToDiscoveryStudio(company, company),
        reasons: [quality.nextMove, quality.bandLabel].filter((s) => s && s.length > 0).slice(0, 4)
    };
}
