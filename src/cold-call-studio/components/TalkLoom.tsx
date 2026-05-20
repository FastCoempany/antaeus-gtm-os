import type { JSX } from "preact";
import {
    activeReply,
    activeThread,
    callStats,
    companyName,
    draft,
    logCall,
    patchDraft,
    selectedAccount,
    setActiveReply,
    setActiveThread
} from "../state";
import {
    findReply,
    findThread,
    nextThreadFor,
    THREADS
} from "../lib/threads";
import {
    loomScore,
    personalize,
    requiredCorrectionCopy,
    weakestThreadCopy
} from "../lib/personalize";
import { saveCallEntry } from "../lib/cloud-persistence";
import {
    OUTCOMES,
    OUTCOME_LABELS,
    type Outcome,
    type Thread,
    type ThreadId
} from "../lib/types";

/**
 * TalkLoom — Wave 3 implementation.
 *
 * Per canon §4.9: "the rep lives in one thread at a time." This
 * component renders the live 6-thread rail (one row per thread,
 * the active row highlighted), the loom-read aside (score +
 * current-pull narrative + weakest-thread coach + session count),
 * and the active-sheet trio (say-line / reply-strip / say-next
 * capture).
 *
 * Wave 4 will add the outcome-button row + notes textarea to the
 * capture panel below; Wave 5 will wire the cross-room handoff.
 */

interface ThreadRowProps {
    readonly thread: Thread;
    readonly index: number;
    readonly active: boolean;
    readonly onActivate: (id: ThreadId) => void;
}

function ThreadRow({
    thread,
    index,
    active,
    onActivate
}: ThreadRowProps): JSX.Element {
    return (
        <button
            type="button"
            class={`cc-thread cc-thread--${thread.id}${active ? " is-active" : ""}`}
            style={{ "--cc-thread-color": thread.color }}
            onClick={() => onActivate(thread.id)}
            data-cc-thread={thread.id}
        >
            <span class="cc-thread__num">
                {thread.num} · {thread.label}
            </span>
            <span class="cc-thread__body">
                <span class="cc-thread__title">{thread.title}</span>
                <span class="cc-thread__copy">{thread.copy}</span>
            </span>
            <span class="cc-thread__verb" aria-hidden="true">
                {thread.verb}
            </span>
            <span class="cc-thread__index" aria-hidden="true">
                {index + 1}.
            </span>
        </button>
    );
}

export function TalkLoom(): JSX.Element {
    const t = findThread(activeThread.value);
    const reply = findReply(t, activeReply.value);
    const next = nextThreadFor(reply);
    const account = selectedAccount.value;
    const hasAccount = account !== null;
    const stats = callStats.value;

    const ctx = {
        accountName: account?.name ?? "",
        topSignal: account?.topSignal ?? "",
        companyName: companyName.value
    };
    const d = draft.value;

    const score = loomScore({
        hasAccount,
        heat: account?.heat ?? 0,
        threadId: t.id,
        hasReply: reply !== null
    });

    const sayPersonalized = personalize(t.say, ctx);
    const replyPersonalized = reply ? personalize(reply.reply, ctx) : "";

    return (
        <section class="cc-loom" aria-label="Live call threads">
            {/*
              Cold Call Studio audit (2026-05): cc-loom__intro
              paragraph and cc-loom__law "Room law" block retired.
              Both were design-philosophy text Sarah doesn't have
              time to read during a live call. The thread rail
              itself + the say/reply/say-next sheet do the work.
            */}
            <div class="cc-loom__head">
                <p class="cc-loom__kicker">LIVE CALL THREADS</p>
                <h2 class="cc-loom__title">
                    Pull <span>one</span> thread at a time.
                </h2>
            </div>

            <div class="cc-loom__grid">
                <div class="cc-loom__stage" role="list" aria-label="Threads">
                    {THREADS.map((thread, i) => (
                        <ThreadRow
                            key={thread.id}
                            thread={thread}
                            index={i}
                            active={thread.id === t.id}
                            onActivate={setActiveThread}
                        />
                    ))}
                </div>

                <aside class="cc-loom__read" aria-label="Where the call stands">
                    <p class="cc-loom__read-kicker">WHERE THE CALL STANDS</p>
                    <p class="cc-loom__score" aria-label="Call score">
                        {score}
                    </p>
                    {/*
                      Program 6 / PR 10 — score headline line. Gives
                      the giant number interpretive weight without
                      re-introducing the retired "Room law" paragraph.
                    */}
                    <p class="cc-loom__score-headline">
                        Six threads are enough if each one carries
                        its own pressure.
                    </p>
                    <div class="cc-loom__read-block">
                        <p class="cc-loom__read-label">Current pull</p>
                        <p class="cc-loom__read-title">{t.title}</p>
                        <p class="cc-loom__read-copy">{t.copy}</p>
                    </div>
                    <div class="cc-loom__read-block">
                        <p class="cc-loom__read-label">Weakest thread</p>
                        <p class="cc-loom__read-title">
                            {weakestThreadCopy(hasAccount)}
                        </p>
                        {/*
                          Program 6 / PR 10 — required-correction
                          prescription pairs with the diagnosis above.
                          Per the picked-winner Variant 02 / Talk Loom
                          wireframe, the side aside surfaces both what's
                          loose AND the actual move — not just the
                          diagnosis.
                        */}
                        <p class="cc-loom__read-correction">
                            <span class="cc-loom__read-correction-label">
                                What to do about it
                            </span>
                            <span class="cc-loom__read-correction-copy">
                                {requiredCorrectionCopy(hasAccount, t.id)}
                            </span>
                        </p>
                    </div>
                    <div class="cc-loom__read-block">
                        <p class="cc-loom__read-label">Session count</p>
                        <p class="cc-loom__read-title">
                            {stats.total}{" "}
                            {stats.total === 1 ? "logged call" : "logged calls"}
                        </p>
                        <p class="cc-loom__read-copy">
                            {stats.meetings} meetings · {stats.callbacks}{" "}
                            callbacks · {stats.referrals} referrals
                        </p>
                    </div>
                </aside>
            </div>

            <div class="cc-loom__sheet">
                <article class="cc-say" aria-label="Say this now">
                    <p class="cc-say__kicker">SAY THIS NOW</p>
                    <p class="cc-say__line">{sayPersonalized}</p>
                    <p class="cc-say__coach">{t.coach}</p>
                </article>

                <article class="cc-replies" aria-label="Buyer might say">
                    <p class="cc-replies__kicker">BUYER MIGHT SAY</p>
                    <ul class="cc-replies__list">
                        {t.replies.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    class={`cc-reply${r.id === activeReply.value ? " is-active" : ""}`}
                                    onClick={() => setActiveReply(r.id)}
                                    data-cc-reply={r.id}
                                >
                                    <strong>{r.buyer}</strong>
                                    <small>{personalize(r.reply, ctx)}</small>
                                </button>
                            </li>
                        ))}
                    </ul>
                </article>

                <article class="cc-capture" aria-label="Say next">
                    <p class="cc-capture__kicker">SAY NEXT</p>
                    {reply ? (
                        <>
                            <p class="cc-capture__response">
                                {replyPersonalized}
                            </p>
                            <p class="cc-capture__next">
                                {next
                                    ? `Next thread: ${next.title}`
                                    : "Log the call and choose the next room."}
                            </p>
                            {next ? (
                                <button
                                    type="button"
                                    class="cc-capture__advance"
                                    onClick={() => setActiveThread(next.id)}
                                    data-cc-next={next.id}
                                >
                                    Pull next thread
                                </button>
                            ) : null}
                        </>
                    ) : (
                        <p class="cc-capture__empty">
                            Choose the buyer response that just happened.
                        </p>
                    )}

                    <label class="cc-notes">
                        <span class="cc-notes__label">
                            What actually happened
                        </span>
                        <textarea
                            class="cc-notes__field"
                            placeholder="Capture the real objection, signal, or next move."
                            value={d.notes}
                            onInput={(e) =>
                                patchDraft({
                                    notes: (
                                        e.currentTarget as HTMLTextAreaElement
                                    ).value
                                })
                            }
                        />
                    </label>

                    <div class="cc-outcomes" role="group" aria-label="Outcome">
                        {OUTCOMES.map((o: Outcome) => (
                            <button
                                key={o}
                                type="button"
                                class={`cc-outcome cc-outcome--${o}`}
                                onClick={() => {
                                    const entry = logCall(o);
                                    if (entry) void saveCallEntry(entry);
                                }}
                                data-cc-outcome={o}
                            >
                                {OUTCOME_LABELS[o]}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        class="cc-outcome cc-outcome--logged"
                        onClick={() => {
                            const entry = logCall("logged");
                            if (entry) void saveCallEntry(entry);
                        }}
                    >
                        Log this call
                    </button>
                </article>
            </div>
        </section>
    );
}
