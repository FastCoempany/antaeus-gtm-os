import type { JSX } from "preact";
import { draft, topSignalHeadline } from "../state";

/**
 * AgendaSpine — Wave 1 placeholder for the 4-stop spine.
 *
 * Per canon §4.11 the canonical strips are: Open / Reason now / Probe /
 * Advance ask. Wave 3 fills each strip with personalized copy from the
 * persona question banks + opener/why-now/advance helpers from Wave 2.
 * Wave 1 ships labeled placeholder blocks so the layout reads.
 */
export function AgendaSpine(): JSX.Element {
    const d = draft.value;
    const top = topSignalHeadline.value;
    return (
        <section class="cp-spine" aria-label="Agenda spine">
            <p class="cp-spine__kicker">PRESSURE SEQUENCE</p>
            <h2 class="cp-spine__title">Interrogate in this order.</h2>
            <p class="cp-spine__copy">
                Good agenda means the meeting can actually advance: the
                person is clear, the reason now is credible, and the
                result has somewhere durable to land.
            </p>
            <ol class="cp-spine__strips">
                <li class="cp-strip" data-cp-strip="open">
                    <p class="cp-strip__num">01</p>
                    <p class="cp-strip__name">Open</p>
                    <p class="cp-strip__copy">
                        {top
                            ? "Open from the live signal."
                            : "Open from the operating burden."}
                    </p>
                </li>
                <li class="cp-strip" data-cp-strip="reason-now">
                    <p class="cp-strip__num">02</p>
                    <p class="cp-strip__name">Reason now</p>
                    <p class="cp-strip__copy">
                        {top
                            ? "Live pressure is already visible."
                            : "Capture the why-now angle before the call."}
                    </p>
                </li>
                <li class="cp-strip" data-cp-strip="probe">
                    <p class="cp-strip__num">03</p>
                    <p class="cp-strip__name">Probe</p>
                    <p class="cp-strip__copy">
                        Three probes tuned to the {d.persona} persona.
                    </p>
                </li>
                <li class="cp-strip" data-cp-strip="advance">
                    <p class="cp-strip__num">04</p>
                    <p class="cp-strip__name">Advance ask</p>
                    <p class="cp-strip__copy">
                        Leave with a dated next step the board can trust.
                    </p>
                </li>
            </ol>
            <p class="cp-spine__placeholder">
                Wave 3 wires the live opener / why-now / probe / advance
                copy from the persona banks + quality engine.
            </p>
        </section>
    );
}
