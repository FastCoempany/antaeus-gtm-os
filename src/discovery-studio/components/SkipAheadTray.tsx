import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import { skipAheadHandlers } from "../state";

/**
 * SkipAheadTray — Wave 5.
 *
 * Collapsible tray surfacing the active framework's skipAheadHandlers
 * — the cued buyer-derail handlers (e.g. "asks for pricing too early",
 * "wants to route to IT"). Each row shows the trigger pattern + a
 * short suggested reply.
 *
 * Per the Lumana on-call control lock spec, this is a required
 * surface — the seller should be able to reach skip-ahead handlers
 * without leaving their active segment.
 *
 * Wave 5 keeps the tray collapsed by default (lower attentional cost)
 * and expandable on click. Wave 6+ may auto-expand when an interrupt
 * fires.
 */
export function SkipAheadTray(): JSX.Element {
    const handlers = skipAheadHandlers.value;
    const [open, setOpen] = useState(false);

    if (handlers.length === 0) {
        return (
            <section class="ds-skip-ahead-tray" aria-label={t("Skip-ahead handlers")}>
                <header class="ds-skip-ahead-tray__header">{t("Skip-ahead")}</header>
                <p class="ds-skip-ahead-tray__empty">
                    No skip-ahead handlers loaded for this framework.
                </p>
            </section>
        );
    }

    return (
        <section
            class={`ds-skip-ahead-tray${open ? " is-open" : ""}`}
            aria-label={t("Skip-ahead handlers")}
        >
            <header class="ds-skip-ahead-tray__header">
                <button
                    type="button"
                    class="ds-skip-ahead-tray__toggle"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    Skip-ahead
                    <span class="ds-skip-ahead-tray__count">
                        {handlers.length}
                    </span>
                    <span
                        class={`ds-skip-ahead-tray__chevron${
                            open ? " is-open" : ""
                        }`}
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>
            </header>
            {open ? (
                <ul class="ds-skip-ahead-tray__list">
                    {handlers.map((h, i) => (
                        <li key={i} class="ds-skip-ahead-tray__item">
                            <p class="ds-skip-ahead-tray__trigger">
                                {h.trigger}
                            </p>
                            <p class="ds-skip-ahead-tray__reply">{h.reply}</p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
