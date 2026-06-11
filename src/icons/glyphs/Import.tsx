/**
 * Import — "import" glyph, generated from the iconography mockup
 * (spec 09: 24px grid, 2px keyline, flat terminals, miter joins).
 * Placeholder quality until the production redraw; replacing this
 * file's SVG paths does not touch the API.
 */
import type { GlyphProps } from "../glyph";

export function ImportGlyph({ size }: GlyphProps) {
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
            <path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>
        </svg>
    );
}
