import type { JSX } from "preact";

/**
 * QueueView — Wave 1 placeholder.
 *
 * Per canon §4.2 the Queue mode shows the ranked list as a triage
 * surface — the same ranking as Spotlight but exposed wholesale so the
 * operator can scan and pick. Wave 4 wires the ranked rows.
 */
export function QueueView(): JSX.Element {
    return (
        <section class="db-queue" aria-label="Queue">
            <p class="db-queue__placeholder">
                Queue mode wires up in Wave 4. Ranked triage list of
                command objects with one-line reasons.
            </p>
        </section>
    );
}
