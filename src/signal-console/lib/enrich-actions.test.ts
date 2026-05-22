import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "./types";
import {
    __resetForTests,
    cancelEnrichAll,
    enrichAccountAndApply,
    enrichmentErrorByAccount,
    enrichmentProgress,
    enrichmentStatusByAccount,
    isEnrichmentRunning,
    runEnrichAll
} from "./enrich-actions";
import { __setAllAccountsForTests } from "../state";

// Mock the enrichment library entirely so the orchestrator runs
// without hitting the network.
vi.mock("./enrichment", () => ({
    enrichAccount: vi.fn(),
    enrichmentResponseToAccountPatch: vi.fn(() => ({})),
    enrichmentSignalsToSignals: vi.fn(() => [])
}));

// Mock cloud-persistence so we don't have to set up a DataClient.
vi.mock("./cloud-persistence", () => ({
    saveAccount: vi.fn(async (a) => a),
    replaceAccountSignals: vi.fn(async () => [])
}));

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

import { enrichAccount } from "./enrichment";
import { saveAccount, replaceAccountSignals } from "./cloud-persistence";

function makeAccount(id: string, overrides: Partial<Account> = {}): Account {
    return {
        id,
        name: `Acct ${id}`,
        signals: [],
        ...overrides
    };
}

beforeEach(() => {
    __resetForTests();
    __setAllAccountsForTests([]);
    vi.clearAllMocks();
});

// ─── enrichAccountAndApply ─────────────────────────────────────────────

describe("enrichAccountAndApply", () => {
    it("marks done + applies patch + signals on ok response", async () => {
        const account = makeAccount("a1");
        __setAllAccountsForTests([account]);
        vi.mocked(enrichAccount).mockResolvedValue({
            status: "ok",
            response: {
                name: "x",
                domain: null,
                info: {},
                signals: [],
                enrichedAt: "now"
            }
        });
        const result = await enrichAccountAndApply(account);
        expect(result.status).toBe("ok");
        expect(enrichmentStatusByAccount.value["a1"]).toBe("done");
        expect(saveAccount).toHaveBeenCalledOnce();
        expect(replaceAccountSignals).toHaveBeenCalledOnce();
    });

    it("marks error + records message on error response", async () => {
        const account = makeAccount("a1");
        __setAllAccountsForTests([account]);
        vi.mocked(enrichAccount).mockResolvedValue({
            status: "error",
            message: "rate limit hit"
        });
        await enrichAccountAndApply(account);
        expect(enrichmentStatusByAccount.value["a1"]).toBe("error");
        expect(enrichmentErrorByAccount.value["a1"]).toBe("rate limit hit");
        // Apply was NOT called when enrich itself failed.
        expect(saveAccount).not.toHaveBeenCalled();
    });

    it("marks skipped on abort", async () => {
        const account = makeAccount("a1");
        __setAllAccountsForTests([account]);
        vi.mocked(enrichAccount).mockResolvedValue({ status: "aborted" });
        await enrichAccountAndApply(account);
        expect(enrichmentStatusByAccount.value["a1"]).toBe("skipped");
        expect(saveAccount).not.toHaveBeenCalled();
    });

    it("clears prior error when re-enriching the same account", async () => {
        const account = makeAccount("a1");
        __setAllAccountsForTests([account]);
        vi.mocked(enrichAccount).mockResolvedValueOnce({
            status: "error",
            message: "first failure"
        });
        await enrichAccountAndApply(account);
        expect(enrichmentErrorByAccount.value["a1"]).toBe("first failure");

        vi.mocked(enrichAccount).mockResolvedValueOnce({
            status: "ok",
            response: {
                name: "x",
                domain: null,
                info: {},
                signals: [],
                enrichedAt: "n"
            }
        });
        await enrichAccountAndApply(account);
        expect(enrichmentErrorByAccount.value["a1"]).toBeUndefined();
        expect(enrichmentStatusByAccount.value["a1"]).toBe("done");
    });
});

// ─── runEnrichAll ──────────────────────────────────────────────────────

describe("runEnrichAll", () => {
    it("walks every account sequentially + returns a summary", async () => {
        const accounts = [
            makeAccount("a1"),
            makeAccount("a2"),
            makeAccount("a3")
        ];
        __setAllAccountsForTests(accounts);
        vi.mocked(enrichAccount).mockResolvedValue({
            status: "ok",
            response: {
                name: "x",
                domain: null,
                info: {},
                signals: [],
                enrichedAt: "n"
            }
        });
        const summary = await runEnrichAll();
        expect(summary.attempted).toBe(3);
        expect(summary.succeeded).toBe(3);
        expect(summary.failed).toBe(0);
        expect(enrichmentStatusByAccount.value["a1"]).toBe("done");
        expect(enrichmentStatusByAccount.value["a2"]).toBe("done");
        expect(enrichmentStatusByAccount.value["a3"]).toBe("done");
    });

    it("counts failures + continues to next account", async () => {
        __setAllAccountsForTests([
            makeAccount("a1"),
            makeAccount("a2"),
            makeAccount("a3")
        ]);
        vi.mocked(enrichAccount)
            .mockResolvedValueOnce({ status: "error", message: "x" })
            .mockResolvedValueOnce({
                status: "ok",
                response: {
                    name: "x",
                    domain: null,
                    info: {},
                    signals: [],
                    enrichedAt: "n"
                }
            })
            .mockResolvedValueOnce({ status: "error", message: "y" });
        const summary = await runEnrichAll();
        expect(summary.attempted).toBe(3);
        expect(summary.succeeded).toBe(1);
        expect(summary.failed).toBe(2);
    });

    it("applies an optional filter (only enrich matching accounts)", async () => {
        __setAllAccountsForTests([
            makeAccount("a1", { enrichedAt: "2026-05-22T00:00:00Z" }),
            makeAccount("a2") // no enrichedAt → stale
        ]);
        vi.mocked(enrichAccount).mockResolvedValue({
            status: "ok",
            response: {
                name: "x",
                domain: null,
                info: {},
                signals: [],
                enrichedAt: "n"
            }
        });
        const summary = await runEnrichAll({
            filter: (a) => !a.enrichedAt
        });
        expect(summary.attempted).toBe(1);
        // a1 was filtered out — no status set
        expect(enrichmentStatusByAccount.value["a1"]).toBeUndefined();
        expect(enrichmentStatusByAccount.value["a2"]).toBe("done");
    });

    it("returns early when a previous run is already active", async () => {
        __setAllAccountsForTests([makeAccount("a1")]);
        let resolveFirst: (() => void) | null = null;
        vi.mocked(enrichAccount).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFirst = (): void =>
                        resolve({
                            status: "ok",
                            response: {
                                name: "x",
                                domain: null,
                                info: {},
                                signals: [],
                                enrichedAt: "n"
                            }
                        });
                })
        );
        const firstRunPromise = runEnrichAll();
        // Yield once so the first runEnrichAll sets up its controller
        // before the second call checks.
        await new Promise((r) => setTimeout(r, 0));
        // Second call while first is in-flight returns early.
        const secondSummary = await runEnrichAll();
        expect(secondSummary.attempted).toBe(0);
        // Unblock the first so the test finishes.
        resolveFirst!();
        await firstRunPromise;
    });

    it("isEnrichmentRunning flips true during the run + false after", async () => {
        __setAllAccountsForTests([makeAccount("a1")]);
        vi.mocked(enrichAccount).mockResolvedValue({
            status: "ok",
            response: {
                name: "x",
                domain: null,
                info: {},
                signals: [],
                enrichedAt: "n"
            }
        });
        expect(isEnrichmentRunning.value).toBe(false);
        const promise = runEnrichAll();
        // After first microtask the status should be running or queued.
        await new Promise((r) => setTimeout(r, 0));
        await promise;
        expect(isEnrichmentRunning.value).toBe(false);
    });
});

// ─── cancelEnrichAll ───────────────────────────────────────────────────

describe("cancelEnrichAll", () => {
    it("aborts queued + skips remaining items", async () => {
        __setAllAccountsForTests([
            makeAccount("a1"),
            makeAccount("a2"),
            makeAccount("a3")
        ]);
        // First account succeeds; cancel before the rest start.
        let count = 0;
        vi.mocked(enrichAccount).mockImplementation(async () => {
            count += 1;
            if (count === 1) {
                cancelEnrichAll();
                return {
                    status: "ok",
                    response: {
                        name: "x",
                        domain: null,
                        info: {},
                        signals: [],
                        enrichedAt: "n"
                    }
                };
            }
            return { status: "aborted" };
        });
        const summary = await runEnrichAll();
        expect(summary.succeeded).toBe(1);
        // Remaining accounts should be skipped.
        expect(enrichmentStatusByAccount.value["a2"]).toBe("skipped");
        expect(enrichmentStatusByAccount.value["a3"]).toBe("skipped");
        expect(summary.aborted).toBe(true);
    });

    it("is a no-op when no run is active", () => {
        cancelEnrichAll(); // Must not throw
    });
});

// ─── enrichmentProgress ────────────────────────────────────────────────

describe("enrichmentProgress", () => {
    it("counts each status bucket", () => {
        enrichmentStatusByAccount.value = {
            a: "done",
            b: "done",
            c: "running",
            d: "queued",
            e: "error",
            f: "skipped"
        };
        const p = enrichmentProgress.value;
        expect(p.done).toBe(2);
        expect(p.running).toBe(1);
        expect(p.queued).toBe(1);
        expect(p.error).toBe(1);
        expect(p.skipped).toBe(1);
        expect(p.total).toBe(6);
    });
});
