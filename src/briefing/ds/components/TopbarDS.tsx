import type { JSX } from "preact";
import { Heading, Kicker } from "@/components";
import { t } from "@/lib/voice/t";

/**
 * TopbarDS — the Briefing's thesis head on the library. A peer telling
 * the operator what the system saw (canon §4.21): the operator's stated
 * preferences are a hypothesis the pipeline tests against what's
 * actually moving. Composed on Kicker + Heading; the LLM-governed reads
 * live below in the streams.
 */
export function TopbarDS(): JSX.Element {
    return (
        <header class="bfd-head">
            <Kicker>{t("BRIEFING · THE DAILY READ")}</Kicker>
            <Heading level="title">{t("What the system saw.")}</Heading>
            <p class="bfd-head__sub">
                {t(
                    "Your stated preferences are a hypothesis. The pipeline tests them against what's actually moving — and tells you when the evidence and the hypothesis stop agreeing.",
                    { class: "body" }
                )}
            </p>
        </header>
    );
}
