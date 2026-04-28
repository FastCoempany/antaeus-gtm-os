import { beforeEach, describe, expect, it } from "vitest";
import {
    backup,
    category,
    demo,
    setCategory,
    refreshAll,
    toast,
    __resetForTests
} from "./state";
import { DEMO_INACTIVE } from "./lib/types";

function clearStorage(): void {
    if (typeof localStorage !== "undefined") {
        for (const k of Object.keys(localStorage)) {
            if (k.startsWith("gtmos_")) localStorage.removeItem(k);
        }
    }
}

describe("initial state", () => {
    beforeEach(() => {
        clearStorage();
        __resetForTests();
    });

    it("starts with default category cxai + inactive demo", () => {
        expect(category.value).toBe("cxai");
        expect(demo.value).toEqual(DEMO_INACTIVE);
    });

    it("backup is empty", () => {
        expect(backup.value.keyCount).toBe(0);
        expect(backup.value.capturedAt).toBeNull();
    });

    it("no toast", () => {
        expect(toast.value).toBeNull();
    });
});

describe("setCategory", () => {
    beforeEach(() => {
        clearStorage();
        __resetForTests();
    });

    it("updates the signal + flashes a toast", () => {
        setCategory("legal");
        expect(category.value).toBe("legal");
        expect(toast.value).not.toBeNull();
        expect(toast.value!.tone).toBe("good");
    });
});

describe("refreshAll", () => {
    beforeEach(() => {
        clearStorage();
        __resetForTests();
    });

    it("re-reads category + demo + backup from storage", () => {
        // refresh against jsdom localStorage which is empty by default
        refreshAll();
        expect(category.value).toBe("cxai");
        expect(demo.value.active).toBe(false);
    });
});
