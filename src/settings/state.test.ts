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

// ─── exportCloudData (pre-beta hygiene) ────────────────────────────

import {
    exportCloudData,
    isExportingCloud,
    lastCloudExport
} from "./state";
import { vi } from "vitest";

vi.mock("./lib/cloud-sync", async () => {
    const actual = await vi.importActual<typeof import("./lib/cloud-sync")>(
        "./lib/cloud-sync"
    );
    return {
        ...actual,
        exportCloudWorkspace: vi.fn().mockResolvedValue({
            schemaVersion: 1,
            source: "antaeus-cloud-export-v1",
            capturedAt: "2026-06-02T18:00:00.000Z",
            workspaceId: "ws-1",
            userEmail: "test@example.com",
            tables: {
                icps: [{ id: "i1" }, { id: "i2" }],
                deals: [{ id: "d1" }]
            },
            perTableCount: { icps: 2, deals: 1 },
            errors: [],
            totalRows: 3
        })
    };
});

describe("exportCloudData", () => {
    beforeEach(() => {
        clearStorage();
        __resetForTests();
    });

    it("toggles isExportingCloud and stores the snapshot", async () => {
        expect(isExportingCloud.value).toBe(false);
        expect(lastCloudExport.value).toBeNull();
        const snap = await exportCloudData();
        expect(isExportingCloud.value).toBe(false);
        expect(snap.totalRows).toBe(3);
        expect(lastCloudExport.value).not.toBeNull();
        expect(lastCloudExport.value!.totalRows).toBe(3);
    });

    it("flashes a good toast when there are no errors", async () => {
        await exportCloudData();
        expect(toast.value).not.toBeNull();
        expect(toast.value!.tone).toBe("good");
        expect(toast.value!.message).toContain("Cloud export ready");
        expect(toast.value!.message).toContain("3");
    });
});
