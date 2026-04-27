import type { JSX } from "preact";
import { allProofs } from "../state";

/**
 * Topbar — kicker + serif thesis + dynamic count.
 *
 * Per canon §4.15 the room shapes "one decision-grade proof object."
 * The topbar is calm; the work is the dark forge / cream cast split
 * stage below.
 */
export function Topbar(): JSX.Element {
    const count = allProofs.value.length;
    const proofLabel = count === 1 ? "proof" : "proofs";
    return (
        <header class="poc-topbar">
            <p class="poc-topbar__kicker">
                POC FRAMEWORK · WAVE 1 ·{" "}
                {count > 0 ? `${count} ${proofLabel} cast` : "no proofs cast yet"}
            </p>
            <h1 class="poc-topbar__title">
                Cast one decision-grade proof.
            </h1>
            <p class="poc-topbar__sub">
                Raw interest is not proof until it can be carried. Forge the
                claim, the owner, the metric, and the kill rule before the
                pilot starts.
            </p>
        </header>
    );
}
