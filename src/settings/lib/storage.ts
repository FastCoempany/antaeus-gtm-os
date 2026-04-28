import { reportError } from "@/lib/observability";
import {
    DEMO_INACTIVE,
    type BackupReadout,
    type BackupSnapshot,
    type DemoState,
    type ProductCategory
} from "./types";

const KEY_PREFIX = "gtmos_";
/**
 * Namespace prefix used by `js/demo-storage-bootstrap.js` to isolate
 * demo-mode storage from real-workspace data. While in demo mode every
 * `gtmos_*` read/write is routed through `gtmos_demo__gtmos_*` by the
 * bootstrap's Storage.prototype patches. clearWorkspace() must skip
 * keys with this prefix so a "Clear local data" press from real-mode
 * Settings does not nuke a sibling demo workspace, and vice versa.
 */
const DEMO_PREFIX = "gtmos_demo__";
const KEY_CATEGORY = "gtmos_product_category";
const KEY_DEMO_SCENARIO = "gtmos_demo_scenario";
const KEY_DEMO_SEEDED = "gtmos_demo_seeded_at";
const KEY_LAST_EXPORT = "gtmos_last_backup_export_at";
/**
 * The canonical demo-mode flag set by `js/demo-storage-bootstrap.js`.
 * Lives in sessionStorage (not localStorage) so it does not survive a
 * tab close. Value is the literal string "demo" when active, "prod"
 * (or absent) otherwise. Reading the legacy `gtmos_demo_active`
 * localStorage key — as the original Wave 1 implementation did —
 * never matches because nothing writes it.
 */
const ENV_MODE_KEY = "gtmos_env_mode";

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

interface SessionLike {
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function getSession(s?: SessionLike | null): SessionLike | null {
    if (s !== undefined) return s;
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
}

/**
 * Walk localStorage and return every gtmos_-prefixed key, EXCLUDING
 * those that begin with `gtmos_demo__`. The demo-namespace exclusion
 * ensures clearWorkspace + buildBackup never accidentally reach into
 * a sibling demo workspace's data when the user is in real mode.
 */
function listGtmosKeys(s?: StorageLike | null): string[] {
    const store = getStorage(s);
    if (!store) return [];
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k || !k.startsWith(KEY_PREFIX)) continue;
        if (k.startsWith(DEMO_PREFIX)) continue;
        keys.push(k);
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

export interface LoadDemoStateOptions {
    readonly storage?: StorageLike | null;
    readonly session?: SessionLike | null;
}

/**
 * Demo-mode probe.
 *
 * `js/demo-storage-bootstrap.js` is the canonical authority for demo
 * state: it writes `sessionStorage.gtmos_env_mode = "demo"` when the
 * page is loaded with `?demo=1` (or via `bootstrapEnvironmentMode({
 * forceMode: "demo" })`). All localStorage reads/writes for
 * `gtmos_*` keys are then namespace-rewritten to `gtmos_demo__*` for
 * the lifetime of that session.
 *
 * The original Wave 1 implementation read `gtmos_demo_active` from
 * localStorage — a key nothing writes — so the Settings demo card
 * always reported "Off" and the Exit button stayed disabled.
 */
export function loadDemoState(opts?: LoadDemoStateOptions): DemoState {
    const session = getSession(opts?.session);
    const store = getStorage(opts?.storage);
    if (!session && !store) return DEMO_INACTIVE;
    try {
        const mode = session?.getItem(ENV_MODE_KEY) ?? null;
        const active = mode === "demo";
        // The bootstrap does not record a seeded-at timestamp, so the
        // best we can offer here is the optional scenario tag (some
        // demo entrypoints write `gtmos_demo_scenario` to localStorage
        // alongside the env-mode flip; we surface it when present).
        const scenario = store?.getItem(KEY_DEMO_SCENARIO) ?? null;
        const seededAt = store?.getItem(KEY_DEMO_SEEDED) ?? null;
        if (!active) return DEMO_INACTIVE;
        return {
            active: true,
            seededAt: seededAt || null,
            scenario: scenario || null
        };
    } catch (err) {
        reportError(err, { op: "settings.loadDemoState" });
        return DEMO_INACTIVE;
    }
}

export interface ExitDemoOptions {
    readonly storage?: StorageLike | null;
    readonly session?: {
        getItem(key: string): string | null;
        removeItem(key: string): void;
    } | null;
}

/**
 * Exit demo mode by removing the canonical sessionStorage flag set by
 * `js/demo-storage-bootstrap.js`. Also clears the optional metadata
 * (`gtmos_demo_scenario`, `gtmos_demo_seeded_at`) that some demo
 * entrypoints write to localStorage so the Settings card stops
 * advertising stale scenario info.
 */
export function exitDemoMode(opts?: ExitDemoOptions): void {
    try {
        if (opts?.session !== undefined) {
            opts.session?.removeItem(ENV_MODE_KEY);
        } else if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(ENV_MODE_KEY);
        }
        const store = getStorage(opts?.storage);
        if (store) {
            store.removeItem(KEY_DEMO_SEEDED);
            store.removeItem(KEY_DEMO_SCENARIO);
        }
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
