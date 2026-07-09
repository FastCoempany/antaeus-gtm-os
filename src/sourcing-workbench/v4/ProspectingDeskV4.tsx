import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    prospects,
    queryCards,
    stats,
    inboundFocus,
    prospectDraft,
    queryCardDraft,
    patchProspectDraft,
    patchQueryCardDraft,
    saveProspectFromDraft,
    saveQueryCardFromDraft,
    patchProspect,
    setProspectStage
} from "../state";
import type { Prospect } from "../lib/types";
import { getProspectQuality } from "../lib/quality";
import { computeLoomRead } from "../lib/loom-read";
import { hrefToSignalConsole, hrefToOutboundStudio } from "../lib/handoff";
import { enqueueInboundAccount } from "@/signal-console/lib/inbound-queue";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./prospecting-desk-v4.css";

/**
 * ProspectingDeskV4 (canon §4.6) — the Funnel, wired to production.
 * One flow, top to bottom: FIND (describe who you want, keep the
 * search, add the companies it turns up) → CONFIRM (the three plain
 * questions — the guard on Signal Console; nothing crosses without
 * them) → SEND (each confirmed account is delivered to Signal Console
 * through its own canonical writer via the inbound queue).
 *
 * Honesty rule (§4.6): the desk does NOT claim a live web search it
 * doesn't run — no fake "Antaeus searched the web" theater. Searches
 * are saved + counted; the operator adds what the search turns up.
 * The quality engine, stage lifecycle, persistence, and handoffs are
 * reused unchanged. The three questions map to the engine's own
 * fields: who-we're-targeting → notes · way-in → entryPoint ·
 * how-we'll-reach-out → approach (the exact fields the quality score
 * already credits).
 */

const selectedId = signal<string | null>(null);
const addOpen = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2600);
}

/** The funnel's "just added" pool — not yet ready, not sent, not set aside. */
function addedPool(list: ReadonlyArray<Prospect>): ReadonlyArray<Prospect> {
    return list.filter((p) => p.stage === "captured" || p.stage === "researched");
}

function answered(p: Prospect): { q1: boolean; q2: boolean; q3: boolean; left: number } {
    const q1 = p.notes.trim().length > 0;
    const q2 = p.entryPoint.trim().length > 0;
    const q3 = p.approach.trim().length > 0;
    return { q1, q2, q3, left: [q1, q2, q3].filter((x) => !x).length };
}

/**
 * Patch a question field AND keep the stage honest: all three answered
 * promotes to "ready" (the right rail), un-answering demotes back to
 * "researched". `patchProspect` alone never re-runs promotion — without
 * this, nothing in the room could ever reach the Ready rail.
 */
function patchQuestion(p: Prospect, part: Partial<Prospect>): void {
    patchProspect(p.id, part);
    const next = { ...p, ...part } as Prospect;
    const a = answered(next);
    if (a.left === 0 && next.stage !== "ready" && next.stage !== "pushed") {
        setProspectStage(p.id, "ready");
    } else if (a.left > 0 && next.stage === "ready") {
        setProspectStage(p.id, "researched");
    }
}

function sendProspect(p: Prospect): void {
    const ok = enqueueInboundAccount({
        name: p.accountName,
        note: [p.entryPoint, p.approach].filter(Boolean).join(" · ") || undefined,
        from: "prospecting-desk"
    });
    if (!ok) {
        toast(`${t("Couldn't queue")} ${p.accountName} — ${t("try the send again.")}`);
        return;
    }
    setProspectStage(p.id, "pushed");
    if (selectedId.value === p.id) selectedId.value = null;
    toast(`${p.accountName} ${t("is on its way to Signal Console — it lands the next time that room opens.", { class: "body" })}`);
}

function setAside(p: Prospect): void {
    setProspectStage(p.id, "dropped");
    if (selectedId.value === p.id) selectedId.value = null;
    toast(`${p.accountName} ${t("set aside — not who we're targeting.", { class: "body" })}`);
}

function saveSearch(): void {
    const saved = saveQueryCardFromDraft();
    if (saved) toast(t("Search saved — add the companies it turns up below.", { class: "body" }));
}

function addCompany(): void {
    const saved = saveProspectFromDraft();
    if (saved) {
        addOpen.value = false;
        selectedId.value = saved.id;
        toast(`${saved.accountName} ${t("added to the funnel.")}`);
    }
}

export function ProspectingDeskV4(): JSX.Element {
    const all = prospects.value;
    const s = stats.value;
    const added = addedPool(all);
    const ready = all.filter((p) => p.stage === "ready");
    const sent = all.filter((p) => p.stage === "pushed");
    const read = computeLoomRead({ prospects: all, stats: s });
    const cards = queryCards.value;
    const qd = queryCardDraft.value;
    const pd = prospectDraft.value;
    const focus = inboundFocus.value;

    const sel = selectedId.value ? all.find((p) => p.id === selectedId.value) ?? null : null;
    // Keep the panel open through the ready promotion so the Send
    // button is right there the moment the third answer lands.
    const selOpen =
        sel && (sel.stage === "captured" || sel.stage === "researched" || sel.stage === "ready")
            ? sel
            : null;
    const a = selOpen ? answered(selOpen) : null;
    const q = selOpen ? getProspectQuality(selOpen) : null;

    return (
        <div class="pd4">
            <div class="pd4-wrap">
                <div class="pd4-bar">
                    <span class="pd4-bname">{t("Prospecting Desk")}</span>
                    <span class="pd4-tstat">
                        <b>{ready.length}</b> {t("ready to send")} · <b>{added.length}</b> {t("being confirmed")}
                    </span>
                </div>

                <h1 class="pd4-lead">{t("One funnel, top to bottom — find, confirm, send.", { class: "body" })}</h1>
                <div class="pd4-leadsub">
                    {t("Accounts enter at the top and only leave once you've confirmed them.", { class: "body" })}
                    {focus ? <> {t("Targeting:")} <b>{focus}</b>.</> : null}
                </div>

                <div class="pd4-deskread">
                    <span class={`pd4-band is-${read.band}`}>{read.bandLabel}</span>
                    <span class="pd4-rd">{read.weekRead}</span>
                    <span class="pd4-mv"><b>{t("Next")}</b>{read.operatorMove}</span>
                </div>

                {/* ── 1 · FIND ─────────────────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">1</span><span class="pd4-st">{t("Find")}</span><span class="pd4-sd">{t("— describe who you want; keep the search; add the companies it turns up", { class: "body" })}</span><span class="pd4-line" /></div>
                <div class="pd4-describe">
                    <div class="pd4-dl">{t("Describe who you want")}</div>
                    <div class="pd4-drow">
                        <input
                            value={qd.query}
                            placeholder={t("e.g. Series-B fintechs that just raised · RevOps leaders new in the seat", { class: "body" })}
                            onInput={(e) => patchQueryCardDraft({ query: (e.currentTarget as HTMLInputElement).value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveSearch(); }}
                        />
                        <button type="button" class="pd4-go" disabled={!qd.query.trim()} onClick={saveSearch}>
                            {t("Keep this search")}
                        </button>
                    </div>
                    <div class="pd4-hint">
                        {t("The desk keeps every search you describe. Add the companies it turns up — each one enters the funnel below and gets confirmed before anything reaches Signal Console.", { class: "body" })}
                    </div>
                </div>

                {cards.length > 0 ? (
                    <div class="pd4-grp">
                        <div class="pd4-grptt">{t("Searches you've kept")} <span class="pd4-n">· {cards.length}</span></div>
                        {cards.slice(0, 6).map((c) => {
                            const fromThis = all.filter((p) => p.sourceQueryId === c.id).length;
                            return (
                                <div class="pd4-srow" key={c.id}>
                                    <span class="pd4-sdot" />
                                    <div class="pd4-sbody">
                                        <div class="pd4-q">{c.query}</div>
                                        {c.intent ? <div class="pd4-h">{c.intent}</div> : null}
                                    </div>
                                    <span class="pd4-sn">{fromThis > 0 ? <><b>{fromThis}</b> {t("added from it")}</> : t("nothing added yet")}</span>
                                    <button
                                        type="button"
                                        class="pd4-run"
                                        onClick={() => {
                                            patchProspectDraft({ sourceQueryId: c.id });
                                            addOpen.value = true;
                                        }}
                                    >
                                        {t("+ Add a company")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <div class={`pd4-add${addOpen.value ? " is-open" : ""}`}>
                    <button type="button" class="pd4-addhead" onClick={() => (addOpen.value = !addOpen.value)}>
                        {addOpen.value ? t("Close") : t("+ Add a company to the funnel", { class: "body" })}
                    </button>
                    {addOpen.value ? (
                        <div class="pd4-addgrid">
                            <label class="pd4-fld">
                                <span>{t("Company")}</span>
                                <input value={pd.accountName} placeholder="e.g. Vanta"
                                    onInput={(e) => patchProspectDraft({ accountName: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("Person to reach")}</span>
                                <input value={pd.contactName} placeholder="e.g. Miguel Lopez"
                                    onInput={(e) => patchProspectDraft({ contactName: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("Their role")}</span>
                                <input value={pd.contactTitle} placeholder="e.g. Head of RevOps"
                                    onInput={(e) => patchProspectDraft({ contactTitle: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("From which search?")}</span>
                                <select value={pd.sourceQueryId}
                                    onChange={(e) => patchProspectDraft({ sourceQueryId: (e.currentTarget as HTMLSelectElement).value })}>
                                    <option value="">{t("Found it myself")}</option>
                                    {cards.map((c) => <option value={c.id} key={c.id}>{c.query.slice(0, 60)}</option>)}
                                </select>
                            </label>
                            <div class="pd4-fld pd4-fld--btn">
                                <button type="button" class="pd4-save" disabled={!pd.accountName.trim()} onClick={addCompany}>
                                    {t("Add to the funnel")}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* ── 2 · CONFIRM ──────────────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">2</span><span class="pd4-st">{t("Confirm")}</span><span class="pd4-sd">{t("— the real work: three questions before an account qualifies for Signal Console", { class: "body" })}</span><span class="pd4-line" /></div>
                <div class="pd4-research">
                    <div class="pd4-rail pd4-rail--l">
                        <div class="pd4-rh">
                            <div class="pd4-rk">{t("Just added")} <span class="pd4-rn">{added.length}</span></div>
                            <div class="pd4-rs">{t("Not confirmed yet — click one to work it.", { class: "body" })}</div>
                        </div>
                        {added.length === 0 ? (
                            <div class="pd4-emptyr">{t("Nothing waiting. Describe a search above and add companies.", { class: "body" })}</div>
                        ) : (
                            added.slice(0, 30).map((p) => {
                                const pq = getProspectQuality(p);
                                return (
                                    <button type="button" class={`pd4-rr${selOpen?.id === p.id ? " is-active" : ""}`} key={p.id} onClick={() => (selectedId.value = p.id)}>
                                        <div class="pd4-ra">{p.accountName} <span class="pd4-rsc">{pq.score}</span></div>
                                        {p.contactName ? <div class="pd4-rc">{p.contactName}{p.contactTitle ? ` · ${p.contactTitle}` : ""}</div> : null}
                                        <div class="pd4-rnote">{answered(p).left === 0 ? t("all three answered") : `${answered(p).left} ${t("to answer")}`}</div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div class="pd4-mid">
                        {selOpen && a && q ? (
                            <>
                                <div class="pd4-mhead">
                                    <div class="pd4-mk">{t("Confirming")}</div>
                                    <div class="pd4-mname">{selOpen.accountName}</div>
                                    {selOpen.contactName ? <div class="pd4-mc">{selOpen.contactName}{selOpen.contactTitle ? ` · ${selOpen.contactTitle}` : ""}</div> : null}
                                    <div class={`pd4-meta${a.left === 0 ? " is-ok" : ""}`}>
                                        {t("quality")} {q.score} · {a.left === 0 ? t("confirmed") : `${a.left} ${t("question")}${a.left === 1 ? "" : "s"} ${t("left")}`}
                                    </div>
                                </div>
                                <div class="pd4-persona">
                                    <span class="pd4-ptag">{t("Who to target")}{focus ? ` · ${focus}` : ""}</span>
                                    {t("Go for the person who owns the problem — not the junior who just fills in the CRM.", { class: "body" })}
                                </div>
                                <div class="pd4-qs">
                                    <div class={`pd4-qq ${a.q1 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q1 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("Are they who we're targeting?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.notes}
                                                placeholder={t("e.g. Yes — they own the forecast rebuild and just raised", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { notes: (e.currentTarget as HTMLInputElement).value })} />
                                        </div>
                                    </div>
                                    <div class={`pd4-qq ${a.q2 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q2 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("What's our way in to the account?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.entryPoint}
                                                placeholder={t("e.g. A shared investor sits on their board — ask for the intro", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { entryPoint: (e.currentTarget as HTMLInputElement).value })} />
                                        </div>
                                    </div>
                                    <div class={`pd4-qq ${a.q3 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q3 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("How will we reach out?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.approach}
                                                placeholder={t("e.g. Open on the raise, then ask for the board intro", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { approach: (e.currentTarget as HTMLInputElement).value })} />
                                        </div>
                                    </div>
                                </div>
                                <div class="pd4-mfoot">
                                    <div class={`pd4-fm${a.left === 0 ? " is-ok" : ""}`}>
                                        {a.left === 0
                                            ? <>{t("All three answered —")} <b>{selOpen.accountName} {t("is ready.")}</b></>
                                            : <>{t("Still to answer:")} <b>{[!a.q1 && t("are they who we're targeting", { class: "body" }), !a.q2 && t("our way in"), !a.q3 && t("how we'll reach out")].filter(Boolean).join(" · ")}</b></>}
                                    </div>
                                    <button type="button" class="pd4-aside" onClick={() => setAside(selOpen)}>
                                        {t("Set aside — not who we're targeting", { class: "body" })}
                                    </button>
                                    <button type="button" class={`pd4-send${a.left === 0 ? " is-on" : ""}`} disabled={a.left !== 0} onClick={() => sendProspect(selOpen)}>
                                        {t("Send")} {selOpen.accountName} {t("to Signal Console")}
                                    </button>
                                    <div class="pd4-fh">{t("answer all three to send")}</div>
                                </div>
                            </>
                        ) : (
                            <div class="pd4-midempty">
                                <div class="pd4-me">{t("Nothing to confirm.")}</div>
                                <div class="pd4-mes">{t("Click an account in “Just added,” or add companies from a search.", { class: "body" })}</div>
                            </div>
                        )}
                    </div>

                    <div class="pd4-rail pd4-rail--r">
                        <div class="pd4-rh">
                            <div class="pd4-rk pd4-rk--ok">{t("Ready to send")} <span class="pd4-rn">{ready.length}</span></div>
                            <div class="pd4-rs">{t("Send each with one click.")}</div>
                        </div>
                        {ready.length === 0 ? (
                            <div class="pd4-emptyr">{t("Nothing queued yet. Finish confirming an account and it lands here.", { class: "body" })}</div>
                        ) : (
                            ready.slice(0, 30).map((p) => (
                                <div class="pd4-rr" key={p.id}>
                                    <div class="pd4-ra">{p.accountName}</div>
                                    {p.contactName ? <div class="pd4-rc">{p.contactName}</div> : null}
                                    <button type="button" class="pd4-rsend" onClick={() => sendProspect(p)}>{t("Send →")}</button>
                                </div>
                            ))
                        )}
                        {sent.length > 0 ? (
                            <>
                                <div class="pd4-subhead">{t("Already sent")} · {sent.length}</div>
                                {sent.slice(0, 8).map((p) => (
                                    <div class="pd4-rr is-sent" key={p.id}>
                                        <div class="pd4-ra">{p.accountName}</div>
                                        <a class="pd4-inlink" href={hrefToSignalConsole({ account: p.accountName })}>{t("in Signal Console ↗")}</a>
                                    </div>
                                ))}
                            </>
                        ) : null}
                    </div>
                </div>

                {/* ── 3 · WHERE THIS FITS ──────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">3</span><span class="pd4-st">{t("Where this fits")}</span><span class="pd4-line" /></div>
                <div class="pd4-fits">
                    <div class="pd4-node is-from"><span class="pd4-nk">{t("comes from")}</span><span class="pd4-nn">{t("Territory")}</span></div>
                    <div class="pd4-arr"><span>→</span><em>{t("who we're targeting")}</em></div>
                    <div class="pd4-node is-here"><span class="pd4-nk">{t("you are here")}</span><span class="pd4-nn">{t("Prospecting Desk")}</span></div>
                    <div class="pd4-arr"><span>→</span><em>{t("confirmed accounts")}</em></div>
                    <a class="pd4-node is-to" href={hrefToSignalConsole()}><span class="pd4-nk">{t("sends to")}</span><span class="pd4-nn">{t("Signal Console")}</span></a>
                    <a class="pd4-branch" href={hrefToOutboundStudio({ account: ready[0]?.accountName })}>
                        {t("also to")} <b>{t("Outbound Studio")}</b> — {t("a ready account → the first message", { class: "body" })}
                    </a>
                </div>
            </div>

            {toastMsg.value ? <div class="pd4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
        </div>
    );
}
