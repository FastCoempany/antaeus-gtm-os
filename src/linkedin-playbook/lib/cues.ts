import type { Cue, CueIndex } from "./types";

/**
 * LinkedIn action sequence.
 *
 * The five existing cue indexes and action types are retained for
 * compatibility. The copy now describes observable actions rather than
 * inferred trust, warmth, or permission states.
 */

export const CUES: ReadonlyArray<Cue> = [
    {
        index: 0,
        name: "Review a relevant public post",
        label: "Cue 01",
        color: "var(--lp-orange)",
        action: "content_engage",
        title: "Start with something the contact actually published.",
        copy: "Use a real post or public update so the interaction has specific context.",
        console: "Read the post and identify one specific point you can respond to without mentioning your product."
    },
    {
        index: 1,
        name: "Leave a useful comment",
        label: "Cue 02",
        color: "var(--lp-blue)",
        action: "content_engage",
        title: "Add a relevant observation or question.",
        copy: "Comment only when you have something specific to add. Do not turn the comment into a pitch.",
        console: "Respond to one specific point from the post, then stop."
    },
    {
        index: 2,
        name: "Send a connection request",
        label: "Cue 03",
        color: "var(--lp-green)",
        action: "connection_request",
        title: "Reference the real interaction in the request.",
        copy: "Keep the request short and tied to a topic or interaction that actually occurred.",
        console: "Reference the relevant public topic and keep the connection note brief."
    },
    {
        index: 3,
        name: "Send useful information",
        label: "Cue 04",
        color: "var(--lp-orange)",
        action: "dm",
        title: "Send information that addresses something the contact discussed.",
        copy: "Use a real resource that is relevant to the contact's stated topic or question. Do not attach a meeting request to it by default.",
        console: "Send one relevant resource without a meeting request."
    },
    {
        index: 4,
        name: "Ask for a short meeting",
        label: "Cue 05",
        color: "var(--lp-red)",
        action: "dm",
        title: "Tie the meeting request to a specific prior topic.",
        copy: "The request should state what you want to discuss and why it follows from the prior interaction.",
        console: "Ask for 15 minutes only when there is a specific topic to discuss."
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
