import type { JSX } from "preact";

/**
 * EmptyState — what the room shows when the pipeline hasn't run for
 * this workspace yet, or when the most recent run produced no
 * qualifying Patterns.
 *
 * Canon Part II §6 — every surface must treat empty / sparse states
 * explicitly. The empty state should feel useful, directional, and
 * intelligent rather than absent. Voice per Part III §11 — plain
 * sentences, no single-noun abstractions doing the work of a sentence.
 */
export function EmptyState(): JSX.Element {
    return (
        <section class="bf-empty" aria-labelledby="bf-empty-headline">
            <p class="bf-empty__label">Nothing to read yet</p>
            <h2 id="bf-empty-headline" class="bf-empty__headline">
                The pipeline hasn't run for this workspace yet.
            </h2>
            <p class="bf-empty__body">
                It fires once a week, Monday at 10 AM ET. When it does,
                this page will hold three to five reads of what's
                happening in your space. What's moving, what's new on
                the periphery you haven't named yet, and where your
                stated assumptions are starting to disagree with the
                data.
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
