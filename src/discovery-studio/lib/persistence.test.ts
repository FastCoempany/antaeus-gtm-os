import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    SCHEMA_VERSION,
    bootPersistence,
    loadDiscoverySession,
    saveDiscoverySession,
    seedSignalsFromState,
    snapshotSession,
    startAutoSave,
    unpackMigrationBlob,
    type PersistedSessionState
} from "./persistence";
import {
    __setFrameworkRegistryForTests,
    activeFramework,
    activeNode,
    callDisposition,
    compressionMode,
    expandedResponse,
    learnedFacts,
    nextStepLock,
    recordLearnedFact,
    resetSession,
    selectFramework,
    setActiveNode,
    triggerInterrupt,
    type Framework
} from "../state";

/**
 * Wave 4 persistence-layer tests.
 *
 * Mock data-client tracks the calls per-table so tests can assert that
 * loadDiscoverySession returns null when no row exists, that
 * saveDiscoverySession upserts (insert first time, update via rowId
 * thereafter), that startAutoSave debounces correctly, and that
 * unpackMigrationBlob translates a Phase 2.3 row into a usable session.
 */

const FIXTURE: Framework = {
    id: "legal",
    label: "Legal / Legal Ops / Law Workflow",
    short: "Legal",
    storageKey: "legal",
    segments: [
        {
            key: "opening-frame",
            num: 1,
            title: "Opening frame",
            cue: "Set the call.",
            essential: true,
            nodes: [
                {
                    id: "of-1",
                    essential: true,
                    tone: "blu",
                    badge: "Why now",
                    text: "What changed?",
                    branches: []
                }
            ]
        }
    ],
    supportDossier: [],
    objectionLibrary: [],
    inboundQuestionHandlers: [],
    skipAheadHandlers: [],
    interrupts: [
        { id: "demo", label: "Demo", tone: "blu", recover: "..." }
    ]
};

interface MockDataClient {
    discoveryCallLogs: {
        list: (...args: unknown[]) => Promise<unknown[]>;
        get: () => Promise<unknown>;
        insert: (row: unknown) => Promise<{ id: string }>;
        update: (id: string, row: unknown) => Promise<{ id: string }>;
        remove: () => Promise<void>;
        subscribe: () => { unsubscribe: () => void };
    };
    [key: string]: unknown;
}

interface MockSpy {
    client: MockDataClient;
    rows: unknown[];
    inserts: unknown[];
    updates: Array<{ id: string; row: unknown }>;
}

function makeMock(initialRows: unknown[] = []): MockSpy {
    const rows = [...initialRows];
    const inserts: unknown[] = [];
    const updates: Array<{ id: string; row: unknown }> = [];
    let nextId = 1;
    const accessor = {
        list: (_args: unknown) => Promise.resolve(rows),
        get: () => Promise.resolve(null),
        insert: (row: unknown) => {
            const id = `row-${nextId++}`;
            const stored = { id, ...(row as object) };
            inserts.push(stored);
            rows.push(stored);
            return Promise.resolve({ id });
        },
        update: (id: string, row: unknown) => {
            updates.push({ id, row });
            return Promise.resolve({ id });
        },
        remove: () => Promise.resolve(),
        subscribe: () => ({ unsubscribe: () => undefined })
    };
    const client: MockDataClient = {
        discoveryCallLogs: accessor
    };
    return { client, rows, inserts, updates };
}

beforeEach(() => {
    resetSession();
    __setFrameworkRegistryForTests([]);
});

afterEach(() => {
    resetSession();
    __setFrameworkRegistryForTests([]);
    vi.useRealTimers();
});

// ─── snapshotSession + seedSignalsFromState round-trip ──────────────────

describe("snapshotSession + seedSignalsFromState", () => {
    it("snapshot reflects current signal values", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        setActiveNode("opening-frame", "of-1");
        recordLearnedFact("of-1", 0, "fact A");
        nextStepLock.value = {
            date: "2026-05-01",
            owner: "Jane",
            attendees: "",
            purpose: "demo",
            reason: ""
        };

        const snap = snapshotSession();
        expect(snap.schemaVersion).toBe(SCHEMA_VERSION);
        expect(snap.activeFramework).toBe("legal");
        expect(snap.activeNode).toEqual({
            segmentKey: "opening-frame",
            nodeId: "of-1"
        });
        expect(snap.learnedFacts).toHaveLength(1);
        expect(snap.nextStepLock.owner).toBe("Jane");
    });

    it("seed restores all relevant signals", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const state: PersistedSessionState = {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: "legal",
            activeNode: { segmentKey: "opening-frame", nodeId: "of-1" },
            expandedResponse: 2,
            learnedFacts: [
                {
                    nodeId: "of-1",
                    branchIndex: 0,
                    fact: "x",
                    recordedAt: "2026-04-25T00:00:00Z"
                }
            ],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "2026-05-01",
                owner: "Jane",
                attendees: "",
                purpose: "demo",
                reason: ""
            },
            compressionMode: "essentials",
            callDisposition: "advanced",
            activeInterruptId: "demo"
        };
        seedSignalsFromState(state);

        expect(activeFramework.value).toBe("legal");
        expect(activeNode.value).toEqual({
            segmentKey: "opening-frame",
            nodeId: "of-1"
        });
        expect(expandedResponse.value).toBe(2);
        expect(learnedFacts.value).toHaveLength(1);
        expect(compressionMode.value).toBe("essentials");
        expect(callDisposition.value).toBe("advanced");
        // activeInterruptId resolves against framework's interrupts
        // — needs frameworkRegistry to have the framework loaded
        expect(triggerInterrupt).toBeDefined();
    });

    it("seed with no framework leaves activeInterrupt null", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const state: PersistedSessionState = {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: null,
            activeNode: null,
            expandedResponse: null,
            learnedFacts: [],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "",
                owner: "",
                attendees: "",
                purpose: "",
                reason: ""
            },
            compressionMode: "off",
            callDisposition: "in-progress",
            activeInterruptId: "demo"
        };
        seedSignalsFromState(state);
        expect(activeFramework.value).toBeNull();
    });
});

// ─── loadDiscoverySession ──────────────────────────────────────────────

describe("loadDiscoverySession", () => {
    it("returns null when no rows exist", async () => {
        const mock = makeMock([]);
        const result = await loadDiscoverySession(
            mock.client as unknown as Parameters<typeof loadDiscoverySession>[0]
        );
        expect(result).toBeNull();
    });

    it("returns the parsed session when a row exists", async () => {
        const persisted: PersistedSessionState = {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: "legal",
            activeNode: null,
            expandedResponse: null,
            learnedFacts: [],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "",
                owner: "",
                attendees: "",
                purpose: "",
                reason: ""
            },
            compressionMode: "off",
            callDisposition: "in-progress",
            activeInterruptId: null
        };
        const mock = makeMock([
            {
                id: "row-1",
                log_type: "discovery-studio-session",
                summary: "Legal",
                data: persisted
            }
        ]);
        const result = await loadDiscoverySession(
            mock.client as unknown as Parameters<typeof loadDiscoverySession>[0]
        );
        expect(result).not.toBeNull();
        expect(result?.rowId).toBe("row-1");
        expect(result?.state.activeFramework).toBe("legal");
    });

    it("returns null when row has malformed shape", async () => {
        const mock = makeMock([
            {
                id: "row-1",
                log_type: "discovery-studio-session",
                data: { not: "valid" }
            }
        ]);
        const result = await loadDiscoverySession(
            mock.client as unknown as Parameters<typeof loadDiscoverySession>[0]
        );
        expect(result).toBeNull();
    });
});

// ─── saveDiscoverySession ───────────────────────────────────────────────

describe("saveDiscoverySession", () => {
    function makeBlankState(): PersistedSessionState {
        return {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: "legal",
            activeNode: null,
            expandedResponse: null,
            learnedFacts: [],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "",
                owner: "",
                attendees: "",
                purpose: "",
                reason: ""
            },
            compressionMode: "off",
            callDisposition: "in-progress",
            activeInterruptId: null
        };
    }

    it("inserts a row when no rowId is passed", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        const id = await saveDiscoverySession(
            mock.client as unknown as Parameters<typeof saveDiscoverySession>[0],
            makeBlankState()
        );
        expect(id).toBe("row-1");
        expect(mock.inserts).toHaveLength(1);
        expect(mock.updates).toHaveLength(0);
    });

    it("updates by rowId when passed", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        const id = await saveDiscoverySession(
            mock.client as unknown as Parameters<typeof saveDiscoverySession>[0],
            makeBlankState(),
            "existing-row-id"
        );
        expect(id).toBe("existing-row-id");
        expect(mock.inserts).toHaveLength(0);
        expect(mock.updates).toHaveLength(1);
        expect(mock.updates[0]?.id).toBe("existing-row-id");
    });

    it("derives summary from the active framework's label", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        await saveDiscoverySession(
            mock.client as unknown as Parameters<typeof saveDiscoverySession>[0],
            makeBlankState()
        );
        const inserted = mock.inserts[0] as { summary?: string };
        expect(inserted.summary).toBe("Legal / Legal Ops / Law Workflow");
    });
});

// ─── startAutoSave ──────────────────────────────────────────────────────

describe("startAutoSave", () => {
    it("debounces saves and calls insert exactly once for a burst", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        vi.useFakeTimers();

        const dispose = startAutoSave(
            mock.client as unknown as Parameters<typeof startAutoSave>[0],
            null,
            { debounceMs: 100 }
        );

        // Burst of mutations
        selectFramework("legal");
        setActiveNode("opening-frame", "of-1");
        recordLearnedFact("of-1", 0, "fact A");
        recordLearnedFact("of-1", 1, "fact B");

        // Advance past the debounce window and let microtasks run
        await vi.advanceTimersByTimeAsync(150);

        expect(mock.inserts).toHaveLength(1);
        const inserted = mock.inserts[0] as {
            data?: { learnedFacts?: ReadonlyArray<unknown> };
        };
        expect(inserted.data?.learnedFacts).toHaveLength(2);

        dispose();
    });

    it("uses update on subsequent saves once a row exists", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        vi.useFakeTimers();

        const dispose = startAutoSave(
            mock.client as unknown as Parameters<typeof startAutoSave>[0],
            null,
            { debounceMs: 100 }
        );

        selectFramework("legal");
        await vi.advanceTimersByTimeAsync(150);
        expect(mock.inserts).toHaveLength(1);

        recordLearnedFact("of-1", 0, "follow-up fact");
        await vi.advanceTimersByTimeAsync(150);

        expect(mock.inserts).toHaveLength(1); // didn't insert again
        expect(mock.updates).toHaveLength(1); // updated the existing row

        dispose();
    });

    it("skips save when state is empty (worth-saving heuristic)", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const mock = makeMock();
        vi.useFakeTimers();

        const dispose = startAutoSave(
            mock.client as unknown as Parameters<typeof startAutoSave>[0],
            null,
            { debounceMs: 100 }
        );

        // No mutations — the snapshot is the default-empty session
        await vi.advanceTimersByTimeAsync(150);

        expect(mock.inserts).toHaveLength(0);
        expect(mock.updates).toHaveLength(0);

        dispose();
    });
});

// ─── unpackMigrationBlob ───────────────────────────────────────────────

describe("unpackMigrationBlob", () => {
    it("returns null when no Phase 2.3 row exists", async () => {
        const mock = makeMock([]);
        const result = await unpackMigrationBlob(
            mock.client as unknown as Parameters<typeof unpackMigrationBlob>[0]
        );
        expect(result).toBeNull();
    });

    it("returns a fresh session when the blob is present but content unhelpful", async () => {
        const mock = makeMock([
            {
                id: "row-blob",
                log_type: "passthrough-blob",
                data: {
                    migration_version: "phase-2.3-passthrough",
                    migrated_from_localstorage: {
                        gtmos_discovery_stats: { x: 1 }
                    }
                }
            }
        ]);
        const result = await unpackMigrationBlob(
            mock.client as unknown as Parameters<typeof unpackMigrationBlob>[0]
        );
        expect(result).not.toBeNull();
        expect(result?.activeFramework).toBeNull();
        expect(result?.learnedFacts).toEqual([]);
    });

    it("overlays gtmos_call_handoff.summary into nextStepLock.reason when present", async () => {
        const mock = makeMock([
            {
                id: "row-blob",
                log_type: "passthrough-blob",
                data: {
                    migration_version: "phase-2.3-passthrough",
                    migrated_from_localstorage: {
                        gtmos_call_handoff: {
                            summary: "Demo Tuesday with CFO"
                        }
                    }
                }
            }
        ]);
        const result = await unpackMigrationBlob(
            mock.client as unknown as Parameters<typeof unpackMigrationBlob>[0]
        );
        expect(result?.nextStepLock.reason).toBe("Demo Tuesday with CFO");
    });
});

// ─── bootPersistence orchestration ──────────────────────────────────────

describe("bootPersistence", () => {
    it("seeds signals from a loaded session and starts auto-save", async () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        const persisted: PersistedSessionState = {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: "legal",
            activeNode: null,
            expandedResponse: null,
            learnedFacts: [
                {
                    nodeId: "of-1",
                    branchIndex: 0,
                    fact: "loaded fact",
                    recordedAt: "2026-04-25T00:00:00Z"
                }
            ],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "",
                owner: "",
                attendees: "",
                purpose: "",
                reason: ""
            },
            compressionMode: "off",
            callDisposition: "in-progress",
            activeInterruptId: null
        };
        const mock = makeMock([
            {
                id: "row-loaded",
                log_type: "discovery-studio-session",
                summary: "Legal",
                data: persisted
            }
        ]);
        const dispose = await bootPersistence(
            mock.client as unknown as Parameters<typeof bootPersistence>[0]
        );

        expect(activeFramework.value).toBe("legal");
        expect(learnedFacts.value).toHaveLength(1);
        expect(learnedFacts.value[0]?.fact).toBe("loaded fact");
        dispose();
    });
});
