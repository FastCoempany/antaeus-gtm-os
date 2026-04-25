import type { JSX } from "preact";
import {
    activeFramework,
    activeNode,
    compressionMode,
    essentialNodeSet,
    frameworkRegistry,
    setActiveNode
} from "../state";

/**
 * SegmentRail — Wave 1 skeleton.
 *
 * Vertical, collapsible list of segments. One open segment + one open node
 * at a time. Compression mode filters the visible nodes.
 *
 * Wave 2 wires the proper expand/collapse interaction + the per-node
 * branch picker.
 */
export function SegmentRail(): JSX.Element {
    const fid = activeFramework.value;
    const node = activeNode.value;
    const mode = compressionMode.value;
    const essentials = essentialNodeSet.value;

    if (!fid) {
        return (
            <section class="ds-segment-rail" aria-label="Discovery segments">
                <p class="ds-segment-rail__empty">
                    Select a framework to see its segment spine.
                </p>
            </section>
        );
    }

    const fw = frameworkRegistry.value.find((f) => f.id === fid);
    if (!fw) {
        return (
            <section class="ds-segment-rail" aria-label="Discovery segments">
                <p class="ds-segment-rail__empty">Framework not loaded.</p>
            </section>
        );
    }

    const filterNode = (nodeId: string): boolean =>
        mode === "off" ? true : essentials.includes(nodeId);

    return (
        <section class="ds-segment-rail" aria-label="Discovery segments">
            <ol class="ds-segment-rail__list">
                {fw.segments.map((seg) => {
                    const visibleNodes = seg.nodes.filter((n) =>
                        filterNode(n.id)
                    );
                    return (
                        <li key={seg.id} class="ds-segment-rail__segment">
                            <header class="ds-segment-rail__segment-header">
                                {seg.label}
                            </header>
                            <ul class="ds-segment-rail__nodes">
                                {visibleNodes.map((n) => {
                                    const isActive =
                                        node?.segmentId === seg.id &&
                                        node?.nodeId === n.id;
                                    return (
                                        <li key={n.id}>
                                            <button
                                                type="button"
                                                class={`ds-segment-rail__node${
                                                    isActive ? " is-active" : ""
                                                }`}
                                                aria-pressed={isActive}
                                                onClick={() =>
                                                    setActiveNode(seg.id, n.id)
                                                }
                                            >
                                                {n.label}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
