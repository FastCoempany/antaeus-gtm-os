import type { JSX } from "preact";
import { activeCueIndex, hottestAccount } from "../state";

/**
 * CueBooth — Wave 1 placeholder.
 *
 * Wave 3 fills this with the live 5-cue ladder, the dark stage with the
 * personalized cue script, the booth-read aside, and the command row.
 * Wave 1 ships a skeleton block so the page lays out and the smoke test
 * passes.
 */
export function CueBooth(): JSX.Element {
    const idx = activeCueIndex.value;
    const acct = hottestAccount.value;
    return (
        <section class="lp-booth" aria-label="LinkedIn cue booth">
            <div class="lp-booth__head">
                <p class="lp-booth__kicker">CUE BOOTH</p>
                <h2 class="lp-booth__title">
                    <span>Enter</span> only when the room gives a cue.
                </h2>
                <p class="lp-booth__intro">
                    The first cue is public. The inbox comes later. Pick
                    the live cue, take the touch, then log it.
                </p>
                <div class="lp-booth__law">
                    <span class="lp-booth__law-kicker">Room law</span>
                    <p>
                        The inbox is not the opening scene. The first
                        visible cue usually happens in public.
                    </p>
                </div>
            </div>
            <div class="lp-booth__placeholder">
                <p>
                    {acct
                        ? `Active context: ${acct.name}. Wave 3 wires the live cue ladder.`
                        : "No live signal context yet. Wave 3 wires the live cue ladder."}
                    {idx !== null
                        ? ` Pinned cue index: ${idx}.`
                        : null}
                </p>
            </div>
        </section>
    );
}
