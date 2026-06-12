import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { actions } from "../state";
import { hrefForActionDestination } from "../lib/handoff";

/**
 * ActionStack — the ranked next-action picker. The first card is the
 * dominant move ("Now"); the second is "Next"; the rest are "Ready".
 * Per canon §4.1 the room must surface ONE dominant move per surface
 * — the visual weight reflects that.
 */
export function ActionStack(): JSX.Element {
    const list = actions.value;
    return (
        <section class="wel-actions" aria-label={t("Next moves")}>
            <header class="wel-section__head">
                <p class="wel-section__kicker">{t("NEXT MOVES")}</p>
                <h2 class="wel-section__title">{t("Pick the action that compounds.")}</h2>
                <p class="wel-section__sub">
                    The first card is the strongest move from where you
                    are. The rest stay queued, in order.
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
                                <span class="wel-mono">{t("Why")}</span> {a.why}
                            </p>
                        ) : null}
                        {a.unlocks ? (
                            <p class="wel-action__unlocks">
                                <span class="wel-mono">{t("Opens up")}</span> {a.unlocks}
                            </p>
                        ) : null}
                        <a
                            class={
                                i === 0
                                    ? "wel-btn wel-btn--primary"
                                    : "wel-btn wel-btn--ghost"
                            }
                            href={hrefForActionDestination(a.href)}
                        >
                            {a.cta}
                        </a>
                    </li>
                ))}
            </ol>
        </section>
    );
}
