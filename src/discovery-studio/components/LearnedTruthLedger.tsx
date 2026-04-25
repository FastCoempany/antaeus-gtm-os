import type { JSX } from "preact";
import {
    getSegmentKeyForNode,
    learnedFacts,
    setActiveNode
} from "../state";

/**
 * LearnedTruthLedger — Wave 3.
 *
 * Running list of facts the buyer revealed during the call. Each fact
 * is keyed to the node + branch that surfaced it. Clicking a fact jumps
 * the active node back to its source so you can re-read context or
 * deploy the fact in tieback.
 *
 * Wave 5 (guardian gaps) will add the hold/deploy distinction via the
 * tiebackLedger primitive.
 */
export function LearnedTruthLedger(): JSX.Element {
    const facts = learnedFacts.value;

    const handleJump = (nodeId: string): void => {
        const segmentKey = getSegmentKeyForNode(nodeId);
        if (segmentKey) {
            setActiveNode(segmentKey, nodeId);
        }
    };

    return (
        <section
            class="ds-learned-truth-ledger"
            aria-label="Learned truth ledger"
        >
            <header class="ds-learned-truth-ledger__header">
                Learned truth
                <span class="ds-learned-truth-ledger__count">
                    {facts.length}
                </span>
            </header>
            {facts.length === 0 ? (
                <p class="ds-learned-truth-ledger__empty">
                    No facts captured yet. Click a branch in the segment rail
                    to record what you've heard.
                </p>
            ) : (
                <ul class="ds-learned-truth-ledger__list">
                    {facts.map((f, i) => (
                        <li key={i} class="ds-learned-truth-ledger__item">
                            <button
                                type="button"
                                class="ds-learned-truth-ledger__jump"
                                onClick={() => handleJump(f.nodeId)}
                                title="Jump to source node"
                            >
                                <span class="ds-learned-truth-ledger__fact">
                                    {f.fact}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
