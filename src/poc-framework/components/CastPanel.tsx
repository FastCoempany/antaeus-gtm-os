import type { JSX } from "preact";

/**
 * CastPanel — Wave 1 placeholder (right, cream "cast" half).
 *
 * Per canon §4.15 + Part II §4.8: dark forge / cream cast hybrid.
 * The cast is the consequence of the forge — weakest-mold diagnosis,
 * generated documents (scope / kickoff / readout / email), and the
 * route rack into Deal Workspace / Future Autopsy / Advisor Deploy.
 * Waves 4–5 wire the docs + handoff.
 */
export function CastPanel(): JSX.Element {
    return (
        <section class="poc-cast" aria-label="Proof cast">
            <p class="poc-cast__kicker">CAST</p>
            <h2 class="poc-cast__title">Carry the proof.</h2>
            <p class="poc-cast__placeholder">
                Wave 2 wires the weakest-mold diagnosis. Wave 4 generates
                the four proof documents (scope / kickoff / readout /
                email). Wave 5 wires the route rack into Deal Workspace,
                Future Autopsy, and Advisor Deploy.
            </p>
        </section>
    );
}
