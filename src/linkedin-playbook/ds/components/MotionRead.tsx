import type { JSX } from "preact";
import { Kicker, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { motion, motionTone } from "../lib/adapters";

/**
 * MotionRead — the play right now (canon §4.10). The motion engine reads
 * the cross-room context (best ICP, hottest account, latest touch) and
 * names the play: why now, the next move, and — the recovery cable — what
 * to do if the rep gets corrected. The console's working-top.
 */
export function MotionRead(): JSX.Element {
    const m = motion();
    return (
        <div class="lpd-motion">
            <div class="lpd-motion__head">
                <Kicker>{t("THE PLAY")}</Kicker>
                <StatusChip label={m.label} tone={motionTone(m.key)} />
                {m.accountName ? <span class="lpd-motion__account">{m.accountName}</span> : null}
            </div>
            <p class="lpd-motion__why">{m.whyNow}</p>
            <div class="lpd-motion__moves">
                <p class="lpd-motion__move">
                    <span class="lpd-motion__move-mark lpd-motion__move-mark--next">{t("NEXT")}</span> {m.nextMove}
                </p>
                {m.recovery ? (
                    <p class="lpd-motion__move">
                        <span class="lpd-motion__move-mark">{t("IF CORRECTED")}</span> {m.recovery}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
