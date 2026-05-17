import type { CommandContextSummary } from "./types";
import { explainCommandObject } from "./command-intelligence";

/**
 * BriefNarrative — deterministic 3-5 sentence summary of the current
 * ranked surface, plus one variable-insight line.
 *
 * Per canon Part III §8 (session design arc): the Brief mode is what
 * the operator opens to first thing in the morning. It must read like
 * what changed since last session, not like a dashboard.
 *
 * The narrative is composed from the ranked summary, not from any
 * cached "morning brief" string — this keeps it honest as the live
 * input changes through the day.
 */

export interface BriefNarrative {
    readonly headline: string;
    readonly sentences: ReadonlyArray<string>;
    readonly insight: string;
}

const EMPTY_NARRATIVE: BriefNarrative = {
    headline: "Nothing under pressure right now.",
    sentences: [
        "No active deals, signals, or recovery moves to triage yet.",
        "Add an account in Signal Console or load a live deal in Deal Workspace — the morning brief fills in immediately."
    ],
    insight: ""
};

function pluralize(n: number, one: string, many: string): string {
    return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

function joinList(items: ReadonlyArray<string>): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0]!;
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildBriefNarrative(
    summary: CommandContextSummary
): BriefNarrative {
    const ranked = summary.ranked;
    const spotlight = summary.spotlight;
    if (!ranked.length || !spotlight) return EMPTY_NARRATIVE;

    const riskCount = summary.riskCards.length;
    const moveCount = summary.moveCards.length;
    const systemCount = summary.systemCards.length;

    const sentences: string[] = [];

    // Phase 2.2 audit — rewritten in plain operator voice. Was:
    //   "Motion pressure is leading: Outbound to Meridian Logistics."
    //   "The queue holds 4 moves ready."
    //   "The ranking is supported — same object likely tomorrow unless
    //    the live snapshot moves."
    //   "Right behind it: Outbound to Northstar Financial (Motion)."
    // All canon-doc voice that survived the Sarah-CRO sweep.

    // Sentence 1 — what's at the top (sentence-shaped, not card-shaped).
    sentences.push(
        `${spotlight.title.replace(/\.$/, "")} is the morning's top move.`
    );

    // Sentence 2 — composition of the queue.
    const compositionParts: string[] = [];
    if (riskCount) compositionParts.push(pluralize(riskCount, "deal", "deals") + " in recovery");
    if (moveCount) compositionParts.push(pluralize(moveCount, "move", "moves") + " queued");
    if (systemCount) compositionParts.push(pluralize(systemCount, "system", "system") + " note");
    if (compositionParts.length) {
        sentences.push(`${joinList(compositionParts).replace(/^\w/, (c) => c.toUpperCase())} behind it.`);
    }

    // Sentence 3 — confidence on the lead, if interesting.
    const label = spotlight.rankingConfidenceLabel;
    if (label === "stable lead") {
        sentences.push("The ranking is stable — this should still be the top move tomorrow.");
    } else if (label === "supported") {
        sentences.push("The ranking is well-supported by the live signals.");
    } else if (label === "mixed signal") {
        sentences.push("Ranking confidence is mixed — worth re-checking after lunch.");
    }

    // Sentence 4 — closest follow-on, if there is one.
    const second = ranked[1];
    if (second && second.id !== spotlight.id) {
        sentences.push(
            `Next up: ${second.title.replace(/\.$/, "")}.`
        );
    }

    // Insight = the engine's one-line explanation of the lead, in
    // brief register.
    const insight = explainCommandObject(spotlight, "brief").copy;

    return {
        headline: spotlight.title,
        sentences,
        insight
    };
}
