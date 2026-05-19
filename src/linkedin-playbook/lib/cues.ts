import type { Cue, CueIndex } from "./types";

/**
 * Phase 4 / Room 8 Wave 2 — cue ladder.
 *
 * Faithful TypeScript port of the legacy `cues()` array
 * (`app/linkedin-playbook/index.html` line 110). Five cues in canonical
 * order — Watch → Comment → Connect → Give-first → Ask. The order is
 * the spine of canon §4.10's "five cues" — public cue first, ask only
 * when trust has compounded.
 *
 * Pure data + lookup helpers. No signals, no DOM.
 */

export const CUES: ReadonlyArray<Cue> = [
    {
        index: 0,
        name: "Watch the public signal",
        label: "Cue 01",
        color: "var(--lp-orange)",
        action: "content_engage",
        title: "Find the post that makes timing real.",
        copy: "The first cue is usually public. Do not enter the inbox before permission exists.",
        console: "Read the post. Name the pressure. Do not mention product."
    },
    {
        index: 1,
        name: "Comment with one useful observation",
        label: "Cue 02",
        color: "var(--lp-blue)",
        action: "content_engage",
        title: "Make the public answer feel inevitable.",
        copy: "Add one useful observation the buyer would recognize from their own day, then leave. No cheerleading and no pitch.",
        console: "Say one specific thing the buyer can recognize from their own world."
    },
    {
        index: 2,
        name: "Connect after recognition",
        label: "Cue 03",
        color: "var(--lp-green)",
        action: "connection_request",
        title: "Ask to enter only after your name is warm.",
        copy: "The request should feel like a continuation, not an interruption.",
        console: "Reference the public thread and keep the note short."
    },
    {
        index: 3,
        name: "Give proof before asking",
        label: "Cue 04",
        color: "var(--lp-orange)",
        action: "dm",
        title: "Send the useful thing before the calendar ask.",
        copy: "Give a benchmark, resource, or operating read that helps even if they never buy.",
        console: "No meeting ask until the give-first touch lands."
    },
    {
        index: 4,
        name: "Ask only when earned",
        label: "Cue 05",
        color: "var(--lp-red)",
        action: "dm",
        title: "The calendar ask is the last cue.",
        copy: "If attention and usefulness are missing, the ask is a cold pitch wearing a social mask.",
        console: "Ask for 15 minutes only when there is a reason they can repeat."
    }
];

/** Look up a cue by index. Clamps out-of-range to the first cue. */
export function findCue(index: CueIndex | number): Cue {
    const i = Math.max(0, Math.min(CUES.length - 1, Math.floor(index)));
    return CUES[i] ?? CUES[0]!;
}

/** Resolve the cue index that should be active given a manual pin or a motion default. */
export function resolveCueIndex(
    pinned: CueIndex | null,
    motionDefault: CueIndex
): CueIndex {
    if (pinned !== null) return pinned;
    return motionDefault;
}
