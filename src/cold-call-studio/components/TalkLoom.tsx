import type { JSX } from "preact";
import { activeThread, selectedAccountName } from "../state";

/**
 * TalkLoom — Wave 1 placeholder.
 *
 * Wave 3 fills this with the 6-thread spine, branch picker,
 * say-line panel, and say-next capture. Wave 1 only ships a
 * skeleton block so the page lays out and the smoke test passes.
 */
export function TalkLoom(): JSX.Element {
    const t = activeThread.value;
    const account = selectedAccountName.value;
    return (
        <section class="cc-loom" aria-label="Talk loom">
            <div class="cc-loom__head">
                <p class="cc-loom__kicker">TALK LOOM</p>
                <h2 class="cc-loom__title">
                    Pull <span>one</span> live thread at a time.
                </h2>
                <p class="cc-loom__intro">
                    The call is not a script archive. It is a sequence of
                    tension changes. The rep should know what to say now,
                    what the buyer might say, and which thread to pull
                    next.
                </p>
                <div class="cc-loom__law">
                    <span class="cc-loom__law-kicker">Room law</span>
                    <p>
                        A cold call is won by narrowing pressure, not
                        widening explanation.
                    </p>
                </div>
            </div>
            <div class="cc-loom__placeholder" data-cc-active-thread={t}>
                <p class="cc-loom__placeholder-copy">
                    {account
                        ? `Active thread: ${t}. Wave 3 wires the live thread spine + branch picker.`
                        : "Pick an account in the Switchboard above to begin. Wave 3 wires the live thread spine."}
                </p>
            </div>
        </section>
    );
}
