import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    advisors,
    deployments,
    activeDeals,
    selectedDeal,
    selectedAdvisor,
    recentDeployments,
    desk,
    advisorDraft,
    setDealId,
    setAdvisorId,
    setMomentId,
    setCustomAsk,
    patchAdvisorDraft,
    saveAdvisorFromDraft,
    logDeployment,
    updateDeploymentOutcome
} from "../state";
import { MOMENTS, findMoment } from "../lib/moments";
import { buildAsk, dealPressure } from "../lib/ask-builder";
import { computeSpendRead } from "../lib/score";
import { getCooldownStatus } from "../lib/cooldown";
import { advisorsForDeal, recommendedAdvisor, recommendedMomentForDeal } from "../lib/recommend";
import { TIERS } from "../lib/tiers";
import { saveDeployment } from "../lib/cloud-persistence";
import { saveAdvisor } from "../lib/cloud-persistence-profile";
import { TIER_IDS } from "../lib/types";
import type { AdvisorDeal, DeploymentOutcome, MomentId, TierId } from "../lib/types";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./call-in-a-favor-v4.css";

/**
 * CallInAFavorV4 (canon §4.16) — the guided backchannel, wired to
 * production from the settled 2026-07-06 top-rail design. Some deals
 * you can't move alone — someone in your corner can: the stuck deals
 * sit as a rail across the top (most stuck first, with a coverage
 * read), and the RELAY works below — you → your person → the buyer,
 * both notes written and easy to say yes to, the ready check + the
 * don't-over-ask guard before anything is sent, and every favor logged
 * back onto the deal. The ask-builder, ready-check scoring, cooldown,
 * recommendations, deployments log + deal sync-back are the shipped
 * engine unchanged. §13: no deploy / rolodex / spend-read on the face.
 */

const addOpen = signal(false);
const editAsk = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

const OUTCOME_LABEL: Record<DeploymentOutcome, string> = {
    pending: t("waiting to hear"),
    engaged: t("they're on it"),
    successful: t("it moved the deal"),
    no_response: t("no reply"),
    declined: t("a clean no"),
    hold: t("held"),
    reroute: t("rerouted")
};

/** How stuck a deal reads — overdue next step first, then no next step. */
function stuckness(d: AdvisorDeal, now: number): { score: number; read: string } {
    if (d.nextStepDate) {
        const ts = Date.parse(d.nextStepDate);
        if (Number.isFinite(ts)) {
            const days = Math.floor((now - ts) / 86_400_000);
            if (days > 0) return { score: 100 + days, read: `${t("Next step overdue")} ${days}d` };
            return { score: 10, read: t("On track — a favor could still speed it", { class: "body" }) };
        }
    }
    if (!d.nextStep.trim()) return { score: 80, read: t("No next step on the books") };
    return { score: 40, read: t("Next step has no date") };
}

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(text)
        .then(() => {
            if (done) toast(done);
        })
        .catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
}

export function CallInAFavorV4(): JSX.Element {
    const now = Date.now();
    const deals = activeDeals.value;
    const people = advisors.value;
    const deps = deployments.value;
    const deal = selectedDeal.value;
    const advisor = selectedAdvisor.value;
    const moment = findMoment(desk.value.momentId);

    const ranked = deals
        .map((d) => ({ d, s: stuckness(d, now) }))
        .sort((a, b) => b.s.score - a.s.score);
    const uncovered = deals.filter((d) => advisorsForDeal(people, d).length === 0).length;

    const generated = buildAsk({ deal, advisor, moment, customAsk: desk.value.customAsk });
    const read = computeSpendRead({ deal, advisor, moment, advisors: people });
    const cooldown = advisor ? getCooldownStatus(advisor, deps, now) : null;
    const secondAsk = cooldown !== null && !cooldown.ok;
    const whoFirst = advisor ? advisor.name.split(" ")[0] : t("your person");
    const recent = recentDeployments.value;
    const draft = advisorDraft.value;

    function pickDeal(d: AdvisorDeal): void {
        setDealId(d.id);
        const rec = recommendedAdvisor(people, deps, d);
        if (rec) setAdvisorId(rec.id);
        setMomentId(recommendedMomentForDeal(d));
    }

    function sendAndLog(logged: boolean): void {
        const dep = logDeployment("pending");
        if (!dep) return;
        // Cloud write too — a local-only log is clobbered when cloud
        // replaces local on boot.
        void saveDeployment(dep);
        editAsk.value = false;
        toast(
            logged
                ? t("Logged — you'll see what comes of it on the deal.", { class: "body" })
                : `${t("Copied your message + logged the favor — it comes back on", { class: "body" })} ${dep.dealName}.`
        );
    }

    return (
        <div class="cf4">
            <div class="cf4-wrap">
                <div class="cf4-top">
                    <span class="cf4-bname">{t("Call in a Favor")}</span>
                    <span class="cf4-r">{t("the guided backchannel")}</span>
                </div>

                <h1 class="cf4-thesis">
                    {t("Some deals you can't move alone — but someone in your corner can.", { class: "body" })}{" "}
                    <span class="cf4-q">{t("Pick the one that needs it most, and set the favor up clean.", { class: "body" })}</span>
                </h1>

                {/* the top rail — stuck deals */}
                <div class="cf4-railh">
                    <span class="cf4-rt">{t("Deals where a favor would help · most stuck first", { class: "body" })}</span>
                    {uncovered > 0 ? (
                        <span class="cf4-cov">
                            {uncovered} {t("have no one who could put in a word —", { class: "body" })}{" "}
                            <button type="button" class="cf4-add" onClick={() => (addOpen.value = !addOpen.value)}>{t("line someone up →")}</button>
                        </span>
                    ) : (
                        <button type="button" class="cf4-add" onClick={() => (addOpen.value = !addOpen.value)}>
                            {addOpen.value ? t("close") : t("+ Add someone to your corner", { class: "body" })}
                        </button>
                    )}
                </div>

                {addOpen.value ? (
                    <div class="cf4-addform">
                        <input value={draft.name} placeholder={t("Name")}
                            onInput={(e) => patchAdvisorDraft({ name: (e.currentTarget as HTMLInputElement).value })} />
                        <input value={draft.title} placeholder={t("investor · advisor · happy customer", { class: "body" })}
                            onInput={(e) => patchAdvisorDraft({ title: (e.currentTarget as HTMLInputElement).value })} />
                        <select value={draft.tier} onChange={(e) => patchAdvisorDraft({ tier: (e.currentTarget as HTMLSelectElement).value as TierId })}>
                            {TIER_IDS.map((tid) => <option value={tid} key={tid}>{TIERS[tid].label}</option>)}
                        </select>
                        <input value={draft.companies} placeholder={t("accounts they carry weight with (comma-separated)", { class: "body" })}
                            onInput={(e) => patchAdvisorDraft({ companies: (e.currentTarget as HTMLInputElement).value })} />
                        <button type="button" disabled={!draft.name.trim()}
                            onClick={() => { const saved = saveAdvisorFromDraft(); if (saved) { void saveAdvisor(saved); toast(`${saved.name} ${t("added to your corner.")}`); addOpen.value = false; } }}>
                            {t("Add")}
                        </button>
                    </div>
                ) : null}

                {ranked.length === 0 ? (
                    <div class="cf4-empty">
                        <h3>{t("No open deals to help yet.")}</h3>
                        <p>{t("When a deal gets stuck in Deal Workspace, it lands here — with who to ask and what for.", { class: "body" })}</p>
                    </div>
                ) : (
                    <div class="cf4-rail">
                        {ranked.slice(0, 8).map(({ d, s }) => {
                            const rec = recommendedAdvisor(people, deps, d);
                            const m = findMoment(recommendedMomentForDeal(d));
                            return (
                                <button type="button" class={`cf4-rcard${deal?.id === d.id ? " is-on" : ""}`} key={d.id} onClick={() => pickDeal(d)}>
                                    <span class="cf4-r1"><span class="cf4-nm">{d.accountName}</span><span class="cf4-val">${Math.round(d.value / 1000)}k · {d.stage}</span></span>
                                    <span class="cf4-st">{s.read}</span>
                                    <span class="cf4-ask">
                                        {rec ? <>{t("Ask")} <b>{rec.name.split(" ")[0]}</b> {t("to")} {m.name.toLowerCase()}</> : <span class="cf4-noone">{t("no one in your corner fits — line someone up", { class: "body" })}</span>}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* the relay */}
                {deal ? (
                    <div class="cf4-work">
                        <div class="cf4-setup">
                            <span class="cf4-pill"><span class="cf4-k">{t("deal")}</span> {deal.accountName}</span>
                            <span class="cf4-conj">→ {t("ask")}</span>
                            <span class="cf4-pill">
                                <span class="cf4-k">{t("who")}</span>
                                <select value={desk.value.advisorId ?? ""} onChange={(e) => setAdvisorId((e.currentTarget as HTMLSelectElement).value)}>
                                    <option value="">{t("Pick your person…")}</option>
                                    {people.map((a) => <option value={a.id} key={a.id}>{a.name} — {a.title}</option>)}
                                </select>
                            </span>
                            <span class="cf4-conj">{t("to")}</span>
                            <span class="cf4-pill">
                                <span class="cf4-k">{t("what")}</span>
                                <select value={desk.value.momentId} onChange={(e) => setMomentId((e.currentTarget as HTMLSelectElement).value as MomentId)}>
                                    {MOMENTS.map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}
                                </select>
                            </span>
                        </div>

                        <div class="cf4-stuck">{dealPressure(deal)} <b>{moment.short}</b></div>

                        <div class="cf4-chain">
                            <span class="cf4-node">{t("You")}</span>
                            <span class="cf4-arr">→</span>
                            <span class="cf4-node is-mid">{whoFirst}</span>
                            {advisor ? <span class="cf4-fit">({advisor.title || TIERS[advisor.tier].label})</span> : null}
                            <span class="cf4-arr">→</span>
                            <span class="cf4-node is-end">{t("the buyer at")} {deal.accountName}</span>
                        </div>

                        <div class="cf4-relay">
                            <div class="cf4-leg">
                                <div class="cf4-lh">{t("What you send")} {whoFirst}</div>
                                {editAsk.value ? (
                                    <textarea class="cf4-card cf4-edit" value={generated.ask}
                                        onInput={(e) => setCustomAsk((e.currentTarget as HTMLTextAreaElement).value)} />
                                ) : (
                                    <div class="cf4-card">{generated.ask}</div>
                                )}
                                <div class="cf4-cardrow">
                                    <button type="button" class="cf4-copy" onClick={() => copyText(generated.ask, t("Your message copied."))}>{t("Copy →")}</button>
                                    <button type="button" class="cf4-copy" onClick={() => (editAsk.value = !editAsk.value)}>{editAsk.value ? t("Done editing") : t("Make it yours")}</button>
                                </div>
                            </div>
                            <div class="cf4-arrow"><span class="cf4-albl">{t("passes it on")}</span><span>→</span></div>
                            <div class="cf4-leg">
                                <div class="cf4-lh">{t("What")} {whoFirst} {t("sends the buyer")}</div>
                                <div class="cf4-card">{generated.forward}</div>
                                <div class="cf4-cardrow">
                                    <button type="button" class="cf4-copy" onClick={() => copyText(generated.forward, t("The forwardable note copied."))}>{t("Copy →")}</button>
                                </div>
                            </div>
                        </div>

                        <div class="cf4-trust">
                            {t("All")} {whoFirst} {t("has to do is tweak a couple of lines and hit send.", { class: "body" })}{" "}
                            <b>{t("The easier you make their part, the more likely they say yes", { class: "body" })}</b>{" "}
                            {t("— and the less you lean on a favor you might need again later.", { class: "body" })}
                        </div>

                        <div class={`cf4-ready${secondAsk ? " is-warn" : read.band === "ask_ready" ? "" : " is-warn"}`}>
                            <span class="cf4-dot" />
                            <div>
                                <b>{secondAsk ? t("One thing before you send.") : read.band === "ask_ready" ? t("Ready to send.") : read.bandLabel + "."}</b>{" "}
                                <span class="cf4-rsub">
                                    {secondAsk
                                        ? `${t("You asked")} ${whoFirst} ${t("for a favor recently — a second ask in a short window. Worth opening with a quick thank-you for the last one.", { class: "body" })}`
                                        : read.bandCopy}
                                </span>
                            </div>
                        </div>

                        <div class="cf4-arow">
                            <button type="button" class="cf4-btn" disabled={!advisor}
                                onClick={() => { copyText(generated.ask, ""); sendAndLog(false); }}>
                                {t("Send & log the favor →")}
                            </button>
                            <button type="button" class="cf4-link" disabled={!advisor} onClick={() => sendAndLog(true)}>
                                {t("Just log it — I'll send it myself", { class: "body" })}
                            </button>
                            <span class="cf4-loop">
                                {t("You'll see what comes of it right here on the", { class: "body" })} <b>{deal.accountName}</b> {t("deal — a reply, a meeting, or a clean no.", { class: "body" })}
                            </span>
                        </div>
                    </div>
                ) : null}

                {/* the favors out — close every loop */}
                {recent.length > 0 ? (
                    <div class="cf4-log">
                        <div class="cf4-logh">{t("Favors out — close every loop", { class: "body" })}</div>
                        {recent.slice(0, 6).map((dep) => (
                            <div class="cf4-lrow" key={dep.id}>
                                <span class="cf4-ln">{dep.advisorName.split(" ")[0]}</span>
                                <span class="cf4-lm">{dep.momentName.toLowerCase()} · {dep.dealName}</span>
                                <select value={dep.outcome}
                                    onChange={(e) => { const updated = updateDeploymentOutcome(dep.id, (e.currentTarget as HTMLSelectElement).value as DeploymentOutcome); if (updated) void saveDeployment(updated); toast(t("Loop closed on the deal.")); }}>
                                    {(Object.keys(OUTCOME_LABEL) as DeploymentOutcome[]).map((o) => (
                                        <option value={o} key={o}>{OUTCOME_LABEL[o]}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
            {toastMsg.value ? <div class="cf4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
