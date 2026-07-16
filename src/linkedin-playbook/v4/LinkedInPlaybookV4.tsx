import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    actions,
    stats,
    bestIcp,
    hottestAccount,
    latestTouch,
    patchDraft,
    setDraftActionType,
    setActiveCue,
    logCue
} from "../state";
import { CUES, findCue } from "../lib/cues";
import { deriveMotion } from "../lib/motion";
import { cueScript, METHOD_TEMPLATES } from "../lib/scripts";
import { hrefToSignalConsole } from "../lib/handoff";
import { saveAction } from "../lib/cloud-persistence";
import type { ActionEntry, CueIndex } from "../lib/types";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./linkedin-playbook-v4.css";

/**
 * LinkedInPlaybookV4 (canon §4.10) — "the one move", wired to
 * production from the settled 2026-07-06 design. LinkedIn as
 * disciplined air cover: one account at a time (the hottest already
 * lit in Signal Console / Outbound), the 5-cue ladder as a
 * where-you-are spine, the single next public-first move with a
 * ready-to-paste line, and a quiet queue of the other accounts
 * you're warming. The cue ladder, motion engine, scripts, action log,
 * and channel stats are reused unchanged.
 */

const focusOverride = signal<string | null>(null);
const templatesOpen = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** The rungs said plainly (§13) — same ladder, zero decode. */
const RUNG_LABELS: ReadonlyArray<string> = [
    t("Find their post"),
    t("Leave a comment"),
    t("Send the request"),
    t("Give something useful"),
    t("Ask for 15 min")
];

/** Per-rung position reads — where you are with this account. */
const POSITION_READS: ReadonlyArray<string> = [
    t("They don't know your name yet. Warm it before you ask for anything.", { class: "body" }),
    t("They've seen you once. One useful comment makes you familiar.", { class: "body" }),
    t("Your name is warm — the request reads as a continuation, not an interruption.", { class: "body" }),
    t("You're connected. Send something useful before any ask.", { class: "body" }),
    t("You've given first. The 15-minute ask is warranted now.", { class: "body" })
];

const POSITION_WORD: ReadonlyArray<string> = [
    t("start"),
    t("second rung"),
    t("third rung"),
    t("fourth rung"),
    t("last rung")
];

/** Map a logged cueLabel back to its rung (legacy names included). */
const LEGACY_CUE_NAMES: Readonly<Record<string, CueIndex>> = {
    "Give proof before asking": 3,
    "Ask only when earned": 4
};

function cueIndexForEntry(entry: ActionEntry): CueIndex | null {
    const byName = CUES.find((c) => c.name === entry.cueLabel);
    if (byName) return byName.index;
    const legacy = LEGACY_CUE_NAMES[entry.cueLabel];
    return legacy ?? null;
}

interface WarmingAccount {
    readonly name: string;
    readonly done: ReadonlySet<CueIndex>;
    readonly here: CueIndex;
}

function warmingFor(list: ReadonlyArray<ActionEntry>): ReadonlyArray<WarmingAccount> {
    const byName = new Map<string, { name: string; done: Set<CueIndex> }>();
    for (const entry of list) {
        const name = entry.accountName.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (!byName.has(key)) byName.set(key, { name, done: new Set() });
        const idx = cueIndexForEntry(entry);
        if (idx !== null) byName.get(key)!.done.add(idx);
    }
    return [...byName.values()].map((a) => {
        let here: CueIndex = 0;
        while (here < 4 && a.done.has(here)) here = (here + 1) as CueIndex;
        return { name: a.name, done: a.done, here };
    });
}

export function LinkedInPlaybookV4(): JSX.Element {
    const log = actions.value;
    const st = stats.value;
    const hottest = hottestAccount.value;
    const warming = warmingFor(log);

    // The focused account: an explicit pick wins; else the hottest; else
    // the first account already being warmed.
    const focusName =
        focusOverride.value ?? hottest?.name ?? warming[0]?.name ?? null;
    const focusWarm =
        focusName != null
            ? warming.find((w) => w.name.toLowerCase() === focusName.toLowerCase()) ?? null
            : null;
    const here: CueIndex = focusWarm?.here ?? 0;
    const done = focusWarm?.done ?? new Set<CueIndex>();
    const cue = findCue(here);

    const motion = deriveMotion({
        icp: bestIcp.value,
        hottestAccount:
            focusName != null
                ? { name: focusName, heat: focusName.toLowerCase() === hottest?.name.toLowerCase() ? hottest.heat : 0 }
                : null,
        latestTouch: latestTouch.value,
        stats: st
    });
    const script = cueScript(cue, motion);
    const others = warming.filter(
        (w) => focusName == null || w.name.toLowerCase() !== focusName.toLowerCase()
    );
    const heat =
        focusName != null && focusName.toLowerCase() === hottest?.name.toLowerCase()
            ? hottest?.heat ?? 0
            : 0;

    function markDone(): void {
        if (!focusName) return;
        patchDraft({ accountName: focusName, contactName: "" });
        setDraftActionType(cue.action);
        setActiveCue(here);
        const entry = logCue();
        setActiveCue(null);
        if (entry) {
            // Cloud write too — a local-only log is clobbered when
            // cloud replaces local on boot.
            void saveAction(entry);
            if (here === 4) {
                toast(`${t("Logged on")} ${focusName} — ${t("the ladder's run. The next touch belongs in Outbound.", { class: "body" })}`);
            } else {
                toast(`${t("Logged on")} ${focusName} — ${t("next:")} ${RUNG_LABELS[here + 1]}.`);
            }
        }
    }

    function copyScript(): void {
        if (!navigator.clipboard?.writeText) {
            toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
            return;
        }
        navigator.clipboard
            .writeText(script)
            .then(() => toast(t("Copied.")))
            .catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
    }

    return (
        <div class="lp4">
            <div class="lp4-wrap">
                <div class="lp4-top">
                    <span class="lp4-bname">{t("LinkedIn Playbook")}</span>
                    <span class="lp4-r">{t("air cover · never the opening scene", { class: "body" })}</span>
                </div>

                <h1 class="lp4-thesis">
                    {t("LinkedIn warms your name so your calls and emails land.", { class: "body" })}{" "}
                    <span class="lp4-q">{t("Not where you pitch — where they start to know you.", { class: "body" })}</span>
                </h1>
                <p class="lp4-sub">{t("One account at a time. Here's your move on the one that's hottest right now.", { class: "body" })}</p>

                {focusName ? (
                    <div class="lp4-move">
                        <div class="lp4-hd">
                            <span class="lp4-who">{t("Your move on")} <b>{focusName}</b></span>
                            <a class="lp4-src" href={hrefToSignalConsole(focusName)}>◆ {t("from Signal Console")}</a>
                            {heat > 0 ? <span class="lp4-heat">{heat > 75 ? t("HOT") : t("WARM")} · {heat}</span> : null}
                        </div>
                        <div class="lp4-spine">
                            {RUNG_LABELS.map((label, i) => (
                                <div class={`lp4-rung${done.has(i as CueIndex) ? " is-done" : ""}${i === here ? " is-here" : ""}`} key={label}>
                                    <span class="lp4-dot" />
                                    <span class="lp4-rl">{label}</span>
                                </div>
                            ))}
                        </div>
                        <div class="lp4-pos">
                            {t("You're at the")} <b>{POSITION_WORD[here]}</b> {t("with")} {focusName} — {POSITION_READS[here]}
                        </div>
                        <div class="lp4-act">
                            <div class="lp4-cue">{cue.console}</div>
                            <div class="lp4-why">
                                {t("Why now:")} <b>{motion.whyNow}</b>
                            </div>
                            <div class="lp4-script">
                                <div class="lp4-sl">
                                    {here <= 1 ? t("what to comment") : here === 2 ? t("the connection note") : here === 3 ? t("what to send") : t("the ask")}
                                    <span class="lp4-slq">· {t("say one useful thing, then leave — no pitch", { class: "body" })}</span>
                                </div>
                                <div class="lp4-sbody">{script}</div>
                            </div>
                            <div class="lp4-row">
                                <button type="button" class="lp4-btn is-pri" onClick={markDone}>{t("Mark it done →")}</button>
                                <button type="button" class="lp4-btn" onClick={copyScript}>{t("Copy the line")}</button>
                                <span class="lp4-win">
                                    {t("One good touch today. That's the whole job.", { class: "body" })} <b>{t("The ask comes later.")}</b>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div class="lp4-empty">
                        <h3>{t("No account is warm yet.")}</h3>
                        <p>{t("Get accounts lit in Signal Console first — this room warms the ones already worth your calls and emails.", { class: "body" })}</p>
                        <a class="lp4-btn" href="/signal-console/?returnTo=%2Flinkedin-playbook%2F&returnLabel=LinkedIn+Playbook&fromMode=room&fromSurface=linkedin-playbook">{t("Open Signal Console →")}</a>
                    </div>
                )}

                {others.length > 0 ? (
                    <div class="lp4-next">
                        <div class="lp4-nh">{t("Other accounts you're warming")}</div>
                        {others.slice(0, 6).map((w) => (
                            <button type="button" class="lp4-acct" key={w.name} onClick={() => (focusOverride.value = w.name)}>
                                <span class="lp4-nm">{w.name}</span>
                                <span class="lp4-mini">
                                    {RUNG_LABELS.map((_, i) => (
                                        <i class={w.done.has(i as CueIndex) ? "is-d" : i === w.here ? "is-h" : ""} key={i} />
                                    ))}
                                </span>
                                <span class="lp4-nx">{RUNG_LABELS[w.here]} →</span>
                            </button>
                        ))}
                    </div>
                ) : null}

                <div class="lp4-refs">
                    <button type="button" class="lp4-drawer" onClick={() => (templatesOpen.value = !templatesOpen.value)}>
                        {templatesOpen.value ? "⌵ " : "› "}{t("Message templates (connect · comment · give · ask)", { class: "body" })}
                    </button>
                    <span class="lp4-score">
                        {t("So far:")} <b>{st.total}</b> {t("touches")} · <b>{st.accepted}</b> {t("accepted")} · <b>{st.replies}</b> {t("replied")}
                    </span>
                </div>
                {templatesOpen.value ? (
                    <div class="lp4-templates">
                        {METHOD_TEMPLATES.map((tpl) => (
                            <div class="lp4-tpl" key={tpl.heading}>
                                <div class="lp4-th">{tpl.heading}</div>
                                <div class="lp4-tb">{tpl.body}</div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
            {toastMsg.value ? <div class="lp4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
