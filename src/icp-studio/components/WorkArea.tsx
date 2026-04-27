import type { JSX } from "preact";
import { draft } from "../state";

/**
 * WorkArea — Wave 1 placeholder.
 *
 * Wave 3 fills this with the bright work surface per Part II §4.8:
 *   - role toggle (founder / first AE)
 *   - 7 input bands (industry / size / geo / buyer / pain / trigger /
 *     proof window) each with template-aware select + custom input
 *   - live build outputs (Thin ICP statement / focus recommendation /
 *     buying-group minimum / evidence signals)
 *   - quality readout (8-check list + score band)
 */
export function WorkArea(): JSX.Element {
    const d = draft.value;
    const filled = [
        d.industry,
        d.size,
        d.geo,
        d.buyer,
        d.pain,
        d.trigger,
        d.proofWindow
    ].filter((v) => v.trim().length > 0).length;
    return (
        <section class="icp-work" aria-label="ICP work surface">
            <p class="icp-work__kicker">WORK SURFACE</p>
            <h2 class="icp-work__title">
                Compose the wedge — one industry, one size, one geo, one
                buyer, one pain, one trigger, one proof window.
            </h2>
            <p class="icp-work__placeholder">
                {filled} / 7 inputs filled. Wave 3 wires the live form +
                build outputs + quality readout.
            </p>
        </section>
    );
}
