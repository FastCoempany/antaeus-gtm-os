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
 * Signal Console audit (2026-05) deltas:
 *   - Hidden entirely when the workspace is empty. Four cells of
 *     zeros + an unactionable "Research heavy" label was noise.
 *   - "Posture" label dropped — the verdict chip stands alone.
 *   - "Top of room" label dropped — the grid already shows the
 *     hottest account at the top.
 */
export function WorkspaceHealth(): JSX.Element | null {
    const accounts = allAccounts.value;
    if (accounts.length === 0) return null;

    const snapshot = buildSignalRoomHealthSnapshot(accounts);
    const motionReady = snapshot.topHeat >= 75;

    return (
        <aside class="sc-health" aria-label="Workspace health">
            <span
                class={`sc-health__verdict sc-health__verdict--${motionReady ? "ready" : "research"}`}
            >
                {motionReady ? "Motion ready" : "Research heavy"}
            </span>
            <div class="sc-health__cell">
                <span class="sc-health__label">Active accounts</span>
                <span class="sc-health__value">{snapshot.accountCount}</span>
            </div>
            <div class="sc-health__cell">
                <span class="sc-health__label">Total signals</span>
                <span class="sc-health__value">{snapshot.signalCount}</span>
            </div>
            <div class="sc-health__cell">
                <span class="sc-health__label">Ready (heat ≥75)</span>
                <span class="sc-health__value">{snapshot.readyCount}</span>
            </div>
        </aside>
    );
}
