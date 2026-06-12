import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
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
            ? t(
                  "The math is believable. Make sure Dashboard coverage and Outbound execution stay in sync with it.",
                  { class: "body" }
              )
            : m.qualityScore >= 68
              ? t(
                    "The math is workable, but one weak conversion assumption can break the quarter. Tighten the weakest assumption before you trust the plan.",
                    { class: "body" }
                )
              : t(
                    "The math is too thin to trust yet. Improve the conversion assumptions or pull the target back before you bet on this plan.",
                    { class: "body" }
                );

    return (
        <section class="qw-plan" aria-label={t("Operating plan")}>
            <header class="qw-section__head">
                <p class="qw-section__kicker">{t("OPERATING PLAN")}</p>
                <h2 class="qw-section__title">{t("What the team has to run every week.", { class: "body" })}</h2>
                <p class="qw-section__sub">
                    {t(
                        "Each card is a pressure number. If one feels unrealistic, change the upstream assumption.",
                        { class: "body" }
                    )}
                </p>
            </header>

            <div class="qw-plan__grid">
                <PlanCard
                    label={t("Touches / week")}
                    value={fmt(m.touchesWeek)}
                    note={t("Run {n} touches/day so the outbound machine stays on pace.", { class: "body" }).replace("{n}", String(m.touchesDay))}
                />
                <PlanCard
                    label={t("Meetings / week")}
                    value={String(m.meetingsWeek)}
                    note={t("Meeting-creation floor your channels need to support.", { class: "body" })}
                    accent
                />
                <PlanCard
                    label={t("Opps / quarter")}
                    value={fmt(m.oppsQuarter)}
                    note={t("Pipeline-creation pressure, not a passive report.", { class: "body" })}
                />
                <PlanCard
                    label={t("Deals / quarter")}
                    value={fmt(m.dealsQuarter)}
                    note={t("Close rate the weekly work is trying to make inevitable.", { class: "body" })}
                />
            </div>

            <div class="qw-plan__summary">
                <div class="qw-summary-box">
                    <h4 class="qw-summary-box__title">{t("Planning read")}</h4>
                    <p>
                        {b.label} quota math currently scores{" "}
                        <strong>{m.qualityScore}/100</strong> ({q.label}).
                        Weekly revenue target is {money(m.weeklyRevenue)}.
                        Daily account pressure is {m.accountPressure} accounts
                        touched per day equivalent.
                    </p>
                </div>
                <div class="qw-summary-box">
                    <h4 class="qw-summary-box__title">{t("What to pressure-test")}</h4>
                    <p>{summary}</p>
                </div>
            </div>

            <details class="qw-math">
                <summary>{t("The raw math")}</summary>
                <div class="qw-math__rows">
                    <Row label={t("Monthly target")} value={money(m.monthlyTarget)} />
                    <Row label={t("Deals needed / month")} value={fmt(m.dealsMonth)} />
                    <Row
                        label={t("Weighted pipeline needed")}
                        value={money(m.pipelineNeeded)}
                    />
                    <Row label={t("Opportunities needed")} value={fmt(m.oppsMonth)} />
                    <Row label={t("Meetings to schedule")} value={fmt(m.meetingsMonth)} />
                    <Row label={t("Total touches / month")} value={fmt(m.touchesMonth)} />
                    <Row
                        label={t("Active accounts to work")}
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
