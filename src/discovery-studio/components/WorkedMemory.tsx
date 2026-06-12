import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    activeFramework,
    essentialNodeSet,
    frameworkRegistry,
    getSegmentKeyForNode,
    setActiveNode,
    workedNodeIds
} from "../state";

/**
 * WorkedMemory — Wave 3.
 *
 * Shows which nodes have been touched via signalLedger. The visible
 * marker that "this part of the call has been covered." Click any
 * worked node to jump back to it.
 *
 * Progress denominator is essentialNodeSet — covered the room's
 * essentials, not the entire 3x-larger node catalog.
 */
export function WorkedMemory(): JSX.Element {
    const fid = activeFramework.value;
    const worked = workedNodeIds.value;
    const essentials = essentialNodeSet.value;
    const fw = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)
        : null;

    if (!fw) {
        return (
            <section class="ds-worked-memory" aria-label={t("Worked memory")}>
                <header class="ds-worked-memory__header">{t("Worked memory")}</header>
                <p class="ds-worked-memory__empty">
                    Pick a framework to start tracking covered ground.
                </p>
            </section>
        );
    }

    // Build a node-id → text map so we can render the worked nodes by their
    // human-readable text without re-walking the framework on every render.
    const nodeText: Record<string, string> = {};
    for (const seg of fw.segments) {
        for (const n of seg.nodes) {
            nodeText[n.id] = n.text;
        }
    }

    const workedEssentials = worked.filter((id) => essentials.includes(id));

    const handleJump = (nodeId: string): void => {
        const segmentKey = getSegmentKeyForNode(nodeId);
        if (segmentKey) {
            setActiveNode(segmentKey, nodeId);
        }
    };

    return (
        <section class="ds-worked-memory" aria-label={t("Worked memory")}>
            <header class="ds-worked-memory__header">
                Worked memory
                <span class="ds-worked-memory__progress">
                    {workedEssentials.length} / {essentials.length}
                </span>
            </header>
            {worked.length === 0 ? (
                <p class="ds-worked-memory__empty">
                    Open a buyer-response in any segment to start tracking
                    covered ground.
                </p>
            ) : (
                <ul class="ds-worked-memory__list">
                    {worked.map((id) => (
                        <li key={id}>
                            <button
                                type="button"
                                class="ds-worked-memory__node"
                                onClick={() => handleJump(id)}
                                title={t("Jump to this node")}
                            >
                                {nodeText[id] ?? id}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
