import type { JSX } from "preact";
import { Kicker, Select, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { rack, setTouchOutcome, touchesForRack } from "../../state";
import {
    CHANNEL_LABELS,
    TEMPERATURE_LABELS,
    TOUCH_OUTCOME_LABELS,
    TOUCH_OUTCOMES,
    type TouchOutcome
} from "../../lib/types";
import { outcomeTone } from "../lib/adapters";

const OUTCOME_OPTIONS = [
    { value: "", label: t("No outcome yet") },
    ...TOUCH_OUTCOMES.map((o) => ({ value: o, label: TOUCH_OUTCOME_LABELS[o] }))
];

/**
 * TouchLogDS — the per-account touch log (canon §4.8). The recovery
 * cable on the same board: every line that left is here, with its
 * outcome editable so the reply/meeting state flows back to Signal
 * Console's temperature. Scoped to the rack's current account.
 */
export function TouchLogDS(): JSX.Element | null {
    const account = rack.value.accountName.trim();
    if (!account) return null;
    const touches = touchesForRack.value;

    return (
        <section class="osd-log" aria-label={t("Touch log")}>
            <div class="osd-log__head">
                <Kicker>{t("TOUCHES")}</Kicker>
                <span class="osd-log__count">
                    {`${touches.length} ${t("on")} ${account}`}
                </span>
            </div>
            {touches.length === 0 ? (
                <p class="osd-log__empty">
                    {t("No touches logged on this account yet.", { class: "body" })}
                </p>
            ) : (
                <ul class="osd-log__list">
                    {touches.map((touch) => (
                        <li key={touch.id} class="osd-log__row">
                            <div class="osd-log__body">
                                <span class="osd-log__line">{touch.content}</span>
                                <div class="osd-log__meta">
                                    <StatusChip
                                        label={CHANNEL_LABELS[touch.channel]}
                                        tone="blue"
                                    />
                                    <span class="osd-log__temp">
                                        {TEMPERATURE_LABELS[touch.temperature]}
                                    </span>
                                    {touch.outcome ? (
                                        <StatusChip
                                            label={TOUCH_OUTCOME_LABELS[touch.outcome]}
                                            tone={outcomeTone(touch.outcome)}
                                        />
                                    ) : null}
                                </div>
                            </div>
                            <Select
                                value={touch.outcome ?? ""}
                                onChange={(o) =>
                                    setTouchOutcome(touch.id, (o || null) as TouchOutcome | null)
                                }
                                options={OUTCOME_OPTIONS}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
