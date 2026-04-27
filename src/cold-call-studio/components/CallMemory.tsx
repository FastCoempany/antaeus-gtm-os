import type { JSX } from "preact";
import { callLog } from "../state";

/**
 * CallMemory — Wave 1 placeholder.
 *
 * Wave 4 wires persistence over `gtmos_cold_call_log` and renders
 * the call grid + handoff strip with continuity params. Wave 1
 * shows an empty-state block so the page still lays out.
 */
export function CallMemory(): JSX.Element {
    const calls = callLog.value;
    return (
        <section class="cc-memory" aria-label="Call memory">
            <header class="cc-memory__head">
                <p class="cc-memory__kicker">CALL MEMORY</p>
                <h2 class="cc-memory__title">
                    Log the outcome before the thread goes cold.
                </h2>
            </header>
            {calls.length === 0 ? (
                <p class="cc-memory__empty">
                    No cold call outcomes logged yet. Wave 4 wires the
                    outcome buttons + persistence over
                    <code>gtmos_cold_call_log</code>.
                </p>
            ) : (
                <ul class="cc-memory__list">
                    {calls.slice(-8).reverse().map((c) => (
                        <li key={c.id} class="cc-memory__row">
                            <span class="cc-memory__row-account">
                                {c.accountName || "—"}
                            </span>
                            <span class="cc-memory__row-thread">
                                {c.threadTitle}
                            </span>
                            <span class="cc-memory__row-outcome">
                                {c.outcome.replace(/_/g, " ")}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
