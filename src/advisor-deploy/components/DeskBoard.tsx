import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    activeDeals,
    advisors,
    deployments,
    desk,
    logDeployment,
    selectedAdvisor,
    selectedDeal,
    setAdvisorId,
    setCustomAsk,
    setDealId,
    setMomentId
} from "../state";
import type { DeploymentOutcome } from "../lib/types";
import { TIERS } from "../lib/tiers";
import { MOMENTS, findMoment } from "../lib/moments";
import { advisorsForDeal } from "../lib/recommend";
import { getCooldownStatus } from "../lib/cooldown";
import { buildAsk, dealPressure } from "../lib/ask-builder";
import { computeSpendRead } from "../lib/score";
import { saveDeployment } from "../lib/cloud-persistence";
import { findDoNotUseCandidate } from "../lib/deploy-cost";
import type { MomentId } from "../lib/types";

/**
 * DeskBoard — Wave 3 implementation.
 *
 * Per canon §4.16 the desk routes one deal × advisor × ask-moment at
 * a time. The hero shows the live spend-read score (Wave 2's
 * computeSpendRead). The 3-cell route bar binds the desk signal.
 * The desktop layout has 5 surfaces:
 *   - proof blotter (LEFT, dark navy paper) — proof line + pressure
 *   - rolodex (CENTER-LEFT) — top 4 relevant advisors as paper tabs
 *   - ask sheet (RIGHT, slightly rotated cream sheet) — forward note
 *     title + carrier line + editable ask textarea
 *   - stamp strip (BOTTOM-RIGHT) — 3 big circular stamps (Wave 4
 *     wires Send/Hold/Reroute behavior)
 *   - desk edge (BOTTOM) — 4-cell summary (Input / Carrier / Output
 *     / Return)
 */

function fmtMoney(value: number): string {
    if (!value) return "$0";
    if (value >= 1_000_000) {
        const m = value / 1_000_000;
        return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
}

const STAGE_LABELS: Readonly<Record<string, string>> = {
    prospect: "Prospect",
    discovery: "Discovery",
    evaluation: "Evaluation",
    poc: "PoC",
    negotiation: "Negotiation",
    verbal: "Verbal",
    "closed-won": "Closed won",
    "closed-lost": "Closed lost"
};

function stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage ?? "Prospect";
}

export function DeskBoard(): JSX.Element {
    const deal = selectedDeal.value;
    const advisor = selectedAdvisor.value;
    const moment = findMoment(desk.value.momentId);
    const generated = buildAsk({
        deal,
        advisor,
        moment,
        customAsk: desk.value.customAsk
    });
    const spend = computeSpendRead({
        deal,
        advisor,
        moment,
        advisors: advisors.value
    });

    const dealOptionList = activeDeals.value;
    const allAdvisors = advisors.value;
    const exactIds = new Set(advisorsForDeal(allAdvisors, deal).map((a) => a.id));

    const desktopTitle = deal
        ? `${deal.accountName} needs ${moment.name.toLowerCase()}.`
        : "Prepare one backchannel ask before you make it.";
    const desktopNote = deal
        ? `The desk is pointed at ${stageLabel(deal.stage)}, ${fmtMoney(deal.value)}. ${dealPressure(deal)}`
        : "Add a live deal and at least one advisor to start routing asks.";

    function stampOutcome(outcome: DeploymentOutcome): void {
        const dep = logDeployment(outcome);
        if (dep) void saveDeployment(dep);
    }

    // Top 4 advisors for the rolodex: exact matches first, then anyone else.
    const rolodexList = allAdvisors
        .slice()
        .sort((a, b) => {
            const aExact = exactIds.has(a.id) ? 1 : 0;
            const bExact = exactIds.has(b.id) ? 1 : 0;
            return bExact - aExact;
        })
        .slice(0, 4);

    // Program 6 / PR 15 — "Do not use" anti-tab. Per the picked-winner
    // Backchannel Desk wireframe, the rolodex surfaces an advisor that
    // would be the WRONG carrier for the current ask (canon §4.16:
    // "Trust is spent, not spent"). Skipped if no cost-flagged advisor
    // exists in the registry — the anti-tab is a discipline cue, not a
    // permanent fixture.
    const doNotUse = findDoNotUseCandidate(
        allAdvisors,
        desk.value.momentId,
        advisor?.id ?? null
    );

    return (
        <section class="ad-desk" aria-labelledby="adDeskTitle">
            <div class="ad-desk__hero">
                <div>
                    <p class="ad-desk__kicker">{t("PRIVATE INFLUENCE DESK")}</p>
                    <h1 class="ad-desk__title" id="adDeskTitle">
                        {desktopTitle}
                    </h1>
                    <p class="ad-desk__note">{desktopNote}</p>
                </div>
                <aside class="ad-desk__read" aria-label={t("Is the ask ready")}>
                    <div class="ad-desk__read-top">
                        <div>
                            <p class="ad-desk__read-kicker">{t("IS THE ASK READY")}</p>
                            <h3 class="ad-desk__read-band">
                                {spend.bandLabel}
                            </h3>
                        </div>
                        <p
                            class={`ad-desk__read-score ad-desk__read-score--${spend.band}`}
                            aria-label={`Ask-ready score ${spend.score}`}
                        >
                            {spend.score}
                        </p>
                    </div>
                    <p class="ad-desk__read-copy">{spend.bandCopy}</p>
                </aside>
            </div>

            <div class="ad-desk__route" aria-label={t("Advisor route controls")}>
                <label class="ad-route__cell">
                    <span class="ad-route__label">{t("Deal")}</span>
                    <select
                        class="ad-select"
                        value={desk.value.dealId}
                        onChange={(e) =>
                            setDealId(
                                (e.currentTarget as HTMLSelectElement).value
                            )
                        }
                    >
                        {dealOptionList.length === 0 ? (
                            <option value="">{t("No live deals yet")}</option>
                        ) : null}
                        {dealOptionList.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.accountName} · {fmtMoney(d.value)} ·{" "}
                                {stageLabel(d.stage)}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ad-route__cell">
                    <span class="ad-route__label">{t("Carrier")}</span>
                    <select
                        class="ad-select"
                        value={desk.value.advisorId}
                        onChange={(e) =>
                            setAdvisorId(
                                (e.currentTarget as HTMLSelectElement).value
                            )
                        }
                    >
                        {allAdvisors.length === 0 ? (
                            <option value="">{t("No advisors registered")}</option>
                        ) : null}
                        {allAdvisors.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} ·{" "}
                                {exactIds.has(a.id) ? "exact" : "available"}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ad-route__cell">
                    <span class="ad-route__label">{t("Ask moment")}</span>
                    <select
                        class="ad-select"
                        value={desk.value.momentId}
                        onChange={(e) =>
                            setMomentId(
                                (e.currentTarget as HTMLSelectElement)
                                    .value as MomentId
                            )
                        }
                    >
                        {MOMENTS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div class="ad-desktop">
                <article class="ad-blotter" aria-label={t("Evidence blotter")}>
                    <p class="ad-blotter__kicker">{t("EVIDENCE BLOTTER")}</p>
                    <h3 class="ad-blotter__title">{generated.proof}</h3>
                    <p class="ad-blotter__copy">{dealPressure(deal)}</p>
                    <div class="ad-blotter__chips">
                        <span class="ad-chip">
                            {stageLabel(deal?.stage ?? "")}
                        </span>
                        <span class="ad-chip">
                            {fmtMoney(deal?.value ?? 0)}
                        </span>
                        <span class="ad-chip">{moment.name}</span>
                    </div>
                </article>

                <div class="ad-rolodex" aria-label={t("Advisor rolodex")}>
                    {rolodexList.length === 0 ? (
                        <p class="ad-rolodex__empty">
                            No advisors registered yet. Add one in the
                            registry below to start routing asks.
                        </p>
                    ) : (
                        rolodexList.map((a) => {
                            const status = getCooldownStatus(
                                a,
                                deployments.value
                            );
                            const exact = exactIds.has(a.id);
                            const isActive = advisor?.id === a.id;
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    class={`ad-rolodex__tab${isActive ? " is-active" : ""}`}
                                    onClick={() => setAdvisorId(a.id)}
                                >
                                    <h3>{a.name}</h3>
                                    <p>
                                        {exact ? "Exact company path. " : ""}
                                        {a.title ||
                                            TIERS[a.tier]?.label ||
                                            "Advisor"}
                                        . {status.label}.
                                    </p>
                                </button>
                            );
                        })
                    )}
                    {doNotUse ? (
                        <article
                            class={`ad-rolodex__antitab ad-rolodex__antitab--${doNotUse.cost}`}
                            aria-label={t("Don't use this carrier yet")}
                        >
                            <p class="ad-rolodex__antitab-kicker">
                                DON'T USE YET
                            </p>
                            <h3>{doNotUse.advisor.name}</h3>
                            <p>{doNotUse.reason}</p>
                        </article>
                    ) : null}
                </div>

                <article class="ad-asksheet" aria-label={t("Forwardable note")}>
                    <p class="ad-asksheet__kicker">{t("FORWARDABLE NOTE")}</p>
                    <h3 class="ad-asksheet__title">{generated.title}</h3>
                    <p class="ad-asksheet__carrier">
                        Carrier:{" "}
                        {advisor
                            ? `${advisor.name}, ${advisor.title || TIERS[advisor.tier]?.label || "Advisor"}`
                            : "No advisor selected"}
                        . Return: {generated.outcome}
                    </p>
                    <textarea
                        class="ad-asksheet__editor"
                        aria-label={t("Advisor ask text")}
                        value={generated.ask}
                        onInput={(e) =>
                            setCustomAsk(
                                (e.currentTarget as HTMLTextAreaElement).value
                            )
                        }
                    />
                </article>

                <div class="ad-stamps" aria-label={t("Deployment outcome stamps")}>
                    <button
                        type="button"
                        class="ad-stamp ad-stamp--send"
                        data-ad-stamp="pending"
                        disabled={!deal || !advisor}
                        onClick={() => stampOutcome("pending")}
                    >
                        Send
                    </button>
                    <button
                        type="button"
                        class="ad-stamp ad-stamp--hold"
                        data-ad-stamp="hold"
                        disabled={!deal || !advisor}
                        onClick={() => stampOutcome("hold")}
                    >
                        Hold
                    </button>
                    <button
                        type="button"
                        class="ad-stamp ad-stamp--reroute"
                        data-ad-stamp="reroute"
                        disabled={!deal || !advisor}
                        onClick={() => stampOutcome("reroute")}
                    >
                        Reroute
                    </button>
                </div>

                <div class="ad-desk__edge">
                    <div>
                        <p class="ad-route__label">{t("Input")}</p>
                        <h3>
                            {deal ? `${deal.accountName} evidence line` : "No live deal"}
                        </h3>
                    </div>
                    <div>
                        <p class="ad-route__label">{t("Carrier")}</p>
                        <h3>{advisor ? advisor.name : "No advisor"}</h3>
                    </div>
                    <div>
                        <p class="ad-route__label">{t("Output")}</p>
                        <h3>{t("Copy-ready ask")}</h3>
                    </div>
                    <div>
                        <p class="ad-route__label">{t("Return")}</p>
                        <h3>{generated.outcome}</h3>
                    </div>
                </div>
            </div>
        </section>
    );
}
