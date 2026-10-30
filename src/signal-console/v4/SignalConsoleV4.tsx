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
import { LiveEdge } from "@/lib/edge/LiveEdge";
import { FollowPeek, openFollow } from "@/lib/follow/FollowPeek";
import "./signal-console-v4.css";

/**
 * Signal Console — watched accounts grouped by current priority using the
 * existing score and signal-recency model. Internal `heat` fields and band
 * ids remain stable for compatibility; visible language describes account
 * priority, supporting signals, and signal age directly.
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
    const notes = cWhy.value.trim() || "Just added — monitoring for relevant account signals";
    const account = buildManualAccount({
        name,
        domain: cDomain.value.trim() || undefined,
        industry: cIndustry.value.trim() || undefined,
        notes
    });
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
                addSigDraft.value = "";
                selectAccount(open ? null : account.id);
            }}
        >
            <div class="sc4-chead">
                <span class="sc4-heatbar" title={t("Account priority score", { class: "body" })}>
                    <i style={`width:${Math.min(100, heat)}%`} />
                </span>
                <span class="sc4-cheat" title={t("Account priority score", { class: "body" })}>{heat}</span>
                <span class={`sc4-tdot sc4-tdot--${tdot}`} title={exec.temperatureLabel} />
            </div>
            <div class="sc4-cname fo-obj" onClick={(e) => { e.stopPropagation(); openFollow(e.currentTarget as HTMLElement, account.name); }}>{account.name}</div>
            <div class="sc4-csig">
                {topSig?.headline ?? account.notes ?? t("No signals yet. Research this account to add current evidence.", { class: "body" })}
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
                                {t("No signals yet. Add one manually or refresh account data.", { class: "body" })}
                            </div>
                        )}
                    </div>
                    <div class="sc4-addsig">
                        <input
                            placeholder={t("Add a signal manually…", { class: "body" })}
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
                            {t("Refresh account data ↻")}
                        </button>
                        <button
                            type="button"
                            class="sc4-watchbtn"
                            onClick={() => (composerOpen.value = !composerOpen.value)}
                        >
                            {t("+ Add company to watchlist")}
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
                            placeholder={t("Why this account is relevant now — current event, change, or trigger", { class: "body" })}
                            value={cWhy.value} onInput={(e) => (cWhy.value = (e.currentTarget as HTMLInputElement).value)} />
                        <div class="sc4-composer__foot">
                            <button type="button" class="sc4-btn sc4-btn--go" onClick={saveWatch}>
                                {t("Add to watchlist")}
                            </button>
                            <span class="sc4-composer__hint">
                                {t("A newly added account appears under New signals until enough evidence exists to change its priority.", { class: "body" })}
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
                        <span><i class="sc4-kd sc4-kd--now" /><b>{field.shape.now}</b> {t("high priority")}</span>
                        <span><i class="sc4-kd sc4-kd--warm" /><b>{field.shape.warm}</b> {t("priority declining")}</span>
                        <span><i class="sc4-kd sc4-kd--emerging" /><b>{field.shape.emerging}</b> {t("new signals")}</span>
                        <span><i class="sc4-kd sc4-kd--cold" /><b>{field.shape.cold}</b> {t("monitor")}</span>
                    </div>
                </div>
                <p class="sc4-sub">
                    {t("Review accounts by current priority. Open an account to see the signals and activity driving its ranking.", { class: "body" })}
                </p>
                <p class="sc4-health">
                    <b>{field.accountsWatched}</b> {t("watched accounts")} · <b>{field.signalsThisWeek}</b> {t("new signals this week")} · <b>{field.compounding}</b> {t("accounts with multiple reinforcing signals")} · <b>{field.stillWeak}</b> {t("accounts with low current priority")}
                </p>

                {field.accountsWatched === 0 ? (
                    <p class="sc4-empty">
                        {t("No accounts are on the watchlist yet. Add one here or send confirmed accounts from Prospecting Desk.", { class: "body" })}
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
            <GroundLine />
            <LiveEdge />
            <FollowPeek />
        </div>
    );
}
