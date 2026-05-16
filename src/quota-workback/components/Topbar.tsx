import type { JSX } from "preact";
import { benchmark, metrics, quality } from "../state";

/**
 * Topbar — kicker + thesis + 4 anchor metrics + planning-quality pill.
 *
 * Per canon §4.18 the room is a System Ledger (bright per founder
 * directive 2026-04-27). The topbar carries the dominant pressure
 * number (touches/day) so the operator lands feeling the weekly
 * weight before scrolling to the form.
 */
export function Topbar(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const q = quality.value;
    const hasPlan = m.monthlyTarget > 0;
    const kicker = hasPlan
        ? `QUOTA WORKBACK · $${m.monthlyTarget.toLocaleString()}/mo · ${b.label} posture`
        : "QUOTA WORKBACK";
    return (
        <header class="qw-topbar" aria-label="Quota Workback header">
            <p class="qw-topbar__kicker">{kicker}</p>
            <h1 class="qw-topbar__title">Make the math feel daily.</h1>
            <p class="qw-topbar__subtitle">
                Turn quota into the week the team actually has to run.
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
            </div>
        </header>
    );
}

function Stat({
    label,
    value,
    accent
}: {
    readonly label: string;
    readonly value: string | number;
    readonly accent?: boolean;
}): JSX.Element {
    const cls = `qw-stat${accent ? " is-accent" : ""}`;
    return (
        <div class={cls}>
            <span class="qw-stat__label">{label}</span>
            <span class="qw-stat__value">{value}</span>
        </div>
    );
}
