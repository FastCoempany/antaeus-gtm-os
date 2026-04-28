import type { JSX } from "preact";
import { benchmark, coverage, metrics } from "../state";
import {
    hrefToColdCallStudio,
    hrefToDashboard,
    hrefToDealWorkspace,
    hrefToOutboundStudio
} from "../lib/handoff";

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${fmt(n)}`;
const pct = (n: number) =>
    `${(Number(n) || 0).toFixed(1).replace(/\.0$/, "")}%`;

/**
 * HandoffStrip — downstream destinations. Per canon §4.18 the room
 * feeds the operating surfaces that actually create pipeline:
 * Outbound Studio, Cold Call Studio, Dashboard, Deal Workspace. Each
 * card carries the live metric the destination should use to decide
 * how to spend the week.
 */
export function HandoffStrip(): JSX.Element {
    const m = metrics.value;
    const b = benchmark.value;
    const c = coverage.value;
    return (
        <section class="qw-handoff" aria-label="Downstream handoffs">
            <header class="qw-section__head">
                <p class="qw-section__kicker">Carry the pressure forward</p>
                <h2 class="qw-section__title">Where the plan lives next</h2>
                <p class="qw-section__sub">
                    Quota Workback only matters if the next room inherits the
                    weekly pressure number, not just an ambitious total.
                </p>
            </header>
            <div class="qw-handoff__grid">
                <Card
                    title="Outbound Studio"
                    metric={`${fmt(m.touchesWeek)} / week`}
                    body="Turn quota into repeatable motion. The standard is enough touches, enough active accounts, enough meetings created."
                    meta={`${fmt(m.activeAccounts)} active accounts · ${pct(m.touchToMeetingRaw)} touch→meeting · ${fmt(m.touchesMonth)} touches/month.`}
                    href={hrefToOutboundStudio()}
                    primary
                />
                <Card
                    title="Cold Call Studio"
                    metric={`${fmt(m.meetingPushesWeek)} meeting pushes / week`}
                    body="Use calls when the plan needs faster conversation density. Live conversation pressure is what makes the meeting target believable."
                    meta={`${m.touchesDay} touches/day floor · ${pct(m.showRateRaw)} show rate · ${pct(m.meetingToOppRaw)} meeting→opp.`}
                    href={hrefToColdCallStudio()}
                />
                <Card
                    title="Dashboard"
                    metric={money(m.pipelineNeeded)}
                    body="The Dashboard should now hold you accountable to coverage, recovery pressure, and whether the workspace can support quota."
                    meta={
                        c.ratio > 0
                            ? `Current coverage: ${c.ratio}x against ${b.coverage}x target.`
                            : "Set quota and load deals to see live coverage pressure."
                    }
                    href={hrefToDashboard()}
                />
                <Card
                    title="Deal Workspace"
                    metric={`${fmt(m.dealsQuarter)} deals / quarter`}
                    body="The intervention board for the live pipeline. Open weak deals and decide which corrective move serves the plan."
                    meta={`${fmt(m.oppsQuarter)} opportunities required to make the quarter believable.`}
                    href={hrefToDealWorkspace()}
                />
            </div>
        </section>
    );
}

function Card({
    title,
    metric,
    body,
    meta,
    href,
    primary
}: {
    readonly title: string;
    readonly metric: string;
    readonly body: string;
    readonly meta: string;
    readonly href: string;
    readonly primary?: boolean;
}): JSX.Element {
    return (
        <article class="qw-handoff-card">
            <h3 class="qw-handoff-card__title">{title}</h3>
            <p class="qw-handoff-card__metric">{metric}</p>
            <p class="qw-handoff-card__body">{body}</p>
            <p class="qw-handoff-card__meta">{meta}</p>
            <a
                class={primary ? "qw-btn qw-btn--primary" : "qw-btn qw-btn--ghost"}
                href={href}
            >
                Open {title}
            </a>
        </article>
    );
}
