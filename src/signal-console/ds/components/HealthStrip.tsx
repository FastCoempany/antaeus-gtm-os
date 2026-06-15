import type { JSX } from "preact";
import { Stat, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { allAccounts } from "../../state";
import { buildSignalRoomHealthSnapshot } from "../../lib/health-snapshot";

/**
 * HealthStrip — the workspace-health pulse (canon §4.7), library-
 * composed. "Motion ready" when the hottest account is ≥75, otherwise
 * "Research heavy" (more research accumulating than motion produced).
 * A short pulse, not a summary essay (Live Instrument law). Hidden when
 * the radar is empty — zeros with an unactionable verdict is noise.
 */
export function HealthStrip(): JSX.Element | null {
    const accounts = allAccounts.value;
    if (accounts.length === 0) return null;

    const snapshot = buildSignalRoomHealthSnapshot(accounts);
    const motionReady = snapshot.topHeat >= 75;

    return (
        <aside class="scd-health" aria-label={t("Workspace health")}>
            <StatusChip
                label={motionReady ? t("Motion ready") : t("Research heavy")}
                tone={motionReady ? "green" : "amber"}
            />
            <Stat value={snapshot.accountCount} label={t("ON THE RADAR")} />
            <Stat value={snapshot.readyCount} label={t("HOT ≥ 75")} />
            <Stat value={snapshot.topHeat} label={t("TOP HEAT")} />
        </aside>
    );
}
