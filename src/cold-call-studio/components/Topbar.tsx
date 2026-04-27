import type { JSX } from "preact";
import { callStats, selectedAccountName } from "../state";

/**
 * Topbar — Wave 1.
 *
 * Per canon §4.9: "no script archive, no CRM board, no loose
 * monologue." The topbar carries the kicker + thesis + one live
 * count (calls logged this session). Stats counter goes live in
 * Wave 4 once the call log is persisted.
 */
export function Topbar(): JSX.Element {
    const stats = callStats.value;
    const account = selectedAccountName.value;
    return (
        <header class="cc-topbar" aria-label="Cold Call Studio header">
            <p class="cc-topbar__kicker">CALLS FAMILY</p>
            <h1 class="cc-topbar__title">Cold Call Studio</h1>
            <p class="cc-topbar__subtitle">
                Route the live call through one thread at a time.
            </p>
            <div class="cc-topbar__meta" role="status">
                <span class="cc-topbar__state">
                    {account ? `Talk loom · ${account}` : "Talk loom"}
                </span>
                <span class="cc-topbar__count">
                    {stats.total} {stats.total === 1 ? "call" : "calls"} logged
                    {stats.total > 0
                        ? ` · ${stats.meetings} meetings`
                        : ""}
                </span>
            </div>
        </header>
    );
}
