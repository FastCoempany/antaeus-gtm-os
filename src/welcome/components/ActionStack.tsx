import type { JSX } from "preact";
import { actions } from "../state";

/**
 * ActionStack — the ranked next-action picker. The first card is the
 * dominant move ("Now"); the second is "Next"; the rest are "Ready".
 * Per canon §4.1 the room must surface ONE dominant move per surface
 * — the visual weight reflects that.
 */
export function ActionStack(): JSX.Element {
    const list = actions.value;
    return (
        <section class="wel-actions" aria-label="Next moves">
            <header class="wel-section__head">
                <p class="wel-section__kicker">What to do next</p>
                <h2 class="wel-section__title">Pick the move that compounds</h2>
                <p class="wel-section__sub">
                    The first card is the highest-leverage move from where you
                    are. The rest stay ready, in order.
                </p>
            </header>
            <ol class="wel-actions__list">
                {list.map((a, i) => (
                    <li
                        key={a.key}
                        class={`wel-action wel-action--${a.state}${i === 0 ? " is-dominant" : ""}`}
                    >
                        <header class="wel-action__head">
                            <span class={`wel-action__state wel-action__state--${a.state}`}>
                                {a.state === "now"
                                    ? "Now"
                                    : a.state === "next"
                                      ? "Next"
                                      : "Ready"}
                            </span>
                            <h3 class="wel-action__title">{a.title}</h3>
                        </header>
                        <p class="wel-action__body">{a.body}</p>
                        {a.meta.length > 0 ? (
                            <ul class="wel-action__meta">
                                {a.meta.map((m) => (
                                    <li key={m}>{m}</li>
                                ))}
                            </ul>
                        ) : null}
                        {a.why ? (
                            <p class="wel-action__why">
                                <span class="wel-mono">Why</span> {a.why}
                            </p>
                        ) : null}
                        {a.unlocks ? (
                            <p class="wel-action__unlocks">
                                <span class="wel-mono">Unlocks</span> {a.unlocks}
                            </p>
                        ) : null}
                        <a
                            class={
                                i === 0
                                    ? "wel-btn wel-btn--primary"
                                    : "wel-btn wel-btn--ghost"
                            }
                            href={a.href}
                        >
                            {a.cta}
                        </a>
                    </li>
                ))}
            </ol>
        </section>
    );
}
