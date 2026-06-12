import type { JSX } from "preact";
import { t } from "@/lib/voice/t";

/**
 * EmptyState — what the room shows when no Patterns surfaced for the
 * latest run. Covers two real conditions: the pipeline hasn't run for
 * this workspace yet, AND the latest run produced nothing that
 * cleared the quality gate. Voice stays condition-agnostic — the
 * operator reads the same orienting copy either way.
 *
 * Canon Part II §6 — every surface must treat empty / sparse states
 * explicitly. The empty state should feel useful, directional, and
 * intelligent rather than absent. Voice per Part III §11 — plain
 * sentences, no single-noun abstractions doing the work of a sentence.
 */
export function EmptyState(): JSX.Element {
    return (
        <section class="bf-empty" aria-labelledby="bf-empty-headline">
            <p class="bf-empty__label">{t("Nothing to read this week")}</p>
            <h2 id="bf-empty-headline" class="bf-empty__headline">
                The pipeline either hasn't fired yet, or it fired and
                nothing cleared the quality gate.
            </h2>
            <p class="bf-empty__body">
                The cron runs Monday at 6 AM Central. When the run
                produces something worth reading, this page will hold
                three to five takes on what's actually moving — what's
                new on the periphery you haven't named yet, and where
                your stated assumptions are starting to disagree with
                the data.
            </p>
            <p class="bf-empty__body">
                Each read carries the evidence behind it. Open any one
                of them to see the items the system clustered, the
                draft-critique-revise chain that produced the paragraph
                you're reading, the quality gate decisions, and what it
                cost.
            </p>
        </section>
    );
}
