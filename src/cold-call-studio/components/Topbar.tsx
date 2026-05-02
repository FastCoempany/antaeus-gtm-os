import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
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
            <BackButton />
            <p class="cc-topbar__kicker">Calls family · Live instrument</p>
            <h1 class="cc-topbar__title">
                Weave opener, objection, proof, and ask into one live route.
            </h1>
            <p class="cc-topbar__subtitle">
                Six threads. Pull one at a time. The call is won by
                narrowing pressure, not widening explanation.
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
