import { describe, expect, it } from "vitest";
import {
    parseRecentActions,
    parseSessionAction,
    pickFocusedObject,
    RECENT_ACTIONS_LIMIT,
    rowToSession,
    serializeRecentActions,
    type SessionAction
} from "./types";

describe("parseSessionAction", () => {
    it("parses a valid action", () => {
        const out = parseSessionAction({
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "advance",
            objectType: "deal",
            objectId: "deal-1",
            summary: "Advanced Meridian to evaluation."
        });
        expect(out).toEqual({
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "advance",
            objectType: "deal",
            objectId: "deal-1",
            summary: "Advanced Meridian to evaluation."
        });
    });

    it("returns null on missing required fields", () => {
        expect(parseSessionAction(null)).toBeNull();
        expect(parseSessionAction({})).toBeNull();
        expect(
            parseSessionAction({ at: "2026-05-19T00:00:00Z", room: "deal-workspace" })
        ).toBeNull();
    });

    it("returns null on invalid room id", () => {
        const out = parseSessionAction({
            at: "2026-05-19T00:00:00Z",
            room: "made-up-room",
            verb: "advance",
            summary: "x"
        });
        expect(out).toBeNull();
    });

    it("returns null on invalid verb", () => {
        const out = parseSessionAction({
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "sabotage",
            summary: "x"
        });
        expect(out).toBeNull();
    });

    it("normalizes invalid objectType to null without dropping the action", () => {
        const out = parseSessionAction({
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "open",
            objectType: "made-up-thing",
            objectId: "x",
            summary: "x"
        });
        expect(out).not.toBeNull();
        expect(out?.objectType).toBeNull();
    });

    it("tolerates missing objectType / objectId (operator opened a room without focus)", () => {
        const out = parseSessionAction({
            at: "2026-05-19T00:00:00Z",
            room: "dashboard",
            verb: "open",
            summary: "Opened Dashboard."
        });
        expect(out).not.toBeNull();
        expect(out?.objectType).toBeNull();
        expect(out?.objectId).toBeNull();
    });
});

describe("parseRecentActions", () => {
    it("returns [] when input is not an array", () => {
        expect(parseRecentActions(null)).toEqual([]);
        expect(parseRecentActions("not array")).toEqual([]);
        expect(parseRecentActions({ wrong: "shape" })).toEqual([]);
    });

    it("returns [] for empty array", () => {
        expect(parseRecentActions([])).toEqual([]);
    });

    it("drops malformed entries silently and keeps the good ones", () => {
        const valid: SessionAction = {
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "advance",
            objectType: "deal",
            objectId: "d1",
            summary: "ok"
        };
        const validJson = valid as unknown as Record<string, unknown>;
        const result = parseRecentActions(
            [validJson, null, "garbage", { wrong: "shape" }, validJson] as unknown as Parameters<typeof parseRecentActions>[0]
        );
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(valid);
    });

    it("caps at RECENT_ACTIONS_LIMIT", () => {
        const action: SessionAction = {
            at: "2026-05-19T00:00:00Z",
            room: "deal-workspace",
            verb: "save",
            objectType: "deal",
            objectId: "d1",
            summary: "ok"
        };
        const overflow = new Array(RECENT_ACTIONS_LIMIT + 10).fill(
            action as unknown as Record<string, unknown>
        );
        const result = parseRecentActions(
            overflow as unknown as Parameters<typeof parseRecentActions>[0]
        );
        expect(result.length).toBe(RECENT_ACTIONS_LIMIT);
    });
});

describe("serializeRecentActions", () => {
    it("returns at most RECENT_ACTIONS_LIMIT entries", () => {
        const action: SessionAction = {
            at: "x",
            room: "deal-workspace",
            verb: "save",
            objectType: null,
            objectId: null,
            summary: "ok"
        };
        const input = new Array(RECENT_ACTIONS_LIMIT + 5).fill(action);
        const out = serializeRecentActions(input) as ReadonlyArray<unknown>;
        expect(out.length).toBe(RECENT_ACTIONS_LIMIT);
    });
});

describe("rowToSession", () => {
    it("converts a valid row to a typed session view", () => {
        const out = rowToSession({
            id: "sess-1",
            workspace_id: "ws-1",
            focused_object_type: "account",
            focused_object_id: "acct-1",
            focused_object_name: "Meridian",
            focused_object_room: "signal-console",
            recent_actions: [],
            created_at: "2026-05-19T00:00:00Z",
            updated_at: "2026-05-19T00:00:00Z"
        });
        expect(out.workspaceId).toBe("ws-1");
        expect(out.focusedObjectType).toBe("account");
        expect(out.focusedObjectRoom).toBe("signal-console");
        expect(out.recentActions).toEqual([]);
    });

    it("falls back to null on invalid enum values rather than crashing", () => {
        const out = rowToSession({
            id: "sess-1",
            workspace_id: "ws-1",
            focused_object_type: "made-up",
            focused_object_id: "x",
            focused_object_name: "x",
            focused_object_room: "made-up",
            recent_actions: [],
            created_at: "2026-05-19T00:00:00Z",
            updated_at: "2026-05-19T00:00:00Z"
        });
        expect(out.focusedObjectType).toBeNull();
        expect(out.focusedObjectRoom).toBeNull();
    });
});

describe("pickFocusedObject", () => {
    it("returns null on null session", () => {
        expect(pickFocusedObject(null)).toBeNull();
    });

    it("returns null when any focus field is missing", () => {
        const base = {
            id: "sess-1",
            workspaceId: "ws-1",
            focusedObjectType: "account" as const,
            focusedObjectId: "acct-1",
            focusedObjectName: "Meridian",
            focusedObjectRoom: "signal-console" as const,
            recentActions: [],
            createdAt: "2026-05-19T00:00:00Z",
            updatedAt: "2026-05-19T00:00:00Z"
        };
        expect(pickFocusedObject({ ...base, focusedObjectId: null })).toBeNull();
        expect(pickFocusedObject({ ...base, focusedObjectName: null })).toBeNull();
        expect(pickFocusedObject({ ...base, focusedObjectRoom: null })).toBeNull();
        expect(pickFocusedObject({ ...base, focusedObjectType: null })).toBeNull();
    });

    it("returns the projection when all focus fields are set", () => {
        const out = pickFocusedObject({
            id: "sess-1",
            workspaceId: "ws-1",
            focusedObjectType: "account",
            focusedObjectId: "acct-1",
            focusedObjectName: "Meridian",
            focusedObjectRoom: "signal-console",
            recentActions: [],
            createdAt: "2026-05-19T00:00:00Z",
            updatedAt: "2026-05-19T00:00:00Z"
        });
        expect(out).toEqual({
            type: "account",
            id: "acct-1",
            name: "Meridian",
            room: "signal-console"
        });
    });
});
