/**
 * Ready — "ready" glyph. GENERATED — do not hand-edit; the
 * iconography mockup is the master and the generator propagates it
 * (tools/design-system/generate-icons.py). Spec 09 construction:
 * 24px grid, 2px keyline, flat terminals, miter joins. Placeholder
 * quality until the production redraw lands in the mockup.
 */
import type { GlyphProps } from "../glyph";

export function ReadyGlyph({ size }: GlyphProps) {
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
            <path d="M5 12.5l4.5 4.5L19 7" stroke="var(--ds-icon-accent, currentColor)"/>
        </svg>
    );
}
