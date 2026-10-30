import type { Cue, Motion } from "./types";

/**
 * LinkedIn suggested scripts and reference templates.
 *
 * Scripts use placeholders for facts the operator must supply. They do not
 * invent benchmarks, claim that a pattern is typical, or imply familiarity
 * that has not been recorded.
 */

export function cueScript(cue: Cue, motion: Motion): string {
    if (cue.action === "connection_request") {
        return "Hi [Name], I saw your point on [topic]. The part about [specific issue] was useful. I would be glad to stay connected.";
    }
    if (cue.action === "dm") {
        if (cue.name.indexOf("Ask") >= 0) {
            return "You mentioned [specific issue]. If it would be useful to compare notes on that, would [day] or [day] work for 15 minutes?";
        }
        return "[Name], you mentioned [specific issue]. This [resource] addresses that question directly, so I thought I would send it in case it is useful. No meeting request attached.";
    }
    if (motion.key === "add_air_cover") {
        return "Saw your point on [topic]. The part about [specific issue] stood out. How are you handling that today?";
    }
    return "Your point on [topic] was useful. I was especially interested in [specific issue]. How are you handling that today?";
}

export type MethodTemplateKey = "connect" | "comment" | "give" | "ask";

export interface MethodTemplate {
    readonly key: MethodTemplateKey;
    readonly kicker: string;
    readonly heading: string;
    readonly small: string;
    readonly body: string;
}

export const METHOD_TEMPLATES: ReadonlyArray<MethodTemplate> = [
    {
        key: "connect",
        kicker: "Connection",
        heading: "Reference a real public interaction.",
        small: "Do not imply familiarity that has not happened.",
        body: "Hi [Name], I saw your point on [topic]. The part about [specific issue] stood out. I would be glad to stay connected."
    },
    {
        key: "comment",
        kicker: "Comment",
        heading: "Add one useful observation or question.",
        small: "Do not turn the comment into a product pitch.",
        body: "The point about [specific issue] stood out. I am curious how you are handling [specific question] today."
    },
    {
        key: "give",
        kicker: "Useful information",
        heading: "Send a relevant resource without a meeting request.",
        small: "Use a real resource that addresses something the contact actually discussed.",
        body: "[Name], you mentioned [specific issue]. This [resource] addresses that question directly, so I thought I would send it in case it is useful. No meeting request attached."
    },
    {
        key: "ask",
        kicker: "Meeting request",
        heading: "Tie the meeting request to the prior conversation.",
        small: "Ask only when there is a specific issue worth discussing.",
        body: "You mentioned [specific issue]. If it would be useful to compare notes on that, would [day] or [day] work for 15 minutes?"
    }
];
