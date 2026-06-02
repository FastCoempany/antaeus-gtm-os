import { describe, expect, it, vi } from "vitest";
import {
    checkCloudConnection,
    EMPTY_COUNTS,
    loadCloudRowCounts,
    type CloudConnectionState
} from "./cloud-sync";

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

// ─── exportCloudWorkspace (ADR-016 pre-beta hygiene) ────────────────

function makeExportClient(opts: {
    factoryThrows?: boolean;
    listResults?: Partial<Record<string, unknown[]>>;
    listShouldFail?: boolean;
    failOnTable?: string;
    workspace?: { id: string; name: string; created_at: string | null } | null;
    user?: { id: string; email: string | null } | null;
}) {
    if (opts.factoryThrows) {
        return () => {
            throw new Error("VITE_SUPABASE_URL is not set");
        };
    }
    const tables = [
        "icps",
        "deals",
        "proofs",
        "advisorDeployments",
        "signalConsoleAccounts",
        "sequences",
        "discoveryCallLogs",
        "studioArtifacts",
        "pipelineSettings",
        "discoveryFrameworks",
        "readinessSnapshots",
        "handoffArtifacts",
        "outdoorsEvents",
        "workspaceProfile"
    ];
    const lists: Record<string, { list: ReturnType<typeof vi.fn> }> = {};
    for (const t of tables) {
        lists[t] = {
            list: vi.fn().mockImplementation(() => {
                if (opts.listShouldFail) {
                    return Promise.reject(new Error("network"));
                }
                if (opts.failOnTable === t) {
                    return Promise.reject(new Error(`${t} failed`));
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
                    error: null
                })
            }
        },
        currentUserId: vi
            .fn()
            .mockResolvedValue(opts.user?.id ?? null),
        currentWorkspace: vi
            .fn()
            .mockResolvedValue(opts.workspace ?? null),
        ...lists
    };
    return () => client as never;
}

describe("exportCloudWorkspace", () => {
    it("returns a degraded snapshot with a single error when factory throws", async () => {
        const { exportCloudWorkspace } = await import("./cloud-sync");
        const factory = makeExportClient({ factoryThrows: true });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.totalRows).toBe(0);
        expect(snap.errors.length).toBe(1);
        expect(snap.errors[0]!.table).toBe("<client>");
        expect(snap.workspaceId).toBeNull();
        expect(snap.tables).toEqual({});
    });

    it("packs every table's rows + per-table count + total", async () => {
        const { exportCloudWorkspace } = await import("./cloud-sync");
        const factory = makeExportClient({
            user: { id: "u1", email: "t@t.com" },
            workspace: {
                id: "ws-1",
                name: "Test Workspace",
                created_at: "2026-01-01T00:00:00Z"
            },
            listResults: {
                icps: [{ id: "i1" }, { id: "i2" }],
                deals: [{ id: "d1" }],
                outdoorsEvents: [
                    { id: "e1", name: "RSA" },
                    { id: "e2", name: "DEF CON" }
                ],
                workspaceProfile: [{ workspace_id: "ws-1", product_category: "security" }]
            }
        });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.perTableCount["icps"]).toBe(2);
        expect(snap.perTableCount["deals"]).toBe(1);
        expect(snap.perTableCount["outdoors_events"]).toBe(2);
        expect(snap.perTableCount["workspace_profile"]).toBe(1);
        // Sum across all 14 tables = 2 + 1 + 2 + 1 = 6 (others empty).
        expect(snap.totalRows).toBe(6);
        expect(snap.tables["outdoors_events"]).toHaveLength(2);
        expect(snap.errors).toEqual([]);
        expect(snap.workspaceId).toBe("ws-1");
        expect(snap.userEmail).toBe("t@t.com");
        expect(snap.source).toBe("antaeus-cloud-export-v1");
        expect(snap.schemaVersion).toBe(1);
    });

    it("survives a single table failing — empty rows + error noted, others still load", async () => {
        const { exportCloudWorkspace } = await import("./cloud-sync");
        const factory = makeExportClient({
            user: { id: "u1", email: "t@t.com" },
            workspace: {
                id: "ws-1",
                name: "Test",
                created_at: null
            },
            listResults: {
                icps: [{ id: "i1" }],
                deals: [{ id: "d1" }, { id: "d2" }]
            },
            failOnTable: "outdoorsEvents"
        });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.errors.length).toBe(1);
        expect(snap.errors[0]!.table).toBe("outdoors_events");
        expect(snap.errors[0]!.reason).toContain("failed");
        expect(snap.tables["outdoors_events"]).toEqual([]);
        // The good tables still landed.
        expect(snap.perTableCount["icps"]).toBe(1);
        expect(snap.perTableCount["deals"]).toBe(2);
        expect(snap.totalRows).toBe(3);
    });

    it("captures workspace + user metadata defensively (null if reads fail)", async () => {
        const { exportCloudWorkspace } = await import("./cloud-sync");
        const factory = makeExportClient({
            workspace: null,
            user: null
        });
        const snap = await exportCloudWorkspace(factory as never);
        expect(snap.workspaceId).toBeNull();
        expect(snap.userEmail).toBeNull();
        // Empty workspaces still produce a valid (empty) snapshot.
        expect(snap.totalRows).toBe(0);
        expect(snap.errors).toEqual([]);
    });

    it("the export scope is the 14 tables we documented", async () => {
        const { exportCloudWorkspace } = await import("./cloud-sync");
        const factory = makeExportClient({
            user: { id: "u1", email: "t@t.com" },
            workspace: { id: "ws", name: "X", created_at: null }
        });
        const snap = await exportCloudWorkspace(factory as never);
        const keys = Object.keys(snap.tables).sort();
        expect(keys).toEqual(
            [
                "advisor_deployments",
                "deals",
                "discovery_call_logs",
                "discovery_frameworks",
                "handoff_artifacts",
                "icps",
                "outdoors_events",
                "pipeline_settings",
                "proofs",
                "readiness_snapshots",
                "sequences",
                "signal_console_accounts",
                "studio_artifacts",
                "workspace_profile"
            ].sort()
        );
    });
});
