import type { Account, HeatBand } from "./types";
import { heat as heatScore, heatMetrics, rankByHeat } from "./heat";
import { reportError } from "@/lib/observability";

/**
 * Phase 4 / Room 3 Wave 4 — Signal Console health snapshot.
 *
 * Published to localStorage under `gtmos_signal_room_health` on every
 * state change. Phase 4 / Room 2 (Dashboard)'s aggregator reads this
 * to build the Outbound move cards in its command-intelligence rail.
 *
 * Shape mirrors the legacy room's `buildSignalConsoleHealthSnapshot`
 * output (lines 1397–1440 of app/signal-console/index.html). Field
 * names are stable — every consumer downstream reads them directly.
 *
 * Per canon Part III §3 rule 6 ("no module feels isolated"), this is
 * the surface that lets other rooms see what's happening here.
 */

export const HEALTH_SNAPSHOT_KEY = "gtmos_signal_room_health";

export interface SignalRoomHealthSnapshot {
    readonly capturedAt: string;
    readonly accountCount: number;
    readonly signalCount: number;
    /** Accounts with heat ≥ 75 (Active or Hot). */
    readonly readyCount: number;
    readonly topAccountId: string | null;
    readonly topAccountName: string;
    readonly topHeat: number;
    readonly topBand: HeatBand;
    readonly topSignalCount: number;
    readonly topHighConfidenceCount: number;
    readonly topRecentCount: number;
    readonly hot_accounts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
        readonly heat: number;
        readonly band: HeatBand;
        readonly signalCount: number;
        readonly recentSignals: number;
        readonly highConfidenceSignals: number;
    }>;
}

export function buildSignalRoomHealthSnapshot(
    accounts: ReadonlyArray<Account>,
    now: number = Date.now()
): SignalRoomHealthSnapshot {
    const ranked = rankByHeat(accounts, now);
    const top = ranked[0] ?? null;
    const topMetrics = top ? heatMetrics(top, now) : null;

    let signalCount = 0;
    let readyCount = 0;
    for (const a of accounts) {
        signalCount += a.signals.length;
        if (heatScore(a, now) >= 75) readyCount++;
    }

    const hotAccounts = ranked.slice(0, 5).map((a) => {
        const m = heatMetrics(a, now);
        return {
            id: a.id,
            name: a.name,
            heat: m.heat,
            band: m.band,
            signalCount: m.signalCount,
            recentSignals: m.recentCount,
            highConfidenceSignals: m.highConfidenceCount
        };
    });

    return {
        capturedAt: new Date(now).toISOString(),
        accountCount: accounts.length,
        signalCount,
        readyCount,
        topAccountId: top?.id ?? null,
        topAccountName: top?.name ?? "",
        topHeat: topMetrics?.heat ?? 0,
        topBand: topMetrics?.band ?? "Low",
        topSignalCount: topMetrics?.signalCount ?? 0,
        topHighConfidenceCount: topMetrics?.highConfidenceCount ?? 0,
        topRecentCount: topMetrics?.recentCount ?? 0,
        hot_accounts: hotAccounts
    };
}

export function publishHealthSnapshot(
    accounts: ReadonlyArray<Account>,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        const snapshot = buildSignalRoomHealthSnapshot(accounts);
        storage.setItem(HEALTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (err) {
        reportError(err, { op: "signal-console.publishHealthSnapshot" });
    }
}
