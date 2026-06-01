/**
 * Briefing destinations — parse + route the `recommended_moves[].destination`
 * tokens produced by the synthesis pipeline.
 *
 * Per canon §4.21 the Briefing produces drafts the operator reviews and
 * saves to a destination room (Discovery / Call Planner / Outbound /
 * Asset Builder / Deal Workspace). The pipeline writes destinations as
 * structured strings like:
 *
 *   "Discovery Studio · Phase 4 · refresh existing"
 *   "Call Planner · Objection Bank · new"
 *   "Outbound Studio · Hook Library · new"
 *   "Asset Builder · Battlecard · Linear · refresh existing"
 *   "Deal Workspace · Deal-Watch · Acme · alert"
 *
 * This module turns those strings into clickable routes carrying the
 * draft payload through the canonical continuity params so the
 * destination room can surface a "drafted from briefing" banner.
 */

import type { RecommendedMove } from "./patterns";

export type DestinationRoom =
    | "discovery-studio"
    | "call-planner"
    | "outbound-studio"
    | "deal-workspace"
    | "asset-builder";

export interface DestinationToken {
    readonly room: DestinationRoom;
    /** Display name of the source's matching room (verbatim from the token). */
    readonly roomLabel: string;
    /** The section within the room (e.g., "Phase 4", "Objection Bank", "Hook Library"). */
    readonly section: string;
    /** "new" → draft a new entry; "refresh" → update an existing entry. */
    readonly action: "new" | "refresh" | "alert" | null;
    /** Identifier of the targeted entry when present (e.g., "obj_001"). */
    readonly targetId: string | null;
    /** Original token text — preserved for fallback display. */
    readonly raw: string;
}

const ROOM_MAP: ReadonlyArray<readonly [DestinationRoom, ReadonlyArray<string>]> = [
    ["discovery-studio", ["discovery studio", "discovery"]],
    ["call-planner", ["call planner"]],
    ["outbound-studio", ["outbound studio", "outbound"]],
    ["deal-workspace", ["deal workspace", "deals"]],
    ["asset-builder", ["asset builder", "assets"]]
];

function roomFromLabel(s: string): DestinationRoom | null {
    const norm = s.trim().toLowerCase();
    for (const [room, labels] of ROOM_MAP) {
        if (labels.includes(norm)) return room;
    }
    return null;
}

function parseAction(s: string): "new" | "refresh" | "alert" | null {
    const norm = s.trim().toLowerCase();
    if (norm === "new") return "new";
    if (norm === "refresh existing" || norm === "refresh") return "refresh";
    if (norm === "alert") return "alert";
    return null;
}

/**
 * Parse a destination token string into structured form. Returns null
 * when the room is unrecognized (the synthesis stage's voice gate is
 * supposed to keep this from happening; fail safe rather than rendering
 * a bare string).
 */
export function parseDestination(raw: string): DestinationToken | null {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const parts = trimmed.split(/\s*·\s*/).filter((p) => p.length > 0);
    if (parts.length === 0) return null;
    const room = roomFromLabel(parts[0]!);
    if (!room) return null;
    const roomLabel = parts[0]!;
    // The last segment is often the action; the segments between room
    // and action are the section path (which can be multi-part for
    // Asset Builder battlecards like "Battlecard · Linear · refresh existing").
    let action: "new" | "refresh" | "alert" | null = null;
    let targetId: string | null = null;
    let sectionEnd = parts.length;
    const last = parts[parts.length - 1]!;
    const parsedAction = parseAction(last);
    if (parsedAction) {
        action = parsedAction;
        sectionEnd = parts.length - 1;
        // Refresh actions sometimes carry an id in the prior segment
        // (e.g., "obj_001"). Detect by snake_case pattern.
        const prior = parts[sectionEnd - 1];
        if (
            parsedAction === "refresh" &&
            prior &&
            /^[a-z0-9]+_[a-z0-9_]+$/i.test(prior)
        ) {
            targetId = prior;
            sectionEnd -= 1;
        }
    }
    const section = parts.slice(1, sectionEnd).join(" · ");
    return {
        room,
        roomLabel,
        section,
        action,
        targetId,
        raw: trimmed
    };
}

/**
 * Build a routable href for a destination token + its draft payload.
 * Returns null when the destination room isn't a buildable target
 * (Asset Builder isn't a shipped room — its destinations stay text).
 *
 * Carries continuity params so the destination room can show a
 * "drafted from briefing" banner and the back-pill works.
 */
export function briefingDestinationHref(
    token: DestinationToken,
    move: RecommendedMove,
    opts: {
        readonly fromSurface?: string;
        readonly returnTo?: string;
        readonly patternId?: string;
    } = {}
): string | null {
    const path = roomPath(token.room);
    if (path === null) return null;
    const params = new URLSearchParams();
    params.set("fromMode", "briefing-draft");
    params.set("fromSurface", opts.fromSurface ?? "patterns");
    params.set("focusRoom", "Briefing");
    params.set("returnTo", opts.returnTo ?? "/briefing/");
    params.set("returnLabel", "Back to Briefing");
    params.set("briefingDraftLabel", move.label);
    if (move.rationale) {
        params.set("briefingDraftRationale", move.rationale);
    }
    if (token.section) {
        params.set("briefingDraftSection", token.section);
    }
    if (token.action) {
        params.set("briefingDraftAction", token.action);
    }
    if (token.targetId) {
        params.set("briefingDraftTargetId", token.targetId);
    }
    if (opts.patternId) {
        params.set("briefingDraftPatternId", opts.patternId);
    }
    return `${path}?${params.toString()}`;
}

function roomPath(room: DestinationRoom): string | null {
    switch (room) {
        case "discovery-studio":
            return "/discovery-studio/";
        case "call-planner":
            return "/call-planner/";
        case "outbound-studio":
            return "/outbound-studio/";
        case "deal-workspace":
            return "/deal-workspace/";
        case "asset-builder":
            return null;
    }
}

export const DESTINATION_ROOM_LABEL: Record<DestinationRoom, string> = {
    "discovery-studio": "Discovery Studio",
    "call-planner": "Call Planner",
    "outbound-studio": "Outbound Studio",
    "deal-workspace": "Deal Workspace",
    "asset-builder": "Asset Builder"
};
