import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readLocalStorageJson, uninitializedContract } from "./shell-helpers";

describe("uninitializedContract", () => {
    it("returns a valid contract shape with health=uninitialized", () => {
        const contract = uninitializedContract<{ foo: string }>(
            "test reason"
        );
        expect(contract.schema_version).toBe("1.0");
        expect(contract.last_modified_at).toBeNull();
        expect(contract.health).toBe("uninitialized");
        expect(contract.health_reason).toBe("test reason");
        expect(contract.state).toBeNull();
    });

    it("carries different reasons through verbatim", () => {
        const a = uninitializedContract<unknown>("reason A");
        const b = uninitializedContract<unknown>("reason B");
        expect(a.health_reason).toBe("reason A");
        expect(b.health_reason).toBe("reason B");
    });
});

describe("readLocalStorageJson", () => {
    let originalLocalStorage: Storage | undefined;
    let mockStore: Map<string, string>;

    beforeEach(() => {
        mockStore = new Map();
        originalLocalStorage = globalThis.localStorage;
        const storage: Storage = {
            length: 0,
            clear: () => mockStore.clear(),
            getItem: (k: string) => mockStore.get(k) ?? null,
            key: () => null,
            removeItem: (k: string) => {
                mockStore.delete(k);
            },
            setItem: (k: string, v: string) => {
                mockStore.set(k, v);
            }
        };
        Object.defineProperty(globalThis, "localStorage", {
            value: storage,
            writable: true,
            configurable: true
        });
        // Also wire window.localStorage since the helper reads from
        // window.localStorage explicitly.
        Object.defineProperty(globalThis, "window", {
            value: { localStorage: storage },
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        if (originalLocalStorage === undefined) {
            // @ts-expect-error — restoring undeclared global
            delete globalThis.localStorage;
            // @ts-expect-error — restoring undeclared global
            delete globalThis.window;
        } else {
            Object.defineProperty(globalThis, "localStorage", {
                value: originalLocalStorage,
                writable: true,
                configurable: true
            });
        }
        vi.restoreAllMocks();
    });

    it("returns null when the key is absent", () => {
        expect(readLocalStorageJson("missing")).toBeNull();
    });

    it("parses valid JSON", () => {
        mockStore.set("k", JSON.stringify({ hello: "world" }));
        expect(readLocalStorageJson("k")).toEqual({ hello: "world" });
    });

    it("returns null when value is malformed JSON", () => {
        mockStore.set("k", "{not valid json");
        expect(readLocalStorageJson("k")).toBeNull();
    });

    it("returns null when value is the literal string 'null'", () => {
        mockStore.set("k", "null");
        expect(readLocalStorageJson("k")).toBeNull();
    });

    it("returns null when window is undefined (SSR-ish)", () => {
        Object.defineProperty(globalThis, "window", {
            value: undefined,
            writable: true,
            configurable: true
        });
        expect(readLocalStorageJson("k")).toBeNull();
    });
});
