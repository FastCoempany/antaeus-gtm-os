import type { JSX } from "preact";
import {
    activeFramework,
    activeNode,
    essentialNodeSet,
    frameworkRegistry
} from "../state";

/**
 * WorkedMemory — Wave 1 skeleton.
 *
 * Shows which nodes have been touched (had at least one branch expanded
 * or been the active node). The visible signal that "this part of the
 * call has been covered."
 *
 * Wave 2 wires this to the signal ledger so the count + list reflect
 * actual call progress, not just the static node catalog.
 */
export function WorkedMemory(): JSX.Element {
    const fid = activeFramework.value;
    const node = activeNode.value;
    const essentials = essentialNodeSet.value;
    const fw = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)
        : null;

    if (!fw) {
        return (
            <section class="ds-worked-memory" aria-label="Worked memory">
                <header class="ds-worked-memory__header">Worked memory</header>
                <p class="ds-worked-memory__empty">
                    Select a framework to see worked-memory progress.
                </p>
            </section>
        );
    }

    const totalEssentials = essentials.length;
    const workedCount = node ? 1 : 0; // Wave 2: count from signalLedger

    return (
        <section class="ds-worked-memory" aria-label="Worked memory">
            <header class="ds-worked-memory__header">
                Worked memory
                <span class="ds-worked-memory__progress">
                    {workedCount} / {totalEssentials}
                </span>
            </header>
            <p class="ds-worked-memory__hint">
                Wave 2 will list the nodes you've touched so far in this call.
            </p>
        </section>
    );
}
