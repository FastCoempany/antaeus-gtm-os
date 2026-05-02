import type { JSX } from "preact";
import { draft } from "../state";

/**
 * PushbackSheet — trigger → response template grid.
 *
 * Per canon §4.16b: "response-to-pushback templates." Reads as a
 * dialogue map. Operator scans before walking in; references during.
 * Seed content carried forward from the legacy CFO Negotiation room
 * (procurement + finance + legal scripts), swapping in whichever
 * counterparty role the rack is set to.
 */
export function PushbackSheet(): JSX.Element {
    const list = draft.value.pushbacks;
    return (
        <section class="ng-pushbacks" aria-label="Pushback templates">
            <h2 class="ng-section__title">
                When they say this, you say this.
            </h2>
            <ul class="ng-pushbacks__list">
                {list.map((p) => (
                    <li class="ng-pushback" key={p.id}>
                        <p class="ng-pushback__trigger">
                            <span class="ng-pushback__label">They say</span>
                            <em>{p.trigger}</em>
                        </p>
                        <p class="ng-pushback__response">
                            <span class="ng-pushback__label">You say</span>
                            {p.response}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
