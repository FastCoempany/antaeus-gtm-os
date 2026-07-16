import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    accountOptions,
    selectedAccount,
    setSelectedAccount,
    draft,
    patchDraft,
    callLog,
    callStats,
    logCall
} from "../state";
import { THREADS } from "../lib/threads";
import { saveCallEntry } from "../lib/cloud-persistence";
import { personalize } from "../lib/personalize";
import { OUTCOME_LABELS, type Outcome, type ThreadId } from "../lib/types";
import { hrefToSignalConsole, hrefToDealWorkspace } from "../lib/handoff";
import {
    loadCustomPushbacks,
    saveCustomPushbacks,
    addCustomPushback,
    removeCustomPushback,
    type CustomPushbackMap
} from "./lib/custom-pushbacks";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./cold-call-studio-v4.css";

/**
 * ColdCallStudioV4 (canon §4.9) — the game plan, wired to production
 * from the settled 2026-07-06 mockup. A prep surface + an after-the-
 * call capture surface, never a during-call console: the pre-flight
 * bar (who · your reason to call, live from Signal Console · your one
 * goal), the 5-step game plan read BEFORE dialing (each step: the line
 * you say + the pushbacks you'll likely hear with an answer ready +
 * add-your-own), and the after-the-call outcome capture (booked →
 * creates a deal; the week's read). The thread data, personalize,
 * call log, discovery stats, and the deal-creation side effect are
 * reused unchanged. No clock, no mid-call clicking.
 */

const customPb = signal<CustomPushbackMap>(loadCustomPushbacks());
const addingFor = signal<ThreadId | null>(null);
const addBuyer = signal("");
const addReply = signal("");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** The five call steps, said plainly (§13). The prep thread became the pre-flight bar. */
const STEP_META: ReadonlyArray<{ id: ThreadId; name: string; par?: string }> = [
    { id: "opener", name: t("Open the call") },
    { id: "pressure", name: t("Why it matters to them"), par: t("(what's the cost)") },
    { id: "proof", name: t("Show them it's worked before", { class: "body" }) },
    { id: "ask", name: t("Ask for the meeting") },
    { id: "exit", name: t("Wrap up") }
];

/** Outcomes grouped the way the seller thinks about them. */
const ALIVE: ReadonlyArray<Outcome> = ["callback_scheduled", "referral"];
const NO_THIS_TIME: ReadonlyArray<Outcome> = ["voicemail", "rejected", "hung_up", "no_answer"];

function saveAdd(): void {
    const threadId = addingFor.value;
    if (!threadId) return;
    if (!addBuyer.value.trim() && !addReply.value.trim()) return;
    const next = addCustomPushback(customPb.value, threadId, addBuyer.value, addReply.value);
    customPb.value = next;
    saveCustomPushbacks(next);
    addingFor.value = null;
    addBuyer.value = "";
    addReply.value = "";
    toast(t("Added to your game plan."));
}

function removePb(threadId: ThreadId, id: string): void {
    const next = removeCustomPushback(customPb.value, threadId, id);
    customPb.value = next;
    saveCustomPushbacks(next);
}

function logOutcome(outcome: Outcome): void {
    const account = selectedAccount.value;
    // Never log a junk row — an outcome needs a named account (the
    // stats + Readiness discovery inputs read this log).
    if (!account) {
        toast(t("Pick the account you called first.", { class: "body" }));
        return;
    }
    const entry = logCall(outcome);
    if (!entry) return;
    // Cloud write too — a local-only log is clobbered when cloud
    // replaces local on boot.
    void saveCallEntry(entry);
    if (outcome === "meeting_booked" && account) {
        toast(`${t("Meeting booked — a deal was created for", { class: "body" })} ${account.name}.`);
    } else {
        toast(`${t("Logged:")} ${OUTCOME_LABELS[outcome]}.`);
    }
}

export function ColdCallStudioV4(): JSX.Element {
    const account = selectedAccount.value;
    const options = accountOptions.value;
    const d = draft.value;
    const stats = callStats.value;
    const log = callLog.value;
    const ctx = {
        accountName: account?.name ?? "",
        topSignal: account?.topSignal ?? ""
    };
    const pct = stats.total > 0 ? Math.round((stats.meetings / stats.total) * 100) : 0;
    const recent = log.slice(0, 2);

    return (
        <div class="cc4">
            <div class="cc4-wrap">
                <div class="cc4-top">
                    <span class="cc4-bname">{t("Cold Call Studio")}</span>
                    <span class="cc4-r">{t("walk in ready · log it after", { class: "body" })}</span>
                </div>

                {/* pre-flight */}
                <div class="cc4-pre">
                    <div class="cc4-cell cc4-who">
                        <div class="cc4-k">{t("Who you're calling")}</div>
                        <div class="cc4-v">
                            <select
                                class="cc4-acct"
                                value={account?.name ?? ""}
                                onChange={(e) => setSelectedAccount((e.currentTarget as HTMLSelectElement).value || null)}
                            >
                                <option value="">{t("Pick an account…")}</option>
                                {options.map((a) => (
                                    <option value={a.name} key={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {account && account.heat > 75 ? <span class="cc4-hot">{t("HOT")}</span> : null}
                        </div>
                        <input
                            class="cc4-contact"
                            value={d.contactName}
                            placeholder={t("Who picks up? (name · role)", { class: "body" })}
                            onInput={(e) => patchDraft({ contactName: (e.currentTarget as HTMLInputElement).value })}
                        />
                    </div>
                    <div class="cc4-cell cc4-reason">
                        <div class="cc4-k">
                            {t("Your reason to call")}
                            {account ? (
                                <a class="cc4-src" href={hrefToSignalConsole(account.name)}>◆ {t("live from Signal Console", { class: "body" })}</a>
                            ) : null}
                        </div>
                        <div class="cc4-v">
                            {account?.topSignal ? (
                                <span class="cc4-hi">{account.topSignal}</span>
                            ) : account ? (
                                t("No live signal on this account yet — go find one before you dial.", { class: "body" })
                            ) : (
                                t("Pick an account and its freshest signal lands here.", { class: "body" })
                            )}
                        </div>
                        <div class="cc4-note">{t("This is your way in — the call is built around it.", { class: "body" })}</div>
                    </div>
                    <div class="cc4-cell cc4-goal">
                        <div class="cc4-k">{t("Your one goal")}</div>
                        <div class="cc4-v">{t("Book 20 minutes")}</div>
                    </div>
                </div>

                {/* the game plan */}
                <div class="cc4-planhd">
                    <span class="cc4-h">{t("Your game plan")}</span>
                    <span class="cc4-s">{t("read it before you dial · then put the phone in your hand", { class: "body" })}</span>
                </div>
                {STEP_META.map((step, i) => {
                    const thread = THREADS.find((th) => th.id === step.id);
                    if (!thread) return null;
                    const custom = customPb.value[step.id] ?? [];
                    return (
                        <div class="cc4-step" key={step.id}>
                            <div class="cc4-sh">
                                <span class="cc4-n">{i + 1}</span>
                                <span class="cc4-nm">{step.name}{step.par ? <span class="cc4-par"> {step.par}</span> : null}</span>
                            </div>
                            <div class="cc4-say">
                                <span class="cc4-tag">{t("You say")}</span>
                                <span class="cc4-line">{personalize(thread.say, ctx)}</span>
                            </div>
                            <div class="cc4-push">
                                <div class="cc4-pbhead"><span class="cc4-c1">{t("If they say")}</span><span class="cc4-c2">{t("You say — the answer's ready", { class: "body" })}</span><span /></div>
                                {thread.replies.map((rep) => (
                                    <div class="cc4-pb" key={rep.id}>
                                        <span class="cc4-q">{personalize(rep.buyer, ctx)}</span>
                                        <span class="cc4-a">{personalize(rep.reply, ctx)}</span>
                                        <span />
                                    </div>
                                ))}
                                {custom.map((rep) => (
                                    <div class="cc4-pb is-yours" key={rep.id}>
                                        <span class="cc4-q">{rep.buyer || t("(what they said)")}</span>
                                        <span class="cc4-a">{rep.reply || t("(your answer)")}</span>
                                        <button type="button" class="cc4-rm" title={t("remove")} onClick={() => removePb(step.id, rep.id)}>✕</button>
                                    </div>
                                ))}
                                {addingFor.value === step.id ? (
                                    <div class="cc4-addrow">
                                        <input value={addBuyer.value} placeholder={t("What they said")}
                                            onInput={(e) => (addBuyer.value = (e.currentTarget as HTMLInputElement).value)} />
                                        <input value={addReply.value} placeholder={t("Your answer, ready for next time", { class: "body" })}
                                            onInput={(e) => (addReply.value = (e.currentTarget as HTMLInputElement).value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") saveAdd(); }} />
                                        <button type="button" class="cc4-addok" onClick={saveAdd}>{t("Keep it")}</button>
                                    </div>
                                ) : (
                                    <button type="button" class="cc4-addpb" onClick={() => { addingFor.value = step.id; addBuyer.value = ""; addReply.value = ""; }}>
                                        + {t("Add a pushback you hear", { class: "body" })}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* after the call */}
                <div class="cc4-after">
                    <div class="cc4-ah"><span class="cc4-ak">{t("After the call")}</span><h3>{t("How'd it go?")}</h3></div>
                    <button type="button" class="cc4-win" disabled={!account} onClick={() => logOutcome("meeting_booked")}>
                        <span class="cc4-ic">📅</span>
                        <span class="cc4-wt">
                            {t("Booked a meeting")}
                            <span class="cc4-wsub">{t("→ creates a deal you can work in Deal Workspace", { class: "body" })}</span>
                        </span>
                        <span class="cc4-go">{account ? t("tap to log →") : t("pick an account first")}</span>
                    </button>
                    <div class="cc4-og">
                        <div class="cc4-grp is-alive">
                            <div class="cc4-gl">{t("Still alive")}</div>
                            <div class="cc4-pills">
                                {ALIVE.map((o) => (
                                    <button type="button" class="cc4-out" key={o} disabled={!account} onClick={() => logOutcome(o)}>
                                        {o === "callback_scheduled" ? t("Call me back") : t("Gave a referral")}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div class="cc4-grp">
                            <div class="cc4-gl">{t("No, this time")}</div>
                            <div class="cc4-pills">
                                {NO_THIS_TIME.map((o) => (
                                    <button type="button" class="cc4-out" key={o} disabled={!account} onClick={() => logOutcome(o)}>
                                        {o === "rejected" ? t("Not interested") : OUTCOME_LABELS[o].replace(/^./, (c) => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <textarea
                        class="cc4-notes"
                        value={d.notes}
                        placeholder={t("What did you hear? One line is enough.", { class: "body" })}
                        onInput={(e) => patchDraft({ notes: (e.currentTarget as HTMLTextAreaElement).value })}
                    />
                    <div class="cc4-week">
                        <span class="cc4-wn">{t("So far:")} <b>{stats.meetings} {t("booked")}</b></span>
                        <span class="cc4-bar"><span class="cc4-fill" style={`width:${Math.min(100, pct)}%`} /></span>
                        <span class="cc4-wr">
                            <b>{stats.total}</b> {t("calls")}{stats.total > 0 ? <> · <b>{pct}%</b> {t("reached a meeting")}</> : null}
                            {recent.length > 0 ? <> · {t("last:")} {recent.map((c) => `${c.accountName || "—"} (${OUTCOME_LABELS[c.outcome]})`).join(" · ")}</> : null}
                        </span>
                        {stats.meetings > 0 && account ? (
                            <a class="cc4-dw" href={hrefToDealWorkspace(account.name)}>{t("Open Deal Workspace →")}</a>
                        ) : null}
                    </div>
                </div>
            </div>
            {toastMsg.value ? <div class="cc4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
