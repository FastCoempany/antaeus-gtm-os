import type { JSX } from "preact";
import { Palette, openPalette, paletteOpen } from "./Palette";

/**
 * PaletteTrigger — mounts the cmd+K keyboard listener once + the
 * Palette overlay. Renders the overlay only when open.
 *
 * Rendered once per room via RoomChrome. The listener attaches on
 * module load (idempotent — guarded by `keydownBound`) so multiple
 * RoomChrome mounts during testing/SSR don't multiply listeners.
 *
 * Keyboard contract:
 *   - cmd+K (mac) or ctrl+K (windows/linux) → toggle palette
 *   - Escape (handled inside Palette) → close palette
 *   - Listener fires globally on `document`; respects `<input>` /
 *     `<textarea>` focus by checking the event target. The cmd+K
 *     binding is universal enough that hijacking it inside text
 *     fields is the correct behavior (browser default does nothing
 *     useful for cmd+K).
 */

let keydownBound = false;

function ensureKeydownListener(): void {
    if (keydownBound) return;
    if (typeof document === "undefined") return;
    keydownBound = true;
    document.addEventListener("keydown", (e: KeyboardEvent): void => {
        const isOpenCombo =
            (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
        if (!isOpenCombo) return;
        e.preventDefault();
        if (paletteOpen.value) {
            paletteOpen.value = false;
        } else {
            openPalette();
        }
    });
}

export function PaletteTrigger(): JSX.Element {
    ensureKeydownListener();
    return <Palette />;
}
