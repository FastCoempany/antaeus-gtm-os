import type { AccentRole } from "@/components";
import type { Outcome, ThreadId } from "../../lib/types";
import {
    loomScore,
    requiredCorrectionCopy,
    weakestThreadCopy
} from "../../lib/personalize";
import {
    activeReply,
    activeThread,
    callStats,
    selectedAccount
} from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Pure adapters — map the Cold Call Studio thread spine + call read onto
 * the design-system components the DS surface composes. The thread data,
 * the score, and the personalize engine are untouched (the "loom" score
 * is a code identifier; the surface label is rewritten). These translate
 * the thread + outcome into tone, the live read into the console header,
 * and a booked meeting into the Wayfinder pulling cell.
 */

/** Thread → tone. The pressure thread runs red; proof green; the rest
 *  warm/cool by where they sit in the call. */
const THREAD_TONE: Record<ThreadId, AccentRole | undefined> = {
    prep: undefined,
    opener: "blue",
    pressure: "red",
    proof: "green",
    ask: "amber",
    exit: undefined
};
export function threadTone(id: ThreadId): AccentRole | undefined {
    return THREAD_TONE[id];
}

/** Call outcome → tone. */
export function outcomeTone(outcome: Outcome): AccentRole | undefined {
    if (outcome === "meeting_booked") return "green";
    if (outcome === "callback_scheduled" || outcome === "referral") return "blue";
    if (outcome === "rejected" || outcome === "hung_up") return "red";
    return undefined;
}

export interface CallRead {
    readonly score: number;
    readonly diagnosis: string;
    readonly correction: string;
}

/** The live call read — score + what's loose + the actual correction. */
export function callRead(): CallRead {
    const account = selectedAccount.value;
    const hasAccount = account !== null;
    return {
        score: loomScore({
            hasAccount,
            heat: account?.heat ?? 0,
            threadId: activeThread.value,
            hasReply: activeReply.value !== null
        }),
        diagnosis: weakestThreadCopy(hasAccount),
        correction: requiredCorrectionCopy(hasAccount, activeThread.value)
    };
}

/** Score → tone (the call read's band). */
export function scoreTone(score: number): AccentRole {
    if (score >= 70) return "green";
    if (score >= 55) return "amber";
    return "red";
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: a booked meeting created a deal (canon
 * §4.9 flows-out), so the one next move is to work it in Deal Workspace.
 * Absent until a meeting is on the board.
 */
export function toPulling(): PullingData | undefined {
    const s = callStats.value;
    if (s.meetings === 0) return undefined;
    const account = selectedAccount.value;
    return {
        verb: "Work the deal",
        object: account?.name || "the booked deal",
        href: hrefToDealWorkspace(account?.name ?? ""),
        reasons: [
            `${s.meetings} ${s.meetings === 1 ? "meeting" : "meetings"} booked from ${s.total} calls.`
        ]
    };
}
