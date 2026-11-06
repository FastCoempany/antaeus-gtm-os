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
                {t("There are no market reads for this week yet.", { class: "body" })}
            </h2>
            <p class="bf-empty__body">
                {t(
                    "Market reads appear here after the weekly market review runs. Each one summarizes a change in your market: a company you aren't tracking yet that matches your targets, or evidence that disagrees with an assumption you've made.",
                    { class: "body" }
                )}
            </p>
            <p class="bf-empty__body">
                {t(
                    "Each read lists its sources. You can open it to see the articles it used, how it was written and checked, and what it cost to produce.",
                    { class: "body" }
                )}
            </p>
        </section>
    );
}
