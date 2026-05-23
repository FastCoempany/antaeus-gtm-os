import type { JSX } from "preact";

/**
 * EmptyState — what the room shows in B.0b, before the pipeline has
 * ever run.
 *
 * Canon Part II §6 — every surface must treat empty / sparse states
 * explicitly. The empty state should feel useful, directional, and
 * intelligent rather than absent. Voice per Part III §11 — plain
 * sentences, no single-noun abstractions doing the work of a sentence.
 *
 * Phasing footnote names the build phase plan deliverables that will
 * fill this surface — B.1 produces enriched items, B.2 ships the
 * first Patterns. Once Patterns exist this component is replaced by a
 * Pattern grid; the empty state survives as a fallback for fresh
 * workspaces whose pipeline hasn't run yet.
 */
export function EmptyState(): JSX.Element {
    return (
        <section class="bf-empty" aria-labelledby="bf-empty-headline">
            <p class="bf-empty__label">Nothing to read yet</p>
            <h2 id="bf-empty-headline" class="bf-empty__headline">
                The pipeline hasn't run.
            </h2>
            <p class="bf-empty__body">
                When it does — once a week, Monday morning — this page
                will hold three to five reads of what's happening in
                your space. What's moving, what's new on the periphery
                you haven't named yet, and where your stated assumptions
                are starting to disagree with the data.
            </p>
            <p class="bf-empty__body">
                Each read carries the evidence behind it. You can open
                any one of them and see the items the system clustered,
                the draft-critique-revise chain that produced the
                paragraph you're reading, the quality gate decisions,
                and what it cost.
            </p>
            <p class="bf-empty__footnote">
                B.0b · scaffold only · pipeline lands in B.1, first
                Patterns in B.2
            </p>
        </section>
    );
}
