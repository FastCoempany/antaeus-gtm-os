import type { JSX } from "preact";
import {
    deployFact,
    factStatusFor,
    getSegmentKeyForNode,
    holdFact,
    learnedFacts,
    setActiveNode
} from "../state";

/**
 * LearnedTruthLedger — Wave 5.
 *
 * Running list of facts the buyer revealed during the call. Each fact
 * carries:
 *   - A jump-to-source button (ledger fact → node it came from)
 *   - A status pill: NEW / HOLD / DEPLOYED
 *   - Hold/Deploy action buttons (state-dependent)
 *
 * The status pill + hold/deploy actions implement the tieback ledger
 * primitive per the Lumana on-call control lock spec. Held facts are
 * queued for tieback; deployed facts have been used back in the
 * conversation.
 *
 * Status transitions:
 *   new → hold     (user clicks "Hold")
 *   hold → deployed (user clicks "Deploy")
 *   new → deployed (user clicks "Deploy" without first holding)
 *
 * Once deployed, status is terminal (no UI-level back-flip in Wave 5).
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
                    {facts.map((f, i) => {
                        const status = factStatusFor(f.nodeId, f.branchIndex);
                        return (
                            <li
                                key={i}
                                class={`ds-learned-truth-ledger__item ds-learned-truth-ledger__item--${
                                    status ?? "new"
                                }`}
                            >
                                <div class="ds-learned-truth-ledger__row">
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
                                    <span
                                        class={`ds-learned-truth-ledger__status ds-learned-truth-ledger__status--${
                                            status ?? "new"
                                        }`}
                                    >
                                        {status === "deployed"
                                            ? "DEPLOYED"
                                            : status === "hold"
                                              ? "HOLD"
                                              : "NEW"}
                                    </span>
                                </div>
                                <div class="ds-learned-truth-ledger__actions">
                                    {status !== "hold" &&
                                    status !== "deployed" ? (
                                        <button
                                            type="button"
                                            class="ds-learned-truth-ledger__action ds-learned-truth-ledger__action--hold"
                                            onClick={() =>
                                                holdFact(f.nodeId, f.branchIndex)
                                            }
                                        >
                                            Hold
                                        </button>
                                    ) : null}
                                    {status !== "deployed" ? (
                                        <button
                                            type="button"
                                            class="ds-learned-truth-ledger__action ds-learned-truth-ledger__action--deploy"
                                            onClick={() =>
                                                deployFact(
                                                    f.nodeId,
                                                    f.branchIndex
                                                )
                                            }
                                        >
                                            Deploy
                                        </button>
                                    ) : null}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
