/**
 * CtrlK — "Ctrl+K" glyph, generated from the iconography mockup
 * (spec 09: 24px grid, 2px keyline, flat terminals, miter joins).
 * Placeholder quality until the production redraw; replacing this
 * file's SVG paths does not touch the API.
 */
import type { GlyphProps } from "../glyph";

export function CtrlKGlyph({ size }: GlyphProps) {
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
            <rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M9 15l2.5-6M14.5 9l-2 3 2 3M8.5 12H11"/>
        </svg>
    );
}
