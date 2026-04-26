import type { JSX } from "preact";
import { commandSummary } from "../state";
import { buildBriefNarrative } from "../lib/brief-narrative";

/**
 * BriefView — Wave 4 implementation.
 *
 * Per canon Part III §8 (session design arc): the Brief is what the
 * operator opens to first thing in the morning. 3-5 sentence
 * narrative composed from the live ranked summary + one
 * variable-insight line below.
 *
 * No "today is going to be great" tone — the narrative is unsentimental
 * operating truth (Part I §1 emotional territory: "harder to fool than
 * I am").
 */
export function BriefView(): JSX.Element {
    const summary = commandSummary.value;
    const narrative = buildBriefNarrative(summary);

    return (
        <section class="db-brief" aria-label="Brief">
            <header class="db-brief__header">
                <p class="db-brief__kicker">MORNING BRIEF</p>
                <h2 class="db-brief__headline">{narrative.headline}</h2>
            </header>
            <div class="db-brief__body">
                {narrative.sentences.map((s, i) => (
                    <p key={i} class="db-brief__line">
                        {s}
                    </p>
                ))}
            </div>
            {narrative.insight ? (
                <p class="db-brief__insight">
                    <span class="db-brief__insight-label">INSIGHT</span>
                    {narrative.insight}
                </p>
            ) : null}
        </section>
    );
}
