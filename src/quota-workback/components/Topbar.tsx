import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { benchmark, metrics, quality } from "../state";

/**
 * Topbar — kicker + thesis + 4 anchor metrics + planning-quality pill.
 *
 * Per canon §4.18 the room is a System Ledger but founder directive
 * (2026-04-27) overrides §4.8: every surface stays bright. The topbar
 * carries the dominant pressure number (touches/day) so the operator
 * lands feeling the weekly weight before scrolling to the form.
 */
export function Topbar(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const q = quality.value;
    const hasPlan = m.monthlyTarget > 0;
    return (
        <header class="qw-topbar" aria-label="Quota Workback header">
            <BackButton />
            <p class="qw-topbar__kicker">Phase 4 / Planning board</p>
            <h1 class="qw-topbar__title">Quota Workback</h1>
            <p class="qw-topbar__subtitle">
                Translate quota into the week the team actually has to run.
                If the math is not believable, the rest of the app is steering
                from a wrong map.
            </p>
            <div class="qw-topbar__hero">
                <div class="qw-hero">
                    <span class="qw-hero__value">{m.touchesDay}</span>
                    <span class="qw-hero__label">
                        {hasPlan
                            ? `touches per day across ${m.activeAccounts} accounts to hit $${m.monthlyTarget.toLocaleString()}/month`
                            : "Set quota and ACV to turn revenue into weekly execution pressure."}
                    </span>
                </div>
                <span class={`qw-band qw-band--${q.tone}`}>
                    {q.label} · {q.score}/100
                </span>
            </div>
            <div class="qw-topbar__stats" role="group" aria-label="Planning anchors">
                <Stat label="Monthly target" value={`$${m.monthlyTarget.toLocaleString()}`} />
                <Stat label="Touches / week" value={m.touchesWeek.toLocaleString()} />
                <Stat label="Coverage goal" value={`${b.coverage}x`} />
                <Stat label="Posture" value={b.label} muted />
            </div>
        </header>
    );
}

function Stat({
    label,
    value,
    accent,
    muted
}: {
    readonly label: string;
    readonly value: string | number;
    readonly accent?: boolean;
    readonly muted?: boolean;
}): JSX.Element {
    const cls = `qw-stat${accent ? " is-accent" : ""}${muted ? " is-muted" : ""}`;
    return (
        <div class={cls}>
            <span class="qw-stat__label">{label}</span>
            <span class="qw-stat__value">{value}</span>
        </div>
    );
}
