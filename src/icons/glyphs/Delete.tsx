/**
 * Delete — "delete" glyph, generated from the iconography mockup
 * (spec 09: 24px grid, 2px keyline, flat terminals, miter joins).
 * Placeholder quality until the production redraw; replacing this
 * file's SVG paths does not touch the API.
 */
import type { GlyphProps } from "../glyph";

export function DeleteGlyph({ size }: GlyphProps) {
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
            <path d="M5 7h14"/><path d="M9 7V4h6v3"/><path d="M7 7l1 14h8l1-14"/><path d="M11 11v6M14 11v6"/>
        </svg>
    );
}
