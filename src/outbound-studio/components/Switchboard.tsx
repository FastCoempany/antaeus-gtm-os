import type { JSX } from "preact";

/**
 * Switchboard — Wave 1 placeholder.
 *
 * Per canon §4.8 the switchboard is the operator rack's working
 * surface. Wave 3 wires the form (account / contact / persona /
 * temperature / trigger / no-ask toggle). Wave 5 adds the URL inbound
 * pre-fill + the recommendations panel.
 */
export function Switchboard(): JSX.Element {
    return (
        <section class="ob-switchboard" aria-label="Operator switchboard">
            <p class="ob-switchboard__kicker">SWITCHBOARD</p>
            <h2 class="ob-switchboard__title">Set the strain.</h2>
            <p class="ob-switchboard__placeholder">
                Wave 3 wires the form (account / contact / persona /
                temperature / trigger / no-ask toggle). The recommended
                channel + asset + CTA are derived from temp × persona.
            </p>
        </section>
    );
}
