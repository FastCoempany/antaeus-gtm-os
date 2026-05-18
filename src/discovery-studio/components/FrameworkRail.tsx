import type { JSX } from "preact";
import {
    activeFramework,
    frameworkRegistry,
    selectFramework,
    type FrameworkId
} from "../state";

/**
 * FrameworkRail — Program 6 / PR 4 refacing.
 *
 * Renders the 9 framework buttons in the vertical left rail of the
 * Ledger Spine Canonical layout. Each row: small dot (orange when
 * active, gray otherwise) + framework name. Clicking switches the
 * active framework.
 *
 * The vertical rail is the Ledger Spine signature affordance.
 * Previous (Wave 1) shipped as horizontal pill buttons in the
 * topbar — that hid the framework names behind a wrap-on-overflow
 * tab strip and scanned poorly against 9 simultaneous options.
 */
export function FrameworkRail(): JSX.Element {
    const frameworks = frameworkRegistry.value;
    const active = activeFramework.value;

    if (frameworks.length === 0) {
        return (
            <p class="ds-framework-rail__empty">Loading frameworks…</p>
        );
    }

    return (
        <nav class="ds-framework-rail" aria-label="Discovery framework selector">
            <ul class="ds-framework-rail__list">
                {frameworks.map((fw) => {
                    const isActive = active === fw.id;
                    return (
                        <li key={fw.id}>
                            <button
                                type="button"
                                class={`ds-framework-rail__btn${
                                    isActive ? " is-active" : ""
                                }`}
                                aria-pressed={isActive}
                                onClick={() =>
                                    selectFramework(fw.id as FrameworkId)
                                }
                            >
                                <span
                                    class="ds-framework-rail__dot"
                                    aria-hidden="true"
                                />
                                <span class="ds-framework-rail__name">
                                    {fw.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
