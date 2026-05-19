import type { JSX } from "preact";
import { benchmark, metrics, quality } from "../state";

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${fmt(n)}`;

/**
 * PlanReadout — the operating plan. Four anchor cards (touches/week,
 * meetings/week, opps/quarter, deals/quarter) + raw "the math" rows +
 * a planning-read summary block.
 */
export function PlanReadout(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const q = quality.value;

    const summary =
        m.qualityScore >= 82
            ? "The math is believable. Make sure Dashboard coverage and Outbound execution stay in sync with it."
            : m.qualityScore >= 68
              ? "The math is workable, but one weak conversion assumption can break the quarter. Tighten the weakest assumption before you trust the plan."
              : "The math is too thin to trust yet. Improve the conversion assumptions or pull the target back before you bet on this plan.";

    return (
        <section class="qw-plan" aria-label="Operating plan">
            <header class="qw-section__head">
                <p class="qw-section__kicker">OPERATING PLAN</p>
                <h2 class="qw-section__title">What the team has to run every week.</h2>
                <p class="qw-section__sub">
                    Each card is a pressure number. If one feels
                    unrealistic, change the upstream assumption.
                </p>
            </header>

            <div class="qw-plan__grid">
                <PlanCard
                    label="Touches / week"
                    value={fmt(m.touchesWeek)}
                    note={`Run ${m.touchesDay} touches/day so the outbound machine stays on pace.`}
                />
                <PlanCard
                    label="Meetings / week"
                    value={String(m.meetingsWeek)}
                    note="Meeting-creation floor your channels need to support."
                    accent
                />
                <PlanCard
                    label="Opps / quarter"
                    value={fmt(m.oppsQuarter)}
                    note="Pipeline-creation pressure, not a passive report."
                />
                <PlanCard
                    label="Deals / quarter"
                    value={fmt(m.dealsQuarter)}
                    note="Close rate the weekly work is trying to make inevitable."
                />
            </div>

            <div class="qw-plan__summary">
                <div class="qw-summary-box">
                    <h4 class="qw-summary-box__title">Planning read</h4>
                    <p>
                        {b.label} quota math currently scores{" "}
                        <strong>{m.qualityScore}/100</strong> ({q.label}).
                        Weekly revenue target is {money(m.weeklyRevenue)}.
                        Daily account pressure is {m.accountPressure} accounts
                        touched per day equivalent.
                    </p>
                </div>
                <div class="qw-summary-box">
                    <h4 class="qw-summary-box__title">What to pressure-test</h4>
                    <p>{summary}</p>
                </div>
            </div>

            <details class="qw-math">
                <summary>The raw math</summary>
                <div class="qw-math__rows">
                    <Row label="Monthly target" value={money(m.monthlyTarget)} />
                    <Row label="Deals needed / month" value={fmt(m.dealsMonth)} />
                    <Row
                        label="Weighted pipeline needed"
                        value={money(m.pipelineNeeded)}
                    />
                    <Row label="Opportunities needed" value={fmt(m.oppsMonth)} />
                    <Row label="Meetings to schedule" value={fmt(m.meetingsMonth)} />
                    <Row label="Total touches / month" value={fmt(m.touchesMonth)} />
                    <Row
                        label="Active accounts to work"
                        value={fmt(m.activeAccounts)}
                        accent
                    />
                </div>
            </details>
        </section>
    );
}

function PlanCard({
    label,
    value,
    note,
    accent
}: {
    readonly label: string;
    readonly value: string;
    readonly note: string;
    readonly accent?: boolean;
}): JSX.Element {
    return (
        <article class={`qw-plan-card${accent ? " is-accent" : ""}`}>
            <span class="qw-plan-card__label">{label}</span>
            <span class="qw-plan-card__value">{value}</span>
            <p class="qw-plan-card__note">{note}</p>
        </article>
    );
}

function Row({
    label,
    value,
    accent
}: {
    readonly label: string;
    readonly value: string;
    readonly accent?: boolean;
}): JSX.Element {
    return (
        <div class="qw-row">
            <span class="qw-row__label">{label}</span>
            <span class={`qw-row__value${accent ? " is-accent" : ""}`}>
                {value}
            </span>
        </div>
    );
}
