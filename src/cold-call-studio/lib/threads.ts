import type { Thread, ThreadId } from "./types";

/**
 * Phase 4 / Room 7 Wave 2 — thread spine.
 *
 * Faithful TypeScript port of the legacy `THREADS` array
 * (`app/cold-call-studio/index.html` lines 97-127). Six threads,
 * each with three buyer-response branches. The order is canonical
 * per canon §4.9 (Prep → Opener → Pressure → Proof → Ask → Exit).
 *
 * Reply `next` values target a `ThreadId` (advances the active
 * thread when chosen) or the literal "post" (signals "log the
 * call and choose the next room"). Wave 3 wires the navigation;
 * Wave 4 reads the threads to compose the call log entry.
 *
 * This module is data-only — no signals, no DOM. Helpers are pure.
 */

export const THREADS: ReadonlyArray<Thread> = [
    {
        id: "prep",
        num: "01",
        label: "Prep thread",
        verb: "hold",
        color: "var(--cc-orange)",
        title: "Pick one real account before dialing.",
        copy: "The call cannot carry generic market language.",
        say: "Before you dial, name the account, the human, and the one pressure that makes this call worth interrupting.",
        coach: "No account means no call.",
        replies: [
            {
                id: "ready",
                buyer: "Account and pressure are clear.",
                reply: "Good. Move into the permission opener and keep the first line narrow.",
                next: "opener"
            },
            {
                id: "not-ready",
                buyer: "Still vague.",
                reply: "Do not dial yet. Open Signal Console and pick the account with the most concrete pressure.",
                next: "prep"
            }
        ]
    },
    {
        id: "opener",
        num: "02",
        label: "Opening thread",
        verb: "pull",
        color: "var(--cc-blue)",
        title: "Earn permission in the first breath.",
        copy: "Own the interruption and give the buyer control.",
        say: "I know I am interrupting. Give me 20 seconds and you can decide if this is worth continuing.",
        coach: "Do not explain the company yet. The first win is permission.",
        replies: [
            {
                id: "busy",
                buyer: "I am busy.",
                reply: "Fair. The short version: I am calling because [account] appears to be dealing with [pressure]. If I am wrong, I will disappear. If I am right, who owns it?",
                next: "pressure"
            },
            {
                id: "who",
                buyer: "Who is this?",
                reply: "[Your name] with [company]. I am calling about [pressure] at [account], not to give you a product pitch. Worth 20 seconds?",
                next: "pressure"
            },
            {
                id: "no-sales",
                buyer: "No sales calls.",
                reply: "Understood. I will skip the sales part. Is [pressure] already handled internally, or is it still creating noise?",
                next: "pressure"
            }
        ]
    },
    {
        id: "pressure",
        num: "03",
        label: "Pressure thread",
        verb: "tighten",
        color: "var(--cc-green)",
        title: "Make the reason concrete.",
        copy: "The call turns when the buyer hears their world, not your category.",
        say: "The reason I called is that [pressure] usually shows up as wasted time, unclear ownership, or delayed revenue before it shows up as a tool problem. Which of those is closest?",
        coach: "Force a concrete lane. Do not ask a big discovery question yet.",
        replies: [
            {
                id: "pain",
                buyer: "It is definitely costing time.",
                reply: "That is the useful starting point. Roughly where does that time go: triage, handoffs, rework, or waiting on decisions?",
                next: "proof"
            },
            {
                id: "soft",
                buyer: "It is not terrible.",
                reply: "That may be true. Is it harmless, or is it one of those things that stays tolerable until volume changes?",
                next: "proof"
            },
            {
                id: "none",
                buyer: "Not a problem.",
                reply: "Good to know. I will not force it. If that changes after [trigger], I am easy to find. For now I will step back.",
                next: "exit"
            }
        ]
    },
    {
        id: "proof",
        num: "04",
        label: "Proof thread",
        verb: "trade",
        color: "var(--cc-orange)",
        title: "Trade one proof point for one admission.",
        copy: "Proof should create permission, not become a deck.",
        say: "The pattern we usually see is [proof point]. When that shows up, teams either absorb it manually or redesign the workflow. Which is happening there?",
        coach: "One proof point. Then stop.",
        replies: [
            {
                id: "manual",
                buyer: "We are absorbing it manually.",
                reply: "That is exactly where this becomes expensive. If I showed you a way to reduce that manual load without replacing the whole stack, would that be worth a short working session?",
                next: "ask"
            },
            {
                id: "vendor",
                buyer: "We already have a vendor.",
                reply: "Good. I am not assuming replacement. The question is whether the current vendor removes the manual load or just gives it a place to live.",
                next: "ask"
            },
            {
                id: "skeptical",
                buyer: "I do not believe that.",
                reply: "Fair. I would not either from a cold call. Let me make the claim smaller: can I send the benchmark and you tell me if it maps to your world?",
                next: "exit"
            }
        ]
    },
    {
        id: "ask",
        num: "05",
        label: "Ask thread",
        verb: "lock",
        color: "var(--cc-green)",
        title: "Ask for the smallest real next move.",
        copy: "The ask should match what the call earned.",
        say: "It sounds specific enough to look at together. Would it make sense to spend 20 minutes this week mapping whether the same pattern applies to [account]?",
        coach: "Ask for time only after pressure and proof are both alive.",
        replies: [
            {
                id: "yes",
                buyer: "Yes.",
                reply: "Good. I will send a calendar hold with a tight agenda: the pressure, where it shows up, and whether there is enough value to keep going.",
                next: "post"
            },
            {
                id: "send",
                buyer: "Send me something.",
                reply: "I can. I will send one short benchmark, not a brochure. What day should I follow up if it is relevant?",
                next: "post"
            },
            {
                id: "not-now",
                buyer: "Not now.",
                reply: "Understood. Is this a bad quarter, wrong owner, or just not a priority?",
                next: "exit"
            }
        ]
    },
    {
        id: "exit",
        num: "06",
        label: "Exit thread",
        verb: "release",
        color: "var(--cc-red)",
        title: "Leave the room cleanly.",
        copy: "A clean exit keeps the route alive later.",
        say: "Makes sense. I will not force it. If [pressure] becomes visible again, I will send one useful note and stay out of your way.",
        coach: "The exit should preserve credibility, not beg for attention.",
        replies: [
            {
                id: "callback",
                buyer: "Try me later.",
                reply: "I will. What is the right window, and what should I reference so this does not restart cold?",
                next: "post"
            },
            {
                id: "referral",
                buyer: "Talk to someone else.",
                reply: "Appreciate it. Who is closest to this pressure, and can I mention you pointed me there?",
                next: "post"
            },
            {
                id: "hard-no",
                buyer: "No.",
                reply: "Understood. I will close the loop here. Thanks for the direct answer.",
                next: "post"
            }
        ]
    }
];

/** Look up a thread by id. Returns the prep thread when not found. */
export function findThread(id: ThreadId): Thread {
    return THREADS.find((t) => t.id === id) ?? THREADS[0]!;
}

/** Look up a reply within a thread. Returns null when no replyId is set. */
export function findReply(thread: Thread, replyId: string | null): Thread["replies"][number] | null {
    if (!replyId) return null;
    return thread.replies.find((r) => r.id === replyId) ?? null;
}

/**
 * Resolve `reply.next` to an actual Thread when it points at a
 * ThreadId, or null when it points at "post" or is null.
 */
export function nextThreadFor(
    reply: Thread["replies"][number] | null
): Thread | null {
    if (!reply || reply.next === null || reply.next === "post") return null;
    return THREADS.find((t) => t.id === reply.next) ?? null;
}
