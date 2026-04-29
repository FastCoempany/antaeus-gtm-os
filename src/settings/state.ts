import { signal, type Signal } from "@preact/signals";
import { createDataClient } from "@/lib/data-client";
import {
    DEMO_INACTIVE,
    type BackupReadout,
    type DemoState,
    type ProductCategory
} from "./lib/types";
import {
    applyBackup,
    buildBackup,
    clearWorkspace,
    exitDemoMode,
    loadCategory,
    loadDemoState,
    readBackup,
    recordExport,
    saveCategory
} from "./lib/storage";
import {
    checkCloudConnection,
    EMPTY_COUNTS,
    loadCloudRowCounts,
    type CloudConnectionState,
    type CloudRowCounts
} from "./lib/cloud-sync";

export type ToastTone = "good" | "warn" | "bad" | "info";

export interface Toast {
    readonly id: string;
    readonly tone: ToastTone;
    readonly message: string;
}

export const category: Signal<ProductCategory> = signal("cxai");
export const demo: Signal<DemoState> = signal(DEMO_INACTIVE);
export const backup: Signal<BackupReadout> = signal({
    keyCount: 0,
    capturedAt: null,
    source: "antaeus-settings-v2"
});
export const toast: Signal<Toast | null> = signal(null);
export const isWorking: Signal<boolean> = signal(false);

export const cloudConnection: Signal<CloudConnectionState> = signal({
    status: "no-credentials",
    userEmail: null,
    workspace: null,
    errorMessage: null
});
export const cloudCounts: Signal<CloudRowCounts> = signal(EMPTY_COUNTS);
export const isVerifyingCloud: Signal<boolean> = signal(false);
export const cloudVerifiedAt: Signal<string | null> = signal(null);

let toastTimer: number | null = null;

function flashToast(tone: ToastTone, message: string): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    toast.value = { id, tone, message };
    if (typeof window !== "undefined") {
        if (toastTimer !== null) window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            if (toast.value && toast.value.id === id) {
                toast.value = null;
            }
            toastTimer = null;
        }, 4500);
    }
}

export function refreshAll(): void {
    category.value = loadCategory();
    demo.value = loadDemoState();
    backup.value = readBackup();
}

export function setCategory(next: ProductCategory): void {
    saveCategory(next);
    category.value = next;
    flashToast("good", "Product category saved.");
}

export function exitDemo(): void {
    exitDemoMode();
    demo.value = loadDemoState();
    flashToast("info", "Demo mode exited. Reload to see real workspace truth.");
}

export function exportBackup(): void {
    if (typeof document === "undefined") return;
    isWorking.value = true;
    try {
        const snap = buildBackup();
        const blob = new Blob([JSON.stringify(snap, null, 2)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `antaeus-backup-${snap.capturedAt.replace(/[:.]/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        recordExport();
        backup.value = readBackup();
        flashToast(
            "good",
            `Backup exported. ${Object.keys(snap.data).length} keys captured.`
        );
    } catch (err) {
        flashToast("bad", "Export failed. See browser console.");
        console.error("[settings] export failed", err);
    } finally {
        isWorking.value = false;
    }
}

export async function importBackupFromFile(file: File): Promise<void> {
    isWorking.value = true;
    try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        if (
            !parsed ||
            typeof parsed !== "object" ||
            !("data" in parsed) ||
            typeof (parsed as { data: unknown }).data !== "object"
        ) {
            flashToast(
                "bad",
                "That file is not a valid Antaeus backup. No changes applied."
            );
            return;
        }
        const result = applyBackup(parsed as Parameters<typeof applyBackup>[0]);
        if (result.error) {
            flashToast("bad", result.error);
        } else {
            flashToast(
                "good",
                `Backup imported. ${result.applied} keys applied${
                    result.skipped > 0 ? `, ${result.skipped} skipped` : ""
                }.`
            );
        }
        backup.value = readBackup();
        category.value = loadCategory();
        demo.value = loadDemoState();
    } catch (err) {
        flashToast("bad", "Import failed: file is not valid JSON.");
        console.error("[settings] import failed", err);
    } finally {
        isWorking.value = false;
    }
}

export function clearAll(): void {
    isWorking.value = true;
    try {
        const removed = clearWorkspace();
        backup.value = readBackup();
        category.value = loadCategory();
        demo.value = loadDemoState();
        flashToast(
            "warn",
            `Workspace cleared. ${removed} keys removed from this device.`
        );
    } finally {
        isWorking.value = false;
    }
}

export function dismissToast(): void {
    toast.value = null;
}

/**
 * Probe + refresh the cloud sync status. Called on mount and on
 * "Verify cloud" button press. Surfaces connection state, workspace
 * info, and per-noun row counts so the operator can confirm the
 * cross-device sync is actually working.
 */
export async function refreshCloudStatus(): Promise<void> {
    isVerifyingCloud.value = true;
    try {
        const connection = await checkCloudConnection(createDataClient);
        cloudConnection.value = connection;
        if (connection.status === "connected") {
            const counts = await loadCloudRowCounts(createDataClient);
            cloudCounts.value = counts;
            cloudVerifiedAt.value = new Date().toISOString();
        } else {
            cloudCounts.value = EMPTY_COUNTS;
            cloudVerifiedAt.value = null;
        }
    } finally {
        isVerifyingCloud.value = false;
    }
}

// Test seeds
export function __setCategoryForTests(next: ProductCategory): void {
    category.value = next;
}
export function __setDemoForTests(next: DemoState): void {
    demo.value = next;
}
export function __setBackupForTests(next: BackupReadout): void {
    backup.value = next;
}
export function __resetForTests(): void {
    category.value = "cxai";
    demo.value = DEMO_INACTIVE;
    backup.value = {
        keyCount: 0,
        capturedAt: null,
        source: "antaeus-settings-v2"
    };
    toast.value = null;
    isWorking.value = false;
    cloudConnection.value = {
        status: "no-credentials",
        userEmail: null,
        workspace: null,
        errorMessage: null
    };
    cloudCounts.value = EMPTY_COUNTS;
    isVerifyingCloud.value = false;
    cloudVerifiedAt.value = null;
}

export function __setCloudConnectionForTests(
    next: CloudConnectionState
): void {
    cloudConnection.value = next;
}
export function __setCloudCountsForTests(next: CloudRowCounts): void {
    cloudCounts.value = next;
}
