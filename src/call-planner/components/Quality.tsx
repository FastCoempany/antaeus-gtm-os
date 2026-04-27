import type { JSX } from "preact";

/**
 * Quality — Wave 1 placeholder for the 5-gate breakdown.
 *
 * Wave 2 ports the legacy `getAgendaQuality()` that scores against
 * 5 weighted gates (Real person 20 + Persona 10 + Account context 20
 * + Why-now 25 + Advancement linked 25, +5 bonus if heat ≥ 85). Wave
 * 3 will render the gate-list + score band + next-move copy here.
 */
export function Quality(): JSX.Element {
    return (
        <section class="cp-quality" aria-label="Agenda quality">
            <p class="cp-quality__kicker">QUALITY</p>
            <h2 class="cp-quality__title">
                Each gate must hold before the meeting.
            </h2>
            <p class="cp-quality__placeholder">
                Wave 2 wires the 5-gate scoring + Wave 3 renders the
                gate list + band pill (credible / workable / thin) + next
                move copy.
            </p>
        </section>
    );
}
