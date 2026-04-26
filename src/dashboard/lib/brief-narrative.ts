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
        "No active deals, signals, or recovery moves are publishing into the command surface.",
        "Once Discovery Studio, Deal Workspace, Signal Console, or Readiness publish a snapshot, the morning brief composes from live data."
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

    // Sentence 1 — what's at the top.
    sentences.push(
        `${spotlight.roomFamilyLabel} pressure is leading: ${spotlight.title.replace(/\.$/, "")}.`
    );

    // Sentence 2 — composition of the queue.
    const compositionParts: string[] = [];
    if (riskCount) compositionParts.push(pluralize(riskCount, "deal", "deals") + " in recovery");
    if (moveCount) compositionParts.push(pluralize(moveCount, "move", "moves") + " ready");
    if (systemCount) compositionParts.push(pluralize(systemCount, "system", "system") + " note");
    if (compositionParts.length) {
        sentences.push(`The queue holds ${joinList(compositionParts)}.`);
    }

    // Sentence 3 — confidence on the lead, if interesting.
    const label = spotlight.rankingConfidenceLabel;
    if (label === "stable lead" || label === "supported") {
        sentences.push(
            `The ranking is ${label} — same object likely tomorrow unless the live snapshot moves.`
        );
    } else if (label === "mixed signal") {
        sentences.push(
            "Ranking confidence is mixed — re-check after the next snapshot before committing the day."
        );
    }

    // Sentence 4 — closest follow-on, if there is one.
    const second = ranked[1];
    if (second && second.id !== spotlight.id) {
        sentences.push(
            `Right behind it: ${second.title.replace(/\.$/, "")} (${second.roomFamilyLabel}).`
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
