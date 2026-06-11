/**
 * AtRisk — "at risk" glyph, generated from the iconography mockup
 * (spec 09: 24px grid, 2px keyline, flat terminals, miter joins).
 * Placeholder quality until the production redraw; replacing this
 * file's SVG paths does not touch the API.
 */
import type { GlyphProps } from "../glyph";

export function AtRiskGlyph({ size }: GlyphProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="butt"
            stroke-linejoin="miter"
        >
            <path d="M12 3L2 20h20z" stroke="var(--ds-icon-accent)"/><path d="M12 10v5" stroke="var(--ds-icon-accent)"/><path d="M12 17.5v0.5" stroke="var(--ds-icon-accent)"/>
        </svg>
    );
}
