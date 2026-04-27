import type { JSX } from "preact";

/**
 * OutputPanel — Wave 1 placeholder.
 *
 * Per canon §4.8 the output panel surfaces the generated send line
 * (one line, one strain). Wave 4 wires the generator + copy +
 * save-angle / log-touch actions.
 */
export function OutputPanel(): JSX.Element {
    return (
        <section class="ob-output" aria-label="Generated send line">
            <p class="ob-output__kicker">SEND LINE</p>
            <h2 class="ob-output__title">The line.</h2>
            <p class="ob-output__placeholder">
                Wave 2 ports the generator engine (5 temperature branches ×
                4 personas + lookup tables for channel / asset / CTA).
                Wave 4 surfaces the generated line with a copy button,
                save-angle, and log-touch flow.
            </p>
        </section>
    );
}
