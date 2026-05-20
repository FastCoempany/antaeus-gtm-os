/**
 * Phase A orchestration layer (ADR-004) — session types.
 *
 * The session is the workspace-scoped object that carries the
 * operator's current focused object across every room. One session
 * per workspace, mutated by any room when focus changes, subscribed
 * to via Supabase Realtime for cross-tab consistency.
 *
 * Storage: `workspace_sessions` table. Schema:
 * supabase/migrations/20260519180000_workspace_sessions.sql
 */

import type { Json } from "@/lib/database.types";

/**
 * The set of objects an operator can focus. Maps to canon §2 sacred
 * nouns plus `focus` (Territory Architect's strategic-focus area) and
 * `approach`.
 */
export type FocusedObjectType =
    | "account"
    | "deal"
    | "signal"
    | "call"
    | "proof"
    | "advisor"
    | "focus"
    | "approach";

export const FOCUSED_OBJECT_TYPES: ReadonlyArray<FocusedObjectType> = [
    "account",
    "deal",
    "signal",
    "call",
    "proof",
    "advisor",
    "focus",
    "approach"
];

/**
 * The set of rooms an action can come from. Mirrors canon §4 room ids.
 */
export type RoomId =
    | "dashboard"
    | "signal-console"
    | "outbound-studio"
    | "cold-call-studio"
    | "linkedin-playbook"
    | "call-planner"
    | "discovery-studio"
    | "advisor-deploy"
    | "negotiation"
    | "icp-studio"
    | "territory-architect"
    | "sourcing-workbench"
    | "poc-framework"
    | "deal-workspace"
    | "future-autopsy"
    | "quota-workback"
    | "founding-gtm"
    | "settings"
    | "welcome"
    | "onboarding";

/**
 * What a room did. Verbs are plain — what an operator would say in
 * one word ("focus on", "advance", "save", "dismiss"). Canon §3
 * architectural truth #1: object-first. Each action names the object
 * it touched.
 */
export type ActionVerb =
    | "focus"     // operator focused an object (the most common)
    | "save"      // operator saved something (deal vitals, ICP, etc.)
    | "advance"   // operator advanced a deal stage or moved a thing forward
    | "log"       // operator logged a call, touch, cue
    | "dismiss"   // operator dismissed an observation or notification
    | "open"      // operator opened a room (no specific object)
    | "navigate"; // operator navigated cross-room via handoff

/**
 * One row in the recent-actions log. Stored as jsonb on the session,
 * validated in TypeScript (DB enforces only structure, not contents).
 */
export interface SessionAction {
    /** ISO 8601 timestamp. */
    readonly at: string;
    readonly room: RoomId;
    readonly verb: ActionVerb;
    readonly objectType: FocusedObjectType | null;
    readonly objectId: string | null;
    /**
     * Plain-English one-liner describing what happened. Read by the
     * birdseye strip when it surfaces recent activity. Must pass
     * canon Part III §11 voice rule.
     */
    readonly summary: string;
}

/** Maximum number of actions kept in the rolling log. */
export const RECENT_ACTIONS_LIMIT = 20;

/**
 * The TypeScript view of a workspace session. Mirrors the
 * `workspace_sessions` table row but with parsed jsonb + tighter
 * types. Use this everywhere in app code; convert at the data-client
 * boundary.
 */
export interface WorkspaceSessionView {
    readonly id: string;
    readonly workspaceId: string;
    readonly focusedObjectType: FocusedObjectType | null;
    readonly focusedObjectId: string | null;
    readonly focusedObjectName: string | null;
    readonly focusedObjectRoom: RoomId | null;
    readonly recentActions: ReadonlyArray<SessionAction>;
    readonly createdAt: string;
    readonly updatedAt: string;
}

/**
 * Compact "what is the operator currently focused on" projection,
 * read by every room + the birdseye strip. Derived from the full
 * session.
 */
export interface FocusedObject {
    readonly type: FocusedObjectType;
    readonly id: string;
    readonly name: string;
    readonly room: RoomId;
}

// ─── Parsing helpers (DB row → view) ──────────────────────────────

function isFocusedObjectType(value: unknown): value is FocusedObjectType {
    return (
        typeof value === "string" &&
        (FOCUSED_OBJECT_TYPES as ReadonlyArray<string>).includes(value)
    );
}

function isRoomId(value: unknown): value is RoomId {
    return (
        typeof value === "string" &&
        ALL_ROOM_IDS.includes(value as RoomId)
    );
}

const ALL_ROOM_IDS: ReadonlyArray<RoomId> = [
    "dashboard",
    "signal-console",
    "outbound-studio",
    "cold-call-studio",
    "linkedin-playbook",
    "call-planner",
    "discovery-studio",
    "advisor-deploy",
    "negotiation",
    "icp-studio",
    "territory-architect",
    "sourcing-workbench",
    "poc-framework",
    "deal-workspace",
    "future-autopsy",
    "quota-workback",
    "founding-gtm",
    "settings",
    "welcome",
    "onboarding"
];

function isActionVerb(value: unknown): value is ActionVerb {
    return (
        value === "focus" ||
        value === "save" ||
        value === "advance" ||
        value === "log" ||
        value === "dismiss" ||
        value === "open" ||
        value === "navigate"
    );
}

/**
 * Parse a single recent_actions jsonb entry. Drops malformed rows
 * defensively so a partial corruption doesn't lose the whole log.
 */
export function parseSessionAction(raw: unknown): SessionAction | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const at = typeof r["at"] === "string" ? r["at"] : null;
    const room = r["room"];
    const verb = r["verb"];
    const summary = typeof r["summary"] === "string" ? r["summary"] : null;
    if (!at || !isRoomId(room) || !isActionVerb(verb) || !summary) {
        return null;
    }
    const objectTypeRaw = r["objectType"];
    const objectType: FocusedObjectType | null = isFocusedObjectType(objectTypeRaw)
        ? objectTypeRaw
        : null;
    const objectId =
        typeof r["objectId"] === "string" ? r["objectId"] : null;
    return {
        at,
        room,
        verb,
        objectType,
        objectId,
        summary
    };
}

/**
 * Parse the recent_actions jsonb column into a typed array. Drops
 * malformed entries. Returns at most RECENT_ACTIONS_LIMIT items.
 */
export function parseRecentActions(raw: Json | null): ReadonlyArray<SessionAction> {
    if (!Array.isArray(raw)) return [];
    const out: SessionAction[] = [];
    for (const item of raw) {
        const parsed = parseSessionAction(item);
        if (parsed) out.push(parsed);
        if (out.length >= RECENT_ACTIONS_LIMIT) break;
    }
    return out;
}

/**
 * Convert the in-memory action list back to a jsonb-compatible array
 * for DB write.
 */
export function serializeRecentActions(
    actions: ReadonlyArray<SessionAction>
): Json {
    return actions.slice(0, RECENT_ACTIONS_LIMIT) as unknown as Json;
}

/**
 * Convert a Supabase `workspace_sessions` row into the typed view.
 * Defensive — bad enum values fall back to null rather than crash.
 */
export function rowToSession(row: {
    id: string;
    workspace_id: string;
    focused_object_type: string | null;
    focused_object_id: string | null;
    focused_object_name: string | null;
    focused_object_room: string | null;
    recent_actions: Json;
    created_at: string;
    updated_at: string;
}): WorkspaceSessionView {
    return {
        id: row.id,
        workspaceId: row.workspace_id,
        focusedObjectType: isFocusedObjectType(row.focused_object_type)
            ? row.focused_object_type
            : null,
        focusedObjectId: row.focused_object_id,
        focusedObjectName: row.focused_object_name,
        focusedObjectRoom: isRoomId(row.focused_object_room)
            ? row.focused_object_room
            : null,
        recentActions: parseRecentActions(row.recent_actions),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Project the focused-object subset out of a session. Returns null if
 * nothing is focused or the focus is incomplete.
 */
export function pickFocusedObject(
    session: WorkspaceSessionView | null
): FocusedObject | null {
    if (!session) return null;
    const { focusedObjectType, focusedObjectId, focusedObjectName, focusedObjectRoom } =
        session;
    if (
        !focusedObjectType ||
        !focusedObjectId ||
        !focusedObjectName ||
        !focusedObjectRoom
    ) {
        return null;
    }
    return {
        type: focusedObjectType,
        id: focusedObjectId,
        name: focusedObjectName,
        room: focusedObjectRoom
    };
}
