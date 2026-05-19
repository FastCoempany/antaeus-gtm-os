import type { JSX } from "preact";
import { benchmark, coverage, metrics, quality } from "../state";

const fmt = (n: number) => n.toLocaleString();

/**
 * SystemHealth — the room's "is the model holding" panel.
 *
 * Per canon §4.18 + Part III §10 (state-language lock): vocabulary is
 * `Compounding` / `Still weak` to mirror the workspace-health pattern;
 * for the System Ledger family Quota Workback uses room-native framing
 * (planning posture, coverage, weekly touches, pressure fit). Tone
 * follows the quality engine.
 */
export function SystemHealth(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const c = coverage.value;
    const q = quality.value;

    const winFit = m.winState === "benchmark";
    const m2oFit = m.m2oState === "benchmark";
    const cycleFit = m.cycleState === "benchmark";
    const fitCount = (winFit ? 1 : 0) + (m2oFit ? 1 : 0) + (cycleFit ? 1 : 0);

    const compounding: string[] = [];
    const fragile: string[] = [];

    if (m.qualityScore >= 82) {
        compounding.push(
            "The planning math is believable right now. The assumptions, the coverage, and the weekly pressure are close enough to reality that you can act on them."
        );
    }
    if ((c.ratio || 0) >= b.coverage) {
        compounding.push(
            "Coverage is already where it needs to be. The pipeline is at or above what the quota plan calls for."
        );
    } else if (fitCount >= 2) {
        compounding.push(
            "Most assumptions still fit the typical range. The weekly plan isn't fully proven yet, but the underlying math is anchored to numbers that hold up."
        );
    }
    if (compounding.length === 0) {
        compounding.push(
            "The room is asking the right questions about the plan. The plan itself still needs harder proof before you should bet the quarter on it."
        );
    }

    if ((c.ratio || 0) < b.coverage) {
        fragile.push(
            "Coverage is still below where the plan needs it. Until the pipeline catches up, the math is more aspiration than reality."
        );
    }
    if (fitCount < 2) {
        fragile.push(
            "Too many of the assumptions have drifted away from typical ranges. Custom numbers can be right, but they need stronger proof before they should run the quarter."
        );
    }
    if (m.touchesDay > 25 || m.activeAccounts > 250) {
        fragile.push(
            "Daily pressure may still be unrealistic. The required touch volume or account load suggests the current plan could outrun actual execution capacity."
        );
    }
    if (fragile.length === 0) {
        fragile.push(
            "No single fragility is dominating the plan. Keep pressure-testing conversions, but the quota model is behaving credibly right now."
        );
    }

    return (
        <section class="qw-health" aria-label="System health">
            <header class="qw-section__head">
                <p class="qw-section__kicker">SYSTEM HEALTH</p>
                <h2 class="qw-section__title">What is holding and what is still fragile.</h2>
                <p class="qw-section__sub">
                    Whether this math can actually be run — not just whether
                    the spreadsheet closes.
                </p>
            </header>

            <div class="qw-health__metrics">
                <Metric
                    label="Plan posture"
                    value={q.label}
                    sub={`${m.qualityScore}/100 planning quality`}
                    tone={q.tone}
                />
                <Metric
                    label="Coverage"
                    value={`${c.ratio || 0}x`}
                    sub={`Against a ${b.coverage}x target.`}
                />
                <Metric
                    label="Touches / week"
                    value={fmt(m.touchesWeek)}
                    sub={`${m.touchesDay} per day across ${fmt(m.activeAccounts)} accounts.`}
                />
                <Metric
                    label="Pressure fit"
                    value={`${fitCount}/3`}
                    sub="Win, meeting, and cycle assumptions still in band."
                />
            </div>

            <div class="qw-health__split">
                <Panel
                    title="Compounding"
                    items={compounding.slice(0, 2)}
                    tone="good"
                />
                <Panel
                    title="Still weak"
                    items={fragile.slice(0, 2)}
                    tone="warn"
                />
            </div>
        </section>
    );
}

function Metric({
    label,
    value,
    sub,
    tone
}: {
    readonly label: string;
    readonly value: string;
    readonly sub: string;
    readonly tone?: "good" | "warn" | "bad";
}): JSX.Element {
    return (
        <div class={`qw-h-metric${tone ? ` is-${tone}` : ""}`}>
            <span class="qw-h-metric__label">{label}</span>
            <span class="qw-h-metric__value">{value}</span>
            <span class="qw-h-metric__sub">{sub}</span>
        </div>
    );
}

function Panel({
    title,
    items,
    tone
}: {
    readonly title: string;
    readonly items: ReadonlyArray<string>;
    readonly tone: "good" | "warn";
}): JSX.Element {
    return (
        <article class={`qw-h-panel is-${tone}`}>
            <h3 class="qw-h-panel__title">{title}</h3>
            <ul class="qw-h-panel__list">
                {items.map((line, i) => (
                    <li key={i}>{line}</li>
                ))}
            </ul>
        </article>
    );
}
