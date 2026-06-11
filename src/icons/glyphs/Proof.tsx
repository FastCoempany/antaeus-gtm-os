/**
 * Proof — "Proof" glyph, generated from the iconography mockup
 * (spec 09: 24px grid, 2px keyline, flat terminals, miter joins).
 * Placeholder quality until the production redraw; replacing this
 * file's SVG paths does not touch the API.
 */
import type { GlyphProps } from "../glyph";

export function ProofGlyph({ size }: GlyphProps) {
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
            <path d="M12 3l7 3v5c0 4.8-3.4 8-7 10-3.6-2-7-5.2-7-10V6z"/><path d="M9 11.5l2 2 4-4.5"/>
        </svg>
    );
}
