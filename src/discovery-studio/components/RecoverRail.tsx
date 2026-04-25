import type { JSX } from "preact";
import {
    activeFramework,
    activeInterrupt,
    frameworkRegistry,
    triggerInterrupt
} from "../state";

/**
 * RecoverRail — Wave 3.
 *
 * Surfaces the framework's interrupts as one-click recovery moves: demo
 * request, pricing pressure, send-info push, wrong-person redirect,
 * time pressure. Clicking an interrupt sets `activeInterrupt`, which
 * the DiscoveryStudio shell renders in a prominent banner with the
 * recover copy + a dismiss button.
 *
 * "Recover" is conceptually outside the segment order — the user can
 * click any of these mid-segment to handle a buyer derailment without
 * losing their segment context.
 */
export function RecoverRail(): JSX.Element {
    const fid = activeFramework.value;
    const active = activeInterrupt.value;
    const interrupts = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)?.interrupts ?? []
        : [];

    return (
        <section class="ds-recover-rail" aria-label="Recover the call">
            <header class="ds-recover-rail__header">Recover</header>
            {interrupts.length === 0 ? (
                <p class="ds-recover-rail__empty">
                    No interrupts loaded for this framework yet.
                </p>
            ) : (
                <ul class="ds-recover-rail__list">
                    {interrupts.map((it) => (
                        <li key={it.id}>
                            <button
                                type="button"
                                class={`ds-recover-rail__btn ds-recover-rail__btn--${it.tone}${
                                    active?.id === it.id ? " is-active" : ""
                                }`}
                                aria-pressed={active?.id === it.id}
                                onClick={() => triggerInterrupt(it)}
                            >
                                {it.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
