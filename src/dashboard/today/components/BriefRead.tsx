import type { JSX } from "preact";
import { Heading, Kicker, Measure } from "@/components";
import { t } from "@/lib/voice/t";
import { commandSummary } from "../../state";
import { buildBriefNarrative } from "../../lib/brief-narrative";
import { ActionLink } from "./ActionLink";

/**
 * The Brief — the resting default landing (spec 04 §3.1, §3.4). A short
 * narrative of what is most pressured + what changed + the one move,
 * held to the reading measure, with the move actionable from the brief
 * itself (the same move the Wayfinder pulling cell carries).
 */
export function BriefRead(): JSX.Element {
    const summary = commandSummary.value;
    const narrative = buildBriefNarrative(summary);
    const spotlight = summary.spotlight;
    const primary =
        spotlight?.actions.find((a) => a.variant === "primary") ??
        spotlight?.actions[0];

    return (
        <article class="dbt-brief">
            <Kicker>{t("THE MORNING BRIEF")}</Kicker>
            <Heading level="display">{narrative.headline}</Heading>
            <Measure>
                {narrative.sentences.map((s, i) => (
                    <p key={i} class="dbt-brief__line">
                        {s}
                    </p>
                ))}
            </Measure>
            {primary ? (
                <div class="dbt-brief__move">
                    <ActionLink action={primary} primary />
                </div>
            ) : null}
            {narrative.insight ? (
                <p class="dbt-brief__insight">
                    <span class="dbt-brief__insight-mark">{t("INSIGHT")}</span>{" "}
                    {narrative.insight}
                </p>
            ) : null}
        </article>
    );
}
