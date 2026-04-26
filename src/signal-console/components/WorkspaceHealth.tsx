import type { JSX } from "preact";
import { allAccounts } from "../state";
import { buildSignalRoomHealthSnapshot } from "../lib/health-snapshot";

/**
 * WorkspaceHealth — Wave 5 panel.
 *
 * Per canon §4.7: research posture is "motion ready" when the topmost
 * account has heat ≥75, otherwise "research heavy" (more research is
 * accumulating than motion is being produced).
 *
 * Two metrics + one verdict. Calm — does not compete with the grid
 * for attention.
 */
export function WorkspaceHealth(): JSX.Element {
    const accounts = allAccounts.value;
    const snapshot = buildSignalRoomHealthSnapshot(accounts);
    const motionReady = snapshot.topHeat >= 75;

    return (
        <aside class="sc-health" aria-label="Workspace health">
            <div class="sc-health__cell">
                <span class="sc-health__label">Posture</span>
                <span
                    class={`sc-health__value sc-health__value--${motionReady ? "ready" : "research"}`}
                >
                    {motionReady ? "Motion ready" : "Research heavy"}
                </span>
            </div>
            <div class="sc-health__cell">
                <span class="sc-health__label">Active accounts</span>
                <span class="sc-health__value">
                    {snapshot.accountCount}
                </span>
            </div>
            <div class="sc-health__cell">
                <span class="sc-health__label">Total signals</span>
                <span class="sc-health__value">
                    {snapshot.signalCount}
                </span>
            </div>
            <div class="sc-health__cell">
                <span class="sc-health__label">Ready (heat ≥75)</span>
                <span class="sc-health__value">{snapshot.readyCount}</span>
            </div>
            {snapshot.topAccountName ? (
                <div class="sc-health__cell sc-health__cell--wide">
                    <span class="sc-health__label">Top of room</span>
                    <span class="sc-health__value">
                        {snapshot.topAccountName} · {snapshot.topHeat} {snapshot.topBand}
                    </span>
                </div>
            ) : null}
        </aside>
    );
}
