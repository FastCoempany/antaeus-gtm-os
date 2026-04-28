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
            "The planning math is currently believable. Assumptions, coverage posture, and weekly pressure are close enough to operating truth to guide real behavior."
        );
    }
    if ((c.ratio || 0) >= b.coverage) {
        compounding.push(
            "Coverage is already supporting the target. Pipeline volume is at or above the benchmark the quota plan expects."
        );
    } else if (fitCount >= 2) {
        compounding.push(
            "Most core assumptions still fit the band. The weekly plan is not fully proven yet, but the model is anchored to credible operating ranges."
        );
    }
    if (compounding.length === 0) {
        compounding.push(
            "The room has a usable pressure model. Quota Workback can already show the right questions, but the plan still needs harder proof before it should be trusted blindly."
        );
    }

    if ((c.ratio || 0) < b.coverage) {
        fragile.push(
            "Coverage is still below plan. Until pipeline support catches up, the math remains more aspiration than operating truth."
        );
    }
    if (fitCount < 2) {
        fragile.push(
            "Too many assumptions have drifted away from benchmark reality. Custom math can be right, but it needs stronger proof before it should run the quarter."
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
                <p class="qw-section__kicker">System health</p>
                <h2 class="qw-section__title">What is holding and what is still fragile</h2>
                <p class="qw-section__sub">
                    Quota Workback should expose whether the math can be run,
                    not just whether the spreadsheet technically closes.
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
