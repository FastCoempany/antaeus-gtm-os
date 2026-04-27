import type { JSX } from "preact";
import { draft, linkedDeal } from "../state";
import { computeQuality, deriveMolds } from "../lib/quality";

/**
 * CastPanel — Wave 3 partial implementation (right, cream "cast" half).
 *
 * Per canon §4.15: the cast is the consequence of the forge. Wave 3
 * surfaces the quality readout + weakest-mold diagnosis + 5-mold
 * grid. Wave 4 will add the four generated documents (scope / kickoff
 * / readout / email). Wave 5 will wire the route rack.
 */
export function CastPanel(): JSX.Element {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const quality = computeQuality(drft, linked);
    const molds = deriveMolds(drft, quality);

    return (
        <section class="poc-cast" aria-label="Proof cast">
            <header class="poc-cast__header">
                <p class="poc-cast__kicker">CAST</p>
                <h2 class="poc-cast__title">{quality.title}</h2>
                <p class="poc-cast__sub">
                    Quality {quality.score}/100 ·{" "}
                    <span class={`poc-cast__band poc-cast__band--${quality.band}`}>
                        {quality.bandLabel}
                    </span>
                </p>
            </header>

            <ul class="poc-mold-grid" aria-label="Mold grid">
                {molds.map((m) => (
                    <li
                        key={m.label}
                        class={`poc-mold poc-mold--${m.state}`}
                        aria-label={`${m.label}: ${m.value}`}
                    >
                        <span class="poc-mold__label">{m.label}</span>
                        <span class="poc-mold__value">{m.value}</span>
                    </li>
                ))}
            </ul>

            <section class="poc-weakest" aria-label="Weakest mold">
                <p class="poc-weakest__kicker">WEAKEST MOLD · NEXT MOVE</p>
                <p class="poc-weakest__title">{quality.weakest.title}</p>
                <p class="poc-weakest__copy">{quality.weakest.copy}</p>
            </section>

            <p class="poc-cast__placeholder">
                Wave 4 generates the four proof documents (scope / kickoff /
                readout / email). Wave 5 wires the route rack into Deal
                Workspace, Future Autopsy, and Advisor Deploy.
            </p>
        </section>
    );
}
