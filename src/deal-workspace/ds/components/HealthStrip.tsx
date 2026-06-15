import type { JSX } from "preact";
import { Stat, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import {
    activeDeals,
    allDeals,
    lostDeals,
    pipelineValue,
    wonDeals
} from "../../state";
import { groupByLane, rankRecovery } from "../../lib/recovery";
import { fmtMoney } from "../lib/adapters";

/**
 * HealthStrip — the recovery pulse (canon §4.13), library-composed and
 * the working-console top of the room (Diagnosis Table: where the work
 * is decaying is legible first). The verdict chip reads how many deals
 * need intervention; the stats carry pipeline value + the win/loss
 * count. Hidden when the board is empty.
 */
export function HealthStrip(): JSX.Element | null {
    const deals = allDeals.value;
    if (deals.length === 0) return null;

    const lanes = groupByLane(rankRecovery(activeDeals.value));
    const critical = lanes.critical.length;
    const atRisk = lanes["at-risk"].length;
    const needsWork = critical + atRisk;

    const verdict =
        critical > 0
            ? { label: `${critical} critical`, tone: "red" as const }
            : atRisk > 0
              ? { label: `${atRisk} at risk`, tone: "amber" as const }
              : { label: t("Pipeline healthy"), tone: "green" as const };

    return (
        <aside class="dwd-health" aria-label={t("Workspace health")}>
            <StatusChip label={verdict.label} tone={verdict.tone} />
            <Stat value={activeDeals.value.length} label={t("ACTIVE DEALS")} />
            <Stat value={fmtMoney(pipelineValue.value)} label={t("PIPELINE")} />
            <Stat value={needsWork} label={t("NEED A MOVE")} />
            <Stat
                value={`${wonDeals.value.length} / ${lostDeals.value.length}`}
                label={t("WON / LOST")}
            />
        </aside>
    );
}
