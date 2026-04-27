import type { JSX } from "preact";

/**
 * MethodSheets — Wave 1 placeholder.
 *
 * Per canon §4.10: "These support the cue. They do not organize the
 * room." Wave 3 fills this with the 4 reference templates (Connection,
 * Public cue, Give-first, Ask) + copy-line buttons. Wave 1 ships a
 * skeleton block so the page lays out.
 */
export function MethodSheets(): JSX.Element {
    return (
        <section class="lp-method" aria-label="LinkedIn method sheets">
            <header class="lp-method__head">
                <div>
                    <p class="lp-method__kicker">SECONDARY METHOD SHEETS</p>
                    <h2 class="lp-method__title">
                        Reference stays below the booth.
                    </h2>
                </div>
                <p class="lp-method__copy">
                    These support the cue. They do not organize the room.
                </p>
            </header>
            <div class="lp-method__grid">
                <p class="lp-method__placeholder">
                    Wave 3 wires the 4 reference templates (Connection /
                    Public cue / Give-first / Ask) with copy-to-clipboard
                    buttons.
                </p>
            </div>
        </section>
    );
}
