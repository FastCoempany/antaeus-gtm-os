import type { Deal } from "./deal-shape";
import { isClosed } from "./deal-shape";
import { rankRecovery } from "./recovery";

/**
 * Wave 5 — Deal Workspace health snapshot.
 *
 * The Dashboard's command-intelligence rail + Readiness Score room +
 * Workspace-health summary block all read a per-room snapshot to
 * compose their own surfaces. Until those rooms migrate, the snapshot
 * is published to localStorage under `gtmos_deal_workspace_health` so
 * legacy readers can pick it up; once they migrate they read directly
 * from the data client.
 *
 * Per canon Part III §3 rule 6 ("no module feels isolated"), this is
 * the surface that lets other rooms see what's happening here.
 *
 * Failures swallowed (storage may be hostile in test / SSR / quota
 * exceeded). The snapshot is a derived view, not source of truth.
 */

export const HEALTH_SNAPSHOT_KEY = "gtmos_deal_workspace_health";

export interface DealHealthSnapshot {
    readonly generated_at: string;
    readonly active_count: number;
    readonly pipeline_value: number;
    readonly won_count: number;
    readonly lost_count: number;
    readonly critical_count: number;
    readonly at_risk_count: number;
    readonly healthy_count: number;
    readonly top_pressure: ReadonlyArray<{
        readonly id: string;
        readonly accountName: string;
        readonly stage: string;
        readonly score: number;
        readonly cause: string;
    }>;
}

export function dealsToHealthSummary(
    deals: ReadonlyArray<Deal>
): DealHealthSnapshot {
    const active = deals.filter((d) => !isClosed(d.stage));
    const won = deals.filter((d) => d.stage === "closed-won");
    const lost = deals.filter((d) => d.stage === "closed-lost");
    const ranked = rankRecovery(active);

    let critical = 0;
    let atRisk = 0;
    let healthy = 0;
    for (const a of ranked) {
        if (a.lane === "critical") critical++;
        else if (a.lane === "at-risk") atRisk++;
        else healthy++;
    }

    const topPressure = ranked.slice(0, 5).map((a) => ({
        id: a.deal.id,
        accountName: a.deal.accountName,
        stage: a.deal.stage,
        score: a.score,
        cause: a.causes[0] ?? a.nextMove
    }));

    return {
        generated_at: new Date().toISOString(),
        active_count: active.length,
        pipeline_value: active.reduce((sum, d) => sum + (d.value || 0), 0),
        won_count: won.length,
        lost_count: lost.length,
        critical_count: critical,
        at_risk_count: atRisk,
        healthy_count: healthy,
        top_pressure: topPressure
    };
}

export function publishHealthSnapshot(deals: ReadonlyArray<Deal>): void {
    try {
        if (typeof localStorage === "undefined") return;
        const summary = dealsToHealthSummary(deals);
        localStorage.setItem(HEALTH_SNAPSHOT_KEY, JSON.stringify(summary));
    } catch {
        // best-effort
    }
}
