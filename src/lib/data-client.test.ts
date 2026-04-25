import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDataClient, optimisticMutate } from "./data-client";
import {
    __resetSupabaseClientForTests,
    __setSupabaseClientForTests,
    type AntaeusSupabaseClient
} from "./supabase-client";
import type { Deal } from "./database.types";

/**
 * Phase 2.2 data-client tests.
 *
 * These are unit tests — they mock the Supabase client and verify the
 * data-client wraps it correctly. Live-DB integration tests are deferred
 * to Phase 3+ when the CLI types generation + room migration lands and
 * real workflows can be exercised end-to-end.
 */

// ─── Mock Supabase client ───────────────────────────────────────────────

type Thenable<T> = Promise<T>;

interface MockQueryResult<T> {
    data: T | null;
    error: { message: string } | null;
}

function makeMockClient(): {
    client: AntaeusSupabaseClient;
    calls: Array<{ op: string; args: unknown[] }>;
    setNextResult: (result: MockQueryResult<unknown>) => void;
    setAuthUser: (user: { id: string } | null) => void;
} {
    const calls: Array<{ op: string; args: unknown[] }> = [];
    let nextResult: MockQueryResult<unknown> = { data: null, error: null };
    let authUser: { id: string } | null = { id: "test-user-id" };

    const builder: Record<string, unknown> = {};
    const then = (onFulfilled: (v: MockQueryResult<unknown>) => unknown): Thenable<unknown> => {
        return Promise.resolve(nextResult).then(onFulfilled);
    };
    for (const op of ["select", "insert", "update", "delete", "eq", "order", "limit"] as const) {
        builder[op] = (...args: unknown[]) => {
            calls.push({ op, args });
            return builder;
        };
    }
    builder.single = () => Promise.resolve(nextResult);
    builder.maybeSingle = () => Promise.resolve(nextResult);
    builder.then = then;

    const client = {
        from: (table: string) => {
            calls.push({ op: "from", args: [table] });
            return builder;
        },
        auth: {
            getUser: () =>
                Promise.resolve({
                    data: { user: authUser },
                    error: null
                })
        },
        channel: (name: string) => {
            calls.push({ op: "channel", args: [name] });
            const chan: Record<string, unknown> = {};
            chan.on = (..._args: unknown[]) => chan;
            chan.subscribe = () => chan;
            chan.unsubscribe = () => Promise.resolve("ok");
            return chan;
        }
    } as unknown as AntaeusSupabaseClient;

    return {
        client,
        calls,
        setNextResult: (r) => {
            nextResult = r;
        },
        setAuthUser: (u) => {
            authUser = u;
        }
    };
}

// ─── Global test scaffolding ────────────────────────────────────────────

beforeEach(() => {
    __resetSupabaseClientForTests();
    vi.stubGlobal("crypto", {
        randomUUID: () => "00000000-0000-0000-0000-000000000000"
    });
});

afterEach(() => {
    __resetSupabaseClientForTests();
    vi.unstubAllGlobals();
});

// ─── Tests ──────────────────────────────────────────────────────────────

describe("createDataClient", () => {
    it("exposes accessors for every sacred noun table", () => {
        const mock = makeMockClient();
        __setSupabaseClientForTests(mock.client);
        const data = createDataClient();

        const expected = [
            "workspaces",
            "workspaceMembers",
            "icps",
            "deals",
            "sequences",
            "signalConsoleAccounts",
            "discoveryFrameworks",
            "discoveryCallLogs",
            "pipelineSettings",
            "profiles",
            "studioArtifacts",
            "proofs",
            "advisorDeployments",
            "readinessSnapshots",
            "handoffArtifacts"
        ] as const;

        for (const key of expected) {
            const accessor = data[key];
            expect(accessor, `missing accessor: ${key}`).toBeDefined();
            expect(typeof accessor.list).toBe("function");
            expect(typeof accessor.get).toBe("function");
            expect(typeof accessor.insert).toBe("function");
            expect(typeof accessor.update).toBe("function");
            expect(typeof accessor.remove).toBe("function");
            expect(typeof accessor.subscribe).toBe("function");
        }
    });

    it("accepts an explicit client without touching the singleton", () => {
        const mockA = makeMockClient();
        const mockB = makeMockClient();
        __setSupabaseClientForTests(mockA.client);

        const data = createDataClient(mockB.client);
        expect(data.client).toBe(mockB.client);
        expect(data.client).not.toBe(mockA.client);
    });
});

describe("NounAccessor — list", () => {
    it("builds a select() with where, orderBy, and limit", async () => {
        const mock = makeMockClient();
        mock.setNextResult({ data: [], error: null });
        const data = createDataClient(mock.client);

        await data.deals.list({
            where: { stage: "won" },
            orderBy: { column: "created_at", ascending: false },
            limit: 50
        });

        const ops = mock.calls.map((c) => c.op);
        expect(ops).toContain("from");
        expect(ops).toContain("select");
        expect(ops).toContain("eq");
        expect(ops).toContain("order");
        expect(ops).toContain("limit");

        const eq = mock.calls.find((c) => c.op === "eq");
        expect(eq?.args).toEqual(["stage", "won"]);

        const order = mock.calls.find((c) => c.op === "order");
        expect(order?.args).toEqual(["created_at", { ascending: false }]);

        const limit = mock.calls.find((c) => c.op === "limit");
        expect(limit?.args).toEqual([50]);
    });

    it("defaults to limit 500 when not specified", async () => {
        const mock = makeMockClient();
        mock.setNextResult({ data: [], error: null });
        const data = createDataClient(mock.client);

        await data.deals.list();

        const limit = mock.calls.find((c) => c.op === "limit");
        expect(limit?.args).toEqual([500]);
    });

    it("throws on server error", async () => {
        const mock = makeMockClient();
        mock.setNextResult({ data: null, error: { message: "nope" } });
        const data = createDataClient(mock.client);

        await expect(data.deals.list()).rejects.toEqual({ message: "nope" });
    });
});

describe("NounAccessor — get/insert/update/remove", () => {
    it("get() queries by id", async () => {
        const mock = makeMockClient();
        const row = { id: "abc", stage: "won" } as Deal;
        mock.setNextResult({ data: row, error: null });
        const data = createDataClient(mock.client);

        const result = await data.deals.get("abc");
        expect(result).toEqual(row);

        const eq = mock.calls.find((c) => c.op === "eq");
        expect(eq?.args).toEqual(["id", "abc"]);
    });

    it("insert() calls insert + returns the row", async () => {
        const mock = makeMockClient();
        const row = { id: "new-id", stage: "prospect" } as Deal;
        mock.setNextResult({ data: row, error: null });
        const data = createDataClient(mock.client);

        const result = await data.deals.insert({ stage: "prospect" });
        expect(result).toEqual(row);

        const insert = mock.calls.find((c) => c.op === "insert");
        expect(insert?.args[0]).toEqual({ stage: "prospect" });
    });

    it("update() patches by id and returns the updated row", async () => {
        const mock = makeMockClient();
        const row = { id: "abc", stage: "won" } as Deal;
        mock.setNextResult({ data: row, error: null });
        const data = createDataClient(mock.client);

        const result = await data.deals.update("abc", { stage: "won" });
        expect(result).toEqual(row);

        const update = mock.calls.find((c) => c.op === "update");
        expect(update?.args[0]).toEqual({ stage: "won" });
        const eq = mock.calls.find((c) => c.op === "eq");
        expect(eq?.args).toEqual(["id", "abc"]);
    });

    it("remove() deletes by id and resolves void", async () => {
        const mock = makeMockClient();
        mock.setNextResult({ data: null, error: null });
        const data = createDataClient(mock.client);

        await expect(data.deals.remove("abc")).resolves.toBeUndefined();

        const del = mock.calls.find((c) => c.op === "delete");
        expect(del).toBeDefined();
        const eq = mock.calls.find((c) => c.op === "eq");
        expect(eq?.args).toEqual(["id", "abc"]);
    });
});

describe("NounAccessor — subscribe", () => {
    it("opens a realtime channel scoped to the table", () => {
        const mock = makeMockClient();
        const data = createDataClient(mock.client);

        const channel = data.deals.subscribe(() => undefined);
        expect(channel).toBeDefined();

        const chan = mock.calls.find((c) => c.op === "channel");
        expect(chan).toBeDefined();
        expect(chan?.args[0]).toMatch(/^antaeus:deals:/);
    });
});

describe("currentWorkspace / currentUserId", () => {
    it("returns null when no user is signed in", async () => {
        const mock = makeMockClient();
        mock.setAuthUser(null);
        const data = createDataClient(mock.client);

        expect(await data.currentUserId()).toBeNull();
        expect(await data.currentWorkspace()).toBeNull();
    });

    it("currentWorkspace queries by owner_id + order asc + limit 1", async () => {
        const mock = makeMockClient();
        mock.setAuthUser({ id: "user-xyz" });
        const workspace = { id: "ws-1", owner_id: "user-xyz", name: "WS" };
        mock.setNextResult({ data: workspace, error: null });
        const data = createDataClient(mock.client);

        const result = await data.currentWorkspace();
        expect(result).toEqual(workspace);

        const eq = mock.calls.find((c) => c.op === "eq");
        expect(eq?.args).toEqual(["owner_id", "user-xyz"]);
    });
});

describe("optimisticMutate", () => {
    it("applies transform synchronously and the server call eventually", async () => {
        const initial = [1, 2, 3];
        const { optimistic, promise } = optimisticMutate(
            initial,
            (s) => s.map((x) => x * 2),
            () => Promise.resolve("server-ok")
        );
        expect(optimistic).toEqual([2, 4, 6]);
        expect(initial).toEqual([1, 2, 3]); // original untouched
        await expect(promise).resolves.toBe("server-ok");
    });

    it("rollback() returns the pre-transform state", () => {
        const initial = { count: 10 };
        const { optimistic, rollback } = optimisticMutate(
            initial,
            (s) => ({ count: s.count + 1 }),
            () => Promise.resolve("ok")
        );
        expect(optimistic.count).toBe(11);
        expect(rollback()).toBe(initial);
    });

    it("server rejection propagates via promise", async () => {
        const initial: number[] = [];
        const { promise } = optimisticMutate(
            initial,
            (s) => [...s, 1],
            () => Promise.reject(new Error("server down"))
        );
        await expect(promise).rejects.toThrow("server down");
    });
});
