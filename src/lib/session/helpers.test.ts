import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    applyRealtimeUpdate,
    bootSession,
    clearFocus,
    pushRecentAction,
    setFocusedObject
} from "./helpers";
import {
    __resetSessionForTests,
    isSessionLoaded,
    session
} from "./state";
import type { Json, Workspace } from "@/lib/database-helpers";
import type { DataClient, NounAccessor } from "@/lib/data-client";

// ─── Mock DataClient ──────────────────────────────────────────────

interface MockSessionRow {
    id: string;
    workspace_id: string;
    focused_object_type: string | null;
    focused_object_id: string | null;
    focused_object_name: string | null;
    focused_object_room: string | null;
    recent_actions: Json;
    created_at: string;
    updated_at: string;
}

function makeMockSessionRow(
    overrides: Partial<MockSessionRow> = {}
): MockSessionRow {
    return {
        id: "sess-1",
        workspace_id: "ws-1",
        focused_object_type: null,
        focused_object_id: null,
        focused_object_name: null,
        focused_object_room: null,
        recent_actions: [],
        created_at: "2026-05-19T00:00:00Z",
        updated_at: "2026-05-19T00:00:00Z",
        ...overrides
    };
}

function makeMockDataClient(opts: {
    workspace?: Workspace | null;
    existingRow?: MockSessionRow | null;
} = {}): {
    data: DataClient;
    insertCalls: Array<Record<string, unknown>>;
    updateCalls: Array<{ id: string; patch: Record<string, unknown> }>;
    listCalls: number;
    subscribeCalls: number;
    setStoredRow: (row: MockSessionRow | null) => void;
} {
    let storedRow: MockSessionRow | null = opts.existingRow ?? null;
    const insertCalls: Array<Record<string, unknown>> = [];
    const updateCalls: Array<{ id: string; patch: Record<string, unknown> }> = [];
    let listCalls = 0;
    let subscribeCalls = 0;

    const workspaceSessions: NounAccessor<"workspace_sessions"> = {
        list: vi.fn(async () => {
            listCalls += 1;
            return storedRow ? [storedRow as never] : [];
        }),
        get: vi.fn(async () => storedRow as never),
        insert: vi.fn(async (row) => {
            const fresh: MockSessionRow = makeMockSessionRow({
                ...(row as Partial<MockSessionRow>)
            });
            storedRow = fresh;
            insertCalls.push(row as Record<string, unknown>);
            return fresh as never;
        }),
        update: vi.fn(async (id, patch) => {
            if (!storedRow) {
                throw new Error("update called with no existing row");
            }
            const next: MockSessionRow = { ...storedRow, ...(patch as Partial<MockSessionRow>), id };
            storedRow = next;
            updateCalls.push({ id, patch: patch as Record<string, unknown> });
            return next as never;
        }),
        remove: vi.fn(async () => {
            storedRow = null;
        }),
        subscribe: vi.fn(() => {
            subscribeCalls += 1;
            return {
                unsubscribe: () => {
                    /* noop */
                }
            } as never;
        })
    };

    const data: DataClient = {
        client: {} as never,
        currentUserId: vi.fn(async () => "user-1"),
        currentWorkspace: vi.fn(async () =>
            opts.workspace === undefined
                ? ({ id: "ws-1", name: "Test", slug: null, owner_id: "user-1", data: {}, created_at: "", updated_at: "" } as Workspace)
                : opts.workspace
        ),
        // The rest of the accessors aren't exercised by these tests; cast through never.
        workspaces: {} as never,
        workspaceMembers: {} as never,
        icps: {} as never,
        deals: {} as never,
        sequences: {} as never,
        signalConsoleAccounts: {} as never,
        signals: {} as never,
        discoveryFrameworks: {} as never,
        discoveryCallLogs: {} as never,
        pipelineSettings: {} as never,
        profiles: {} as never,
        studioArtifacts: {} as never,
        proofs: {} as never,
        advisorDeployments: {} as never,
        readinessSnapshots: {} as never,
        handoffArtifacts: {} as never,
        foundingGtmShares: {} as never,
        workspaceSessions,
        workspaceProfile: {} as never,
        observations: {} as never,
        briefingRuns: {} as never,
        briefingRawItems: {} as never,
        briefingEnrichedItems: {} as never,
        briefingClusters: {} as never,
        briefingPatterns: {} as never,
        briefingAuditEnvelopes: {} as never,
        briefingPatternFeedback: {} as never
    };

    return {
        data,
        insertCalls,
        updateCalls,
        get listCalls() {
            return listCalls;
        },
        get subscribeCalls() {
            return subscribeCalls;
        },
        setStoredRow: (row) => {
            storedRow = row;
        }
    };
}

beforeEach(() => {
    __resetSessionForTests();
});

// ─── bootSession ──────────────────────────────────────────────────

describe("bootSession", () => {
    it("returns null + flips loaded when no workspace is selected", async () => {
        const { data } = makeMockDataClient({ workspace: null });
        const out = await bootSession({ data, skipRealtime: true });
        expect(out.session).toBeNull();
        expect(session.value).toBeNull();
        expect(isSessionLoaded.value).toBe(true);
    });

    it("returns null + flips loaded when no session row exists for the workspace", async () => {
        const { data } = makeMockDataClient({ existingRow: null });
        const out = await bootSession({ data, skipRealtime: true });
        expect(out.session).toBeNull();
        expect(session.value).toBeNull();
        expect(isSessionLoaded.value).toBe(true);
    });

    it("loads + populates the signal when a row exists", async () => {
        const row = makeMockSessionRow({
            focused_object_type: "account",
            focused_object_id: "acct-1",
            focused_object_name: "Meridian",
            focused_object_room: "signal-console"
        });
        const { data } = makeMockDataClient({ existingRow: row });
        const out = await bootSession({ data, skipRealtime: true });
        expect(out.session?.focusedObjectName).toBe("Meridian");
        expect(session.value?.focusedObjectRoom).toBe("signal-console");
        expect(isSessionLoaded.value).toBe(true);
    });

    it("subscribes to Realtime by default", async () => {
        const mock = makeMockDataClient();
        await bootSession({ data: mock.data });
        expect(mock.subscribeCalls).toBe(1);
    });

    it("skips Realtime when skipRealtime is set", async () => {
        const mock = makeMockDataClient();
        await bootSession({ data: mock.data, skipRealtime: true });
        expect(mock.subscribeCalls).toBe(0);
    });
});

// ─── applyRealtimeUpdate ──────────────────────────────────────────

describe("applyRealtimeUpdate", () => {
    it("updates session on INSERT for the right workspace", () => {
        applyRealtimeUpdate(
            {
                eventType: "INSERT",
                new: makeMockSessionRow({
                    focused_object_type: "account",
                    focused_object_id: "x",
                    focused_object_name: "Meridian",
                    focused_object_room: "signal-console"
                }) as unknown as Record<string, unknown>,
                old: null
            },
            "ws-1"
        );
        expect(session.value?.focusedObjectName).toBe("Meridian");
    });

    it("ignores payloads for the wrong workspace", () => {
        applyRealtimeUpdate(
            {
                eventType: "UPDATE",
                new: makeMockSessionRow({ workspace_id: "other-ws" }) as unknown as Record<string, unknown>,
                old: null
            },
            "ws-1"
        );
        expect(session.value).toBeNull();
    });

    it("clears session on DELETE for the right workspace", () => {
        // Seed first
        applyRealtimeUpdate(
            {
                eventType: "INSERT",
                new: makeMockSessionRow() as unknown as Record<string, unknown>,
                old: null
            },
            "ws-1"
        );
        expect(session.value).not.toBeNull();
        // Then delete
        applyRealtimeUpdate(
            {
                eventType: "DELETE",
                new: null,
                old: { workspace_id: "ws-1" }
            },
            "ws-1"
        );
        expect(session.value).toBeNull();
    });
});

// ─── setFocusedObject ─────────────────────────────────────────────

describe("setFocusedObject", () => {
    it("inserts a new session row when none exists", async () => {
        const mock = makeMockDataClient({ existingRow: null });
        const out = await setFocusedObject(
            {
                type: "account",
                id: "acct-1",
                name: "Meridian",
                room: "signal-console"
            },
            { data: mock.data }
        );
        expect(out?.focusedObjectName).toBe("Meridian");
        expect(mock.insertCalls).toHaveLength(1);
        expect(mock.insertCalls[0]).toMatchObject({
            workspace_id: "ws-1",
            focused_object_name: "Meridian",
            focused_object_room: "signal-console"
        });
    });

    it("updates the existing row in place", async () => {
        const existing = makeMockSessionRow({ id: "sess-existing" });
        const mock = makeMockDataClient({ existingRow: existing });
        await setFocusedObject(
            {
                type: "deal",
                id: "deal-1",
                name: "Meridian deal",
                room: "deal-workspace"
            },
            { data: mock.data }
        );
        expect(mock.updateCalls).toHaveLength(1);
        expect(mock.updateCalls[0]?.id).toBe("sess-existing");
        expect(mock.updateCalls[0]?.patch).toMatchObject({
            focused_object_type: "deal",
            focused_object_room: "deal-workspace"
        });
        expect(mock.insertCalls).toHaveLength(0);
    });

    it("appends a synthetic 'focus' action to the recent log", async () => {
        const mock = makeMockDataClient({ existingRow: null });
        await setFocusedObject(
            {
                type: "account",
                id: "acct-1",
                name: "Meridian",
                room: "signal-console"
            },
            { data: mock.data }
        );
        const inserted = mock.insertCalls[0];
        const actions = inserted?.["recent_actions"] as ReadonlyArray<Record<string, unknown>>;
        expect(actions).toHaveLength(1);
        expect(actions[0]).toMatchObject({
            room: "signal-console",
            verb: "focus",
            objectType: "account",
            objectId: "acct-1",
            summary: "Focused on Meridian."
        });
    });

    it("preserves existing recent_actions when updating", async () => {
        const existing = makeMockSessionRow({
            id: "sess-1",
            recent_actions: [
                {
                    at: "2026-05-18T00:00:00Z",
                    room: "deal-workspace",
                    verb: "save",
                    objectType: "deal",
                    objectId: "deal-9",
                    summary: "Saved deal vitals."
                }
            ]
        });
        const mock = makeMockDataClient({ existingRow: existing });
        await setFocusedObject(
            {
                type: "account",
                id: "acct-1",
                name: "Meridian",
                room: "signal-console"
            },
            { data: mock.data }
        );
        const updated = mock.updateCalls[0]?.patch;
        const actions = updated?.["recent_actions"] as ReadonlyArray<Record<string, unknown>>;
        expect(actions).toHaveLength(2);
        // Newest first
        expect(actions[0]?.["summary"]).toBe("Focused on Meridian.");
        expect(actions[1]?.["summary"]).toBe("Saved deal vitals.");
    });

    it("returns null when no workspace is selected", async () => {
        const mock = makeMockDataClient({ workspace: null });
        const out = await setFocusedObject(
            {
                type: "account",
                id: "x",
                name: "x",
                room: "signal-console"
            },
            { data: mock.data }
        );
        expect(out).toBeNull();
        expect(mock.insertCalls).toHaveLength(0);
    });
});

// ─── clearFocus ───────────────────────────────────────────────────

describe("clearFocus", () => {
    it("returns null when no row exists (nothing to clear)", async () => {
        const mock = makeMockDataClient({ existingRow: null });
        const out = await clearFocus({ data: mock.data });
        expect(out).toBeNull();
        expect(mock.updateCalls).toHaveLength(0);
    });

    it("updates the row to null all focus fields", async () => {
        const existing = makeMockSessionRow({
            id: "sess-1",
            focused_object_type: "account",
            focused_object_id: "acct-1",
            focused_object_name: "Meridian",
            focused_object_room: "signal-console"
        });
        const mock = makeMockDataClient({ existingRow: existing });
        await clearFocus({ data: mock.data });
        expect(mock.updateCalls[0]?.patch).toEqual({
            focused_object_type: null,
            focused_object_id: null,
            focused_object_name: null,
            focused_object_room: null
        });
    });
});

// ─── pushRecentAction ─────────────────────────────────────────────

describe("pushRecentAction", () => {
    it("inserts a new row with the action if none exists", async () => {
        const mock = makeMockDataClient({ existingRow: null });
        await pushRecentAction(
            {
                room: "outbound-studio",
                verb: "log",
                objectType: "account",
                objectId: "acct-1",
                summary: "Logged an outbound email to Meridian."
            },
            { data: mock.data, now: 1716163200000 }
        );
        const inserted = mock.insertCalls[0];
        const actions = inserted?.["recent_actions"] as ReadonlyArray<Record<string, unknown>>;
        expect(actions).toHaveLength(1);
        expect(actions[0]).toMatchObject({
            room: "outbound-studio",
            verb: "log",
            summary: "Logged an outbound email to Meridian."
        });
    });

    it("prepends the new action to existing actions, newest first", async () => {
        const existing = makeMockSessionRow({
            id: "sess-1",
            recent_actions: [
                {
                    at: "2026-05-18T00:00:00Z",
                    room: "deal-workspace",
                    verb: "save",
                    objectType: "deal",
                    objectId: "deal-9",
                    summary: "Saved deal vitals."
                }
            ]
        });
        const mock = makeMockDataClient({ existingRow: existing });
        await pushRecentAction(
            {
                room: "discovery-studio",
                verb: "log",
                objectType: "call",
                objectId: "call-1",
                summary: "Logged a discovery call."
            },
            { data: mock.data, now: 1716163200000 }
        );
        const actions = mock.updateCalls[0]?.patch[
            "recent_actions"
        ] as ReadonlyArray<Record<string, unknown>>;
        expect(actions).toHaveLength(2);
        expect(actions[0]?.["summary"]).toBe("Logged a discovery call.");
        expect(actions[1]?.["summary"]).toBe("Saved deal vitals.");
    });
});
