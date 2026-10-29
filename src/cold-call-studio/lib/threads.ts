import type { Thread, ThreadId } from "./types";

/**
 * Cold Call Studio conversation data.
 *
 * Internal ThreadId values are retained for compatibility. User-facing
 * language is grounded in the selected account signal and what the buyer
 * actually says. No branch invents customer proof, benchmark data, buyer
 * urgency, or causal impact that the module does not have as input.
 */

export const THREADS: ReadonlyArray<Thread> = [
    {
        id: "prep",
        num: "01",
        label: "Prepare",
        verb: "hold",
        color: "var(--cc-orange)",
        title: "Choose the account and reason for the call before dialing.",
        copy: "Use a specific account event or signal rather than generic market language.",
        say: "Before you dial, confirm the account, the contact, and the specific event or signal you plan to reference.",
        coach: "Do not call until you can state why this account is relevant now.",
        replies: [
            {
                id: "ready",
                buyer: "The account and reason are clear.",
                reply: "Proceed to the opener and keep the first line brief.",
                next: "opener"
            },
            {
                id: "not-ready",
                buyer: "The reason is still vague.",
                reply: "Review the account in Signal Console and choose a concrete signal or event before dialing.",
                next: "prep"
            }
        ]
    },
    {
        id: "opener",
        num: "02",
        label: "Open the call",
        verb: "pull",
        color: "var(--cc-blue)",
        title: "Acknowledge the interruption and ask for a short window.",
        copy: "Give the buyer a quick way to decide whether to continue.",
        say: "I know I am interrupting. Give me 20 seconds and you can decide if this is worth continuing.",
        coach: "Keep the opener short. Explain the reason for the call next.",
        replies: [
            {
                id: "busy",
                buyer: "I am busy.",
                reply: "Understood. The short version is that I am calling because of [pressure] at [account]. If that is not relevant to you, who owns it?",
                next: "pressure"
            },
            {
                id: "who",
                buyer: "Who is this?",
                reply: "[Your name] with [company]. I am calling because of [pressure] at [account]. Can I give you the 20-second version?",
                next: "pressure"
            },
            {
                id: "no-sales",
                buyer: "No sales calls.",
                reply: "Understood. I will keep it brief. Is [pressure] something your team is dealing with, or should I close the loop?",
                next: "pressure"
            }
        ]
    },
    {
        id: "pressure",
        num: "03",
        label: "Understand the impact",
        verb: "tighten",
        color: "var(--cc-green)",
        title: "Ask where the issue shows up instead of assuming the impact.",
        copy: "The account signal explains why you called; the buyer tells you whether it matters internally.",
        say: "The reason I called is [pressure]. I do not know yet whether that is creating a problem for your team. If it is, where does it show up most: time, handoffs, rework, or delayed decisions?",
        coach: "Let the buyer name the impact. Do not turn the account signal into an assumed pain point.",
        replies: [
            {
                id: "pain",
                buyer: "It is definitely costing time.",
                reply: "Where does most of that time go: triage, handoffs, rework, or waiting on decisions?",
                next: "proof"
            },
            {
                id: "soft",
                buyer: "It is not terrible.",
                reply: "Understood. What keeps it manageable today, and what would have to change before it became worth revisiting?",
                next: "proof"
            },
            {
                id: "none",
                buyer: "Not a problem.",
                reply: "Good to know. I will not force it. If the situation changes later, I can follow up then.",
                next: "exit"
            }
        ]
    },
    {
        id: "proof",
        num: "04",
        label: "Understand the current approach",
        verb: "trade",
        color: "var(--cc-orange)",
        title: "Find out how the buyer handles the issue today.",
        copy: "Do not introduce a proof claim until you have real proof that matches the buyer's situation.",
        say: "How are you handling [pressure] today: manually, through an existing vendor, or another way?",
        coach: "If you have a relevant verified example, use it briefly. Otherwise stay with the buyer's current process.",
        replies: [
            {
                id: "manual",
                buyer: "We are handling it manually.",
                reply: "What part of that manual work would be most useful to reduce, if any?",
                next: "ask"
            },
            {
                id: "vendor",
                buyer: "We already have a vendor.",
                reply: "Understood. What is working well with the current vendor, and is there anything you still have to handle outside it?",
                next: "ask"
            },
            {
                id: "skeptical",
                buyer: "I do not believe that.",
                reply: "Fair. I do not want you to take a claim from a cold call on faith. I can send the specific evidence I have, if it is relevant, and you can decide whether it maps to your situation.",
                next: "exit"
            }
        ]
    },
    {
        id: "ask",
        num: "05",
        label: "Ask for the next conversation",
        verb: "lock",
        color: "var(--cc-green)",
        title: "Make the meeting request specific to what the buyer said.",
        copy: "The meeting request should follow from the issue or process the buyer just described.",
        say: "It sounds specific enough to look at together. Would it make sense to spend 20 minutes this week on how you are handling this at [account] and whether there is anything useful for us to help with?",
        coach: "Ask for time only after the buyer has confirmed a relevant issue or process to discuss.",
        replies: [
            {
                id: "yes",
                buyer: "Yes.",
                reply: "Good. I will send a calendar hold with a focused agenda: the issue, where it shows up, and whether there is enough value to keep going.",
                next: "post"
            },
            {
                id: "send",
                buyer: "Send me something.",
                reply: "I can. What information would be most useful, and what day should I follow up after you have had a chance to look at it?",
                next: "post"
            },
            {
                id: "not-now",
                buyer: "Not now.",
                reply: "Understood. Is the timing bad, am I speaking with the wrong person, or is this simply not a priority?",
                next: "exit"
            }
        ]
    },
    {
        id: "exit",
        num: "06",
        label: "Close the call",
        verb: "release",
        color: "var(--cc-red)",
        title: "End the call clearly and record any follow-up that was requested.",
        copy: "Do not manufacture a future opportunity when the buyer has said no.",
        say: "Understood. I will not force it. If the situation changes later, I can follow up then.",
        coach: "Respect the answer and record only the follow-up the buyer actually agreed to.",
        replies: [
            {
                id: "callback",
                buyer: "Try me later.",
                reply: "I will. What is the right time to follow up, and what should I reference so you have the context?",
                next: "post"
            },
            {
                id: "referral",
                buyer: "Talk to someone else.",
                reply: "Appreciate it. Who is closest to this issue, and can I mention that you pointed me to them?",
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

/** Resolve reply.next to another thread, or null for post-call routing. */
export function nextThreadFor(
    reply: Thread["replies"][number] | null
): Thread | null {
    if (!reply || reply.next === null || reply.next === "post") return null;
    return THREADS.find((t) => t.id === reply.next) ?? null;
}
