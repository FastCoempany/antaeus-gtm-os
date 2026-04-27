import type { Cue, Motion } from "./types";

/**
 * Phase 4 / Room 8 Wave 2 — cue scripts + method-sheet templates.
 *
 * `cueScript(cue, motion)` is a faithful TypeScript port of the legacy
 * `cueScript(cue, m)` function (`app/linkedin-playbook/index.html` line
 * 111). Returns the suggested live script for the active cue, branching
 * on the cue's actionType and (for DM cues) the cue name; for the
 * content cues, the wording shifts based on whether this is air-cover
 * for an outbound motion or a fresh credibility pass.
 *
 * The 4 method-sheet templates (Connection / Public cue / Give-first /
 * Ask) are also ported verbatim from the legacy HTML lines 79-83. They
 * appear in the secondary reference panel below the booth — operator
 * copies them to clipboard.
 *
 * Both helpers are pure strings; there is no DOM here.
 */

export function cueScript(cue: Cue, motion: Motion): string {
    if (cue.action === "connection_request") {
        return "Hi [Name], your point on [specific pressure] was useful. I work around that pattern and would be glad to stay connected.";
    }
    if (cue.action === "dm") {
        if (cue.name.indexOf("Ask") >= 0) {
            return "Based on what you shared about [pressure], I think there is a concrete conversation worth having. Would [day] or [day] work for 15 minutes?";
        }
        return "[Name], saw this and thought it matched the pattern you mentioned: [benchmark]. No ask - just seemed relevant to what your team is navigating.";
    }
    // content_engage / content_share / inmail (fallback) — vary on motion key.
    if (motion.key === "add_air_cover") {
        return "This is the kind of pressure that usually shows up in the queue before it shows up in the forecast. Curious where it is most visible right now.";
    }
    return "That pressure usually shows up first in response time before it shows up in tooling. Curious where the strain is most visible right now.";
}

/** Method-sheet template keys — match the secondary panel order. */
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
        heading: "Request only after recognition.",
        small: "A blank request is channel debt.",
        body: "Hi [Name], I saw your point on [topic]. The part about [specific strain] stood out. Would be useful to stay connected as this develops."
    },
    {
        key: "comment",
        kicker: "Public cue",
        heading: "Comment with one operating read.",
        small: "Do not pitch in the comments.",
        body: "This tends to show up first in [operating pressure] before it shows up in tooling. Curious where the strain is most visible right now."
    },
    {
        key: "give",
        kicker: "Give-first",
        heading: "Send proof before asking.",
        small: "The give must help whether or not they buy.",
        body: "[Name], saw this and thought it matched the pattern you mentioned: [benchmark/resource]. No ask - just seemed relevant to what your team is navigating."
    },
    {
        key: "ask",
        kicker: "Ask",
        heading: "Ask only when earned.",
        small: "The calendar request comes after familiarity and proof.",
        body: "Based on what you shared about [pressure], I think there is a concrete conversation worth having. Would [day] or [day] work for 15 minutes?"
    }
];
