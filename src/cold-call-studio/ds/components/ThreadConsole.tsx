import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, Kicker, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import {
    activeReply,
    activeThread,
    companyName,
    logCall,
    selectedAccount,
    setActiveReply,
    setActiveThread
} from "../../state";
import { findReply, findThread } from "../../lib/threads";
import { personalize } from "../../lib/personalize";
import { OUTCOMES, OUTCOME_LABELS, type Outcome, type ThreadId } from "../../lib/types";
import { outcomeTone, threadTone } from "../lib/adapters";

/**
 * ThreadConsole — the live thread, the dominant focal of the Live
 * Instrument (canon §4.9). The rep lives in one thread at a time: the
 * line to say now, the buyer-might-say branches, the recommended next
 * line for the branch they took, and the outcome lanes. Narrow pressure
 * thread by thread; never a script library.
 */

const flash: Signal<string> = signal("");
function showFlash(msg: string): void {
    flash.value = msg;
    setTimeout(() => (flash.value = ""), 2400);
}

export function ThreadConsole(): JSX.Element {
    const thread = findThread(activeThread.value);
    const account = selectedAccount.value;
    const ctx = {
        accountName: account?.name ?? "",
        topSignal: account?.topSignal ?? "",
        companyName: companyName.value
    };
    const reply = findReply(thread, activeReply.value);

    function onLog(outcome: Outcome): void {
        const entry = logCall(outcome);
        showFlash(
            entry
                ? outcome === "meeting_booked"
                    ? t("Meeting booked — a deal was created.", { class: "body" })
                    : t("Call logged.")
                : t("Pick an account first.", { class: "body" })
        );
    }

    return (
        <section class="ccd-console" aria-label={`Thread: ${thread.label}`}>
            <header class="ccd-console__head">
                <div class="ccd-console__kicker">
                    <span class="ccd-console__num">{thread.num}</span>
                    <Kicker>{thread.label}</Kicker>
                    <StatusChip label={thread.verb} tone={threadTone(thread.id)} />
                </div>
                <h2 class="ccd-console__title">{thread.title}</h2>
            </header>

            {/* The line to say now. */}
            <div class="ccd-say">
                <span class="ccd-say__mark">{t("SAY")}</span>
                <p class="ccd-say__line">{personalize(thread.say, ctx)}</p>
            </div>
            <p class="ccd-coach">{thread.coach}</p>

            {/* Buyer-might-say branches. */}
            <div class="ccd-branches">
                <Kicker>{t("IF THEY SAY")}</Kicker>
                <div class="ccd-branches__row">
                    {thread.replies.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            class={`ccd-branch${activeReply.value === r.id ? " is-active" : ""}`}
                            aria-pressed={activeReply.value === r.id}
                            onClick={() => setActiveReply(r.id)}
                        >
                            {r.buyer}
                        </button>
                    ))}
                </div>
            </div>

            {/* The recommended next line for the chosen branch. */}
            {reply ? (
                <div class="ccd-next">
                    <span class="ccd-next__mark">{t("SAY NEXT")}</span>
                    <p class="ccd-next__line">{personalize(reply.reply, ctx)}</p>
                    {reply.next && reply.next !== "post" ? (
                        <Button
                            variant="accent"
                            onClick={() => setActiveThread(reply.next as ThreadId)}
                        >
                            {t("Pull the next thread")}
                        </Button>
                    ) : null}
                </div>
            ) : null}

            {/* Outcome lanes. */}
            <footer class="ccd-outcomes">
                <Kicker>{t("LOG THE OUTCOME")}</Kicker>
                <div class="ccd-outcomes__row">
                    {OUTCOMES.map((o) => (
                        <button
                            key={o}
                            type="button"
                            class={`ccd-outcome ccd-outcome--${outcomeTone(o) ?? "neutral"}`}
                            onClick={() => onLog(o)}
                        >
                            {OUTCOME_LABELS[o]}
                        </button>
                    ))}
                </div>
                {flash.value ? <span class="ccd-outcomes__flash" role="status">{flash.value}</span> : null}
            </footer>
        </section>
    );
}
