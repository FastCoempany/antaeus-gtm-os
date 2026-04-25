import type { JSX } from "preact";
import {
    activeFramework,
    frameworkRegistry,
    selectFramework,
    type FrameworkId
} from "../state";

/**
 * FrameworkRail — Wave 1 skeleton.
 *
 * Renders the 9 framework buttons; clicking switches the active framework.
 * Wave 2 fills in the proper visual treatment + framework metadata.
 */
export function FrameworkRail(): JSX.Element {
    const frameworks = frameworkRegistry.value;
    const active = activeFramework.value;

    return (
        <nav class="ds-framework-rail" aria-label="Discovery framework selector">
            {frameworks.length === 0 ? (
                <p class="ds-framework-rail__empty">No frameworks loaded.</p>
            ) : (
                <ul class="ds-framework-rail__list">
                    {frameworks.map((fw) => (
                        <li key={fw.id}>
                            <button
                                type="button"
                                class={`ds-framework-rail__btn${
                                    active === fw.id ? " is-active" : ""
                                }`}
                                aria-pressed={active === fw.id}
                                onClick={() =>
                                    selectFramework(fw.id as FrameworkId)
                                }
                            >
                                {fw.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </nav>
    );
}
