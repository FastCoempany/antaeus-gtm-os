import type { JSX } from "preact";
import { Kicker, Select, Stat, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { actions, stats, updateOutcome } from "../../state";
import { OUTCOME_LABELS, OUTCOMES, type Outcome } from "../../lib/types";
import { outcomeTone } from "../lib/adapters";

const OUTCOME_OPTIONS = [
    { value: "", label: t("No outcome yet") },
    ...OUTCOMES.map((o) => ({ value: o, label: OUTCOME_LABELS[o] }))
];

/**
 * ChannelBoard — the channel memory (canon §4.10). The acceptance + reply
 * rates that say whether the air cover is working, and the logged cues
 * with their outcomes. Motion truth flows from here to the Dashboard +
 * Readiness.
 */
export function ChannelBoard(): JSX.Element | null {
    const s = stats.value;
    const log = actions.value;
    if (log.length === 0) return null;

    return (
        <section class="lpd-board" aria-label={t("Channel memory")}>
            <header class="lpd-board__head">
                <Kicker>{t("CHANNEL MEMORY")}</Kicker>
                <div class="lpd-board__stats">
                    <Stat value={s.connections} label={t("REQUESTS")} />
                    <Stat value={`${s.acceptRate}%`} label={t("ACCEPTED")} />
                    <Stat value={s.dms} label={t("DMS")} />
                    <Stat value={`${s.replyRate}%`} label={t("REPLIED")} />
                </div>
            </header>
            <ul class="lpd-board__list">
                {log
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((a) => (
                        <li key={a.id} class="lpd-board__row">
                            <div class="lpd-board__body">
                                <span class="lpd-board__account">
                                    {a.accountName || a.contactName || t("(unnamed)")}
                                </span>
                                <span class="lpd-board__cue">
                                    {a.cueLabel} · {a.motionLabel}
                                </span>
                            </div>
                            {a.outcome ? (
                                <StatusChip label={OUTCOME_LABELS[a.outcome]} tone={outcomeTone(a.outcome)} />
                            ) : null}
                            <Select
                                value={a.outcome ?? ""}
                                onChange={(o) => updateOutcome(a.id, (o || null) as Outcome | null)}
                                options={OUTCOME_OPTIONS}
                            />
                        </li>
                    ))}
            </ul>
        </section>
    );
}
