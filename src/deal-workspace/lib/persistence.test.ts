import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    __getDataClientForTests,
    __setDataClientForTests,
    looksLikePersistedId,
    saveDealEdit
} from "./persistence";
import { __setAllDealsForTests, allDeals } from "../state";
import type { Deal } from "./deal-shape";

function makeStubClient(overrides: {
    update?: (id: string, patch: unknown) => Promise<unknown>;
    insert?: (row: unknown) => Promise<unknown>;
}): {
    deals: {
        update: (id: string, patch: unknown) => Promise<unknown>;
        insert: (row: unknown) => Promise<unknown>;
    };
} {
    return {
        deals: {
            update:
                overrides.update ??
                (async () => {
                    throw new Error("update not stubbed");
                }),
            insert:
                overrides.insert ??
                (async () => {
                    throw new Error("insert not stubbed");
                })
        }
    };
}

describe("looksLikePersistedId", () => {
    it("matches uuids", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(
            looksLikePersistedId("550E8400-E29B-41D4-A716-446655440000")
        ).toBe(true);
    });

    it("rejects legacy / blob ids", () => {
        expect(looksLikePersistedId("legacy-0")).toBe(false);
        expect(looksLikePersistedId("legacy-1")).toBe(false);
        expect(looksLikePersistedId("draft-abc")).toBe(false);
        expect(looksLikePersistedId("")).toBe(false);
    });
});

describe("saveDealEdit", () => {
    beforeEach(() => {
        __setAllDealsForTests([]);
        __setDataClientForTests(null);
    });

    afterEach(() => {
        __setDataClientForTests(null);
    });

    const baseDeal: Deal = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        accountName: "Acme",
        value: 50000,
        stage: "discovery"
    };

    it("upserts locally even when no client is wired", async () => {
        const result = await saveDealEdit(baseDeal);
        expect(result.id).toBe(baseDeal.id);
        expect(allDeals.value).toHaveLength(1);
        expect(allDeals.value[0]?.accountName).toBe("Acme");
    });

    it("calls deals.update for uuid ids", async () => {
        const update = vi.fn(async (_id: string, _patch: unknown) => ({
            id: baseDeal.id,
            account_name: "Acme",
            stage: "evaluation",
            deal_value: 60000,
            data: {}
        }));
        __setDataClientForTests(
            makeStubClient({ update }) as unknown as Parameters<
                typeof __setDataClientForTests
            >[0]
        );

        const next: Deal = { ...baseDeal, stage: "evaluation", value: 60000 };
        const saved = await saveDealEdit(next);

        expect(update).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0]?.[0]).toBe(baseDeal.id);
        expect(saved.stage).toBe("evaluation");
        expect(saved.value).toBe(60000);
        expect(allDeals.value[0]?.stage).toBe("evaluation");
    });

    it("calls deals.insert for non-uuid ids (legacy / blob)", async () => {
        const insert = vi.fn(async (_row: unknown) => ({
            id: "550e8400-e29b-41d4-a716-446655440099",
            account_name: "Beta",
            stage: "discovery",
            deal_value: 10000,
            data: {}
        }));
        __setDataClientForTests(
            makeStubClient({ insert }) as unknown as Parameters<
                typeof __setDataClientForTests
            >[0]
        );

        const legacy: Deal = {
            id: "legacy-0",
            accountName: "Beta",
            value: 10000,
            stage: "discovery"
        };
        await saveDealEdit(legacy);

        expect(insert).toHaveBeenCalledTimes(1);
        const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;
        expect(row.account_name).toBe("Beta");
        expect(row.stage).toBe("discovery");
    });

    it("preserves the local edit when the server save throws", async () => {
        const update = vi.fn(async () => {
            throw new Error("RLS rejection");
        });
        __setDataClientForTests(
            makeStubClient({ update }) as unknown as Parameters<
                typeof __setDataClientForTests
            >[0]
        );

        const next: Deal = { ...baseDeal, stage: "negotiation" };
        const result = await saveDealEdit(next);

        expect(result.stage).toBe("negotiation");
        // Local upsert still happened so the operator sees their edit.
        expect(allDeals.value[0]?.stage).toBe("negotiation");
    });
});

describe("__setDataClientForTests", () => {
    it("round-trips the client reference", () => {
        const stub = makeStubClient({}) as unknown as Parameters<
            typeof __setDataClientForTests
        >[0];
        __setDataClientForTests(stub);
        expect(__getDataClientForTests()).toBe(stub);
        __setDataClientForTests(null);
        expect(__getDataClientForTests()).toBeNull();
    });
});
