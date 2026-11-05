import { describe, expect, it, vi } from "vitest";
import {
    checkCloudConnection,
    deleteCloudWorkspace,
    EMPTY_COUNTS,
    EXPORT_PAGE_SIZE,
    exportCloudWorkspace,
    isCloudExportFile,
    loadCloudRowCounts,
    restoreCloudExport,
    type CloudConnectionState
} from "./cloud-sync";
import { sectionOrder, tablesToDelete, WORKSPACE_TABLES } from "./workspace-tables";

interface ListMock {
    list: ReturnType<typeof vi.fn>;
}

function makeStubClient(opts: {
    factoryThrows?: boolean;
    authError?: { message: string } | null;
    user?: { id: string; email: string | null } | null;
    workspace?: {
        id: string;
        name: string;
        created_at: string | null;
    } | null;
    listResults?: Partial<Record<string, unknown[]>>;
    listShouldFail?: boolean;
}) {
    if (opts.factoryThrows) {
        return () => {
            throw new Error("VITE_SUPABASE_URL is not set");
        };
    }
    const lists: Record<string, ListMock> = {};
    const tables = [
        "icps",
        "deals",
        "proofs",
        "advisorDeployments",
        "signalConsoleAccounts",
        "sequences",
        "discoveryCallLogs",
        "studioArtifacts",
        "pipelineSettings"
    ];
    for (const t of tables) {
        lists[t] = {
            list: vi.fn().mockImplementation(() => {
                if (opts.listShouldFail) {
                    return Promise.reject(new Error("network"));
                }
                return Promise.resolve(opts.listResults?.[t] ?? []);
            })
        };
    }
    const client = {
        client: {
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: opts.user ?? null },
                    error: opts.authError ?? null
                })
            }
        },
        currentWorkspace: vi.fn().mockResolvedValue(opts.workspace ?? null),
        ...lists
    };
    return () => client as unknown as Parameters<
        typeof checkCloudConnection
    >[0] extends () => infer R
        ? R
        : never;
}

describe("checkCloudConnection", () => {
    it("returns no-credentials when factory throws", async () => {
        const factory = makeStubClient({ factoryThrows: true });
        const state = await checkCloudConnection(
            factory as unknown as () => Parameters<
                typeof checkCloudConnection
            >[0] extends () => infer R
                ? R
                : never
        );
        expect(state.status).toBe("no-credentials");
        expect(state.errorMessage).toContain("VITE_SUPABASE_URL");
    });

    it("returns auth-missing when user is null", async () => {
        const factory = makeStubClient({ user: null });
        const state = (await checkCloudConnection(
            factory as never
        )) as CloudConnectionState;
        expect(state.status).toBe("auth-missing");
    });

    it("returns connected with workspace when user + workspace exist", async () => {
        const factory = makeStubClient({
            user: { id: "u1", email: "test@example.com" },
            workspace: {
                id: "ws_1",
                name: "Acme Workspace",
                created_at: "2026-01-01T00:00:00Z"
            }
        });
        const state = (await checkCloudConnection(
            factory as never
        )) as CloudConnectionState;
        expect(state.status).toBe("connected");
        expect(state.userEmail).toBe("test@example.com");
        expect(state.workspace?.name).toBe("Acme Workspace");
    });

    it("returns error when auth call errors", async () => {
        const factory = makeStubClient({
            authError: { message: "rate limit" },
            user: null
        });
        const state = (await checkCloudConnection(
            factory as never
        )) as CloudConnectionState;
        expect(state.status).toBe("error");
        expect(state.errorMessage).toBe("rate limit");
    });
});

describe("loadCloudRowCounts", () => {
    it("returns EMPTY_COUNTS when factory throws", async () => {
        const factory = makeStubClient({ factoryThrows: true });
        const counts = await loadCloudRowCounts(factory as never);
        expect(counts).toEqual(EMPTY_COUNTS);
    });

    it("counts rows per table when client returns lists", async () => {
        const factory = makeStubClient({
            user: { id: "u1", email: "t@t" },
            listResults: {
                icps: [{ id: "1" }, { id: "2" }],
                deals: [{ id: "1" }, { id: "2" }, { id: "3" }],
                proofs: [{ id: "1" }],
                advisorDeployments: [],
                signalConsoleAccounts: [{ id: "1" }],
                sequences: [{ id: "1" }, { id: "2" }],
                discoveryCallLogs: [{ id: "1" }],
                studioArtifacts: [
                    { id: "1" },
                    { id: "2" },
                    { id: "3" },
                    { id: "4" }
                ],
                pipelineSettings: [{ id: "1" }]
            }
        });
        const counts = await loadCloudRowCounts(factory as never);
        expect(counts.icps).toBe(2);
        expect(counts.deals).toBe(3);
        expect(counts.proofs).toBe(1);
        expect(counts.advisorDeployments).toBe(0);
        expect(counts.signalConsoleAccounts).toBe(1);
        expect(counts.sequences).toBe(2);
        expect(counts.discoveryCallLogs).toBe(1);
        expect(counts.studioArtifacts).toBe(4);
        expect(counts.pipelineSettings).toBe(1);
    });

    it("returns 0 for tables that error (per-table catch)", async () => {
        const factory = makeStubClient({
            user: { id: "u", email: "e" },
            listShouldFail: true
        });
        const counts = await loadCloudRowCounts(factory as never);
        expect(counts).toEqual(EMPTY_COUNTS);
    });
});

// ─── Download / Delete / Restore — fake Supabase ────────────────────

type Row = Record<string, unknown>;

interface FakeOptions {
    rows?: Record<string, Row[]>;
    failRead?: string[];
    failDelete?: string[];
    rpc?: "ok" | "missing" | "partial";
    workspace?: { id: string; name: string } | null;
    userId?: string | null;
    factoryThrows?: boolean;
}

function makeFakeClient(opts: FakeOptions) {
    if (opts.factoryThrows) {
        return {
            factory: () => {
                throw new Error("VITE_SUPABASE_URL is not set");
            },
            calls: { reads: [] as string[], deletes: [] as string[], upserts: [] as Array<{ table: string; rows: unknown[]; ignore: boolean }>, rpc: [] as unknown[] }
        };
    }
    const db: Record<string, Row[]> = {};
    for (const [t, rows] of Object.entries(opts.rows ?? {})) db[t] = rows.map((r) => ({ ...r }));
    const calls = {
        reads: [] as string[],
        deletes: [] as string[],
        upserts: [] as Array<{ table: string; rows: unknown[]; ignore: boolean }>,
        rpc: [] as unknown[]
    };
    function builder(table: string) {
        let op: "select" | "upsert" | "delete" = "select";
        const filters: Array<[string, string]> = [];
        let range: [number, number] = [0, Number.MAX_SAFE_INTEGER];
        let upsertRows: unknown[] = [];
        let ignore = false;
        const b = {
            select: () => b,
            eq: (c: string, v: string) => {
                filters.push([c, v]);
                return b;
            },
            order: () => b,
            range: (f: number, to: number) => {
                range = [f, to];
                return b;
            },
            upsert: (rows: unknown[], o?: { ignoreDuplicates?: boolean }) => {
                op = "upsert";
                upsertRows = rows;
                ignore = o?.ignoreDuplicates ?? false;
                return b;
            },
            delete: () => {
                op = "delete";
                return b;
            },
            then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
                try {
                    const match = (r: Row) => filters.every(([c, v]) => r[c] === v);
                    if (op === "select") {
                        calls.reads.push(table);
                        if (opts.failRead?.includes(table)) {
                            return Promise.resolve({ data: null, error: { message: `${table} read failed` } }).then(resolve, reject);
                        }
                        const all = (db[table] ?? []).filter(match);
                        return Promise.resolve({ data: all.slice(range[0], range[1] + 1), error: null }).then(resolve, reject);
                    }
                    if (op === "delete") {
                        calls.deletes.push(table);
                        if (opts.failDelete?.includes(table)) {
                            return Promise.resolve({ data: null, error: { message: "denied" }, count: null }).then(resolve, reject);
                        }
                        const before = db[table] ?? [];
                        const kept = before.filter((r) => !match(r));
                        db[table] = kept;
                        return Promise.resolve({ data: null, error: null, count: before.length - kept.length }).then(resolve, reject);
                    }
                    calls.upserts.push({ table, rows: upsertRows, ignore });
                    return Promise.resolve({ data: null, error: null }).then(resolve, reject);
                } catch (e) {
                    return Promise.reject(e).then(resolve, reject);
                }
            }
        };
        return b;
    }
    const sb = {
        from: (t: string) => builder(t),
        rpc: (fn: string, args: { ws: string }) => {
            calls.rpc.push({ fn, args });
            if (opts.rpc === "missing" || opts.rpc === undefined) {
                return Promise.resolve({ data: null, error: { message: "Could not find the function public.delete_workspace_data", code: "PGRST202" } });
            }
            const deleted: Record<string, number> = {};
            for (const spec of tablesToDelete()) {
                const before = db[spec.table] ?? [];
                const kept = before.filter((r) => r.workspace_id !== args.ws);
                deleted[spec.table] = before.length - kept.length;
                db[spec.table] = kept;
            }
            const errors = opts.rpc === "partial" ? { observations: "boom" } : {};
            return Promise.resolve({ data: { deleted, errors }, error: null });
        },
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: opts.userId === null ? null : { email: "t@t.com" } },
                error: null
            })
        }
    };
    const client = {
        client: sb,
        currentWorkspace: vi.fn().mockResolvedValue(
            opts.workspace === undefined ? { id: "ws-1", name: "Acme" } : opts.workspace
        ),
        currentUserId: vi.fn().mockResolvedValue(opts.userId === undefined ? "u1" : opts.userId)
    };
    return { factory: () => client as never, calls, db };
}

describe("exportCloudWorkspace — every table, organized by section", () => {
    it("returns a degraded snapshot when the factory throws", async () => {
        const { factory } = makeFakeClient({ factoryThrows: true });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.totalRows).toBe(0);
        expect(snap.errors[0]!.table).toBe("<client>");
        expect(snap.sections).toEqual({});
        expect(snap.source).toBe("antaeus-workspace-export-v2");
    });

    it("reads every readable registry table, files rows under plain sections", async () => {
        const { factory, calls } = makeFakeClient({
            rows: {
                deals: [{ id: "d1", workspace_id: "ws-1" }, { id: "d9", workspace_id: "ws-other" }],
                observations: [{ id: "o1", workspace_id: "ws-1" }],
                captured_meetings: [{ id: "m1", workspace_id: "ws-1" }],
                founding_gtm_shares: [{ id: "s1", workspace_id: "ws-1" }],
                profiles: [{ id: "p1", user_id: "u1" }, { id: "p2", user_id: "u2" }]
            }
        });
        const snap = await exportCloudWorkspace(factory as never);
        const readable = WORKSPACE_TABLES.filter((t) => t.memberRead).map((t) => t.table);
        expect(new Set(calls.reads)).toEqual(new Set(readable));
        expect(snap.manifest.map((m) => m.table)).toEqual(readable);
        // Scoped to this workspace (and to the signed-in person for profiles).
        expect(snap.perTableCount["deals"]).toBe(1);
        expect(snap.perTableCount["profiles"]).toBe(1);
        expect(snap.totalRows).toBe(5);
        // Organized by plain-English section, in app order.
        expect(Object.keys(snap.sections)).toEqual([...sectionOrder()]);
        const deals = snap.sections["Deals"]!.tables.find((t) => t.table === "deals")!;
        expect(deals.label).toBe("Deals");
        expect(deals.rows).toEqual([{ id: "d1", workspace_id: "ws-1" }]);
        expect(snap.sections["Things the system noticed"]!.rowCount).toBe(1);
        expect(snap.sections["Outreach and meetings"]!.tables.map((t) => t.table)).toContain("captured_meetings");
        expect(snap.workspaceName).toBe("Acme");
        expect(snap.userEmail).toBe("t@t.com");
        expect(snap.errors).toEqual([]);
    });

    it("pages past the page size so nothing is cut off", async () => {
        const many = Array.from({ length: EXPORT_PAGE_SIZE * 2 + 5 }, (_, i) => ({ id: `d${i}`, workspace_id: "ws-1" }));
        const { factory } = makeFakeClient({ rows: { deals: many } });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.perTableCount["deals"]).toBe(many.length);
    });

    it("one failing table is noted; the rest still land", async () => {
        const { factory } = makeFakeClient({
            rows: { icps: [{ id: "i1", workspace_id: "ws-1" }] },
            failRead: ["observations"]
        });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.errors).toEqual([{ table: "observations", reason: "observations read failed" }]);
        expect(snap.manifest.find((m) => m.table === "observations")!.error).toContain("failed");
        expect(snap.perTableCount["icps"]).toBe(1);
    });

    it("skips the per-person profile when no one is signed in", async () => {
        const { factory, calls } = makeFakeClient({ userId: null });
        await exportCloudWorkspace(factory as never);
        expect(calls.reads).not.toContain("profiles");
    });
});

describe("deleteCloudWorkspace — everything", () => {
    it("cancels with a plain reason when no workspace is found", async () => {
        const { factory, calls } = makeFakeClient({ workspace: null });
        const res = await deleteCloudWorkspace(factory as never);
        expect(res.cancelled).toBe(true);
        expect(calls.rpc).toEqual([]);
    });

    it("uses the server delete and reports per-table counts", async () => {
        const { factory, calls, db } = makeFakeClient({
            rpc: "ok",
            rows: {
                deals: [{ id: "d1", workspace_id: "ws-1" }],
                observations: [{ id: "o1", workspace_id: "ws-1" }],
                profiles: [{ id: "p1", user_id: "u1", workspace_id: "ws-1" }]
            }
        });
        const res = await deleteCloudWorkspace(factory as never);
        expect(res.method).toBe("server");
        expect(calls.rpc).toEqual([{ fn: "delete_workspace_data", args: { ws: "ws-1" } }]);
        expect(res.totalDeleted).toBe(2);
        expect(res.perTable["observations"]).toBe(1);
        expect(res.errors).toEqual([]);
        // Profiles are kept.
        expect(db!["profiles"]).toHaveLength(1);
    });

    it("surfaces per-table errors from the server delete", async () => {
        const { factory } = makeFakeClient({ rpc: "partial" });
        const res = await deleteCloudWorkspace(factory as never);
        expect(res.errors).toEqual(["observations: boom"]);
    });

    it("falls back to per-table deletes when the server delete isn't deployed", async () => {
        const { factory, calls } = makeFakeClient({
            rpc: "missing",
            rows: { deals: [{ id: "d1", workspace_id: "ws-1" }] },
            failDelete: ["icps"]
        });
        const res = await deleteCloudWorkspace(factory as never);
        expect(res.method).toBe("per-table");
        expect(res.perTable["deals"]).toBe(1);
        const memberDeletable = tablesToDelete().filter((t) => t.memberDelete).map((t) => t.table);
        expect(calls.deletes).toEqual(memberDeletable);
        // Tables only the server can empty are reported, not claimed.
        expect(res.errors.some((e) => e.startsWith("observations:"))).toBe(true);
        expect(res.errors.some((e) => e.startsWith("icps: denied"))).toBe(true);
        expect(calls.deletes).not.toContain("profiles");
    });
});

describe("restoreCloudExport", () => {
    it("restores a sectioned download in registry order, skipping system-written parts", async () => {
        const { factory, calls } = makeFakeClient({});
        const snapshot = {
            source: "antaeus-workspace-export-v2",
            sections: {
                Deals: { tables: [{ table: "deals", rows: [{ id: "d1" }] }] },
                Pilots: { tables: [{ table: "proofs", rows: [{ id: "p1" }] }] },
                "Readiness and the handoff": { tables: [{ table: "readiness_snapshots", rows: [{ id: "r1" }] }] },
                "Things the system noticed": { tables: [{ table: "observations", rows: [{ id: "o1" }] }] },
                "Accounts and signals": { tables: [{ table: "signal_console_accounts", rows: [{ id: "a1" }] }] }
            }
        };
        expect(isCloudExportFile(snapshot)).toBe(true);
        const res = await restoreCloudExport(factory as never, snapshot);
        expect(calls.upserts.map((u) => u.table)).toEqual([
            "signal_console_accounts",
            "deals",
            "proofs",
            "readiness_snapshots"
        ]);
        expect(calls.upserts.find((u) => u.table === "readiness_snapshots")!.ignore).toBe(true);
        expect(res.restoredRows).toBe(4);
        expect(res.skippedTables).toEqual(["observations"]);
    });

    it("still reads the older flat download", async () => {
        const { factory, calls } = makeFakeClient({});
        const old = { source: "antaeus-cloud-export-v1", tables: { icps: [{ id: "i1" }] } };
        expect(isCloudExportFile(old)).toBe(true);
        const res = await restoreCloudExport(factory as never, old);
        expect(calls.upserts.map((u) => u.table)).toEqual(["icps"]);
        expect(res.restoredRows).toBe(1);
    });
});
