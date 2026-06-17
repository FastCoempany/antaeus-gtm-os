import type { JSX } from "preact";
import {
    Card,
    HandoffStrip,
    Kicker,
    Meter,
    Stat,
    StatusChip
} from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import { benchmark, coverage, inputs, metrics, quality } from "../../state";
import {
    hrefToColdCallStudio,
    hrefToDashboard,
    hrefToDealWorkspace,
    hrefToOutboundStudio
} from "../../lib/handoff";
import { coverageRatio, coverageTone, qualityTone } from "../lib/adapters";

/**
 * PlanLedger — the dominant made thing of the Quota Workback System
 * Ledger (canon §4.18: turn a quota target into weekly execution pressure
 * the operator can feel). One summary state dominates — the daily touch
 * pressure — and the cascade, the coverage, and the system-health read
 * support it. Composed on the library over the unchanged workback engine.
 */

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${fmt(n)}`;

export function PlanLedger(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const q = quality.value;
    const c = coverage.value;
    const tone = qualityTone(q.tone);
    const hasQuota = inputs.value.quota > 0;
    const annotate = showsAnnotations();
    const covTone = coverageTone();

    const summary =
        m.qualityScore >= 82
            ? t("The math is believable. Keep coverage and execution in sync with it.", { class: "body" })
            : m.qualityScore >= 68
              ? t("The math is workable, but one weak conversion assumption can break the quarter.", { class: "body" })
              : t("The math is too thin to trust yet — tighten the assumptions or pull the target back.", { class: "body" });

    return (
        <div class="qwd-ledger">
            {/* The dominant summary state — daily touch pressure. */}
            <div class="qwd-hero">
                <div class="qwd-hero__head">
                    <Kicker>{t("THE WEEKLY PRESSURE")}</Kicker>
                    <StatusChip label={q.label} tone={tone} />
                </div>
                <div class="qwd-hero__stat">
                    <span class="qwd-hero__value">{hasQuota ? m.touchesDay : "—"}</span>
                    <span class="qwd-hero__unit">{t("touches / day")}</span>
                </div>
                <p class="qwd-hero__read">
                    {hasQuota
                        ? `${b.label} quota math scores ${m.qualityScore}/100. Weekly revenue target ${money(m.weeklyRevenue)}.`
                        : t("Set a quota in the controls to see the weekly pressure.", { class: "body" })}
                </p>
            </div>

            {/* The cascade — quota → deals → opps → meetings → touches. */}
            <div class="qwd-cascade">
                <Card kicker={t("TOUCHES / WEEK")}>
                    <Stat value={fmt(m.touchesWeek)} label={t("across the working week")} />
                </Card>
                <Card kicker={t("MEETINGS / WEEK")} tone="blue">
                    <Stat value={fmt(m.meetingsWeek)} label={t("the meeting-creation floor")} />
                </Card>
                <Card kicker={t("OPPS / QUARTER")}>
                    <Stat value={fmt(m.oppsQuarter)} label={t("pipeline-creation pressure")} />
                </Card>
                <Card kicker={t("DEALS / QUARTER")}>
                    <Stat value={fmt(m.dealsQuarter)} label={t("the close-rate target")} />
                </Card>
            </div>

            {/* Coverage — live pipeline against the benchmark target. */}
            <div class="qwd-coverage">
                <div class="qwd-coverage__head">
                    <Kicker>{t("PIPELINE COVERAGE")}</Kicker>
                    {hasQuota && c.hasDeals ? (
                        <span class="qwd-coverage__ratio">
                            {c.ratio}x / {b.coverage}x
                        </span>
                    ) : null}
                </div>
                {!hasQuota ? (
                    <p class="qwd-coverage__empty">
                        {t("Coverage compares weighted open pipeline against the quota.", { class: "body" })}
                    </p>
                ) : !c.hasDeals ? (
                    <p class="qwd-coverage__empty">
                        {t("Add open opportunities in Deal Workspace and coverage lights up.", { class: "body" })}
                    </p>
                ) : (
                    <>
                        <Meter
                            ratio={coverageRatio()}
                            read={
                                c.needed > 0
                                    ? t("Gap to the coverage target the quota calls for.", { class: "body" })
                                    : t("Pipeline is at or above the coverage target.", { class: "body" })
                            }
                            tone={covTone}
                            label={t("Pipeline coverage")}
                        />
                        <div class="qwd-coverage__meta">
                            <span>{money(c.weighted)} weighted</span>
                            <span>{money(c.raw)} raw</span>
                            <span class={c.needed > 0 ? "is-bad" : "is-good"}>
                                {c.needed > 0 ? `Gap: ${money(c.needed)}` : t("On target")}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* The system-health read — is the model holding? */}
            <div class="qwd-health">
                <Card kicker={t("WHAT TO PRESSURE-TEST")} tone={tone}>
                    <p class="ds-card__copy">{summary}</p>
                </Card>
            </div>

            {/* The raw math — gated to annotated density. */}
            {annotate ? (
                <details class="qwd-math">
                    <summary>{t("The raw math")}</summary>
                    <div class="qwd-math__rows">
                        <Row label={t("Monthly target")} value={money(m.monthlyTarget)} />
                        <Row label={t("Deals needed / month")} value={fmt(m.dealsMonth)} />
                        <Row label={t("Weighted pipeline needed")} value={money(m.pipelineNeeded)} />
                        <Row label={t("Opportunities needed")} value={fmt(m.oppsMonth)} />
                        <Row label={t("Meetings to schedule")} value={fmt(m.meetingsMonth)} />
                        <Row label={t("Total touches / month")} value={fmt(m.touchesMonth)} />
                        <Row label={t("Active accounts to work")} value={fmt(m.activeAccounts)} />
                    </div>
                </details>
            ) : null}

            {hasQuota ? (
                <HandoffStrip
                    label={t("Carry the pressure into execution")}
                    kicker={t("RUN THE PLAN")}
                    title={t("Take the weekly pressure into the motion.", { class: "body" })}
                    routes={[
                        { label: t("Run the outbound"), href: hrefToOutboundStudio(), primary: true },
                        { label: t("Run cold calls"), href: hrefToColdCallStudio() },
                        { label: t("Check the pipeline"), href: hrefToDealWorkspace() },
                        { label: t("See it on the dashboard"), href: hrefToDashboard() }
                    ]}
                />
            ) : null}
        </div>
    );
}

function Row({
    label,
    value
}: {
    readonly label: string;
    readonly value: string;
}): JSX.Element {
    return (
        <div class="qwd-row">
            <span class="qwd-row__label">{label}</span>
            <span class="qwd-row__value">{value}</span>
        </div>
    );
}
