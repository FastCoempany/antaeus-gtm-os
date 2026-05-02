import type { JSX } from "preact";

/**
 * Spine — left rail glyph per variant-B "Intervention Desk."
 *
 * The spine is the investigative anchor — a brand mark + dot + rail
 * that runs the full height of the room. It marks the room as a
 * Diagnosis Table where the diagnosis is live, not a passive board.
 *
 * Recessive at narrow viewports (canon Part II §5 — the shell
 * supports, does not dominate).
 */
export function Spine(): JSX.Element {
    return (
        <aside class="dw-spine" aria-hidden="true">
            <span class="dw-spine__brand">ANTAEUS</span>
            <span class="dw-spine__dot" />
            <span class="dw-spine__rail" />
        </aside>
    );
}
