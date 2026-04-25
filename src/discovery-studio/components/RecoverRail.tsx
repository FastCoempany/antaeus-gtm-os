import type { JSX } from "preact";
import { activeFramework, frameworkRegistry } from "../state";

/**
 * RecoverRail — Wave 1 skeleton.
 *
 * The "recover the call" rail surfaces interrupts the user can deploy
 * when the call goes sideways: demo request, pricing pressure, send-info
 * push, wrong-person redirect, time pressure. Each interrupt exists
 * outside the segment order — the user can click any of them mid-segment
 * to recover.
 *
 * Wave 2 wires up the actual click handler that injects recover copy
 * back into the active node.
 */
export function RecoverRail(): JSX.Element {
    const fid = activeFramework.value;
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
                                class={`ds-recover-rail__btn ds-recover-rail__btn--${it.tone}`}
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
