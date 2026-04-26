import type { JSX } from "preact";

/**
 * BriefView — Wave 1 placeholder.
 *
 * Per canon §4.2 the Brief mode shows a 3–5 sentence narrative + one
 * variable-insight line. Wave 4 generates the narrative from ranked
 * objects + workspace-health snapshots.
 */
export function BriefView(): JSX.Element {
    return (
        <section class="db-brief" aria-label="Brief">
            <p class="db-brief__placeholder">
                Brief mode wires up in Wave 4. The narrative is generated
                from the ranked objects + workspace-health snapshots.
            </p>
        </section>
    );
}
