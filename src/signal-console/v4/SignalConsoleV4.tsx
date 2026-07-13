import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    visibleAccounts,
    searchQuery,
    setSearchQuery,
    selectedAccountId,
    selectAccount,
    buildManualAccount
} from "../state";
import {
    saveAccount,
    deleteAccount,
    addSignal as addSignalEverywhere
} from "../lib/cloud-persistence";
import type { Account } from "../lib/types";
import { getAccountExecutionContext } from "../lib/execution-context";
import { runEnrichAll } from "../lib/enrich-actions";
import {
    hrefToOutbound,
    hrefToDealWorkspace,
    hrefToDiscoveryAgenda,
    hrefToColdCall
} from "../lib/handoff";
import { buildAttentionField, type AttentionBand } from "./lib/attention";
import { GroundLine } from "@/lib/ground/GroundLine";
import { FollowPeek, openFollow } from "@/lib/follow/FollowPeek";
import "./signal-console-v4.css";

/**
 * SignalConsoleV4 — the Attention Router (canon §4.7), wired to
 * production. The whole watched field at once, grouped by where
 * attention should go (act now / reach while warm / emerging / going
 * cold), a shape-of-attention strip, click-to-open-in-place, add-account
 * + enrich in the working header. The heat engine, CRUD, enrichment,
 * execution-context, and handoff are reused unchanged.
 */

const composerOpen = signal(false);
const cName = signal("");
const cDomain = signal("");
const cIndustry = signal("");
const cWhy = signal("");
const addSigDraft = signal("");

function saveWatch(): void {
    const name = cName.value.trim();
    if (!name) return;
    const notes = cWhy.value.trim() || "Just added — watching for signals";
    const account = buildManualAccount({
        name,
        domain: cDomain.value.trim() || undefined,
        industry: cIndustry.value.trim() || undefined,
        notes
    });
    // Through the cloud orchestrator (local upsert + Supabase write) —
    // a local-only write is clobbered when cloud replaces local on boot.
    void saveAccount(account);
    cName.value = "";
    cDomain.value = "";
    cIndustry.value = "";
    cWhy.value = "";
    composerOpen.value = false;
}

function addSignal(accountId: string): void {
    const headline = addSigDraft.value.trim();
    if (!headline) return;
    void addSignalEverywhere(accountId, {
        id: `sig_${Date.now()}_${Math.round(performance.now())}`,
        headline,
        source: "By hand",
        published_date: new Date().toISOString()
    });
    addSigDraft.value = "";
}

const TDOT: Record<string, string> = { hot: "live", warm: "live", cool: "touch", ice_cold: "" };

function moveLabel(band: AttentionBand): string {
    return band === "emerging" || band === "cold" ? t("Research") : t("Compose");
}

function Chip({ account, heat, ageLabel, band }: {
    account: Account;
    heat: number;
    ageLabel: string;
    band: AttentionBand;
}): JSX.Element {
    const open = selectedAccountId.value === account.id;
    const exec = getAccountExecutionContext(account);
    const tdot = TDOT[exec.temperature] ?? "";
    const topSig = account.signals[0];
    const move = moveLabel(band);
    const replied = tdot === "live";

    return (
        <div
            class={`sc4-chip${open ? " is-open" : ""}${band === "now" ? " sc4-chip--glow" : ""}`}
            onClick={() => {
                // Clear the add-signal draft when switching chips so
                // unsaved text never bleeds into the next account.
                addSigDraft.value = "";
                selectAccount(open ? null : account.id);
            }}
        >
            <div class="sc4-chead">
                <span class="sc4-heatbar">
                    <i style={`width:${Math.min(100, heat)}%`} />
                </span>
                <span class="sc4-cheat">{heat}</span>
                <span class={`sc4-tdot sc4-tdot--${tdot}`} title={exec.temperatureLabel} />
            </div>
            <div class="sc4-cname fo-obj" onClick={(e) => { e.stopPropagation(); openFollow(e.currentTarget as HTMLElement, account.name); }}>{account.name}</div>
            <div class="sc4-csig">
                {topSig?.headline ?? account.notes ?? t("no signals yet — research to build heat", { class: "body" })}
            </div>
            <div class={`sc4-cage${replied ? " sc4-cage--live" : ""}`}>
                {replied ? `● ${t("replied")} · ` : ""}
                {ageLabel}
            </div>

            {open ? (
                <div class="sc4-detail" onClick={(e) => e.stopPropagation()}>
                    <div class="sc4-cplabel">{t("Signals")}</div>
                    <div class="sc4-sigs">
                        {account.signals.length > 0 ? (
                            account.signals.map((s) => (
                                <div class="sc4-dsig" key={s.id}>
                                    <span>·</span>
                                    <span>
                                        <b>{s.headline ?? t("(untitled signal)")}</b>
                                        {s.source ? ` — ${s.source}` : ""}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div class="sc4-dsig sc4-dsig--empty">
                                {t("No signals yet — add one, or run enrich.", { class: "body" })}
                            </div>
                        )}
                    </div>
                    <div class="sc4-addsig">
                        <input
                            placeholder={t("Add a signal by hand…", { class: "body" })}
                            value={addSigDraft.value}
                            onInput={(e) => (addSigDraft.value = (e.currentTarget as HTMLInputElement).value)}
                        />
                        <button type="button" class="sc4-btn" onClick={() => addSignal(account.id)}>
                            {t("Add")}
                        </button>
                    </div>
                    <div class="sc4-rack">
                        <a class="sc4-btn sc4-btn--go" href={move === "Research" ? hrefToDiscoveryAgenda(account.name) : hrefToOutbound(account.name, exec.temperature)}>
                            {move}
                        </a>
                        <a class="sc4-btn" href={hrefToDiscoveryAgenda(account.name)}>{t("Plan a call")}</a>
                        <a class="sc4-btn" href={hrefToColdCall(account.name)}>{t("Cold call")}</a>
                        <a class="sc4-btn" href={hrefToDealWorkspace(account.name)}>{t("Open deal")}</a>
                        <button
                            type="button"
                            class="sc4-stopwatch"
                            onClick={() => void deleteAccount(account.id)}
                        >
                            {t("Stop watching")}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function SignalConsoleV4(): JSX.Element {
    const field = buildAttentionField(visibleAccounts.value);
    const SEG_MIN = 2;

    return (
        <div class="sc4">
            <div class="sc4-wrap">
                <div class="sc4-bar">
                    <span class="sc4-bname">{t("Signal Console")}</span>
                    <span class="sc4-posture">
                        <span class="sc4-pdot" />
                        {field.posture}
                    </span>
                    <span class="sc4-bar__r">
                        <span class="sc4-search">
                            <input
                                placeholder={t("Find an account…", { class: "body" })}
                                value={searchQuery.value}
                                onInput={(e) => setSearchQuery((e.currentTarget as HTMLInputElement).value)}
                            />
                        </span>
                        <button type="button" class="sc4-enrich" onClick={() => void runEnrichAll()}>
                            {t("Enrich all ↻")}
                        </button>
                        <button
                            type="button"
                            class="sc4-watchbtn"
                            onClick={() => (composerOpen.value = !composerOpen.value)}
                        >
                            {t("+ Watch a company")}
                        </button>
                    </span>
                </div>

                {composerOpen.value ? (
                    <div class="sc4-composer">
                        <div class="sc4-composer__row">
                            <input class="sc4-cinput" placeholder={t("Account name — e.g. Acme Robotics", { class: "body" })}
                                value={cName.value} onInput={(e) => (cName.value = (e.currentTarget as HTMLInputElement).value)} />
                            <input class="sc4-cinput" placeholder="acme.com"
                                value={cDomain.value} onInput={(e) => (cDomain.value = (e.currentTarget as HTMLInputElement).value)} />
                            <input class="sc4-cinput" placeholder={t("Industry", { class: "body" })}
                                value={cIndustry.value} onInput={(e) => (cIndustry.value = (e.currentTarget as HTMLInputElement).value)} />
                        </div>
                        <input class="sc4-cinput sc4-cinput--wide"
                            placeholder={t("Why they're on your radar — the trigger that brought them up", { class: "body" })}
                            value={cWhy.value} onInput={(e) => (cWhy.value = (e.currentTarget as HTMLInputElement).value)} />
                        <div class="sc4-composer__foot">
                            <button type="button" class="sc4-btn sc4-btn--go" onClick={saveWatch}>
                                {t("Watch this company")}
                            </button>
                            <span class="sc4-composer__hint">
                                {t("A new watch lands in Emerging until its signals build heat.", { class: "body" })}
                            </span>
                        </div>
                    </div>
                ) : null}

                <div class="sc4-shape">
                    <div class="sc4-shape__bar">
                        {(["now", "warm", "emerging", "cold"] as const).map((k) => (
                            <span class={`sc4-seg sc4-seg--${k}`} key={k} style={`flex:${Math.max(SEG_MIN, field.shape[k])}`}>
                                <i />
                            </span>
                        ))}
                    </div>
                    <div class="sc4-shape__key">
                        <span><i class="sc4-kd sc4-kd--now" /><b>{field.shape.now}</b> {t("act now")}</span>
                        <span><i class="sc4-kd sc4-kd--warm" /><b>{field.shape.warm}</b> {t("reach while warm")}</span>
                        <span><i class="sc4-kd sc4-kd--emerging" /><b>{field.shape.emerging}</b> {t("emerging")}</span>
                        <span><i class="sc4-kd sc4-kd--cold" /><b>{field.shape.cold}</b> {t("going cold")}</span>
                    </div>
                </div>
                <p class="sc4-sub">
                    {t("The shape of your attention today. Scan the bands, open any account in place, strike where it's ripe.", { class: "body" })}
                </p>
                <p class="sc4-health">
                    <b>{field.accountsWatched}</b> {t("accounts watched")} · <b>{field.signalsThisWeek}</b> {t("signals this week")} · <b>{field.compounding}</b> {t("compounding")}, <b>{field.stillWeak}</b> {t("still weak")}
                </p>

                {field.accountsWatched === 0 ? (
                    <p class="sc4-empty">
                        {t("No accounts watched yet. Add one with “Watch a company,” or send confirmed accounts over from the Prospecting Desk.", { class: "body" })}
                    </p>
                ) : (
                    field.bands
                        .filter((b) => b.accounts.length > 0)
                        .map((b) => (
                            <div class={`sc4-band sc4-band--${b.key}`} key={b.key}>
                                <div class="sc4-bhead">
                                    <span class="sc4-blabel">{b.label}</span>
                                    <span class="sc4-bwhy">— {b.why}</span>
                                    <span class="sc4-bn">{b.accounts.length}</span>
                                </div>
                                <div class="sc4-lane">
                                    {b.accounts.map((ra) => (
                                        <Chip
                                            key={ra.account.id}
                                            account={ra.account}
                                            heat={ra.heat}
                                            ageLabel={ra.ageLabel}
                                            band={b.key}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                )}
            </div>
            {/* The Ground — the app's one jump summon (2026-07-08):
                touch the ground line (or press G) and the motion map
                rises from beneath the room. */}
            <GroundLine />
            <FollowPeek />

        </div>
    );
}
