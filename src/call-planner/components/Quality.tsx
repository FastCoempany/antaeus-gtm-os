import type { JSX } from "preact";
import { draft, linkedDeal, matchedAccount } from "../state";
import { evaluateQuality } from "../lib/quality";

/**
 * Quality — Wave 3 implementation.
 *
 * Renders the 5-gate breakdown + score band + nextMove copy. The
 * quality projection is recomputed every render off the live draft +
 * matchedAccount + linkedDeal state.
 */
export function Quality(): JSX.Element {
    const q = evaluateQuality({
        draft: draft.value,
        matchedAccount: matchedAccount.value,
        linkedDeal: linkedDeal.value
    });

    return (
        <section class="cp-quality" aria-label="Agenda quality">
            <header class="cp-quality__head">
                <div>
                    <p class="cp-quality__kicker">AGENDA QUALITY</p>
                    <h2 class="cp-quality__title">
                        Five gates the meeting has to clear.
                    </h2>
                </div>
                <div class="cp-quality__band-wrap" aria-label="Score band">
                    <span class={`cp-quality__band cp-quality__band--${q.band}`}>
                        {q.bandLabel} · {q.score}/100
                    </span>
                </div>
            </header>
            <p class="cp-quality__next">
                <strong>Next move:</strong> {q.nextMove}
            </p>
            <ul class="cp-quality__gates">
                {q.gates.map((g) => (
                    <li
                        key={g.key}
                        class={`cp-gate-row${g.met ? " is-met" : " is-miss"}`}
                    >
                        <div class="cp-gate-row__body">
                            <p class="cp-gate-row__label">{g.label}</p>
                            <p class="cp-gate-row__copy">{g.copy}</p>
                        </div>
                        <span class="cp-gate-row__state">
                            {g.met ? "Met" : "Missing"}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
