import type { JSX } from "preact";
import { Heading, Kicker, Measure } from "@/components";
import { pickByDensity, showsAnnotations } from "@/lib/density";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { commandSummary } from "../../state";
import { buildBriefNarrative } from "../../lib/brief-narrative";
import { ActionLink } from "./ActionLink";

/**
 * The Brief — the resting default landing (spec 04 §3.1, §3.4). A short
 * narrative of what is most pressured + what changed + the one move,
 * held to the reading measure, with the move actionable from the brief
 * itself (the same move the Wayfinder pulling cell carries).
 *
 * Density (spec 02): Show me how reads the full narrative + the insight
 * annotation; Step back compresses to the lead sentence + the move, and
 * drops the insight — the fluent operator wants the headline and the
 * action, not the briefing prose.
 */
export function BriefRead(): JSX.Element {
    const summary = commandSummary.value;
    const narrative = buildBriefNarrative(summary);
    const spotlight = summary.spotlight;
    const primary =
        spotlight?.actions.find((a) => a.variant === "primary") ??
        spotlight?.actions[0];

    // Sentence count is a density dimension (02 §3.1): the full read or
    // just the lead. Both are engine-authored narrative, not t() copy.
    const sentences = pickByDensity({
        verbose: narrative.sentences,
        terse: narrative.sentences.slice(0, 1)
    });

    return (
        <article class="dbt-brief">
            <div class="dbt-brief__kicker-row">
                <Icon name="briefing" size={16} />
                <Kicker>{t("THE MORNING BRIEF")}</Kicker>
            </div>
            <Heading level="display">{narrative.headline}</Heading>
            <Measure>
                {sentences.map((s, i) => (
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
            {narrative.insight && showsAnnotations() ? (
                <p class="dbt-brief__insight">
                    <span class="dbt-brief__insight-mark">{t("INSIGHT")}</span>{" "}
                    {narrative.insight}
                </p>
            ) : null}
        </article>
    );
}
