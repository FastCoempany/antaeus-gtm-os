import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    __setDemoModeOverrideForTests,
    isDemoModeActive,
    makeDemoLocalNounAccessor
} from "./data-client-demo-local";

function memoryStorage(): Storage {
    const map = new Map<string, string>();
    return {
        get length() {
            return map.size;
        },
        key(i) {
            return Array.from(map.keys())[i] ?? null;
        },
        getItem(k) {
            return map.get(k) ?? null;
        },
        setItem(k, v) {
            map.set(k, v);
        },
        removeItem(k) {
            map.delete(k);
        },
        clear() {
            map.clear();
        }
    };
}

describe("makeDemoLocalNounAccessor", () => {
    let storage: Storage;
    let ids: string[];
    let counter: number;

    beforeEach(() => {
        storage = memoryStorage();
        counter = 0;
        ids = [];
    });

    function makeAccessor() {
        return makeDemoLocalNounAccessor("deals", {
            storage,
            generateId: () => {
                const id = `demo-deal-${counter++}`;
                ids.push(id);
                return id;
            },
            now: () => "2026-05-20T12:00:00Z"
        });
    }

    it("starts empty and returns [] from list()", async () => {
        const accessor = makeAccessor();
        expect(await accessor.list()).toEqual([]);
    });

    it("inserts a row and round-trips through list()", async () => {
        const accessor = makeAccessor();
        const inserted = await accessor.insert({
            account_name: "Meridian",
            stage: "prospect"
        } as never);

        expect(inserted).toMatchObject({
            id: "demo-deal-0",
            account_name: "Meridian",
            stage: "prospect",
            created_at: "2026-05-20T12:00:00Z",
            updated_at: "2026-05-20T12:00:00Z"
        });

        const all = await accessor.list();
        expect(all).toHaveLength(1);
        expect(all[0]?.id).toBe("demo-deal-0");
    });

    it("honors caller-supplied id on insert", async () => {
        const accessor = makeAccessor();
        const inserted = await accessor.insert({
            id: "custom-id",
            account_name: "Acme",
            stage: "prospect"
        } as never);
        expect(inserted.id).toBe("custom-id");
        // Generator not called when id supplied
        expect(ids).toHaveLength(0);
    });

    it("get() returns the row by id, or null on miss", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.insert({ account_name: "B", stage: "prospect" } as never);

        const hit = await accessor.get("demo-deal-1");
        expect(hit?.account_name).toBe("B");

        const miss = await accessor.get("nope");
        expect(miss).toBeNull();
    });

    it("update() merges patch + bumps updated_at", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);

        const patched = await accessor.update("demo-deal-0", {
            stage: "evaluation"
        } as never);

        expect(patched).toMatchObject({
            id: "demo-deal-0",
            account_name: "A",
            stage: "evaluation",
            updated_at: "2026-05-20T12:00:00Z"
        });
    });

    it("update() throws when the id doesn't exist", async () => {
        const accessor = makeAccessor();
        await expect(
            accessor.update("nonexistent", { stage: "won" } as never)
        ).rejects.toThrow(/row not found in deals/);
    });

    it("resolves workspace_profile by workspace_id, not id (PK fix)", async () => {
        // workspace_profile has no `id` column — it keys on workspace_id.
        // Before the pkColumn fix, update(workspace_id, …) looked for an
        // `id` match and threw "row not found", silently breaking the
        // Phase F toggle, density, ICP profile, and onboarding mirror.
        const wp = makeDemoLocalNounAccessor("workspace_profile", {
            storage,
            generateId: () => "should-not-be-used",
            now: () => "2026-06-22T12:00:00Z"
        });
        await wp.insert({
            workspace_id: "ws-77",
            phase_f_proposals_enabled: true
        } as never);

        // get() finds it by workspace_id
        const got = await wp.get("ws-77");
        expect((got as unknown as { workspace_id: string }).workspace_id).toBe(
            "ws-77"
        );

        // update() patches the row keyed by workspace_id (no throw)
        const patched = await wp.update("ws-77", {
            phase_f_proposals_enabled: false
        } as never);
        expect(
            (patched as unknown as { phase_f_proposals_enabled: boolean })
                .phase_f_proposals_enabled
        ).toBe(false);

        // remove() drops it by workspace_id
        await wp.remove("ws-77");
        expect(await wp.list()).toEqual([]);
    });

    it("remove() drops the row from list()", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.insert({ account_name: "B", stage: "prospect" } as never);

        await accessor.remove("demo-deal-0");

        const remaining = await accessor.list();
        expect(remaining).toHaveLength(1);
        expect(remaining[0]?.id).toBe("demo-deal-1");
    });

    it("remove() on missing id is a no-op", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.remove("nope");
        expect(await accessor.list()).toHaveLength(1);
    });

    it("list() applies where filter on equality", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.insert({ account_name: "B", stage: "won" } as never);
        await accessor.insert({ account_name: "C", stage: "prospect" } as never);

        const filtered = await accessor.list({
            where: { stage: "prospect" } as never
        });
        expect(filtered).toHaveLength(2);
        expect(filtered.map((d) => (d as { account_name: string }).account_name).sort()).toEqual(
            ["A", "C"]
        );
    });

    it("list() ignores undefined where values", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);

        const result = await accessor.list({
            where: { stage: undefined } as never
        });
        expect(result).toHaveLength(1);
    });

    it("list() respects orderBy ascending", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "C", stage: "prospect" } as never);
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.insert({ account_name: "B", stage: "prospect" } as never);

        const result = await accessor.list({
            orderBy: { column: "account_name", ascending: true } as never
        });
        expect(
            result.map((d) => (d as { account_name: string }).account_name)
        ).toEqual(["A", "B", "C"]);
    });

    it("list() respects orderBy descending", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        await accessor.insert({ account_name: "B", stage: "prospect" } as never);

        const result = await accessor.list({
            orderBy: { column: "account_name", ascending: false } as never
        });
        expect(
            result.map((d) => (d as { account_name: string }).account_name)
        ).toEqual(["B", "A"]);
    });

    it("list() respects limit", async () => {
        const accessor = makeAccessor();
        for (let i = 0; i < 10; i++) {
            await accessor.insert({
                account_name: `A${i}`,
                stage: "prospect"
            } as never);
        }
        const result = await accessor.list({ limit: 3 });
        expect(result).toHaveLength(3);
    });

    it("list() handles malformed storage gracefully", async () => {
        // Manually corrupt the storage envelope
        storage.setItem("gtmos_demo__deals", "not-valid-json");
        const accessor = makeAccessor();
        expect(await accessor.list()).toEqual([]);
    });

    it("subscribe() returns a no-op channel", () => {
        const accessor = makeAccessor();
        const channel = accessor.subscribe(() => undefined);
        expect(channel).toBeDefined();
        expect(typeof channel.unsubscribe).toBe("function");
        // Calling it shouldn't throw.
        expect(() => channel.unsubscribe()).not.toThrow();
    });

    it("stores rows under the gtmos_demo__<table> namespace", async () => {
        const accessor = makeAccessor();
        await accessor.insert({ account_name: "A", stage: "prospect" } as never);
        const raw = storage.getItem("gtmos_demo__deals");
        expect(raw).toBeDefined();
        const parsed = JSON.parse(raw!);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].account_name).toBe("A");
    });
});

describe("isDemoModeActive", () => {
    afterEach(() => {
        __setDemoModeOverrideForTests(null);
        try {
            sessionStorage.removeItem("gtmos_env_mode");
        } catch {
            // ignore
        }
    });

    it("returns true when sessionStorage gtmos_env_mode is 'demo'", () => {
        sessionStorage.setItem("gtmos_env_mode", "demo");
        expect(isDemoModeActive()).toBe(true);
    });

    it("returns false when gtmos_env_mode is missing", () => {
        expect(isDemoModeActive()).toBe(false);
    });

    it("returns false when gtmos_env_mode is anything other than 'demo'", () => {
        sessionStorage.setItem("gtmos_env_mode", "production");
        expect(isDemoModeActive()).toBe(false);
    });

    it("honors the test override when set", () => {
        __setDemoModeOverrideForTests(true);
        expect(isDemoModeActive()).toBe(true);
        __setDemoModeOverrideForTests(false);
        expect(isDemoModeActive()).toBe(false);
    });
});
