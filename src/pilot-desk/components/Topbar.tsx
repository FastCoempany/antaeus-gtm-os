import type { JSX } from "preact";
import { allProofs } from "../state";

/**
 * Topbar — kicker + serif headline + dynamic count.
 *
 * Per canon §4.15 the room shapes one pilot's evidence so the buyer's
 * boss can act on it. The topbar is calm; the work is the dark forge
 * / cream cast split stage below.
 */
export function Topbar(): JSX.Element {
    const count = allProofs.value.length;
    const savedLabel = count === 1 ? "piece of evidence" : "pieces of evidence";
    return (
        <header class="poc-topbar">
            <p class="poc-topbar__kicker">
                POC FRAMEWORK ·{" "}
                {count > 0 ? `${count} ${savedLabel} saved` : "no evidence yet"}
            </p>
            <h1 class="poc-topbar__title">
                Make the pilot results clear enough that the buyer's boss can act on them.
            </h1>
            <p class="poc-topbar__sub">
                Raw interest isn't enough. Pin the claim, the owner, the
                metric, and the kill rule before the pilot starts.
            </p>
        </header>
    );
}
