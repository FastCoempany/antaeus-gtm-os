import type { JSX } from "preact";

/**
 * SpotlightView — Wave 1 placeholder.
 *
 * Per canon §4.2 the Spotlight mode shows ONE focal command object
 * with its dominant move + reasons + a recessive "next 6" rail.
 * Wave 3 wires the ranking engine output. Wave 1 ships the empty
 * shell so layout + smoke test land cleanly.
 */
export function SpotlightView(): JSX.Element {
    return (
        <section class="db-spotlight" aria-label="Spotlight">
            <div class="db-spotlight__focus">
                <p class="db-spotlight__placeholder">
                    Spotlight wires up in Wave 3 once the ranking engine ports
                    in Wave 2.
                </p>
            </div>
            <aside class="db-spotlight__rail" aria-label="Next ranked items">
                <p class="db-spotlight__rail-kicker">NEXT</p>
                <p class="db-spotlight__rail-empty">—</p>
            </aside>
        </section>
    );
}
