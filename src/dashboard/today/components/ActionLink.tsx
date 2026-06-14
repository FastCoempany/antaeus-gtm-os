import type { JSX } from "preact";
import type { CommandAction } from "../../lib/types";

/**
 * A CommandAction rendered as a navigation control styled as a button
 * (the engine's actions carry hrefs, not click handlers). Primary =
 * the orange dominant move; everything else recedes to ghost. Mirrors
 * the HandoffStrip convention (anchors wearing ds-btn classes).
 */
export function ActionLink(props: {
    readonly action: CommandAction;
    /** Force the primary (orange) treatment regardless of variant. */
    readonly primary?: boolean;
}): JSX.Element {
    const primary = props.primary ?? props.action.variant === "primary";
    return (
        <a
            class={`ds-btn ds-btn--${primary ? "accent" : "ghost"}`}
            href={props.action.href}
        >
            {props.action.label}
        </a>
    );
}
