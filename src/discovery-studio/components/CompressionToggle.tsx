import type { JSX } from "preact";
import {
    compressionMode,
    setCompressionMode,
    type CompressionMode
} from "../state";

/**
 * CompressionToggle — Wave 5.
 *
 * Three-state pill group: Off / Essentials / Emergency. Drives the
 * `compressionMode` signal which the SegmentRail reads to filter
 * non-essential nodes:
 *
 *   off        — show all nodes, regardless of essential flag
 *   essentials — show only nodes flagged essential
 *   emergency  — same as essentials (Wave 5+ may further reduce
 *                to "active segment only" if the spec hardens)
 *
 * Per the Lumana on-call control lock spec, compression mode is one
 * of the seven required surfaces; visible toggle so the user can
 * compress mid-call without spelunking through settings.
 */
const MODES: ReadonlyArray<{
    id: CompressionMode;
    label: string;
    hint: string;
}> = [
    { id: "off", label: "Off", hint: "All nodes visible" },
    { id: "essentials", label: "Essentials", hint: "Only essential nodes" },
    { id: "emergency", label: "Emergency", hint: "Reduce to fundamentals" }
];

export function CompressionToggle(): JSX.Element {
    const active = compressionMode.value;

    return (
        <div
            class="ds-compression-toggle"
            role="radiogroup"
            aria-label="Compression mode"
        >
            <span class="ds-compression-toggle__label">Compression</span>
            <div class="ds-compression-toggle__group">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={active === m.id}
                        class={`ds-compression-toggle__btn${
                            active === m.id ? " is-active" : ""
                        }`}
                        title={m.hint}
                        onClick={() => setCompressionMode(m.id)}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
