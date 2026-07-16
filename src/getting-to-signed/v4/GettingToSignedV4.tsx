import type { JSX } from "preact";
import { signal, effect } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft, draftDeal, linkedDeals, setDealId, appendLearning } from "../state";
import { hrefToAdvisorDeploy, hrefToDealWorkspace } from "../lib/handoff";
import {
    loadSignedState,
    saveSignedState,
    memberId,
    engagementRead,
    pickBlocking,
    EMPTY_SIGNED_STATE,
    FRONT_IDS,
    type SignedState,
    type FrontId,
    type FrontStatus,
    type MemberKind
} from "./lib/fronts";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./getting-to-signed-v4.css";

/**
 * GettingToSignedV4 (canon §4.16b) — the face-off + ledger, wired to
 * production from the settled 2026-07-07 design. The deal isn't won at
 * yes: the room runs the whole procurement gauntlet — the one thing
 * actually blocking as a two-sided face-off up top (their side ⟷ your
 * line, with hold / trade / the line you won't cross), everything else
 * open as a positions ledger (Legal / Security / Finance / Business,
 * each row drilling to its depth — the security coverage map is the
 * deepest). Committee engagement chips + papers-ready strip + the
 * plan-to-signed keep the committee warm. Deal linking + learnings
 * reuse the shipped engine; the fronts model is the additive layer.
 */

const gts = signal<SignedState>(EMPTY_SIGNED_STATE);
const gtsDealId = signal<string>("");
const openFront = signal<FrontId | null>(null);
const learnDraft = signal("");
const addMemberName = signal("");
const addMemberRole = signal("");
const addMemberKind = signal<MemberKind>("other");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let booted = false;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** Boot per-deal state + persistence. Called from main. */
export function bootSignedState(): void {
    gtsDealId.value = draft.value.dealId ?? "";
    gts.value = loadSignedState(gtsDealId.value);
    if (booted) return;
    booted = true;
    let first = true;
    effect(() => {
        const state = gts.value;
        const id = gtsDealId.value;
        if (first) {
            first = false;
            return;
        }
        saveSignedState(id, state);
    });
    effect(() => {
        const id = draft.value.dealId ?? "";
        if (id !== gtsDealId.value) {
            gtsDealId.value = id;
            gts.value = loadSignedState(id);
        }
    });
}

function patchGts(part: Partial<SignedState>): void {
    gts.value = { ...gts.value, ...part } as SignedState;
}

function patchFront(id: FrontId, part: Partial<SignedState["fronts"][FrontId]>): void {
    patchGts({
        fronts: { ...gts.value.fronts, [id]: { ...gts.value.fronts[id], ...part } }
    });
}

const FRONT_META: Record<FrontId, { label: string; dot: string; hint: string }> = {
    legal: { label: t("Legal"), dot: "#b83232", hint: t("liability, indemnification, redlines — the changes they want to the contract", { class: "body" }) },
    security: { label: t("Security"), dot: "#7c5cff", hint: t("the questionnaire — mostly answered by papers you already hold", { class: "body" }) },
    finance: { label: t("Finance"), dot: "#1f9d6b", hint: t("payment terms — every give gets something back", { class: "body" }) },
    business: { label: t("Business"), dot: "#b5790f", hint: t("keep the committee moving — this front is what actually kills deals", { class: "body" }) }
};

const STATUS_LABEL: Record<FrontStatus, string> = {
    blocking: t("blocking"),
    clearing: t("clearing"),
    todo: t("to do"),
    at_risk: t("at risk"),
    settled: t("settled")
};

/** Authored playbook per front — the room's grounded coaching (canon §4.16b). */
const PLAYBOOK: Record<FrontId, JSX.Element> = {
    legal: (
        <>
            <b>{t("Unlimited isn't the norm", { class: "body" })}</b> — {t("a 12-month-fees cap is, with a data breach usually getting its own higher \"super-cap.\" And the cap is linked to their indemnification ask: a broad promise is worthless if the cap is tiny — settle them together, never one at a time.", { class: "body" })}
        </>
    ),
    security: (
        <>
            {t("Don't fill the checklist by hand —", { class: "body" })} <b>{t("most of it is already answered by papers you hold.", { class: "body" })}</b> {t("Send the papers first; only the genuinely open questions need a human.", { class: "body" })}
        </>
    ),
    finance: (
        <>
            {t("A longer payment term is a give —", { class: "body" })} <b>{t("get something for it.")}</b> {t("Offer three and let them pick: net-60 flat · net-30 for a small cut · a discount for annual up-front. The line: no net-90 on an unpaid balance.", { class: "body" })}
        </>
    ),
    business: (
        <>
            {t("This is the front that actually kills deals — not losing the argument, but the committee going quiet.", { class: "body" })} <b>{t("Build the plan-to-signed with your champion", { class: "body" })}</b> {t("— dated steps, named owners — and give the quiet person a real reason to re-engage, never a \"just checking in.\"", { class: "body" })}
        </>
    )
};

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
        return;
    }
    navigator.clipboard.writeText(text).then(() => toast(done)).catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
}

export function GettingToSignedV4(): JSX.Element {
    const state = gts.value;
    const deal = draftDeal.value;
    const deals = linkedDeals.value;
    const blocking = pickBlocking(state);
    const face = blocking ? state.fronts[blocking] : null;
    const papers = state.papers;
    const paperList = [
        papers.soc2 && "SOC 2",
        papers.subprocessors && t("subprocessor list"),
        papers.pentest && t("pen-test"),
        papers.dpa && "DPA"
    ].filter(Boolean) as string[];
    const cov = state.coverage;
    const covOpen = Math.max(0, cov.total - cov.covered);
    // Every front stays in the ledger — the face-off is the hero view of
    // the blocking one, but its depth (status, the coverage map, the
    // plan-to-signed) must never become unreachable while it blocks.
    const ledgerFronts = FRONT_IDS;

    return (
        <div class="gs4">
            <div class="gs4-wrap">
                <div class="gs4-top">
                    <span class="gs4-bname">{t("Getting to Signed")}</span>
                    <span class="gs4-r">{t("the deal isn't won at yes", { class: "body" })}</span>
                </div>

                <div class="gs4-read">
                    <span class="gs4-who">{deal?.accountName ?? t("Pick the deal")}</span>
                    {deal ? <a class="gs4-m" href={hrefToDealWorkspace(deal.id)}>◆ ${Math.round(deal.value / 1000)}k</a> : null}
                    {deals.length > 0 ? (
                        <select class="gs4-dealsel" value={draft.value.dealId ?? ""}
                            onChange={(e) => setDealId((e.currentTarget as HTMLSelectElement).value || null)}>
                            <option value="">{t("Which deal?")}</option>
                            {deals.map((x) => <option value={x.id} key={x.id}>{x.accountName}</option>)}
                        </select>
                    ) : null}
                    <span class="gs4-to">
                        {t("to signed by")}{" "}
                        <input class="gs4-date" value={state.targetDate} placeholder={t("month-end")}
                            onInput={(e) => patchGts({ targetDate: (e.currentTarget as HTMLInputElement).value })} />
                    </span>
                </div>

                {/* committee + papers strip */}
                <div class="gs4-strip">
                    {state.committee.map((m) => {
                        const read = engagementRead(m);
                        return (
                            <span class={`gs4-chip${read.band === "quiet" ? " is-quiet" : ""}`} key={m.id}
                                title={t("Tap when you've touched them", { class: "body" })}
                                onClick={() => patchGts({ committee: state.committee.map((x) => x.id === m.id ? { ...x, lastTouch: new Date().toISOString() } : x) })}>
                                <span class={`gs4-d is-${read.band}`} />
                                {m.name}
                                <span class="gs4-rl">
                                    {m.kind === "champion" ? t("champion") : m.kind === "signer" ? t("signs off") : m.role || t("committee")}
                                    {read.band === "quiet" ? ` · ${t("quiet")} ${read.days}d` : read.band === "new" ? ` · ${t("new")}` : ""}
                                </span>
                                <button type="button" class="gs4-mx" title={t("Remove")}
                                    onClick={(ev) => { ev.stopPropagation(); patchGts({ committee: state.committee.filter((x) => x.id !== m.id) }); }}>×</button>
                            </span>
                        );
                    })}
                    <span class="gs4-addm">
                        <input value={addMemberName.value} placeholder={t("Name")} onInput={(e) => (addMemberName.value = (e.currentTarget as HTMLInputElement).value)} />
                        <input value={addMemberRole.value} placeholder={t("role")} class="gs4-rolein" onInput={(e) => (addMemberRole.value = (e.currentTarget as HTMLInputElement).value)} />
                        <select value={addMemberKind.value} onChange={(e) => (addMemberKind.value = (e.currentTarget as HTMLSelectElement).value as MemberKind)}>
                            <option value="champion">{t("champion")}</option>
                            <option value="signer">{t("signs off")}</option>
                            <option value="other">{t("committee")}</option>
                        </select>
                        <button type="button" disabled={!addMemberName.value.trim()}
                            onClick={() => {
                                patchGts({ committee: [...state.committee, { id: memberId(), name: addMemberName.value.trim(), role: addMemberRole.value.trim(), kind: addMemberKind.value, lastTouch: null }] });
                                addMemberName.value = ""; addMemberRole.value = "";
                            }}>{t("Add")}</button>
                    </span>
                    <span class="gs4-sp">
                        {t("Papers ready:")} <b>{paperList.length > 0 ? paperList.join(" · ") : t("none marked yet")}</b>
                        {(["soc2", "subprocessors", "pentest", "dpa"] as const).map((k) => (
                            <button type="button" key={k} class={`gs4-pp${papers[k] ? " is-on" : ""}`}
                                onClick={() => patchGts({ papers: { ...papers, [k]: !papers[k] } })}>
                                {k === "soc2" ? "SOC 2" : k === "subprocessors" ? t("subs") : k === "pentest" ? t("pen-test") : "DPA"}
                            </button>
                        ))}
                    </span>
                </div>

                {/* the face-off */}
                {blocking && face ? (
                    <>
                        <div class="gs4-blockhd">{t("The one thing blocking — settle this and the next front opens", { class: "body" })}</div>
                        <div class="gs4-faceoff">
                            <div class="gs4-side is-them">
                                <div class="gs4-sl">{t("Their side")} · {FRONT_META[blocking].label}</div>
                                <input class="gs4-sv" value={face.theirAsk} placeholder={t("What are they holding the contract on?", { class: "body" })}
                                    onInput={(e) => patchFront(blocking, { theirAsk: (e.currentTarget as HTMLInputElement).value })} />
                            </div>
                            <div class="gs4-gap"><span class="gs4-gl">{t("the gap")}</span><span class="gs4-vs">{t("vs")}</span></div>
                            <div class="gs4-side is-you">
                                <div class="gs4-sl">{t("Your line")}</div>
                                <input class="gs4-sv" value={face.yourLine} placeholder={t("Your counter — and the line you won't cross", { class: "body" })}
                                    onInput={(e) => patchFront(blocking, { yourLine: (e.currentTarget as HTMLInputElement).value })} />
                            </div>
                        </div>
                        <div class="gs4-why">{PLAYBOOK[blocking]}</div>
                        <div class="gs4-arow">
                            <button type="button" class="gs4-btn"
                                disabled={!face.theirAsk.trim() || !face.yourLine.trim()}
                                onClick={() => copyText(
                                    `${t("On")} ${FRONT_META[blocking].label.toLowerCase()}: ${t("you've asked for")} ${face.theirAsk}. ${t("Our position:")} ${face.yourLine}. ${t("Happy to walk through it — we'd like this signed by", { class: "body" })} ${state.targetDate || t("month-end")}.`,
                                    t("Counter-position copied — send it, then note what came back.", { class: "body" })
                                )}>
                                {t("Send the counter-position →")}
                            </button>
                            <a class="gs4-link" href={hrefToAdvisorDeploy(deal?.id)}>{t("Loop in someone who's won this fight", { class: "body" })}</a>
                            <button type="button" class="gs4-link" onClick={() => (openFront.value = openFront.value === blocking ? null : blocking)}>{t("Work this front ▾")}</button>
                            <button type="button" class="gs4-link" onClick={() => patchFront(blocking, { status: "settled" })}>{t("Mark it settled")}</button>
                        </div>
                    </>
                ) : (
                    <div class="gs4-clear">
                        <h3>{t("Nothing is blocking.")}</h3>
                        <p>{t("Every front is settled — chase the countersignature, not another concession.", { class: "body" })}</p>
                    </div>
                )}

                {/* the positions ledger */}
                <div class="gs4-lh"><span>{t("Team")}</span><span>{t("All four fronts · their ask → your line", { class: "body" })}</span><span>{t("Status")}</span><span /></div>
                {ledgerFronts.map((id) => {
                    const f = state.fronts[id];
                    const open = openFront.value === id;
                    return (
                        <div class={`gs4-row${open ? " is-on" : ""}`} key={id}>
                            <button type="button" class="gs4-rowhit" onClick={() => (openFront.value = open ? null : id)}>
                                <span class="gs4-tag"><span class="gs4-dt" style={`background:${FRONT_META[id].dot}`} />{FRONT_META[id].label}</span>
                                <span class="gs4-thread">
                                    <span class="gs4-th">{f.theirAsk || FRONT_META[id].hint}</span>
                                    {f.theirAsk || f.yourLine ? (
                                        <span class="gs4-pos">
                                            <span class="gs4-them">{f.theirAsk || t("their ask")}</span>
                                            <span class="gs4-arr">→</span>
                                            <span class="gs4-you">{f.yourLine || t("your line")}</span>
                                        </span>
                                    ) : null}
                                </span>
                                <span class={`gs4-stat is-${f.status}`}>{STATUS_LABEL[f.status]}</span>
                                <span class="gs4-drill">{open ? t("close ▴") : t("open ▾")}</span>
                            </button>
                            {open ? (
                                <div class="gs4-dd">
                                    <div class="gs4-pl">{PLAYBOOK[id]}</div>
                                    <div class="gs4-ddgrid">
                                        <label><span>{t("Their ask")}</span>
                                            <input value={f.theirAsk} onInput={(e) => patchFront(id, { theirAsk: (e.currentTarget as HTMLInputElement).value })} /></label>
                                        <label><span>{t("Your line")}</span>
                                            <input value={f.yourLine} onInput={(e) => patchFront(id, { yourLine: (e.currentTarget as HTMLInputElement).value })} /></label>
                                        <label><span>{t("Status")}</span>
                                            <select value={f.status} onChange={(e) => patchFront(id, { status: (e.currentTarget as HTMLSelectElement).value as FrontStatus })}>
                                                {(["blocking", "clearing", "todo", "at_risk", "settled"] as const).map((sVal) => (
                                                    <option value={sVal} key={sVal}>{STATUS_LABEL[sVal]}</option>
                                                ))}
                                            </select></label>
                                    </div>
                                    {id === "security" ? (
                                        <div class="gs4-cov">
                                            <div class="gs4-ct">{t("Coverage · what your papers already answer", { class: "body" })}</div>
                                            <div class="gs4-covin">
                                                <label>{t("questions total")} <input type="number" value={cov.total || ""} onInput={(e) => patchGts({ coverage: { ...cov, total: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                                <label>{t("your papers answer")} <input type="number" value={cov.covered || ""} onInput={(e) => patchGts({ coverage: { ...cov, covered: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                                <label>{t("open with saved answers")} <input type="number" value={cov.saved || ""} onInput={(e) => patchGts({ coverage: { ...cov, saved: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                            </div>
                                            {cov.total > 0 ? (
                                                <>
                                                    <div class="gs4-covbar">
                                                        {cov.covered > 0 ? <span class="gs4-cg" style={`flex:${cov.covered}`}>{cov.covered} {t("covered")}</span> : null}
                                                        {covOpen > 0 ? <span class="gs4-ca" style={`flex:${covOpen}`}>{covOpen} {t("open")}</span> : null}
                                                    </div>
                                                    <div class="gs4-covby">
                                                        {t("Of the")} {covOpen} {t("left,")} <b>{Math.min(cov.saved, covOpen)}</b> {t("have saved answers you've used before;")} <b>{Math.max(0, covOpen - cov.saved)}</b> {t("need a word from engineering.")}
                                                    </div>
                                                </>
                                            ) : (
                                                <div class="gs4-covby">{t("Put the numbers in and the map shows how little is genuinely open.", { class: "body" })}</div>
                                            )}
                                        </div>
                                    ) : null}
                                    {id === "business" ? (
                                        <div class="gs4-plan">
                                            <div class="gs4-ct">{t("The plan-to-signed — dated steps, named owners, you both hold it", { class: "body" })}</div>
                                            <textarea value={state.planToSigned}
                                                placeholder={t("e.g. Security papers sent (you, today) · legal call (their counsel + you, Thu) · signature (CFO, the 28th)", { class: "body" })}
                                                onInput={(e) => patchGts({ planToSigned: (e.currentTarget as HTMLTextAreaElement).value })} />
                                            <button type="button" class="gs4-btn" disabled={!state.planToSigned.trim()}
                                                onClick={() => copyText(state.planToSigned, t("Plan copied — send it to your champion to co-own.", { class: "body" }))}>
                                                {t("Send the plan-to-signed →")}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}

                {/* we won't repeat this */}
                <div class="gs4-learn">
                    <span class="gs4-ll">{t("We won't repeat this")}</span>
                    <input value={learnDraft.value} placeholder={t("What did this run to signature teach you?", { class: "body" })}
                        onInput={(e) => (learnDraft.value = (e.currentTarget as HTMLInputElement).value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && learnDraft.value.trim()) { appendLearning(learnDraft.value); learnDraft.value = ""; toast(t("Kept — it feeds your loss patterns.", { class: "body" })); } }} />
                </div>
            </div>
            {toastMsg.value ? <div class="gs4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
