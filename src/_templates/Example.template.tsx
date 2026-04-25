import type { JSX } from "preact";

/**
 * Canonical component template.
 *
 * Copy this file as the pattern for new Preact components in Antaeus.
 *
 * Conventions it demonstrates:
 *   1. Props are explicitly typed with an interface, no `any`.
 *   2. Optional handler (onSelect) cleanly falls back to disabled state.
 *   3. Modifier classes follow BEM-ish `{block}--{modifier}` naming,
 *      consistent with the existing vanilla CSS system.
 *   4. No internal state — this is a presentational component. Stateful
 *      components should colocate state in a hook (see useExample template).
 *   5. aria-* attributes present where semantics require them.
 *   6. Defaults handled at the signature so the implementation stays
 *      unbranched.
 */
export interface ExampleTemplateProps {
    /** Visible label on the button. */
    label: string;
    /** Click handler. Omit to render the button in disabled state. */
    onSelect?: () => void;
    /** If true, apply the primary-action visual treatment. */
    primary?: boolean;
}

export function ExampleTemplate({
    label,
    onSelect,
    primary = false
}: ExampleTemplateProps): JSX.Element {
    const disabled = onSelect === undefined;
    const classes = [
        "example-template",
        primary ? "example-template--primary" : ""
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            type="button"
            class={classes}
            disabled={disabled}
            aria-disabled={disabled ? "true" : "false"}
            onClick={onSelect}
        >
            {label}
        </button>
    );
}
