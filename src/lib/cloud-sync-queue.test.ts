import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    __clearQueueForTests,
    __resetAutoFlushForTests,
    bootRetryAutoFlush,
    enqueueRetry,
    flushQueue,
    readQueue
} from "./cloud-sync-queue";

class StorageStub {
    private map = new Map<string, string>();
    getItem(key: string): string | null {
        return this.map.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
    removeItem(key: string): void {
        this.map.delete(key);
    }
    raw(): Map<string, string> {
        return this.map;
    }
}

function makeStubClient(opts: {
    sequencesInsert?: ReturnType<typeof vi.fn>;
    sequencesUpdate?: ReturnType<typeof vi.fn>;
    sequencesRemove?: ReturnType<typeof vi.fn>;
}) {
    const accessor = (impls: typeof opts) => ({
        insert: impls.sequencesInsert ?? vi.fn().mockResolvedValue({ id: "ok" }),
        update: impls.sequencesUpdate ?? vi.fn().mockResolvedValue({ id: "ok" }),
        remove: impls.sequencesRemove ?? vi.fn().mockResolvedValue(undefined),
        list: vi.fn(),
        get: vi.fn(),
        subscribe: vi.fn()
    });
    const sequences = accessor(opts);
    return {
        client: {
            sequences,
            icps: accessor({}),
            deals: accessor({}),
            signalConsoleAccounts: accessor({}),
            discoveryFrameworks: accessor({}),
            discoveryCallLogs: accessor({}),
            pipelineSettings: accessor({}),
            studioArtifacts: accessor({}),
            proofs: accessor({}),
            advisorDeployments: accessor({}),
            readinessSnapshots: accessor({}),
            handoffArtifacts: accessor({}),
            profiles: accessor({}),
            workspaces: accessor({}),
            workspaceMembers: accessor({})
        } as never,
        sequences
    };
}

describe("enqueueRetry + readQueue", () => {
    let storage: StorageStub;

    beforeEach(() => {
        storage = new StorageStub();
        __clearQueueForTests({ storage: storage as never });
    });

    it("appends an op to localStorage", () => {
        enqueueRetry(
            {
                table: "sequences",
                op: "insert",
                payload: { sequence_key: "outbound", title: "x" } as never,
                source: "test"
            },
            { storage: storage as never }
        );
        const q = readQueue({ storage: storage as never });
        expect(q).toHaveLength(1);
        expect(q[0]?.table).toBe("sequences");
        expect(q[0]?.op).toBe("insert");
    });

    it("collapses duplicate (table+rowId+op) entries to the latest payload", () => {
        enqueueRetry(
            {
                table: "sequences",
                op: "update",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                payload: { title: "first" } as never,
                source: "test"
            },
            { storage: storage as never }
        );
        enqueueRetry(
            {
                table: "sequences",
                op: "update",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                payload: { title: "second" } as never,
                source: "test"
            },
            { storage: storage as never }
        );
        const q = readQueue({ storage: storage as never });
        expect(q).toHaveLength(1);
        expect((q[0]?.payload as { title: string }).title).toBe("second");
    });

    it("keeps insert + update + delete as separate entries (different op)", () => {
        enqueueRetry(
            {
                table: "sequences",
                op: "insert",
                payload: { title: "i" } as never,
                source: "t"
            },
            { storage: storage as never }
        );
        enqueueRetry(
            {
                table: "sequences",
                op: "update",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                payload: { title: "u" } as never,
                source: "t"
            },
            { storage: storage as never }
        );
        enqueueRetry(
            {
                table: "sequences",
                op: "delete",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                source: "t"
            },
            { storage: storage as never }
        );
        expect(readQueue({ storage: storage as never })).toHaveLength(3);
    });
});

describe("flushQueue", () => {
    let storage: StorageStub;

    beforeEach(() => {
        storage = new StorageStub();
        __clearQueueForTests({ storage: storage as never });
    });

    it("returns 0/0/0 when queue is empty", async () => {
        const { client } = makeStubClient({});
        const result = await flushQueue(client, { storage: storage as never });
        expect(result).toEqual({
            attempted: 0,
            succeeded: 0,
            stillPending: 0
        });
    });

    it("removes successful ops + leaves failures pending", async () => {
        const insertOk = vi.fn().mockResolvedValue({ id: "row-1" });
        const updateFail = vi.fn().mockRejectedValue(new Error("network"));
        const { client } = makeStubClient({
            sequencesInsert: insertOk,
            sequencesUpdate: updateFail
        });

        enqueueRetry(
            {
                table: "sequences",
                op: "insert",
                payload: { title: "ok" } as never,
                source: "t"
            },
            { storage: storage as never }
        );
        enqueueRetry(
            {
                table: "sequences",
                op: "update",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                payload: { title: "fail" } as never,
                source: "t"
            },
            { storage: storage as never }
        );

        const result = await flushQueue(client, {
            storage: storage as never
        });
        expect(result.attempted).toBe(2);
        expect(result.succeeded).toBe(1);
        expect(result.stillPending).toBe(1);
        expect(insertOk).toHaveBeenCalledOnce();
        expect(updateFail).toHaveBeenCalledOnce();

        const q = readQueue({ storage: storage as never });
        expect(q).toHaveLength(1);
        expect(q[0]?.op).toBe("update");
        expect(q[0]?.attempts).toBe(1);
        expect(q[0]?.lastAttemptAt).not.toBeNull();
    });

    it("calls accessor.remove for delete ops", async () => {
        const removeOk = vi.fn().mockResolvedValue(undefined);
        const { client } = makeStubClient({ sequencesRemove: removeOk });
        enqueueRetry(
            {
                table: "sequences",
                op: "delete",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                source: "t"
            },
            { storage: storage as never }
        );
        const result = await flushQueue(client, {
            storage: storage as never
        });
        expect(result.succeeded).toBe(1);
        expect(removeOk).toHaveBeenCalledWith(
            "550e8400-e29b-41d4-a716-446655440000"
        );
    });

    it("retries the same op after a failed flush (attempts increments)", async () => {
        const updateFail = vi
            .fn()
            .mockRejectedValueOnce(new Error("first"))
            .mockResolvedValueOnce({ id: "ok" });
        const { client } = makeStubClient({ sequencesUpdate: updateFail });
        enqueueRetry(
            {
                table: "sequences",
                op: "update",
                rowId: "550e8400-e29b-41d4-a716-446655440000",
                payload: { title: "retry" } as never,
                source: "t"
            },
            { storage: storage as never }
        );

        const r1 = await flushQueue(client, { storage: storage as never });
        expect(r1.succeeded).toBe(0);
        expect(r1.stillPending).toBe(1);

        const r2 = await flushQueue(client, { storage: storage as never });
        expect(r2.succeeded).toBe(1);
        expect(r2.stillPending).toBe(0);
        expect(updateFail).toHaveBeenCalledTimes(2);
    });
});

describe("bootRetryAutoFlush", () => {
    beforeEach(() => {
        __resetAutoFlushForTests();
    });

    it("registers online + visibilitychange listeners + interval", () => {
        const onlineHandlers: Array<() => void> = [];
        const visHandlers: Array<() => void> = [];
        const win = {
            addEventListener: (
                type: "online" | "visibilitychange",
                handler: () => void
            ) => {
                if (type === "online") onlineHandlers.push(handler);
                if (type === "visibilitychange") visHandlers.push(handler);
            },
            removeEventListener: () => undefined,
            setInterval: vi.fn().mockReturnValue(1),
            clearInterval: vi.fn()
        };
        const { client } = makeStubClient({});
        const handle = bootRetryAutoFlush(() => client, {
            win: win as never,
            doc: { visibilityState: "visible" } as never,
            nav: { onLine: true } as never,
            storage: new StorageStub() as never
        });
        expect(onlineHandlers).toHaveLength(1);
        expect(visHandlers).toHaveLength(1);
        expect(win.setInterval).toHaveBeenCalledOnce();
        handle.stop();
        expect(win.clearInterval).toHaveBeenCalledOnce();
    });

    it("is idempotent — second boot is a no-op while first is active", () => {
        const win = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            setInterval: vi.fn().mockReturnValue(1),
            clearInterval: vi.fn()
        };
        const { client } = makeStubClient({});
        const ctx = {
            win: win as never,
            doc: { visibilityState: "visible" } as never,
            nav: { onLine: true } as never,
            storage: new StorageStub() as never
        };
        bootRetryAutoFlush(() => client, ctx);
        bootRetryAutoFlush(() => client, ctx);
        expect(win.setInterval).toHaveBeenCalledOnce();
    });
});
