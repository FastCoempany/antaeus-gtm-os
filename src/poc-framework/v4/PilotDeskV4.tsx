import type { JSX } from "preact";
import { signal, effect } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    draft,
    patchDraft,
    setDurationDays,
    saveDraft,
    activeProof,
    linkedDeal,
    linkedDeals
} from "../state";
import { hrefToDealWorkspace } from "../lib/handoff";
import {
    loadExtras,
    saveExtras,
    personId,
    circleTarget,
    readAdoption,
    EMPTY_EXTRAS,
    type PilotExtras,
    type CirclePerson,
    type PersonKind
} from "./lib/pilot";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./pilot-desk-v4.css";

/**
 * PilotDeskV4 (canon §4.15) — the guided pilot, wired to production
 * from the settled 2026-07-06 design. A hand-holding pilot GUIDE, not
 * a scorecard: the circle (who's hands-on, right-sized to the deal),
 * the who's-missing prompts on the open field, the collapsible Share
 * kit + Mutual pilot plan, and the five movements shown one at a time
 * — set it up → bring in the people → keep it moving (gated check-in
 * steps) → read the adoption → the write-up the champion carries.
 * Adoption is the success meter, never the outcome number. The shipped
 * spec engine (draft/save/quality/deal-sync) is reused unchanged; the
 * people operation is the additive pilot layer. §13: no proof / cast /
 * mold / forge on the face — plain words only.
 */

const extras = signal<PilotExtras>(EMPTY_EXTRAS);
const extrasAccount = signal<string>("");
const kitOpen = signal(false);
const openGap = signal<string | null>(null);
const gapName = signal("");
const addName = signal("");
const addRole = signal("");
const addKind = signal<PersonKind>("hands_on");
const actionsDraft = signal("");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let persistStarted = false;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** Boot the per-account extras + persistence loop. Called from main. */
export function bootPilotExtras(): void {
    const account = draft.value.account;
    extrasAccount.value = account;
    extras.value = loadExtras(account);
    if (!persistStarted) {
        persistStarted = true;
        let first = true;
        effect(() => {
            const e = extras.value;
            const acct = extrasAccount.value;
            if (first) {
                first = false;
                return;
            }
            if (acct.trim()) saveExtras(acct, e);
        });
        // Account switch (deal change) reloads that account's pilot.
        effect(() => {
            const acct = draft.value.account;
            if (acct !== extrasAccount.value) {
                extrasAccount.value = acct;
                extras.value = loadExtras(acct);
            }
        });
    }
}

function patchExtras(part: Partial<PilotExtras>): void {
    extras.value = { ...extras.value, ...part } as PilotExtras;
}

const KIND_LABEL: Record<PersonKind, string> = {
    hands_on: t("hands-on"),
    champion: t("your champion"),
    signoff: t("signs off")
};

interface KitItem {
    readonly key: string;
    readonly icon: string;
    readonly name: string;
    readonly sub: string;
    readonly verb: string;
    readonly template: (ctx: { account: string; champion: string }) => string;
}

const KIT: ReadonlyArray<KitItem> = [
    { key: "video", icon: "🎬", name: t("Getting-started video"), sub: t("5 minutes — send it first"), verb: t("Send →"), template: (c) => `Quick one — here's the 5-minute getting-started for the ${c.account} pilot. Watch it before you open the product and the first session makes sense right away.` },
    { key: "quickstart", icon: "📄", name: t("Quick-start per role"), sub: t("one page each"), verb: t("Send →"), template: (c) => `Attached: a one-page quick-start for your role in the ${c.account} pilot — the three things to do this week, nothing more.` },
    { key: "case", icon: "🏆", name: t("Case study"), sub: t("a company like theirs that ran this", { class: "body" }), verb: t("Send →"), template: (c) => `A team a lot like ${c.account} ran this same pilot — here's what they saw in the first two weeks, in their own words.` },
    { key: "whyyou", icon: "💬", name: t("\"Why you're in this pilot\" note", { class: "body" }), sub: t("context per person"), verb: t("Send →"), template: (c) => `You're in the ${c.account} pilot because you're closest to the work it's meant to help with. Your read in week one matters more than anyone's.` },
    { key: "champion", icon: "🤝", name: t("Champion kit"), sub: t("sell it when you're not there", { class: "body" }), verb: t("Send →"), template: (c) => `${c.champion} — here's the short kit for the moments I'm not in the room: what the pilot has to show, the three lines that answer the usual pushback, and what we agreed the results meeting will cover.` },
    { key: "kickoff", icon: "📣", name: t("Kickoff announcement"), sub: t("your champion posts it"), verb: t("Copy →"), template: (c) => `Team — we're piloting a new tool for the next two weeks at ${c.account}. It's a real trial, not a demo: use it in your day-to-day and say what's broken. Your honest read decides whether it stays.` },
    { key: "faq", icon: "❓", name: t("FAQ"), sub: t("answers for the internal skeptic", { class: "body" }), verb: t("Send →"), template: () => `The short FAQ: What happens to our data? Nothing leaves your environment. Does this replace our stack? No — it sits on top. What if it doesn't work? We stop at the date we agreed, no strings.` },
    { key: "reference", icon: "🔗", name: t("Reference-customer intro"), sub: t("connect a stuck user to a happy one", { class: "body" }), verb: t("Ask →"), template: () => `Would it help to talk to someone who uses this every day at a company like yours? Happy to make the intro — 15 minutes, no salespeople on the call.` },
    { key: "mutual", icon: "📋", name: t("Mutual pilot plan"), sub: t("you both own it — the goal, the steps, the results meeting", { class: "body" }), verb: t("Build together →"), template: (c) => `OUR PILOT PLAN — ${c.account}\nWhat it has to show: (we write this together)\nWho's hands-on: (their side + ours)\nCheck-ins: (dates we both hold)\nThe results meeting: (date + who's in the room)\nOwned by: ${c.champion} + me — we both sign.` }
];

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(text)
        .then(() => toast(done))
        .catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
}

function addPerson(name: string, role: string, kind: PersonKind): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const person: CirclePerson = {
        id: personId(),
        name: trimmed,
        role: role.trim(),
        kind,
        active: false
    };
    patchExtras({ circle: [...extras.value.circle, person] });
}

function toggleActive(id: string): void {
    patchExtras({
        circle: extras.value.circle.map((p) =>
            p.id === id && p.kind === "hands_on" ? { ...p, active: !p.active } : p
        )
    });
}

function removePerson(id: string): void {
    patchExtras({ circle: extras.value.circle.filter((p) => p.id !== id) });
}

export function PilotDeskV4(): JSX.Element {
    const d = draft.value;
    const proof = activeProof.value;
    const deal = linkedDeal.value;
    const deals = linkedDeals.value;
    const e = extras.value;
    const champion = e.circle.find((p) => p.kind === "champion") ?? null;
    const handsOn = e.circle.filter((p) => p.kind === "hands_on");
    const adoption = readAdoption(e);
    const target = circleTarget(deal?.value ?? 0);

    // Movement derivation — the guide shows one movement at a time.
    const m1Done = proof !== null && proof.successCriteria.trim().length > 0;
    const m2Done = handsOn.length >= 2 && champion !== null;
    const current: 1 | 2 | 3 | 4 | 5 = !m1Done ? 1 : !m2Done ? 2 : e.stage;

    // Day count from the saved spec.
    const dayOf = proof
        ? Math.max(1, Math.ceil((Date.now() - Date.parse(proof.updatedAt)) / 86_400_000))
        : 0;

    // The gated check-in steps (movement 3), generated from circle state.
    const firstInactive = handsOn.find((p) => !p.active) ?? null;
    const activeNames = handsOn.filter((p) => p.active).map((p) => p.name);
    const steps: ReadonlyArray<string> = [
        activeNames.length > 0
            ? `${t("Message")} ${activeNames.slice(0, 2).join(" + ")} ${t("a quick \"nice work\" — keeps your active users warm", { class: "body" })}`
            : `${t("Check in with")} ${champion?.name ?? t("your champion")} — ${t("who's actually opened it so far?", { class: "body" })}`,
        firstInactive
            ? `${t("Get")} ${firstInactive.name} ${t("to their first real action — send the 5-minute start", { class: "body" })}`
            : t("Everyone enrolled is using it — pull in the next person from their side.", { class: "body" }),
        `${t("Set the next check-in with")} ${champion?.name ?? t("your champion")}`
    ];

    const gaps = [
        {
            id: "it",
            q: t("Someone from IT"),
            why: t("Who controls the data the product reads from? The pilot stalls at the first permissions wall without them.", { class: "body" })
        },
        {
            id: "driver",
            q: t("A day-to-day driver on their side", { class: "body" }),
            why: t("Who keeps the pilot alive between your check-ins? Hands-on enough to use it, senior enough to nudge the others.", { class: "body" })
        }
    ].filter((g) => !e.closedGaps.includes(g.id));

    function logCheckIn(): void {
        const actions = Number(actionsDraft.value) || 0;
        patchExtras({
            checkins: [{ at: new Date().toISOString(), actions }, ...e.checkins],
            stepsDone: 0
        });
        actionsDraft.value = "";
        toast(t("Check-in logged — the desk sets up the next one.", { class: "body" }));
    }

    return (
        <div class="pk4">
            <div class="pk4-wrap">
                <div class="pk4-top">
                    <span class="pk4-bname">{t("Pilot Desk")}</span>
                    <span class="pk4-r">{t("the guided pilot")}</span>
                </div>

                <div class="pk4-where">
                    <span class="pk4-who">{d.account ? `${d.account} ${t("pilot")}` : t("Your pilot")}</span>
                    {deal ? (
                        <a class="pk4-deal" href={hrefToDealWorkspace(deal.id)}>◆ ${Math.round(deal.value / 1000)}k {t("deal")}</a>
                    ) : deals.length > 0 ? (
                        <select
                            class="pk4-dealsel"
                            value={d.linkedDealId}
                            onChange={(ev) => {
                                const id = (ev.currentTarget as HTMLSelectElement).value;
                                const picked = deals.find((x) => x.id === id);
                                patchDraft({ linkedDealId: id, account: picked?.accountName ?? d.account });
                            }}>
                            <option value="">{t("Tie it to a deal…")}</option>
                            {deals.map((x) => <option value={x.id} key={x.id}>{x.accountName}</option>)}
                        </select>
                    ) : null}
                    {proof && dayOf > 0 ? (
                        <span class="pk4-wk">{t("Day")} {Math.min(dayOf, d.durationDays)} {t("of")} {d.durationDays}</span>
                    ) : null}
                </div>

                {/* the circle */}
                {current >= 2 ? (
                    <div class="pk4-band">
                        <div class="pk4-bh">
                            <span class="pk4-bt">{t("The circle — who's hands-on with the pilot", { class: "body" })}</span>
                            <span class="pk4-br">
                                {e.circle.length} {t("in")} · {t("aim")} {target.min}–{target.max} {t("for this deal")}{e.circle.length >= target.min ? " ✓" : ""}
                            </span>
                        </div>
                        <div class="pk4-sizenote">{t("A small group is right for this kind of sale, not a crowd — the desk sizes it to your deal.", { class: "body" })}</div>
                        <div class="pk4-faces">
                            {e.circle.map((p) => (
                                <span class="pk4-face" key={p.id} onClick={() => toggleActive(p.id)} title={p.kind === "hands_on" ? t("Tap when they start using it", { class: "body" }) : ""}>
                                    <span class={`pk4-d ${p.kind !== "hands_on" ? "is-na" : p.active ? "is-on" : "is-off"}`} />
                                    {p.name}
                                    <span class="pk4-rl">{p.role ? `${p.role} · ` : ""}{p.kind === "hands_on" ? (p.active ? t("using it") : t("not started")) : KIND_LABEL[p.kind]}</span>
                                    <button type="button" class="pk4-fx" onClick={(ev) => { ev.stopPropagation(); removePerson(p.id); }}>×</button>
                                </span>
                            ))}
                            <span class="pk4-addface">
                                <input value={addName.value} placeholder={t("Name")} onInput={(ev) => (addName.value = (ev.currentTarget as HTMLInputElement).value)} />
                                <input value={addRole.value} placeholder={t("role")} class="pk4-rolein" onInput={(ev) => (addRole.value = (ev.currentTarget as HTMLInputElement).value)} />
                                <select value={addKind.value} onChange={(ev) => (addKind.value = (ev.currentTarget as HTMLSelectElement).value as PersonKind)}>
                                    <option value="hands_on">{t("hands-on")}</option>
                                    <option value="champion">{t("champion")}</option>
                                    <option value="signoff">{t("signs off")}</option>
                                </select>
                                <button type="button" disabled={!addName.value.trim()} onClick={() => { addPerson(addName.value, addRole.value, addKind.value); addName.value = ""; addRole.value = ""; }}>{t("Add")}</button>
                            </span>
                        </div>
                    </div>
                ) : null}

                {/* who's missing — on the open field */}
                {current >= 2 && gaps.length > 0 ? (
                    <div class="pk4-gaps">
                        <div class="pk4-gt">
                            {gaps.length === 1 ? t("One person the pilot still needs — it stalls without them.", { class: "body" }) : t("Two people the pilot still needs — it stalls without them.", { class: "body" })}
                        </div>
                        {gaps.map((g) => (
                            <div class={`pk4-grow${openGap.value === g.id ? " is-open" : ""}`} key={g.id}>
                                <div class="pk4-gtop">
                                    <span class="pk4-gq">{g.q}</span>
                                    <span class="pk4-gwhy">{g.why}</span>
                                    <button type="button" class="pk4-gfind" onClick={() => (openGap.value = openGap.value === g.id ? null : g.id)}>{t("Find them →")}</button>
                                </div>
                                {openGap.value === g.id ? (
                                    <div class="pk4-findbox">
                                        <div class="pk4-fl">{t("Know who it is? Add them.")}</div>
                                        <input value={gapName.value} placeholder={t("Name + role")} onInput={(ev) => (gapName.value = (ev.currentTarget as HTMLInputElement).value)} />
                                        <button type="button" disabled={!gapName.value.trim()}
                                            onClick={() => {
                                                addPerson(gapName.value, g.id === "it" ? "IT" : t("driver"), "hands_on");
                                                patchExtras({ closedGaps: [...extras.value.closedGaps, g.id] });
                                                gapName.value = "";
                                                openGap.value = null;
                                            }}>{t("Add")}</button>
                                        <button type="button" class="pk4-intro"
                                            onClick={() => copyText(
                                                `${champion?.name ?? t("Hey")} — ${t("for the pilot to hold up we need", { class: "body" })} ${g.q.toLowerCase()} ${t("in the loop. Who's the right person, and would you intro us?", { class: "body" })}`,
                                                t("Intro ask copied — send it to your champion.", { class: "body" })
                                            )}>
                                            {t("Don't know them? Ask your champion — copy the intro", { class: "body" })}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* share kit */}
                {current >= 2 ? (
                    <div class="pk4-band pk4-kit">
                        <button type="button" class="pk4-bh pk4-kithead" onClick={() => (kitOpen.value = !kitOpen.value)}>
                            <span class="pk4-bt">{t("Share kit — what to send the team so they actually use it", { class: "body" })}</span>
                            <span class="pk4-br is-blue">{KIT.length} {t("things to share")} {kitOpen.value ? "▴" : "▾"}</span>
                        </button>
                        {firstInactive ? (
                            <div class="pk4-knud">{t("Right now:")} <b>{firstInactive.name} {t("hasn't started.")}</b> {t("Send the 5-minute getting-started so your next check-in is about wins, not setup.", { class: "body" })}</div>
                        ) : null}
                        {kitOpen.value ? (
                            <div class="pk4-assets">
                                {KIT.map((item) => (
                                    <div class={`pk4-asset${item.key === "mutual" ? " is-mutual" : ""}${item.key === "video" && firstInactive ? " is-hot" : ""}`} key={item.key}>
                                        <span class="pk4-ic">{item.icon}</span>
                                        <span class="pk4-an">
                                            {item.name}
                                            <span class="pk4-asub">{item.sub}</span>
                                        </span>
                                        <button type="button" class="pk4-send"
                                            onClick={() => {
                                                copyText(item.template({ account: d.account || t("the account"), champion: champion?.name ?? t("your champion") }), t("Copied — paste it where the team lives.", { class: "body" }));
                                                if (!e.shared.includes(item.key)) patchExtras({ shared: [...e.shared, item.key] });
                                            }}>
                                            {e.shared.includes(item.key) ? t("Sent ✓") : item.verb}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {/* the five movements */}
                <div class="pk4-path">
                    {/* 1 — set it up */}
                    <div class={`pk4-mv${m1Done ? " is-done" : " is-now"}`}>
                        <span class="pk4-node">{m1Done ? "✓" : "1"}</span>
                        <div class="pk4-ttl">{t("Set it up")} <span class="pk4-tag">{m1Done ? t("in place") : t("you're here")}</span></div>
                        {m1Done && proof ? (
                            <div class="pk4-summ">{d.durationDays}-{t("day window")} · {proof.successCriteria.slice(0, 60)}{proof.readoutOwner ? ` · ${proof.readoutOwner} ${t("signs off")}` : ""}</div>
                        ) : (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Agree what the pilot has to show — before anyone touches the product.", { class: "body" })}</div>
                                <div class="pk4-pwhy">{t("A pilot without an agreed finish line runs forever and shows nothing. Write the three answers down with your champion", { class: "body" })} — <b>{t("these three answers become the Mutual pilot plan.", { class: "body" })}</b></div>
                                <div class="pk4-form">
                                    <label><span>{t("What it has to show")}</span>
                                        <input value={d.successCriteria} placeholder={t("e.g. Cut forecast-error in half on one team", { class: "body" })}
                                            onInput={(ev) => patchDraft({ successCriteria: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("Who signs off")}</span>
                                        <input value={d.readoutOwner} placeholder={t("e.g. Dana Wu, VP Ops")}
                                            onInput={(ev) => patchDraft({ readoutOwner: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("When you'll stop")}</span>
                                        <input value={d.boundaries} placeholder={t("e.g. Day 14, or earlier if nobody's using it", { class: "body" })}
                                            onInput={(ev) => patchDraft({ boundaries: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("Account")}</span>
                                        <input value={d.account} placeholder="e.g. Ramp"
                                            onInput={(ev) => patchDraft({ account: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <div class="pk4-window">
                                        <span>{t("The window")}</span>
                                        <button type="button" class={d.durationDays === 7 ? "is-on" : ""} onClick={() => setDurationDays(7)}>7 {t("days")}</button>
                                        <button type="button" class={d.durationDays === 14 ? "is-on" : ""} onClick={() => setDurationDays(14)}>14 {t("days")}</button>
                                    </div>
                                </div>
                                <button type="button" class="pk4-btn"
                                    disabled={!d.account.trim() || !d.successCriteria.trim()}
                                    onClick={() => { saveDraft(); toast(t("Pilot set — now bring in the people.", { class: "body" })); }}>
                                    {t("Lock the setup →")}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2 — bring in the people */}
                    <div class={`pk4-mv${m2Done ? " is-done" : m1Done ? " is-now" : ""}`}>
                        <span class="pk4-node">{m2Done ? "✓" : "2"}</span>
                        <div class="pk4-ttl">{t("Bring in the first people")} <span class="pk4-tag">{m2Done ? t("in place · keep widening ↑") : m1Done ? t("you're here") : t("ahead")}</span></div>
                        <div class="pk4-summ">{t("Your hands-on users + champion. The circle above is where you keep growing it.", { class: "body" })}</div>
                        {m1Done && !m2Done ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Get the right hands on it — usually not the buyer.", { class: "body" })}</div>
                                <div class="pk4-pwhy">{t("You need at least", { class: "body" })} <b>{t("two hands-on users and a champion")}</b> {t("before the pilot is real. Add them in the circle above — the who's-missing prompts point at the two people teams forget.", { class: "body" })}</div>
                            </div>
                        ) : null}
                    </div>

                    {/* 3 — keep it moving */}
                    <div class={`pk4-mv${current > 3 ? " is-done" : current === 3 && m2Done ? " is-now" : ""}`}>
                        <span class="pk4-node">{current > 3 ? "✓" : "3"}</span>
                        <div class="pk4-ttl">{t("Keep the pilot moving")} <span class="pk4-tag">{current > 3 ? t("moving") : current === 3 && m2Done ? t("you're here") : t("ahead")}</span></div>
                        <div class="pk4-summ">{t("Hold their hand between check-ins — is the product getting used, and who else can you pull in?", { class: "body" })}</div>
                        {current === 3 && m2Done ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">
                                    {firstInactive
                                        ? `${t("Get")} ${firstInactive.name} ${t("using the product before your next check-in.", { class: "body" })}`
                                        : t("Everyone's in — widen the circle and hold the pace.", { class: "body" })}
                                </div>
                                <div class="pk4-adopt">
                                    <div><div class="pk4-cl">{t("Actually using it")}</div><div class={`pk4-cv${adoption.using < adoption.enrolled ? " is-warn" : " is-good"}`}>{adoption.using} {t("of")} {adoption.enrolled} {t("enrolled")}</div></div>
                                    <div><div class="pk4-cl">{t("Actions taken")}</div><div class={`pk4-cv${adoption.actionsLast > 0 ? " is-good" : ""}`}>{adoption.actionsLast} {t("last check-in")}</div></div>
                                </div>
                                <div class="pk4-src">{t("how we know: from your product's usage — or mark it by hand on the circle above", { class: "body" })}</div>
                                <ul class="pk4-steps">
                                    {steps.map((s, i) => {
                                        const done = i < e.stepsDone;
                                        const locked = i > e.stepsDone;
                                        return (
                                            <li class={`${done ? "is-done" : ""}${locked ? " is-lock" : ""}`} key={s}>
                                                <button type="button" class="pk4-ck" disabled={locked}
                                                    onClick={() => patchExtras({ stepsDone: done ? i : i + 1 })}>{done ? "✓" : ""}</button>
                                                <span class="pk4-tt">{s}{locked ? <span class="pk4-lockhint"> — {t("finish the step above first")}</span> : null}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div class="pk4-logrow">
                                    <input value={actionsDraft.value} type="number" placeholder={t("actions this check-in")}
                                        onInput={(ev) => (actionsDraft.value = (ev.currentTarget as HTMLInputElement).value)} />
                                    <button type="button" class="pk4-btn" onClick={logCheckIn}>{t("Log this check-in →")}</button>
                                    {e.checkins.length > 0 ? <span class="pk4-ccount">{e.checkins.length} {t("logged")}</span> : null}
                                    {e.checkins.length > 0 ? (
                                        <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 4 })}>{t("Read the adoption →")}</button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* 4 — read the adoption */}
                    <div class={`pk4-mv${current > 4 ? " is-done" : current === 4 ? " is-now" : ""}`}>
                        <span class="pk4-node">{current > 4 ? "✓" : "4"}</span>
                        <div class="pk4-ttl">{t("Read the adoption")} <span class="pk4-tag">{current > 4 ? t("read") : current === 4 ? t("you're here") : t("ahead")}</span></div>
                        <div class="pk4-summ">{t("Are enough of the right people actually using the product day-to-day to give it a fair shot?", { class: "body" })}</div>
                        {current === 4 ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">
                                    {adoption.band === "ready"
                                        ? t("Ready — the right people are using it, and it's producing.", { class: "body" })
                                        : adoption.band === "almost"
                                          ? t("Almost — usage is real but thin. One more active person changes the read.", { class: "body" })
                                          : t("Too thin to hand over — the pilot hasn't had a fair shot yet.", { class: "body" })}
                                </div>
                                <div class="pk4-adopt">
                                    <div><div class="pk4-cl">{t("Actually using it")}</div><div class={`pk4-cv${adoption.band === "ready" ? " is-good" : " is-warn"}`}>{adoption.using} {t("of")} {adoption.enrolled}</div></div>
                                    <div><div class="pk4-cl">{t("Check-ins held")}</div><div class="pk4-cv">{e.checkins.length}</div></div>
                                </div>
                                <div class="pk4-pwhy">{t("The outcome number can lag the window — adoption is the honest meter. If the right hands are on it and it's getting used, the pilot did its job.", { class: "body" })}</div>
                                <div class="pk4-logrow">
                                    <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 3 })}>{t("← Keep it moving")}</button>
                                    <button type="button" class="pk4-btn" onClick={() => patchExtras({ stage: 5 })}>{t("Write it up →")}</button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* 5 — the write-up */}
                    <div class={`pk4-mv${current === 5 ? " is-now" : ""}`}>
                        <span class="pk4-node">5</span>
                        <div class="pk4-ttl">{t("Write up what it showed, for your champion to carry", { class: "body" })} <span class="pk4-tag">{current === 5 ? t("you're here") : t("ahead")}</span></div>
                        <div class="pk4-summ">{t("A short write-up your champion can take to their boss and defend on their own — without you in the room.", { class: "body" })}</div>
                        {current === 5 ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Write it so")} {champion?.name ?? t("your champion")} {t("can defend it alone.", { class: "body" })}</div>
                                <textarea
                                    class="pk4-writeup"
                                    value={e.writeup}
                                    placeholder={t("What we set out to show · who used it and how much · what it showed · what we'd do next. Four short paragraphs — their boss reads it in two minutes.", { class: "body" })}
                                    onInput={(ev) => patchExtras({ writeup: (ev.currentTarget as HTMLTextAreaElement).value })}
                                />
                                <div class="pk4-logrow">
                                    <button type="button" class="pk4-btn" disabled={!e.writeup.trim()}
                                        onClick={() => copyText(e.writeup, t("Copied — send it to your champion before the results meeting.", { class: "body" }))}>
                                        {t("Copy for the results meeting", { class: "body" })}
                                    </button>
                                    <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 4 })}>{t("← Back to the read")}</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {toastMsg.value ? <div class="pk4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
        </div>
    );
}
