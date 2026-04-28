import { reportError } from "@/lib/observability";
import {
    DEMO_INACTIVE,
    type BackupReadout,
    type BackupSnapshot,
    type DemoState,
    type ProductCategory
} from "./types";

const KEY_PREFIX = "gtmos_";
const KEY_CATEGORY = "gtmos_product_category";
const KEY_DEMO = "gtmos_demo_active";
const KEY_DEMO_SEEDED = "gtmos_demo_seeded_at";
const KEY_DEMO_SCENARIO = "gtmos_demo_scenario";
const KEY_LAST_EXPORT = "gtmos_last_backup_export_at";

/**
 * Storage helpers for the Settings room.
 *
 * Operates on `gtmos_*` localStorage keys directly — the Preact
 * Settings rebuild is intentionally a *local* trust annex. Cloud sync
 * still goes through the legacy auth + Supabase pipeline; this room
 * controls what lives on this device.
 */

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    key(index: number): string | null;
    readonly length: number;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function listGtmosKeys(s?: StorageLike | null): string[] {
    const store = getStorage(s);
    if (!store) return [];
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
    }
    return keys.sort();
}

export function loadCategory(s?: StorageLike | null): ProductCategory {
    const store = getStorage(s);
    if (!store) return "cxai";
    try {
        const raw = store.getItem(KEY_CATEGORY);
        if (!raw) return "cxai";
        // Accept both raw string and JSON-wrapped values to tolerate
        // legacy stores that quoted the category.
        const trimmed = raw.replace(/^"|"$/g, "");
        return (trimmed || "cxai") as ProductCategory;
    } catch (err) {
        reportError(err, { op: "settings.loadCategory" });
        return "cxai";
    }
}

export function saveCategory(
    next: ProductCategory,
    s?: StorageLike | null
): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(KEY_CATEGORY, next);
    } catch (err) {
        reportError(err, { op: "settings.saveCategory" });
    }
}

export function loadDemoState(s?: StorageLike | null): DemoState {
    const store = getStorage(s);
    if (!store) return DEMO_INACTIVE;
    try {
        const active = store.getItem(KEY_DEMO);
        const seeded = store.getItem(KEY_DEMO_SEEDED);
        const scenario = store.getItem(KEY_DEMO_SCENARIO);
        return {
            active: active === "1" || active === "true",
            seededAt: seeded || null,
            scenario: scenario || null
        };
    } catch (err) {
        reportError(err, { op: "settings.loadDemoState" });
        return DEMO_INACTIVE;
    }
}

export function exitDemoMode(s?: StorageLike | null): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.removeItem(KEY_DEMO);
        store.removeItem(KEY_DEMO_SEEDED);
        store.removeItem(KEY_DEMO_SCENARIO);
    } catch (err) {
        reportError(err, { op: "settings.exitDemo" });
    }
}

export function buildBackup(
    now = new Date(),
    s?: StorageLike | null
): BackupSnapshot {
    const store = getStorage(s);
    const data: Record<string, string> = {};
    if (store) {
        for (const key of listGtmosKeys(store)) {
            const v = store.getItem(key);
            if (v !== null) data[key] = v;
        }
    }
    return {
        capturedAt: now.toISOString(),
        source: "antaeus-settings-v2",
        data
    };
}

export function recordExport(
    now = new Date(),
    s?: StorageLike | null
): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(KEY_LAST_EXPORT, now.toISOString());
    } catch (err) {
        reportError(err, { op: "settings.recordExport" });
    }
}

export function lastExportAt(s?: StorageLike | null): string | null {
    const store = getStorage(s);
    if (!store) return null;
    try {
        return store.getItem(KEY_LAST_EXPORT);
    } catch (err) {
        reportError(err, { op: "settings.lastExportAt" });
        return null;
    }
}

export function readBackup(s?: StorageLike | null): BackupReadout {
    const keys = listGtmosKeys(s);
    return {
        keyCount: keys.length,
        capturedAt: lastExportAt(s),
        source: "antaeus-settings-v2"
    };
}

export interface ImportResult {
    readonly applied: number;
    readonly skipped: number;
    readonly error: string | null;
}

export function applyBackup(
    snapshot: BackupSnapshot,
    s?: StorageLike | null
): ImportResult {
    const store = getStorage(s);
    if (!store) return { applied: 0, skipped: 0, error: "Storage unavailable" };
    if (!snapshot || typeof snapshot !== "object" || !snapshot.data) {
        return { applied: 0, skipped: 0, error: "Backup file is malformed" };
    }
    let applied = 0;
    let skipped = 0;
    for (const [k, v] of Object.entries(snapshot.data)) {
        if (!k.startsWith(KEY_PREFIX)) {
            skipped++;
            continue;
        }
        if (typeof v !== "string") {
            skipped++;
            continue;
        }
        try {
            store.setItem(k, v);
            applied++;
        } catch (err) {
            reportError(err, { op: "settings.applyBackup", key: k });
            skipped++;
        }
    }
    return { applied, skipped, error: null };
}

export function clearWorkspace(s?: StorageLike | null): number {
    const store = getStorage(s);
    if (!store) return 0;
    const keys = listGtmosKeys(store);
    let removed = 0;
    for (const key of keys) {
        try {
            store.removeItem(key);
            removed++;
        } catch (err) {
            reportError(err, { op: "settings.clearWorkspace", key });
        }
    }
    return removed;
}
