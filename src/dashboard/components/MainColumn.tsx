import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { commandSummary } from "../state";
import { buildBriefNarrative } from "../lib/brief-narrative";
import { SignalLine } from "./SignalLine";

/**
 * MainColumn — the fluid main column of the Soft Cut layout.
 *
 * Sits beside the SliceRail (right column). What renders here adapts
 * to the active mode:
 *
 *   - brief    → MORNING BRIEF narrative (4-6 sentences + insight line)
 *                + SignalLine chip row above it. Sarah opens to a
 *                ready-to-read summary; the rail beside it shows the
 *                ranked items the narrative references.
 *
 *   - spotlight → SignalLine chip row + a quiet "Spotlight is the
 *                focal Slice on the right" pointer. The rail does the
 *                heavy lifting in spotlight mode (first Slice is
 *                enlarged); the main column gets out of the way.
 *
 *   - queue    → SignalLine chip row + ranking-confidence read +
 *                ranked-count summary. The rail renders all Slices
 *                equal-weight; the main column carries the meta-read.
 *
 * The SignalLine renders in all three modes — it's the canonical
 * Soft Cut workspace-state pulse, the chip row Sarah scans before
 * her eyes drop to the rail.
 */

interface Props {
    readonly mode: "brief" | "spotlight" | "queue";
}

export function MainColumn({ mode }: Props): JSX.Element {
    const summary = commandSummary.value;
    return (
        <section class="db-main" aria-label={t("Main column")}>
            <SignalLine objects={summary.ranked} />
            {mode === "brief" ? <BriefBlock /> : null}
            {mode === "spotlight" ? <SpotlightPointer /> : null}
            {mode === "queue" ? <QueueMeta /> : null}
        </section>
    );
}

function BriefBlock(): JSX.Element {
    const summary = commandSummary.value;
    const narrative = buildBriefNarrative(summary);
    return (
        <article class="db-main__brief">
            <header class="db-main__brief-head">
                <p class="db-main__brief-kicker">{t("MORNING BRIEF")}</p>
                <h2 class="db-main__brief-headline">{narrative.headline}</h2>
            </header>
            <div class="db-main__brief-body">
                {narrative.sentences.map((s, i) => (
                    <p key={i} class="db-main__brief-line">
                        {s}
                    </p>
                ))}
            </div>
            {narrative.insight ? (
                <p class="db-main__brief-insight">
                    <span class="db-main__brief-insight-label">{t("INSIGHT")}</span>
                    {narrative.insight}
                </p>
            ) : null}
        </article>
    );
}

function SpotlightPointer(): JSX.Element {
    const summary = commandSummary.value;
    const spotlight = summary.spotlight;
    if (!spotlight) return <></>;
    return (
        <article class="db-main__spotlight-pointer">
            <p class="db-main__spotlight-kicker">{t("SPOTLIGHT MODE")}</p>
            <p class="db-main__spotlight-copy">
                {t("The focal slice on the right is", { class: "body" })}{" "}
                <strong>{spotlight.title}</strong>
                {t(". Click another slice to swap the spotlight.", {
                    class: "body"
                })}
            </p>
        </article>
    );
}

function QueueMeta(): JSX.Element {
    const summary = commandSummary.value;
    return (
        <article class="db-main__queue-meta">
            <p class="db-main__queue-kicker">{t("QUEUE MODE")}</p>
            <p class="db-main__queue-copy">
                {summary.ranked.length} ranked item
                {summary.ranked.length === 1 ? "" : "s"} — work down the list.
            </p>
        </article>
    );
}
