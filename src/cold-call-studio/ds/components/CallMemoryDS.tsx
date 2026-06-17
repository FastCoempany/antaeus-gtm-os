import type { JSX } from "preact";
import { Kicker, Stat, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { callLog, callStats } from "../../state";
import { OUTCOME_LABELS } from "../../lib/types";
import { outcomeTone } from "../lib/adapters";

/**
 * CallMemoryDS — the call log + the running counts (canon §4.9). What
 * the calls produced: meetings, callbacks, referrals. Each row is a
 * logged call with its thread, the buyer's response, and the outcome.
 */
export function CallMemoryDS(): JSX.Element | null {
    const log = callLog.value;
    const s = callStats.value;
    if (log.length === 0) return null;

    return (
        <section class="ccd-memory" aria-label={t("Call memory")}>
            <header class="ccd-memory__head">
                <Kicker>{t("CALL MEMORY")}</Kicker>
                <div class="ccd-memory__stats">
                    <Stat value={s.total} label={t("CALLS")} />
                    <Stat value={s.meetings} label={t("MEETINGS")} />
                    <Stat value={s.callbacks} label={t("CALLBACKS")} />
                    <Stat value={s.referrals} label={t("REFERRALS")} />
                </div>
            </header>
            <ul class="ccd-memory__list">
                {log
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((c) => (
                        <li key={c.id} class="ccd-memory__row">
                            <div class="ccd-memory__body">
                                <span class="ccd-memory__account">
                                    {c.accountName || t("(no account)")}
                                </span>
                                <span class="ccd-memory__thread">{c.threadTitle}</span>
                                {c.buyerResponse ? (
                                    <span class="ccd-memory__buyer">“{c.buyerResponse}”</span>
                                ) : null}
                            </div>
                            <StatusChip
                                label={OUTCOME_LABELS[c.outcome]}
                                tone={outcomeTone(c.outcome)}
                            />
                        </li>
                    ))}
            </ul>
        </section>
    );
}
