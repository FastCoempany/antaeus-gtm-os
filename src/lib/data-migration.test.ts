import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    MIGRATION_COMPLETE_KEY,
    MIGRATION_FEATURE_FLAG,
    __getRegisteredMigrators,
    asNumber,
    asString,
    runDataMigration,
    safeParse
} from "./data-migration";
import {
    __resetSupabaseClientForTests,
    type AntaeusSupabaseClient
} from "./supabase-client";
import { createDataClient } from "./data-client";

/**
 * Phase 2.3 migration tool tests.
 *
 * Focus: the gate + idempotency logic, and the shared transformation helpers.
 * Per-noun migrators get their own test coverage when they're added in Phase 2.3.C.
 */

// ─── Minimal in-memory storage ──────────────────────────────────────────

function makeStorage(initial: Record<string, string> = {}): Storage {
    const store = { ...initial };
    return {
        getItem: (k) => (k in store ? store[k]! : null),
        setItem: (k, v) => {
            store[k] = v;
        },
        removeItem: (k) => {
            delete store[k];
        },
        clear: () => {
            for (const k of Object.keys(store)) delete store[k];
        },
        key: (i) => Object.keys(store)[i] ?? null,
        get length() {
            return Object.keys(store).length;
        }
    };
}

// ─── Minimal mock Supabase client for test runs that reach createDataClient() ─

function makeNoopClient(): AntaeusSupabaseClient {
    const then = <T>(fn: (v: unknown) => T) =>
        Promise.resolve({ data: null, error: null }).then(fn);
    const chain: Record<string, unknown> = {};
    for (const op of ["select", "insert", "update", "delete", "eq", "order", "limit"] as const) {
        chain[op] = () => chain;
    }
    chain.single = () => Promise.resolve({ data: null, error: null });
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
    chain.then = then;
    return {
        from: () => chain,
        auth: {
            getUser: () =>
                Promise.resolve({ data: { user: null }, error: null })
        },
        channel: () => ({
            on: () => ({ subscribe: () => ({}), unsubscribe: () => undefined })
        })
    } as unknown as AntaeusSupabaseClient;
}

// ─── Setup / teardown ───────────────────────────────────────────────────

beforeEach(() => {
    __resetSupabaseClientForTests();
});

afterEach(() => {
    __resetSupabaseClientForTests();
    vi.unstubAllEnvs();
});

// ─── Gate tests ─────────────────────────────────────────────────────────

describe("runDataMigration — gates", () => {
    it("refuses to run when the Posthog flag is off (default)", async () => {
        const storage = makeStorage();
        const report = await runDataMigration({ storage });
        expect(report.gatedBy).toBe("flag_off");
        expect(report.tables).toHaveLength(0);
        expect(report.totalInserted).toBe(0);
    });

    it("refuses to re-run when the completion marker is set (without force)", async () => {
        const storage = makeStorage({
            [MIGRATION_COMPLETE_KEY]: "2026-04-24T18:00:00.000Z"
        });
        const data = createDataClient(makeNoopClient());
        const report = await runDataMigration({
            storage,
            dataClient: data,
            __bypassFlag: true
        });
        expect(report.gatedBy).toBe("already_migrated");
    });

    it("re-runs past the completion marker when force: true is passed", async () => {
        const storage = makeStorage({
            [MIGRATION_COMPLETE_KEY]: "2026-04-24T18:00:00.000Z"
        });
        const data = createDataClient(makeNoopClient());
        const report = await runDataMigration({
            storage,
            dataClient: data,
            force: true,
            __bypassFlag: true
        });
        expect(report.gatedBy).toBeUndefined();
    });

    it("passes through both gates when flag bypass + no marker + real migrators", async () => {
        const storage = makeStorage();
        const data = createDataClient(makeNoopClient());
        const report = await runDataMigration({
            storage,
            dataClient: data,
            __bypassFlag: true
        });
        expect(report.gatedBy).toBeUndefined();
        // With no registered migrators yet (Phase 2.3.B), tables should be empty.
        expect(report.tables).toHaveLength(__getRegisteredMigrators().length);
    });
});

// ─── Idempotency marker ─────────────────────────────────────────────────

describe("runDataMigration — completion marker", () => {
    it("writes the marker on a successful non-dry run with zero errors", async () => {
        const storage = makeStorage();
        const data = createDataClient(makeNoopClient());
        await runDataMigration({
            storage,
            dataClient: data,
            __bypassFlag: true
        });
        const marker = storage.getItem(MIGRATION_COMPLETE_KEY);
        expect(marker).toBeTruthy();
        expect(marker).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("does NOT write the marker when dryRun: true", async () => {
        const storage = makeStorage();
        const data = createDataClient(makeNoopClient());
        await runDataMigration({
            storage,
            dataClient: data,
            __bypassFlag: true,
            dryRun: true
        });
        expect(storage.getItem(MIGRATION_COMPLETE_KEY)).toBeNull();
    });
});

// ─── Transformation helpers ─────────────────────────────────────────────

describe("safeParse", () => {
    it("parses valid JSON", () => {
        expect(safeParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    });
    it("returns null for null / empty / garbage input", () => {
        expect(safeParse(null)).toBeNull();
        expect(safeParse("")).toBeNull();
        expect(safeParse("{not json")).toBeNull();
    });
});

describe("asString", () => {
    it("passes through strings", () => {
        expect(asString("hello")).toBe("hello");
    });
    it("returns null for null/undefined", () => {
        expect(asString(null)).toBeNull();
        expect(asString(undefined)).toBeNull();
    });
    it("coerces other primitives to string", () => {
        expect(asString(42)).toBe("42");
        expect(asString(true)).toBe("true");
    });
});

describe("asNumber", () => {
    it("passes through finite numbers", () => {
        expect(asNumber(42)).toBe(42);
        expect(asNumber(0)).toBe(0);
    });
    it("parses numeric strings", () => {
        expect(asNumber("42")).toBe(42);
    });
    it("returns null for non-finite, null, or non-numeric", () => {
        expect(asNumber(Number.NaN)).toBeNull();
        expect(asNumber(Number.POSITIVE_INFINITY)).toBeNull();
        expect(asNumber("not a number")).toBeNull();
        expect(asNumber(null)).toBeNull();
        expect(asNumber({})).toBeNull();
    });
});

// ─── Pass-through migrator coverage ─────────────────────────────────────

describe("pass-through migrators", () => {
    /**
     * Instead of mocking the full Supabase client, we shim the data-client
     * accessors with insert spies. Each accessor records the row it would
     * have inserted; tests then assert the row shape + keysRead.
     */
    function makeSpyDataClient(): {
        client: import("./data-client").DataClient;
        calls: Record<string, unknown[]>;
    } {
        const calls: Record<string, unknown[]> = {};
        const makeAccessor = (name: string) => {
            calls[name] = [];
            return {
                list: () => Promise.resolve([]),
                get: () => Promise.resolve(null),
                insert: (row: unknown) => {
                    calls[name]!.push(row);
                    return Promise.resolve(row);
                },
                update: (_id: string, row: unknown) => Promise.resolve(row),
                remove: () => Promise.resolve(),
                subscribe: () => ({ unsubscribe: () => undefined })
            };
        };

        const client = {
            client: {} as unknown as AntaeusSupabaseClient,
            currentUserId: () => Promise.resolve("test-user"),
            currentWorkspace: () => Promise.resolve(null),
            workspaces: makeAccessor("workspaces"),
            workspaceMembers: makeAccessor("workspaceMembers"),
            icps: makeAccessor("icps"),
            deals: makeAccessor("deals"),
            sequences: makeAccessor("sequences"),
            signalConsoleAccounts: makeAccessor("signalConsoleAccounts"),
            discoveryFrameworks: makeAccessor("discoveryFrameworks"),
            discoveryCallLogs: makeAccessor("discoveryCallLogs"),
            pipelineSettings: makeAccessor("pipelineSettings"),
            profiles: makeAccessor("profiles"),
            studioArtifacts: makeAccessor("studioArtifacts"),
            proofs: makeAccessor("proofs"),
            advisorDeployments: makeAccessor("advisorDeployments"),
            readinessSnapshots: makeAccessor("readinessSnapshots"),
            handoffArtifacts: makeAccessor("handoffArtifacts")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as import("./data-client").DataClient;
        return { client, calls };
    }

    it("skips a table with no matching localStorage keys (silent, no error)", async () => {
        const storage = makeStorage(); // empty
        const { client, calls } = makeSpyDataClient();
        const report = await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true
        });
        expect(report.gatedBy).toBeUndefined();
        // Every per-noun report should have rowsInserted: 0 and no errors.
        for (const t of report.tables) {
            expect(t.rowsInserted, `${t.table} should have 0 rows`).toBe(0);
            expect(t.errors).toHaveLength(0);
        }
        // No accessor should have been called.
        for (const [name, entries] of Object.entries(calls)) {
            expect(entries, `${name} should not have been called`).toHaveLength(0);
        }
    });

    it("migrates one blob row per table when localStorage has matching keys", async () => {
        const storage = makeStorage({
            gtmos_deal_workspaces: JSON.stringify([
                { id: "d1", stage: "won", account_name: "Acme" }
            ]),
            gtmos_deal_outcomes: JSON.stringify([{ deal_id: "d1", outcome: "won" }]),
            gtmos_icp_analytics: JSON.stringify({ icps: [{ id: "i1" }] }),
            gtmos_readiness_snapshot: JSON.stringify({ overall_score: 62 })
        });
        const { client, calls } = makeSpyDataClient();
        const report = await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true
        });

        expect(report.totalInserted).toBe(3); // deals + icps + readiness_snapshots
        expect(report.totalErrors).toBe(0);

        // Deals migrator inserted one row with both deals keys packed inside
        expect(calls.deals).toHaveLength(1);
        const dealRow = calls.deals![0] as {
            data: {
                migrated_from_localstorage: Record<string, unknown>;
                migration_version: string;
            };
        };
        expect(
            Object.keys(dealRow.data.migrated_from_localstorage).sort()
        ).toEqual(["gtmos_deal_outcomes", "gtmos_deal_workspaces"]);
        expect(dealRow.data.migration_version).toBe("phase-2.3-passthrough");

        // ICP migrator picked up gtmos_icp_analytics
        expect(calls.icps).toHaveLength(1);

        // Readiness picked up its single key
        expect(calls.readinessSnapshots).toHaveLength(1);

        // Sequences, signal_console_accounts, etc. had no keys → no calls
        expect(calls.sequences).toHaveLength(0);
        expect(calls.signalConsoleAccounts).toHaveLength(0);
    });

    it("injects placeholder values for NOT NULL label columns", async () => {
        // Tables like icps, deals, sequences mark name/account_name as NOT NULL.
        // The migrator must inject a distinctive placeholder so the insert
        // satisfies the constraint AND Phase 3+ room migrations can detect
        // blob rows by matching the placeholder string.
        const storage = makeStorage({
            gtmos_deal_workspaces: JSON.stringify([{ id: "d1" }])
        });
        const { client, calls } = makeSpyDataClient();
        await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true
        });

        expect(calls.deals).toHaveLength(1);
        const row = calls.deals![0] as { account_name?: string };
        expect(row.account_name).toBe("__gtmos_migration_blob__");
    });

    it("injects user_id for tables that require it explicitly", async () => {
        // pipeline_settings + studio_artifacts don't have a default on user_id,
        // so the migrator must look up the current user and set it on insert.
        const storage = makeStorage({
            gtmos_qw_inputs: JSON.stringify({ target_quota: 1000000 })
        });
        const { client, calls } = makeSpyDataClient();
        await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true
        });

        expect(calls.pipelineSettings).toHaveLength(1);
        const row = calls.pipelineSettings![0] as { user_id?: string };
        expect(row.user_id).toBe("test-user");
    });

    it("preserves non-JSON values as raw strings in the blob (no error)", async () => {
        // Some legacy localStorage keys (e.g. gtmos_handoff_exported) were
        // written as bare strings, not JSON-wrapped. The migrator must not
        // error on these — it preserves them verbatim so the data isn't lost.
        const storage = makeStorage({
            gtmos_handoff_exported: "2026-04-20T12:34:56.789Z"
        });
        const { client, calls } = makeSpyDataClient();
        const report = await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true
        });

        const handoff = report.tables.find(
            (t) => t.table === "handoff_artifacts"
        );
        expect(handoff).toBeDefined();
        expect(handoff?.errors).toHaveLength(0);
        expect(handoff?.rowsInserted).toBe(1);

        const row = calls.handoffArtifacts![0] as {
            data: { migrated_from_localstorage: Record<string, unknown> };
        };
        expect(row.data.migrated_from_localstorage.gtmos_handoff_exported).toBe(
            "2026-04-20T12:34:56.789Z"
        );
    });

    it("dryRun does not call insert but still counts transforms", async () => {
        const storage = makeStorage({
            gtmos_deal_workspaces: JSON.stringify([{ id: "d1" }])
        });
        const { client, calls } = makeSpyDataClient();
        const report = await runDataMigration({
            storage,
            dataClient: client,
            __bypassFlag: true,
            dryRun: true
        });

        const deals = report.tables.find((t) => t.table === "deals");
        expect(deals?.rowsTransformed).toBe(1);
        expect(deals?.rowsInserted).toBe(0);
        expect(deals?.rowsSkipped).toBe(1); // dryRun counts as skipped
        expect(calls.deals).toHaveLength(0);
    });
});

// ─── Flag key constants (regression guard) ──────────────────────────────

describe("exported constants", () => {
    it("uses the stable MIGRATION_COMPLETE_KEY", () => {
        expect(MIGRATION_COMPLETE_KEY).toBe("gtmos_migrated_to_supabase_v1");
    });
    it("uses the stable MIGRATION_FEATURE_FLAG", () => {
        expect(MIGRATION_FEATURE_FLAG).toBe("data_migration_live");
    });
});
