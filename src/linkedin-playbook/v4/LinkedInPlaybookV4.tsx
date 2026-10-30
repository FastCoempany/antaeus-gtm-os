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
 * LinkedIn Playbook treats LinkedIn as a supporting outreach channel. It
 * uses recorded LinkedIn actions plus Signal Console/outbound context to
 * recommend one next action without inferring buyer trust or intent.
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

const STEP_LABELS: ReadonlyArray<string> = [
    t("Review a post"),
    t("Leave a comment"),
    t("Send connection request"),
    t("Send useful information"),
    t("Ask for 15 minutes")
];

const POSITION_READS: ReadonlyArray<string> = [
    t("No LinkedIn action in this sequence is logged for the account yet.", { class: "body" }),
    t("The initial public-review step is logged. The next step is a substantive public comment when one is relevant.", { class: "body" }),
    t("A public interaction is logged. The next step in this sequence is a connection request tied to real context.", { class: "body" }),
    t("A connection request is logged. Send useful information only when it addresses a real topic or question.", { class: "body" }),
    t("The useful-information step is logged. A short meeting request is the final step when there is a specific topic to discuss.", { class: "body" })
];

const POSITION_WORD: ReadonlyArray<string> = [
    t("step 1"),
    t("step 2"),
    t("step 3"),
    t("step 4"),
    t("step 5")
];

/** Map a logged cueLabel back to its sequence position, including legacy names. */
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

interface AccountSequenceState {
    readonly name: string;
    readonly done: ReadonlySet<CueIndex>;
    readonly here: CueIndex;
}

function sequenceStateFor(list: ReadonlyArray<ActionEntry>): ReadonlyArray<AccountSequenceState> {
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
    const highestPriority = hottestAccount.value;
    const accountStates = sequenceStateFor(log);

    const focusName =
        focusOverride.value ?? highestPriority?.name ?? accountStates[0]?.name ?? null;
    const focusState =
        focusName != null
            ? accountStates.find((w) => w.name.toLowerCase() === focusName.toLowerCase()) ?? null
            : null;
    const here: CueIndex = focusState?.here ?? 0;
    const done = focusState?.done ?? new Set<CueIndex>();
    const cue = findCue(here);

    const motion = deriveMotion({
        icp: bestIcp.value,
        hottestAccount:
            focusName != null
                ? { name: focusName, heat: focusName.toLowerCase() === highestPriority?.name.toLowerCase() ? highestPriority.heat : 0 }
                : null,
        latestTouch: latestTouch.value,
        stats: st
    });
    const script = cueScript(cue, motion);
    const others = accountStates.filter(
        (w) => focusName == null || w.name.toLowerCase() !== focusName.toLowerCase()
    );
    const priorityScore =
        focusName != null && focusName.toLowerCase() === highestPriority?.name.toLowerCase()
            ? highestPriority?.heat ?? 0
            : 0;

    function markDone(): void {
        if (!focusName) return;
        patchDraft({ accountName: focusName, contactName: "" });
        setDraftActionType(cue.action);
        setActiveCue(here);
        const entry = logCue();
        setActiveCue(null);
        if (entry) {
            void saveAction(entry);
            if (here === 4) {
                toast(`${t("Logged on")} ${focusName}. ${t("The five-step LinkedIn sequence is complete; continue the account plan in the appropriate outreach room.", { class: "body" })}`);
            } else {
                toast(`${t("Logged on")} ${focusName}. ${t("Next:")} ${STEP_LABELS[here + 1]}.`);
            }
        }
    }

    function copyScript(): void {
        if (!navigator.clipboard?.writeText) {
            toast(t("Copying is not available here. Select the text manually.", { class: "body" }));
            return;
        }
        navigator.clipboard
            .writeText(script)
            .then(() => toast(t("Copied.")))
            .catch(() => toast(t("Could not copy. Select the text manually.", { class: "body" })));
    }

    return (
        <div class="lp4">
            <div class="lp4-wrap">
                <div class="lp4-top">
                    <span class="lp4-bname">{t("LinkedIn Playbook")}</span>
                    <span class="lp4-r">{t("supporting outreach · not the primary channel", { class: "body" })}</span>
                </div>

                <h1 class="lp4-thesis">
                    {t("Use LinkedIn to build familiarity with a contact before or alongside calls and email.", { class: "body" })}
                </h1>
                <p class="lp4-sub">{t("Current recommended LinkedIn action for the highest-priority available account.", { class: "body" })}</p>

                {focusName ? (
                    <div class="lp4-move">
                        <div class="lp4-hd">
                            <span class="lp4-who">{t("Recommended action for")} <b>{focusName}</b></span>
                            <a class="lp4-src" href={hrefToSignalConsole(focusName)}>◆ {t("Signal Console")}</a>
                            {priorityScore > 0 ? <span class="lp4-heat">{t("PRIORITY")} · {priorityScore}</span> : null}
                        </div>
                        <div class="lp4-spine">
                            {STEP_LABELS.map((label, i) => (
                                <div class={`lp4-rung${done.has(i as CueIndex) ? " is-done" : ""}${i === here ? " is-here" : ""}`} key={label}>
                                    <span class="lp4-dot" />
                                    <span class="lp4-rl">{label}</span>
                                </div>
                            ))}
                        </div>
                        <div class="lp4-pos">
                            <b>{POSITION_WORD[here]}</b> {t("for")} {focusName}: {POSITION_READS[here]}
                        </div>
                        <div class="lp4-act">
                            <div class="lp4-cue">{cue.console}</div>
                            <div class="lp4-why">
                                {t("Why this action:")} <b>{motion.whyNow}</b>
                            </div>
                            <div class="lp4-script">
                                <div class="lp4-sl">
                                    {here <= 1 ? t("Suggested public response") : here === 2 ? t("Suggested connection note") : here === 3 ? t("Suggested message") : t("Suggested meeting request")}
                                    <span class="lp4-slq"> · {t("Use only details that are true for this account and contact.", { class: "body" })}</span>
                                </div>
                                <div class="lp4-sbody">{script}</div>
                            </div>
                            <div class="lp4-row">
                                <button type="button" class="lp4-btn is-pri" onClick={markDone}>{t("Mark action complete →")}</button>
                                <button type="button" class="lp4-btn" onClick={copyScript}>{t("Copy suggested text")}</button>
                                <span class="lp4-win">
                                    {here < 4
                                        ? t("Complete the relevant step before moving to the next one.", { class: "body" })
                                        : t("The meeting request should reference a specific prior topic or interaction.", { class: "body" })}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div class="lp4-empty">
                        <h3>{t("No account is available for a LinkedIn action yet.", { class: "body" })}</h3>
                        <p>{t("Add or prioritize accounts in Signal Console, or record an outbound touch, then return here for a LinkedIn recommendation.", { class: "body" })}</p>
                        <a class="lp4-btn" href="/signal-console/?returnTo=%2Flinkedin-playbook%2F&returnLabel=LinkedIn+Playbook&fromMode=room&fromSurface=linkedin-playbook">{t("Open Signal Console →")}</a>
                    </div>
                )}

                {others.length > 0 ? (
                    <div class="lp4-next">
                        <div class="lp4-nh">{t("Other accounts with LinkedIn actions")}</div>
                        {others.slice(0, 6).map((w) => (
                            <button type="button" class="lp4-acct" key={w.name} onClick={() => (focusOverride.value = w.name)}>
                                <span class="lp4-nm">{w.name}</span>
                                <span class="lp4-mini">
                                    {STEP_LABELS.map((_, i) => (
                                        <i class={w.done.has(i as CueIndex) ? "is-d" : i === w.here ? "is-h" : ""} key={i} />
                                    ))}
                                </span>
                                <span class="lp4-nx">{STEP_LABELS[w.here]} →</span>
                            </button>
                        ))}
                    </div>
                ) : null}

                <div class="lp4-refs">
                    <button type="button" class="lp4-drawer" onClick={() => (templatesOpen.value = !templatesOpen.value)}>
                        {templatesOpen.value ? "⌵ " : "› "}{t("Message templates (connect · comment · resource · ask)", { class: "body" })}
                    </button>
                    <span class="lp4-score">
                        {t("Recorded:")} <b>{st.total}</b> {t("actions")} · <b>{st.accepted}</b> {t("connections accepted")} · <b>{st.replies}</b> {t("replies")}
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
