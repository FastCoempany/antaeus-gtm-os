import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import { armedTriggers, disableArmedTrigger, recentFires, triggersLoaded } from "../state";
import {
    type ArmedTrigger,
    type TriggerFire,
    shortFireDate,
    triggerTypeLabel
} from "../lib/watchlist-client";
import { AddTriggerFlow } from "./AddTriggerFlow";

/**
 * Saved monitoring rules shown beneath Briefing analyses. A rule defines
 * an event Antaeus should check for; matching events are listed with the
 * supporting evidence count and most recent match date.
 */

function FireRow({ fire }: { fire: TriggerFire }): JSX.Element {
    return (
        <li class="bf-fire">
            <p class="bf-fire__summary">{fire.summary}</p>
            <p class="bf-fire__meta">
                {fire.trigger_natural_language && (
                    <span class="bf-fire__trig">{fire.trigger_natural_language}</span>
                )}
                <span class="bf-fire__when">
                    {shortFireDate(fire.fired_at)} · {fire.evidence_count} {t("evidence item", { class: "body" })}
                    {fire.evidence_count === 1 ? "" : "s"}
                </span>
            </p>
        </li>
    );
}

function ArmedRow({ trigger }: { trigger: ArmedTrigger }): JSX.Element {
    const [busy, setBusy] = useState(false);
    async function handleDisable(): Promise<void> {
        if (busy) return;
        setBusy(true);
        await disableArmedTrigger(trigger.id);
        setBusy(false);
    }
    return (
        <li class="bf-armed">
            <div class="bf-armed__body">
                <p class="bf-armed__nl">{trigger.natural_language}</p>
                <p class="bf-armed__meta">
                    <span class="bf-armed__type">{triggerTypeLabel(trigger.trigger_type)}</span>
                    {trigger.fire_count > 0 && (
                        <span class="bf-armed__fires">
                            {t("matched")} {trigger.fire_count}×
                            {trigger.last_fired_at
                                ? ` · ${t("last match", { class: "body" })} ${shortFireDate(trigger.last_fired_at)}`
                                : ""}
                        </span>
                    )}
                    {trigger.fire_count === 0 && (
                        <span class="bf-armed__fires bf-armed__fires--quiet">
                            {t("no matches yet", { class: "body" })}
                        </span>
                    )}
                </p>
            </div>
            <button
                type="button"
                class="bf-btn bf-btn--ghost bf-btn--small"
                disabled={busy}
                onClick={() => void handleDisable()}
            >
                {busy ? "…" : t("Pause rule")}
            </button>
        </li>
    );
}

export function WatchList(): JSX.Element | null {
    const [adding, setAdding] = useState(false);

    if (!triggersLoaded.value) {
        return null;
    }

    const fires = recentFires.value;
    const armed = armedTriggers.value;

    return (
        <section class="bf-watch" aria-label={t("Saved monitoring rules")}>
            <div class="bf-watch__head">
                <p class="bf-watch__kicker">{t("Saved monitoring rules")}</p>
                {!adding && (
                    <button
                        type="button"
                        class="bf-btn bf-btn--ghost bf-btn--small"
                        onClick={() => setAdding(true)}
                    >
                        {t("Add monitoring rule")}
                    </button>
                )}
            </div>

            {adding && <AddTriggerFlow onDone={() => setAdding(false)} />}

            {fires.length > 0 && (
                <div class="bf-watch__block">
                    <p class="bf-watch__sub">{t("Matches this week")}</p>
                    <ul class="bf-fires">
                        {fires.map((f) => (
                            <FireRow fire={f} key={f.id} />
                        ))}
                    </ul>
                </div>
            )}

            <div class="bf-watch__block">
                <p class="bf-watch__sub">
                    {armed.length === 0
                        ? t("No monitoring rules yet")
                        : `${t("Active rules")} (${armed.length})`}
                </p>
                {armed.length === 0 ? (
                    <p class="bf-watch__empty">
                        {t(
                            "Create a monitoring rule for an event you care about, such as a competitor launch, simultaneous competitor activity, or a partner becoming inactive. Matching events appear here when new data meets the rule.",
                            { class: "body" }
                        )}
                    </p>
                ) : (
                    <ul class="bf-armed-list">
                        {armed.map((trigger) => (
                            <ArmedRow trigger={trigger} key={trigger.id} />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
