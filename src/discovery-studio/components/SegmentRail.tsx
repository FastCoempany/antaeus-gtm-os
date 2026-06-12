import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    activeFramework,
    activeNode,
    clearActiveNode,
    compressionMode,
    essentialNodeSet,
    expandResponse,
    expandedResponse,
    frameworkRegistry,
    recordBranchInteraction,
    setActiveNode,
    type Branch,
    type SegmentNode
} from "../state";

/**
 * Static tempo hints per segment key — guidance, not enforcement.
 * 30-minute call distributed proportionally: pain + current-state get
 * the most time, openers + post-call routing the least. Total ≈ 30.
 */
const TEMPO_HINTS: Record<string, number> = {
    "opening-frame": 2,
    "current-state-truth": 5,
    "pain-and-consequence": 5,
    "trigger-and-urgency": 3,
    "stakeholder-and-ownership": 3,
    "proof-threshold": 3,
    "current-vendor-and-displacement": 3,
    "decision-architecture": 3,
    "next-step-lock": 2,
    "post-call-routing": 1
};

/**
 * SegmentRail — Program 6 / PR 4 refacing.
 *
 * The 10-stop spine, vertically stacked. Adopts the Ledger Spine
 * Canonical expandable-segment model: only ONE segment is open at a
 * time. Non-active segments collapse to dot + num + title (compressed
 * header only). The active segment expands inline with its nodes +
 * branch picker.
 *
 * "Active" is derived from `activeNode.segmentKey` — clicking a
 * compressed segment header selects its first visible node, which
 * makes the segment expand. Clicking the expanded segment's header
 * again collapses it (clears activeNode).
 *
 * Compression mode still filters NODES inside the active segment;
 * segments themselves are not hidden by compression mode (they're
 * always 10 rows, just compressed when not active).
 *
 * Previous (Wave 2) model showed every segment with all visible
 * nodes + branches inline at once — that read as a long scrolling
 * document, not a focused work surface. The Ledger Spine wireframe
 * picked one-segment-at-a-time for exactly that focus discipline.
 */
export function SegmentRail(): JSX.Element {
    const fid = activeFramework.value;
    const node = activeNode.value;
    const mode = compressionMode.value;
    const essentials = essentialNodeSet.value;
    // Which segment is currently expanded? Derived from activeNode;
    // null means every segment is collapsed.
    const activeSegmentKey: string | null = node?.segmentKey ?? null;

    if (!fid) {
        return (
            <section class="ds-segment-rail" aria-label={t("Discovery segments")}>
                <p class="ds-segment-rail__empty">
                    Pick a framework above to load its discovery segments.
                </p>
            </section>
        );
    }

    const fw = frameworkRegistry.value.find((f) => f.id === fid);
    if (!fw) {
        return (
            <section class="ds-segment-rail" aria-label={t("Discovery segments")}>
                <p class="ds-segment-rail__empty">
                    Framework is still loading — try reselecting.
                </p>
            </section>
        );
    }

    const filterNode = (nodeId: string): boolean =>
        mode === "off" ? true : essentials.includes(nodeId);

    return (
        <section class="ds-segment-rail" aria-label={t("Discovery segments")}>
            <ol class="ds-segment-rail__list">
                {fw.segments.map((seg) => {
                    const visibleNodes = seg.nodes.filter((n) =>
                        filterNode(n.id)
                    );
                    if (visibleNodes.length === 0) return null;
                    // Wave 5 — phase tempo hint. 30-min target divided
                    // across 10 segments = 3 min per segment baseline. Pain
                    // and current-state segments get extra weight, openers
                    // and routing get less. Static hint, not enforced.
                    const tempoMinutes = TEMPO_HINTS[seg.key] ?? 3;
                    // Ledger Spine: one segment expanded at a time.
                    const isSegmentActive = activeSegmentKey === seg.key;
                    // Clicking a collapsed segment header selects its
                    // first visible node (which marks the segment as
                    // active, causing it to expand). Clicking an
                    // already-expanded segment header collapses it
                    // (clears activeNode).
                    const handleHeaderClick = (): void => {
                        if (isSegmentActive) {
                            clearActiveNode();
                        } else if (visibleNodes[0]) {
                            setActiveNode(seg.key, visibleNodes[0].id);
                        }
                    };
                    return (
                        <li
                            key={seg.key}
                            class={`ds-segment-rail__segment${
                                seg.essential
                                    ? " ds-segment-rail__segment--essential"
                                    : ""
                            }${isSegmentActive ? " is-segment-active" : " is-segment-collapsed"}`}
                        >
                            <button
                                type="button"
                                class="ds-segment-rail__segment-header"
                                aria-expanded={isSegmentActive}
                                onClick={handleHeaderClick}
                            >
                                <span class="ds-segment-rail__segment-dot" aria-hidden="true" />
                                <span class="ds-segment-rail__segment-num">
                                    {seg.num.toString().padStart(2, "0")}
                                </span>
                                <span class="ds-segment-rail__segment-title">
                                    {seg.title}
                                </span>
                                <span class="ds-segment-rail__segment-tempo">
                                    ~{tempoMinutes}m
                                </span>
                            </button>
                            {isSegmentActive && seg.cue ? (
                                <p class="ds-segment-rail__segment-cue">
                                    {seg.cue}
                                </p>
                            ) : null}
                            {isSegmentActive ? (
                            <ul class="ds-segment-rail__nodes">
                                {visibleNodes.map((n) => {
                                    const isActive =
                                        node?.segmentKey === seg.key &&
                                        node?.nodeId === n.id;
                                    return (
                                        <li key={n.id}>
                                            <NodeButton
                                                node={n}
                                                isActive={isActive}
                                                onClick={() =>
                                                    setActiveNode(seg.key, n.id)
                                                }
                                            />
                                            {isActive ? (
                                                <BranchPicker branches={n.branches} />
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

interface NodeButtonProps {
    node: SegmentNode;
    isActive: boolean;
    onClick: () => void;
}

function NodeButton({ node, isActive, onClick }: NodeButtonProps): JSX.Element {
    const tone = node.tone ?? "blu";
    return (
        <button
            type="button"
            class={`ds-segment-rail__node ds-segment-rail__node--${tone}${
                isActive ? " is-active" : ""
            }${node.essential ? " is-essential" : ""}`}
            aria-pressed={isActive}
            onClick={onClick}
        >
            {node.badge ? (
                <span class="ds-segment-rail__node-badge">{node.badge}</span>
            ) : null}
            <span class="ds-segment-rail__node-text">{node.text}</span>
            {node.note ? (
                <span class="ds-segment-rail__node-note">{node.note}</span>
            ) : null}
        </button>
    );
}

interface BranchPickerProps {
    branches: ReadonlyArray<Branch>;
}

function BranchPicker({ branches }: BranchPickerProps): JSX.Element {
    const expanded = expandedResponse.value;
    const node = activeNode.value;
    if (branches.length === 0) {
        return (
            <p class="ds-branch-picker__empty">
                No buyer-response branches loaded for this prompt.
            </p>
        );
    }
    return (
        <div class="ds-branch-picker">
            {branches.map((b, i) => {
                const isExpanded = expanded === i;
                const handleClick = (): void => {
                    if (isExpanded) {
                        expandResponse(-1);
                    } else {
                        expandResponse(i);
                        // Wave 3: record the branch interaction. This is
                        // idempotent — re-clicking the same branch won't
                        // duplicate the ledger entry.
                        if (node) {
                            recordBranchInteraction(node.nodeId, i, b);
                        }
                    }
                };
                return (
                    <button
                        key={i}
                        type="button"
                        class={`ds-branch-picker__branch ds-branch-picker__branch--${b.cls}${
                            isExpanded ? " is-expanded" : ""
                        }`}
                        onClick={handleClick}
                    >
                        {b.tag ? (
                            <span class="ds-branch-picker__tag">{b.tag}</span>
                        ) : null}
                        <span class="ds-branch-picker__quote">
                            "{b.quote}"
                        </span>
                        {isExpanded ? (
                            <div class="ds-branch-picker__detail">
                                <p class="ds-branch-picker__move">
                                    <strong>{t("Say next:")}</strong> {b.move}
                                </p>
                                {b.clear ? (
                                    <p class="ds-branch-picker__clear">
                                        <strong>{t("Clear:")}</strong> {b.clear}
                                    </p>
                                ) : null}
                                {b.missing ? (
                                    <p class="ds-branch-picker__missing">
                                        <strong>{t("Still missing:")}</strong>{" "}
                                        {b.missing}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
