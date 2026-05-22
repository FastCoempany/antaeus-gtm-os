import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataClient } from "@/lib/data-client";
import type { Row } from "@/lib/database-helpers";
import {
    __getDataClientForTests,
    __setDataClientForTests,
    addSignal,
    addSignalToCloud,
    applyRealtimePayload,
    deleteAccount,
    deleteAccountInCloud,
    deleteSignal,
    deleteSignalFromCloud,
    patchSignal,
    replaceAccountSignals,
    updateSignalInCloud
} from "./cloud-persistence";
import { __setAllAccountsForTests, allAccounts } from "../state";
import type { Account } from "./types";

// Mock the parity-flag check so we can flip dual-write on/off per test.
// Default: ON. Each test overrides as needed.
vi.mock("@/lib/data-parity-flags", () => ({
    isRoomParityWriteEnabled: vi.fn(() => true),
    isRoomParityReadEnabled: vi.fn(() => false),
    DATA_PARITY_FLAGS: {},
    DATA_LAYER_PARITY_COMPLETE: "data_layer_parity_complete",
    isDataLayerParityComplete: vi.fn(() => false)
}));

// Also silence observability — Sentry / Posthog aren't initialized in tests.
vi.mock("@/lib/observability", async () => {
    const actual =
        await vi.importActual<typeof import("@/lib/observability")>(
            "@/lib/observability"
        );
    return {
        ...actual,
        reportError: vi.fn(),
        trackEvent: vi.fn()
    };
});

import { isRoomParityWriteEnabled } from "@/lib/data-parity-flags";

const ACCOUNT_UUID = "11111111-2222-3333-4444-555555555555";
const SIGNAL_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

// ─── Mock DataClient ──────────────────────────────────────────────

interface CallLog {
    op: "insert" | "update" | "remove";
    table: "signals" | "signal_console_accounts";
    args: ReadonlyArray<unknown>;
}

function makeMockClient(): {
    client: DataClient;
    calls: CallLog[];
    setNextResult: (r: unknown) => void;
    setNextError: (e: Error) => void;
} {
    const calls: CallLog[] = [];
    let nextResult: unknown = null;
    let nextError: Error | null = null;

    function consume<T>(table: CallLog["table"], op: CallLog["op"], args: unknown[]): Promise<T> {
        calls.push({ op, table, args });
        if (nextError) {
            const err = nextError;
            nextError = null;
            return Promise.reject(err);
        }
        const result = nextResult;
        nextResult = null;
        return Promise.resolve(result as T);
    }

    const signalsAccessor = {
        list: vi.fn(),
        get: vi.fn(),
        insert: vi.fn((row) => consume("signals", "insert", [row])),
        update: vi.fn((id, patch) => consume("signals", "update", [id, patch])),
        remove: vi.fn((id) => consume("signals", "remove", [id])),
        subscribe: vi.fn(() => ({ unsubscribe: () => undefined }))
    };

    const accountsAccessor = {
        list: vi.fn(),
        get: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        remove: vi.fn((id) =>
            consume("signal_console_accounts", "remove", [id])
        ),
        subscribe: vi.fn(() => ({ unsubscribe: () => undefined }))
    };

    const client = {
        signals: signalsAccessor,
        signalConsoleAccounts: accountsAccessor
    } as unknown as DataClient;

    return {
        client,
        calls,
        setNextResult: (r) => {
            nextResult = r;
        },
        setNextError: (e) => {
            nextError = e;
        }
    };
}

function makeRow(overrides: Partial<Row<"signals">> = {}): Row<"signals"> {
    return {
        id: SIGNAL_UUID,
        account_id: ACCOUNT_UUID,
        workspace_id: "w",
        signal_type: null,
        headline: null,
        source: null,
        url: null,
        published_date: null,
        fetched_at: null,
        captured_at: null,
        confidence: null,
        is_ai: false,
        flagged: false,
        note: null,
        data: {},
        created_at: "2026-05-22T12:00:00Z",
        updated_at: "2026-05-22T12:00:00Z",
        ...overrides
    };
}

beforeEach(() => {
    __setAllAccountsForTests([]);
    __setDataClientForTests(null);
    vi.mocked(isRoomParityWriteEnabled).mockReturnValue(true);
});

// ─── addSignalToCloud ────────────────────────────────────────────────

describe("addSignalToCloud", () => {
    it("no-ops when no client is set", async () => {
        const result = await addSignalToCloud(ACCOUNT_UUID, {
            id: "sig_1",
            headline: "Test"
        });
        expect(result).toBeNull();
    });

    it("no-ops when parity-write flag is off", async () => {
        vi.mocked(isRoomParityWriteEnabled).mockReturnValue(false);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        const result = await addSignalToCloud(ACCOUNT_UUID, {
            id: "sig_1",
            headline: "Test"
        });
        expect(result).toBeNull();
        expect(mock.calls).toHaveLength(0);
    });

    it("no-ops when account id is legacy (would fail FK)", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        const result = await addSignalToCloud("acc_legacy_1", {
            id: "sig_1",
            headline: "Test"
        });
        expect(result).toBeNull();
        expect(mock.calls).toHaveLength(0);
    });

    it("inserts when client + flag + account uuid all line up", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(makeRow({ headline: "Acme raised $20M" }));
        const result = await addSignalToCloud(ACCOUNT_UUID, {
            id: "sig_local_1",
            type: "funding",
            headline: "Acme raised $20M"
        });
        expect(result).not.toBeNull();
        expect(result!.id).toBe(SIGNAL_UUID);
        expect(result!.headline).toBe("Acme raised $20M");
        expect(mock.calls).toHaveLength(1);
        expect(mock.calls[0]!.op).toBe("insert");
        expect(mock.calls[0]!.table).toBe("signals");
    });

    it("catches errors + returns null without throwing", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextError(new Error("RLS deny"));
        const result = await addSignalToCloud(ACCOUNT_UUID, {
            id: "sig_1",
            headline: "x"
        });
        expect(result).toBeNull();
    });
});

// ─── updateSignalInCloud ─────────────────────────────────────────────

describe("updateSignalInCloud", () => {
    it("no-ops when signal id is legacy", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        const result = await updateSignalInCloud({
            id: "sig_legacy_1",
            flagged: true
        });
        expect(result).toBeNull();
        expect(mock.calls).toHaveLength(0);
    });

    it("patches when signal id is a uuid", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(makeRow({ flagged: true }));
        const result = await updateSignalInCloud({
            id: SIGNAL_UUID,
            flagged: true
        });
        expect(result).not.toBeNull();
        expect(result!.flagged).toBe(true);
        expect(mock.calls[0]!.op).toBe("update");
        const patch = mock.calls[0]!.args[1] as { flagged?: boolean };
        expect(patch.flagged).toBe(true);
    });

    it("does not patch account_id (FK is immutable)", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(makeRow());
        await updateSignalInCloud({
            id: SIGNAL_UUID,
            note: "updated note"
        });
        const patch = mock.calls[0]!.args[1] as Record<string, unknown>;
        expect("account_id" in patch).toBe(false);
    });
});

// ─── deleteSignalFromCloud ───────────────────────────────────────────

describe("deleteSignalFromCloud", () => {
    it("no-ops on legacy id", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        await deleteSignalFromCloud("sig_legacy_1");
        expect(mock.calls).toHaveLength(0);
    });

    it("removes when id is a uuid", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(undefined);
        await deleteSignalFromCloud(SIGNAL_UUID);
        expect(mock.calls).toHaveLength(1);
        expect(mock.calls[0]!.op).toBe("remove");
        expect(mock.calls[0]!.args[0]).toBe(SIGNAL_UUID);
    });

    it("catches errors silently", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextError(new Error("RLS deny"));
        // Must not throw
        await deleteSignalFromCloud(SIGNAL_UUID);
    });
});

// ─── deleteAccountInCloud (existing function — sanity coverage) ─────

describe("deleteAccountInCloud", () => {
    it("no-ops without client", async () => {
        await deleteAccountInCloud(ACCOUNT_UUID);
        expect(__getDataClientForTests()).toBeNull();
    });

    it("no-ops on legacy id (no cloud row exists)", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        await deleteAccountInCloud("acc_legacy_1");
        expect(mock.calls).toHaveLength(0);
    });

    it("removes when id is a uuid", async () => {
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(undefined);
        await deleteAccountInCloud(ACCOUNT_UUID);
        expect(mock.calls).toHaveLength(1);
        expect(mock.calls[0]!.table).toBe("signal_console_accounts");
        expect(mock.calls[0]!.args[0]).toBe(ACCOUNT_UUID);
    });
});

// ─── applyRealtimePayload (existing — keep regression coverage) ─────

describe("applyRealtimePayload", () => {
    it("ignores malformed events", () => {
        applyRealtimePayload({ eventType: "UPDATE", new: null, old: null });
        applyRealtimePayload({ eventType: "DELETE", new: null, old: null });
    });
});

// ─── Orchestrators (Wave 3): local + cloud composed ──────────────────

function seedAccount(id: string, signals: Account["signals"] = []): void {
    __setAllAccountsForTests([{ id, name: "Test", signals }]);
}

describe("addSignal (orchestrator)", () => {
    it("adds locally even when cloud is unavailable", async () => {
        seedAccount(ACCOUNT_UUID);
        const out = await addSignal(ACCOUNT_UUID, {
            id: "sig_local_1",
            headline: "Local-only"
        });
        expect(out.id).toBe("sig_local_1");
        const account = allAccounts.value.find((a) => a.id === ACCOUNT_UUID)!;
        expect(account.signals).toHaveLength(1);
    });

    it("swaps local id for server-minted uuid when cloud insert succeeds", async () => {
        seedAccount(ACCOUNT_UUID);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(makeRow({ headline: "Persisted" }));
        const out = await addSignal(ACCOUNT_UUID, {
            id: "sig_local_1",
            headline: "Persisted"
        });
        expect(out.id).toBe(SIGNAL_UUID); // swapped to uuid
        const account = allAccounts.value.find((a) => a.id === ACCOUNT_UUID)!;
        expect(account.signals).toHaveLength(1);
        expect(account.signals[0]!.id).toBe(SIGNAL_UUID);
    });

    it("keeps local id when cloud write is skipped (flag off)", async () => {
        vi.mocked(isRoomParityWriteEnabled).mockReturnValue(false);
        seedAccount(ACCOUNT_UUID);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        const out = await addSignal(ACCOUNT_UUID, {
            id: "sig_local_1",
            headline: "Local"
        });
        expect(out.id).toBe("sig_local_1");
        expect(mock.calls).toHaveLength(0);
    });
});

describe("patchSignal (orchestrator)", () => {
    it("updates locally + propagates patch to cloud", async () => {
        seedAccount(ACCOUNT_UUID, [
            { id: SIGNAL_UUID, headline: "x", flagged: false }
        ]);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(makeRow({ flagged: true }));
        const out = await patchSignal(ACCOUNT_UUID, {
            id: SIGNAL_UUID,
            headline: "x",
            flagged: true
        });
        expect(out.flagged).toBe(true);
        const account = allAccounts.value.find((a) => a.id === ACCOUNT_UUID)!;
        expect(account.signals[0]!.flagged).toBe(true);
    });
});

describe("deleteSignal (orchestrator)", () => {
    it("removes locally + propagates to cloud", async () => {
        seedAccount(ACCOUNT_UUID, [{ id: SIGNAL_UUID, headline: "x" }]);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(undefined);
        await deleteSignal(ACCOUNT_UUID, SIGNAL_UUID);
        const account = allAccounts.value.find((a) => a.id === ACCOUNT_UUID)!;
        expect(account.signals).toHaveLength(0);
        expect(mock.calls[0]!.op).toBe("remove");
    });
});

describe("deleteAccount (orchestrator)", () => {
    it("removes locally + propagates to cloud", async () => {
        seedAccount(ACCOUNT_UUID);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        mock.setNextResult(undefined);
        await deleteAccount(ACCOUNT_UUID);
        expect(allAccounts.value.find((a) => a.id === ACCOUNT_UUID)).toBeUndefined();
        expect(mock.calls).toHaveLength(1);
        expect(mock.calls[0]!.table).toBe("signal_console_accounts");
    });
});

describe("replaceAccountSignals (orchestrator)", () => {
    it("swaps signals[] wholesale + bulk-writes each to cloud", async () => {
        seedAccount(ACCOUNT_UUID, [{ id: "stale", headline: "old" }]);
        const mock = makeMockClient();
        __setDataClientForTests(mock.client);
        // Two enrichment signals → two inserts → two server-minted uuids
        const UUID_2 = "ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb";
        mock.setNextResult(makeRow({ id: SIGNAL_UUID, headline: "Fresh 1" }));
        const out1 = await addSignalToCloud(ACCOUNT_UUID, {
            id: "fresh_1",
            headline: "Fresh 1"
        });
        expect(out1).not.toBeNull();
        // Reset for replaceAccountSignals
        mock.setNextResult(makeRow({ id: UUID_2, headline: "Fresh 2" }));
        const out = await replaceAccountSignals(ACCOUNT_UUID, [
            { id: "local_only", headline: "Fresh 2" }
        ]);
        expect(out).toHaveLength(1);
        expect(out[0]!.id).toBe(UUID_2);
        const account = allAccounts.value.find((a) => a.id === ACCOUNT_UUID)!;
        expect(account.signals).toHaveLength(1);
        expect(account.signals[0]!.id).toBe(UUID_2);
        // "stale" original signal was replaced (not preserved)
        expect(account.signals.find((s) => s.id === "stale")).toBeUndefined();
    });
});
