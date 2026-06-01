import { describe, expect, it, vi } from "vitest";
import { runCloudSeed } from "./runner";
import {
    SEED_ACCOUNTS,
    SEED_DEALS,
    SEED_MARKER_ACCOUNT_KEY,
    SEED_PROOFS,
    SEED_SIGNALS
} from "./seed-data";

interface Calls {
    accountsList: number;
    accountsInsert: number;
    dealsInsert: number;
    signalsInsert: number;
    proofsInsert: number;
}

function makeMockClient(opts: {
    markerExists?: boolean;
    accountsListThrows?: boolean;
    accountInsertFailsAt?: string;
    dealInsertFailsAt?: string;
}): { client: unknown; calls: Calls } {
    const calls: Calls = {
        accountsList: 0,
        accountsInsert: 0,
        dealsInsert: 0,
        signalsInsert: 0,
        proofsInsert: 0
    };
    const idCounter = { n: 0 };
    const data = {
        deals: {
            insert: vi.fn(async (row: Record<string, unknown>) => {
                if (opts.dealInsertFailsAt === row.account_name) {
                    throw new Error("deal insert failed");
                }
                calls.dealsInsert += 1;
                return { id: `deal-${++idCounter.n}`, ...row };
            })
        },
        signalConsoleAccounts: {
            list: vi.fn(async () => {
                calls.accountsList += 1;
                if (opts.accountsListThrows) throw new Error("list failed");
                return opts.markerExists
                    ? [{ id: "marker-1", account_key: SEED_MARKER_ACCOUNT_KEY }]
                    : [];
            }),
            insert: vi.fn(async (row: Record<string, unknown>) => {
                if (opts.accountInsertFailsAt === row.account_key) {
                    throw new Error("account insert failed");
                }
                calls.accountsInsert += 1;
                return { id: `acct-${++idCounter.n}`, ...row };
            })
        },
        signals: {
            insert: vi.fn(async () => {
                calls.signalsInsert += 1;
                return { id: `sig-${++idCounter.n}` };
            })
        },
        proofs: {
            insert: vi.fn(async () => {
                calls.proofsInsert += 1;
                return { id: `prf-${++idCounter.n}` };
            })
        }
    };
    return { client: data, calls };
}

describe("runCloudSeed — idempotency", () => {
    it("skips when the marker row exists already", async () => {
        const mock = makeMockClient({ markerExists: true });
        const r = await runCloudSeed({ data: mock.client as never });
        expect(r.ok).toBe(true);
        expect(r.skipped).toBe("already-seeded");
        expect(mock.calls.dealsInsert).toBe(0);
        expect(mock.calls.accountsInsert).toBe(0);
    });

    it("dryRun returns intended counts without writing", async () => {
        const mock = makeMockClient({});
        const r = await runCloudSeed({
            data: mock.client as never,
            dryRun: true
        });
        expect(r.ok).toBe(true);
        expect(r.counts.deals).toBe(SEED_DEALS.length);
        expect(r.counts.accounts).toBe(SEED_ACCOUNTS.length);
        expect(r.counts.signals).toBe(SEED_SIGNALS.length);
        expect(r.counts.proofs).toBe(SEED_PROOFS.length);
        expect(mock.calls.dealsInsert).toBe(0);
        expect(mock.calls.accountsInsert).toBe(0);
    });

    it("refuses to seed if the idempotency check itself fails", async () => {
        const mock = makeMockClient({ accountsListThrows: true });
        const r = await runCloudSeed({ data: mock.client as never });
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/verify whether the workspace was already seeded/i);
        expect(mock.calls.dealsInsert).toBe(0);
    });
});

describe("runCloudSeed — write paths", () => {
    it("writes the marker first, then all seed rows", async () => {
        const mock = makeMockClient({});
        const r = await runCloudSeed({ data: mock.client as never });
        expect(r.ok).toBe(true);
        // Marker + accounts. The +1 is the marker row.
        expect(mock.calls.accountsInsert).toBe(SEED_ACCOUNTS.length + 1);
        expect(mock.calls.dealsInsert).toBe(SEED_DEALS.length);
        expect(mock.calls.signalsInsert).toBe(SEED_SIGNALS.length);
        expect(mock.calls.proofsInsert).toBe(SEED_PROOFS.length);
        expect(r.counts.deals).toBe(SEED_DEALS.length);
    });

    it("continues past a single failed insert and reports the error", async () => {
        const mock = makeMockClient({
            dealInsertFailsAt: "Cascadia Health Systems"
        });
        const r = await runCloudSeed({ data: mock.client as never });
        expect(r.ok).toBe(false);
        expect(r.counts.deals).toBe(SEED_DEALS.length - 1);
        expect(r.errors.some((e) => e.includes("Cascadia"))).toBe(true);
        // Accounts + signals + proofs still proceed despite the one
        // failed deal.
        expect(mock.calls.accountsInsert).toBe(SEED_ACCOUNTS.length + 1);
        expect(mock.calls.proofsInsert).toBe(SEED_PROOFS.length);
    });

    it("skips signals whose parent account failed to insert", async () => {
        const mock = makeMockClient({
            accountInsertFailsAt: "atlas-energy"
        });
        const r = await runCloudSeed({ data: mock.client as never });
        // Atlas has 2 seed signals (1 stale, 1 flagged) — both should
        // be skipped because the parent account failed.
        const atlasSignalCount = SEED_SIGNALS.filter(
            (s) => s.account_key === "atlas-energy"
        ).length;
        expect(r.counts.signals).toBe(
            SEED_SIGNALS.length - atlasSignalCount
        );
        const skipMessages = r.errors.filter((e) =>
            e.includes("atlas-energy")
        );
        // 1 account error + 2 signal-skip errors.
        expect(skipMessages.length).toBeGreaterThanOrEqual(3);
    });
});
