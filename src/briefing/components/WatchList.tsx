import type { JSX } from "preact";
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
 * WatchList (B.3b) — the operator's standing orders, inline in the
 * Briefing room beneath the Patterns.
 *
 * Three parts: the fires this week (a trigger the operator armed went
 * off — shown first because it's the live payoff), the armed triggers
 * themselves (with a way to stand each one down), and an in-place flow
 * to arm a new one. Reads the signals bootTriggers() populates.
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
                    {shortFireDate(fire.fired_at)} · {fire.evidence_count} item
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
        // On success the row drops out of the list when the signal
        // refreshes; on failure we just re-enable the button.
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
                            fired {trigger.fire_count}×
                            {trigger.last_fired_at
                                ? ` · last ${shortFireDate(trigger.last_fired_at)}`
                                : ""}
                        </span>
                    )}
                    {trigger.fire_count === 0 && (
                        <span class="bf-armed__fires bf-armed__fires--quiet">
                            no fires yet
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
                {busy ? "…" : "Stand down"}
            </button>
        </li>
    );
}

export function WatchList(): JSX.Element | null {
    const [adding, setAdding] = useState(false);

    if (!triggersLoaded.value) {
        // Quiet — the Patterns are the headline; the Watch List loads
        // underneath without its own spinner.
        return null;
    }

    const fires = recentFires.value;
    const armed = armedTriggers.value;

    return (
        <section class="bf-watch" aria-label="Watch list">
            <div class="bf-watch__head">
                <p class="bf-watch__kicker">Watch list</p>
                {!adding && (
                    <button
                        type="button"
                        class="bf-btn bf-btn--ghost bf-btn--small"
                        onClick={() => setAdding(true)}
                    >
                        Add a trigger
                    </button>
                )}
            </div>

            {adding && <AddTriggerFlow onDone={() => setAdding(false)} />}

            {fires.length > 0 && (
                <div class="bf-watch__block">
                    <p class="bf-watch__sub">Fired this week</p>
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
                        ? "No standing orders yet"
                        : `Armed (${armed.length})`}
                </p>
                {armed.length === 0 ? (
                    <p class="bf-watch__empty">
                        Arm a trigger and the system watches for it every run — a
                        product launch from a named competitor, two or more of them
                        moving at once, a partner going quiet. When one fires, it
                        shows up here.
                    </p>
                ) : (
                    <ul class="bf-armed-list">
                        {armed.map((t) => (
                            <ArmedRow trigger={t} key={t.id} />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
