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
