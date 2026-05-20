import type { JSX } from "preact";
import { benchmark, inputs, metrics, quality } from "../state";

/**
 * Topbar — kicker + headline + hero touches/day + plan-input anchors.
 *
 * Per canon §4.18 the room is a System Ledger (bright per founder
 * directive 2026-04-27). Per the picked-winner Variant 01 (AI-
 * selected, 2026-05-01) the topbar carries:
 *
 *   - dominant pressure number (touches/day) as the hero
 *   - planning-quality posture pill alongside the hero
 *   - a 4-stat row of PLAN INPUTS (annual quota / ACV / win rate /
 *     cycle) so the operator can see at a glance what produced the
 *     hero number. Each stat carries an interpretive sub-note.
 *
 * Program 6 / PR 17 — replaces the prior 3-stat output row (monthly
 * target / touches-per-week / coverage goal) which was duplicative
 * with the hero + CoveragePanel + PlanReadout below.
 */
export function Topbar(): JSX.Element {
    const i = inputs.value;
    const m = metrics.value;
    const b = benchmark.value;
    const q = quality.value;
    const hasPlan = m.monthlyTarget > 0;
    const kicker = hasPlan
        ? `QUOTA WORKBACK · $${m.monthlyTarget.toLocaleString()}/mo · ${b.label} posture`
        : "QUOTA WORKBACK";

    // Annualized rollups used for the sub-note context lines.
    const dealsYear = m.dealsMonth * 12;
    const oppsYear = m.oppsMonth * 12;

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
            <div class="qw-topbar__stats" role="group" aria-label="Plan inputs">
                <Stat
                    label="Annual quota"
                    value={i.quota > 0 ? `$${formatMoney(i.quota)}` : "—"}
                    sub={i.quota > 0 ? "Set in onboarding" : "Not set"}
                />
                <Stat
                    label="Avg ACV"
                    value={i.acv > 0 ? `$${formatMoney(i.acv)}` : "—"}
                    sub={
                        dealsYear > 0
                            ? `${Math.round(dealsYear).toLocaleString()} deals to hit number`
                            : "Set ACV to see deals needed"
                    }
                />
                <Stat
                    label="Win rate"
                    value={i.win > 0 ? `${i.win}%` : "—"}
                    sub={
                        oppsYear > 0
                            ? `~${Math.round(oppsYear).toLocaleString()} opps needed`
                            : "Set win rate to see opps needed"
                    }
                />
                <Stat
                    label="Cycle"
                    value={i.cycle > 0 ? `${i.cycle}d` : "—"}
                    sub={b.label}
                />
            </div>
        </header>
    );
}

function formatMoney(n: number): string {
    if (n >= 1_000_000) {
        const m = n / 1_000_000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
    }
    if (n >= 1_000) {
        const k = n / 1_000;
        return k % 1 === 0 ? `${k}K` : `${k.toFixed(0)}K`;
    }
    return n.toLocaleString();
}

function Stat({
    label,
    value,
    sub
}: {
    readonly label: string;
    readonly value: string | number;
    readonly sub?: string;
}): JSX.Element {
    return (
        <div class="qw-stat">
            <span class="qw-stat__label">{label}</span>
            <span class="qw-stat__value">{value}</span>
            {sub ? <span class="qw-stat__sub">{sub}</span> : null}
        </div>
    );
}
