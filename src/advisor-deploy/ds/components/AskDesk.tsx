import type { JSX } from "preact";
import {
    Button,
    Card,
    FormField,
    HandoffStrip,
    Kicker,
    Meter,
    Select,
    StatusChip,
    Textarea
} from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    activeDeals,
    advisors,
    desk,
    logDeployment,
    selectedAdvisor,
    selectedDeal,
    setAdvisorId,
    setCustomAsk,
    setDealId,
    setMomentId
} from "../../state";
import { MOMENTS, findMoment } from "../../lib/moments";
import { TIERS } from "../../lib/tiers";
import { advisorsForDeal } from "../../lib/recommend";
import { buildAsk, dealPressure } from "../../lib/ask-builder";
import {
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToNegotiation,
    hrefToPocFramework
} from "../../lib/handoff";
import { saveDeployment } from "../../lib/cloud-persistence";
import type { DeploymentOutcome, MomentId } from "../../lib/types";
import { spendRead, spendTone } from "../lib/adapters";

/**
 * AskDesk — the dominant focal of the Advisor Deploy Live Instrument
 * (canon §4.16: a private influence desk pointed at one deal × advisor ×
 * ask-moment). The spend read shows whether the ask is ready to cost
 * trust; the route controls aim the desk; the prepared ask is the made
 * thing; the three stamps spend / hold / reroute; the handoff carries the
 * effect back into the deal. Composed on the library over the unchanged
 * spend-read + ask-builder + recommend engine.
 */

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

function fmtMoney(value: number): string {
    if (!value) return "$0";
    if (value >= 1_000_000) {
        const m = value / 1_000_000;
        return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
}

function stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage ?? "Prospect";
}

function stamp(outcome: DeploymentOutcome): void {
    const dep = logDeployment(outcome);
    if (dep) void saveDeployment(dep);
}

export function AskDesk(): JSX.Element {
    const deal = selectedDeal.value;
    const advisor = selectedAdvisor.value;
    const moment = findMoment(desk.value.momentId);
    const generated = buildAsk({
        deal,
        advisor,
        moment,
        customAsk: desk.value.customAsk
    });
    const spend = spendRead();
    const tone = spendTone(spend.band);
    const dealList = activeDeals.value;
    const allAdvisors = advisors.value;
    const exactIds = new Set(advisorsForDeal(allAdvisors, deal).map((a) => a.id));
    const canStamp = Boolean(deal && advisor);
    const annotate = showsAnnotations();

    const dealOpts = [
        { value: "", label: dealList.length ? t("Choose a deal…") : t("No live deals yet") },
        ...dealList.map((d) => ({
            value: d.id,
            label: `${d.accountName} · ${fmtMoney(d.value)} · ${stageLabel(d.stage)}`
        }))
    ];
    const advisorOpts = [
        { value: "", label: allAdvisors.length ? t("Choose a carrier…") : t("No advisors yet") },
        ...allAdvisors.map((a) => ({
            value: a.id,
            label: `${a.name} · ${exactIds.has(a.id) ? "exact" : "available"}`
        }))
    ];
    const momentOpts = MOMENTS.map((m) => ({ value: m.id, label: m.name }));

    return (
        <div class="add-desk">
            {/* The spend read — is the ask ready to cost trust? */}
            <div class="add-read">
                <div class="add-read__head">
                    <Kicker>{t("IS THE ASK READY")}</Kicker>
                    <StatusChip label={spend.bandLabel} tone={tone} />
                    <span class="add-read__score">{spend.score}</span>
                </div>
                <Meter
                    ratio={spend.score / 100}
                    read={spend.bandCopy}
                    tone={tone}
                    label={t("Ask readiness")}
                />
            </div>

            {/* The route — aim the desk. */}
            <div class="add-route">
                <FormField label={t("Deal")}>
                    <Select value={desk.value.dealId} onChange={setDealId} options={dealOpts} />
                </FormField>
                <FormField label={t("Carrier")}>
                    <Select value={desk.value.advisorId} onChange={setAdvisorId} options={advisorOpts} />
                </FormField>
                <FormField label={t("Ask moment")}>
                    <Select
                        value={desk.value.momentId}
                        onChange={(v) => setMomentId(v as MomentId)}
                        options={momentOpts}
                    />
                </FormField>
            </div>

            {/* The prepared ask — the made thing. */}
            <Card icon="proof" kicker={t("THE EVIDENCE LINE")} tone={tone}>
                <p class="add-proof">{generated.proof}</p>
                {annotate ? <p class="ds-card__copy">{dealPressure(deal)}</p> : null}
            </Card>

            <Card icon="advisor" kicker={t("THE ASK")}>
                <p class="add-ask__carrier">
                    {t("Carrier:")}{" "}
                    {advisor
                        ? `${advisor.name}, ${advisor.title || TIERS[advisor.tier]?.label || "Advisor"}`
                        : t("No carrier selected")}
                    {" · "}
                    {t("Return:")} {generated.outcome}
                </p>
                <Textarea
                    rows={8}
                    value={generated.ask}
                    onInput={setCustomAsk}
                />
            </Card>

            {/* The stamps — spend, hold, or reroute. */}
            <div class="add-stamps">
                <div class="add-stamps__head">
                    <Kicker>{t("SPEND THE TRUST")}</Kicker>
                </div>
                <div class="add-stamps__row" role="group" aria-label={t("Deployment outcome")}>
                    <Button
                        variant="accent"
                        onClick={() => stamp("pending")}
                        disabled={!canStamp}
                        disabledWhy={
                            !canStamp
                                ? t("Pick a deal and a carrier first.", { class: "body" })
                                : undefined
                        }
                    >
                        {t("Send the ask")}
                    </Button>
                    <Button variant="secondary" onClick={() => stamp("hold")} disabled={!canStamp}>
                        {t("Hold")}
                    </Button>
                    <Button variant="ghost" onClick={() => stamp("reroute")} disabled={!canStamp}>
                        {t("Reroute")}
                    </Button>
                </div>
            </div>

            {deal ? (
                <HandoffStrip
                    label={t("Carry the ask forward")}
                    kicker={t("RETURN THE LOOP")}
                    title={t("Every ask returns as a deal update.", { class: "body" })}
                    routes={[
                        {
                            label: t("Update the deal"),
                            href: hrefToDealWorkspace(deal.id, deal.accountName),
                            primary: true
                        },
                        { label: t("Pre-mortem the deal"), href: hrefToFutureAutopsy(deal.id, deal.accountName) },
                        { label: t("Forge the evidence"), href: hrefToPocFramework(deal.id, deal.accountName) },
                        { label: t("Rehearse the negotiation"), href: hrefToNegotiation(deal.id, deal.accountName) }
                    ]}
                />
            ) : null}
        </div>
    );
}
