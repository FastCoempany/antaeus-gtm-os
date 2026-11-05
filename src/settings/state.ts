import { signal, type Signal } from "@preact/signals";
import { createDataClient } from "@/lib/data-client";
import { setLiveEdgeOn } from "@/lib/edge/edge-prefs";
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
    deleteCloudWorkspace,
    EMPTY_COUNTS,
    exportCloudWorkspace,
    loadCloudRowCounts,
    type CloudConnectionState,
    type CloudDeleteResult,
    type CloudExportSnapshot,
    type CloudRowCounts,
    isCloudExportFile,
    restoreCloudExport
} from "./lib/cloud-sync";
import {
    buildExportFile,
    type WorkspaceExportFormat
} from "./lib/workspace-export-formats";

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
export const isDeletingCloud: Signal<boolean> = signal(false);
export const lastCloudDelete: Signal<CloudDeleteResult | null> = signal(null);
export const isExportingCloud: Signal<boolean> = signal(false);
export const lastCloudExport: Signal<CloudExportSnapshot | null> = signal(null);
export const exportFormat: Signal<WorkspaceExportFormat> = signal("json");

// ── Phase F (ADR-017) — proposals toggle ──────────────────────
export const phaseFEnabled: Signal<boolean> = signal(true);
export const phaseFLoaded: Signal<boolean> = signal(false);
export const phaseFSaving: Signal<boolean> = signal(false);
export const phaseFError: Signal<string | null> = signal(null);

// Density gradient (spec 02). The live state lives in @/lib/density's
// signal; these are the Settings-local load/save status wrappers.
export const densityLoaded: Signal<boolean> = signal(false);
export const densitySaving: Signal<boolean> = signal(false);
export const densityError: Signal<string | null> = signal(null);

// Phase 2.9 introduced an inboundReturn signal here. Program 6 / PR 1
// retired it in favor of the canonical RoomChrome + BackButton pair
// — same continuity-param read, same safeReturnTo guard, applied
// uniformly to every room.

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
    void refreshPhaseFToggle();
    void refreshDensity();
    void loadAutoRerun();
}

export function setCategory(next: ProductCategory): void {
    saveCategory(next);
    category.value = next;
    flashToast("good", "Product category saved.");
}

export function exitDemo(): void {
    exitDemoMode();
    demo.value = loadDemoState();
    flashToast("info", "Demo mode exited. Reload to switch back to your real workspace data.");
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
        // A cloud export ("Download my workspace") restores through the
        // cloud — upserted row by row, idempotent — not localStorage.
        if (isCloudExportFile(parsed)) {
            const result = await restoreCloudExport(
                () => createDataClient(),
                parsed
            );
            if (result.restoredRows > 0) {
                const trouble =
                    result.errors.length > 0
                        ? ` ${result.errors.length} part${result.errors.length === 1 ? "" : "s"} couldn't be put back.`
                        : "";
                flashToast(
                    "good",
                    `Workspace restored — ${result.restoredRows} records back in place.${trouble}`
                );
            } else {
                flashToast(
                    "bad",
                    "Couldn't put the copy back — check your connection and try again."
                );
            }
            return;
        }
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
 * Download my workspace. Reads every workspace table (see
 * lib/workspace-tables.ts), organizes it by part of the app, and
 * downloads it in the chosen format: one restorable JSON file, or a
 * .zip of spreadsheets with a contents sheet.
 *
 * Defensive throughout: a part that can't be read lands empty with its
 * error noted in the file, and the rest of the download still happens.
 */
export async function exportCloudData(
    format: WorkspaceExportFormat = exportFormat.value
): Promise<CloudExportSnapshot> {
    isExportingCloud.value = true;
    try {
        const snap = await exportCloudWorkspace(createDataClient);
        lastCloudExport.value = snap;

        // Outside a DOM (tests, SSR) skip the download but keep the
        // snapshot signal populated so callers can inspect it.
        if (typeof document !== "undefined") {
            try {
                const file = buildExportFile(snap, format);
                const blob = new Blob([file.body as BlobPart], {
                    type: file.mimeType
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("[settings] workspace download failed", err);
            }
        }

        const parts = snap.manifest.length;
        if (snap.errors.length === 0) {
            flashToast(
                "good",
                `Workspace downloaded — ${snap.totalRows} record${
                    snap.totalRows === 1 ? "" : "s"
                } across ${parts} parts of the app.`
            );
        } else {
            flashToast(
                "warn",
                `Workspace downloaded, but ${snap.errors.length} part${
                    snap.errors.length === 1 ? "" : "s"
                } couldn't be read. ${snap.totalRows} records are in the file, and it lists what's missing.`
            );
            console.warn("[settings] workspace download errors:", snap.errors);
        }
        return snap;
    } finally {
        isExportingCloud.value = false;
    }
}

/**
 * Delete everything. Removes every record in this workspace — the same
 * parts the download covers (lib/workspace-tables.ts) — through the
 * delete_workspace_data RPC. Keeps the workspaces row, its membership,
 * and the user's own profile so the operator can keep signing in.
 *
 * After cloud wipe, also clears the local `gtmos_*` cache + refreshes
 * the cloud-counts readout so the operator sees the result.
 *
 * The UI gates this behind a typed-phrase confirmation; this function
 * trusts its caller to have collected that consent.
 */
export async function deleteCloudData(): Promise<CloudDeleteResult> {
    isDeletingCloud.value = true;
    try {
        const result = await deleteCloudWorkspace(createDataClient);
        lastCloudDelete.value = result;

        // Mirror to local: wipe gtmos_* so the room doesn't keep
        // showing stale state. Skipped when the cloud delete never
        // started, so a failed sign-in doesn't cost the device copy.
        if (!result.cancelled) {
            clearWorkspace();
            backup.value = readBackup();
            category.value = loadCategory();
            demo.value = loadDemoState();
        }

        if (result.cancelled) {
            flashToast(
                "bad",
                `Nothing was deleted from the cloud. ${result.errors[0] ?? ""}`.trim()
            );
        } else if (result.errors.length === 0) {
            flashToast(
                "warn",
                `Everything deleted — ${result.totalDeleted} record${
                    result.totalDeleted === 1 ? "" : "s"
                } removed, and this browser's copy cleared.`
            );
        } else {
            flashToast(
                "bad",
                `${result.totalDeleted} records deleted, but ${result.errors.length} part${
                    result.errors.length === 1 ? "" : "s"
                } couldn't be emptied. Try again in a minute.`
            );
            console.warn("[settings] cloud delete errors:", result.errors);
        }

        // Re-probe cloud counts so the row-count card shows zeros (or
        // surfaces any rows that survived the wipe).
        await refreshCloudStatus();

        return result;
    } finally {
        isDeletingCloud.value = false;
    }
}

/**
 * Probe + refresh the cloud sync status. Called on mount and on
 * "Verify cloud" button press. Surfaces connection state, workspace
 * info, and per-noun row counts so the operator can confirm the
 * cross-device sync is actually working.
 */
// ── Phase F toggle actions ────────────────────────────────────

import { loadPhaseFToggle, savePhaseFToggle } from "./lib/phase-f-toggle";
import { loadAutoRerun, saveAutoRerun } from "@/prospecting-desk/lib/auto-rerun";

export async function toggleAutoRerun(next: boolean): Promise<void> {
    const result = await saveAutoRerun(next);
    if (!result.ok) {
        flashToast("bad", result.error ?? "Couldn't save that just now. Try again in a moment.");
        return;
    }
    flashToast(
        next ? "good" : "info",
        next
            ? "Saved searches will be checked again every week."
            : "Weekly automatic checks of saved searches are off."
    );
}

export async function refreshPhaseFToggle(): Promise<void> {
    const state = await loadPhaseFToggle();
    phaseFEnabled.value = state.enabled;
    phaseFLoaded.value = true;
}

export async function togglePhaseF(next: boolean): Promise<void> {
    if (phaseFSaving.value) return;
    phaseFSaving.value = true;
    phaseFError.value = null;
    const previous = phaseFEnabled.value;
    phaseFEnabled.value = next;
    try {
        const result = await savePhaseFToggle(next);
        if (!result.ok) {
            phaseFEnabled.value = previous;
            phaseFError.value = result.error ?? "Could not save the toggle.";
            return;
        }
        flashToast(
            next ? "good" : "info",
            next
                ? "Recommendations turned on."
                : "Recommendations turned off."
        );
    } finally {
        phaseFSaving.value = false;
    }
}

/**
 * The Live Edge's durable switch (locked 2026-07-16) — mirrors the
 * hover control on the rail itself. Edge off ≠ capture off: the wire
 * hides; the counting keeps running.
 */
export function toggleLiveEdge(next: boolean): void {
    setLiveEdgeOn(next);
    flashToast(
        next ? "good" : "info",
        next
            ? "Recent activity is visible in the left panel."
            : "Recent activity is hidden. Use the activity control to show it again."
    );
}

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
    isDeletingCloud.value = false;
    lastCloudDelete.value = null;
    isExportingCloud.value = false;
    lastCloudExport.value = null;
    exportFormat.value = "json";
    phaseFEnabled.value = true;
    phaseFLoaded.value = false;
    phaseFSaving.value = false;
    phaseFError.value = null;
}

export function __setCloudConnectionForTests(
    next: CloudConnectionState
): void {
    cloudConnection.value = next;
}
export function __setCloudCountsForTests(next: CloudRowCounts): void {
    cloudCounts.value = next;
}

// ── Density gradient actions (spec 02) ────────────────────────────

import { bootDensity, saveDensityState } from "@/lib/density";
import type { DensityState } from "@/lib/density";

export async function refreshDensity(): Promise<void> {
    await bootDensity();
    densityLoaded.value = true;
}

export async function setDensity(next: DensityState): Promise<void> {
    if (densitySaving.value) return;
    densitySaving.value = true;
    densityError.value = null;
    try {
        const result = await saveDensityState(next);
        if (!result.ok) {
            densityError.value = result.error ?? "Could not save your choice.";
            return;
        }
        flashToast(
            "good",
            next === "show_me_how"
                ? "The system will walk you through every surface."
                : "The system will step back and trust your way around."
        );
    } finally {
        densitySaving.value = false;
    }
}
