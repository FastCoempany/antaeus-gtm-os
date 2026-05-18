import type { JSX } from "preact";

/**
 * SwitchLaws — left column of the Switchboard Loft.
 *
 * Surfaces the two operating laws from canon §4.8 + the picked-
 * winner Variant 03 / Switchboard Loft wireframe. These are static
 * doctrinal cards — they don't change with rack state. The room
 * being a switchboard MEANS these laws hold.
 *
 *   Input law: "No send path without a named strain."
 *     The operator cannot route generic category language into a
 *     live outbound channel. Anti-spam discipline at the input
 *     surface.
 *
 *   Recovery law: "Every route keeps a recovery cable on the same
 *     board."
 *     Objection handling stays on the same board, not in another
 *     room or panel.
 *
 * Per canon Part III §3 Rule 5 ("every save must visibly matter"):
 * the laws are visible at the input surface so the operator sees
 * what the rack is enforcing as they fill it.
 */
export function SwitchLaws(): JSX.Element {
    return (
        <aside class="ob-loft__laws" aria-label="Operating laws">
            <article class="ob-law">
                <p class="ob-law__kicker">INPUT LAW</p>
                <p class="ob-law__title">
                    No send path without a named strain.
                </p>
                <p class="ob-law__copy">
                    The operator cannot route generic category language
                    into a live outbound channel.
                </p>
            </article>
            <article class="ob-law">
                <p class="ob-law__kicker">RECOVERY LAW</p>
                <p class="ob-law__title">
                    Every route keeps a recovery cable on the same board.
                </p>
                <p class="ob-law__copy">
                    Objection handling stays here, not in another room
                    or panel.
                </p>
            </article>
        </aside>
    );
}
