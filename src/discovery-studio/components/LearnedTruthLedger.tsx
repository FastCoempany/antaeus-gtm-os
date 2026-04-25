import type { JSX } from "preact";
import { learnedFacts } from "../state";

/**
 * LearnedTruthLedger — Wave 1 skeleton.
 *
 * Running list of facts the buyer revealed during the call. Each fact
 * is keyed to the node + branch that surfaced it. The ledger is the
 * visible memory — what the user has heard so far in this conversation.
 *
 * Wave 2 wires up the click-to-jump-back-to-source-node interaction.
 */
export function LearnedTruthLedger(): JSX.Element {
    const facts = learnedFacts.value;

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
                            <span class="ds-learned-truth-ledger__fact">
                                {f.fact}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
