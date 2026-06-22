import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload
} from "@supabase/supabase-js";
import type { InsertRow, Row, TableName, UpdateRow } from "./database-helpers";
import { pkColumn } from "./database-helpers";
import type { ListOptions, NounAccessor } from "./data-client";

/**
 * Demo-local NounAccessor — a localStorage-backed implementation that mirrors
 * the production Supabase NounAccessor shape but never hits the network.
 *
 * Phase 4.5 demo mode boundary (ADR-005): demo workspaces stay localStorage-only.
 * Generators only observe real workspaces. When the demo-seed bootstrap has
 * marked the workspace as demo (`sessionStorage.gtmos_env_mode === "demo"`),
 * the data-client returns these accessors instead of the real Supabase-backed
 * ones. Mutations stay local; subscriptions are no-ops; the heartbeat never
 * sees the workspace.
 *
 * Rows are stored as JSON arrays under `gtmos_demo__<table>` keys. The
 * namespace matches the rest of the demo isolation pattern from
 * `js/demo-storage-bootstrap.js`. A separate cleanup pass during Settings
 * room operations preserves this prefix.
 *
 * Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md §"Demo mode boundary"
 */

// ─── Generation helpers (test-overridable) ──────────────────────────────

interface DemoLocalDeps {
    storage: Storage;
    generateId: () => string;
    now: () => string;
}

function defaultDeps(): DemoLocalDeps {
    return {
        storage: typeof localStorage !== "undefined" ? localStorage : memoryStorage(),
        generateId: () =>
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `demo-${Math.random().toString(36).slice(2, 14)}`,
        now: () => new Date().toISOString()
    };
}

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

// ─── Storage envelope ───────────────────────────────────────────────────

function storageKey<T extends TableName>(table: T): string {
    return `gtmos_demo__${table}`;
}

function readAll<T extends TableName>(
    table: T,
    storage: Storage
): Row<T>[] {
    try {
        const raw = storage.getItem(storageKey(table));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Row<T>[]) : [];
    } catch {
        return [];
    }
}

function writeAll<T extends TableName>(
    table: T,
    storage: Storage,
    rows: Row<T>[]
): void {
    try {
        storage.setItem(storageKey(table), JSON.stringify(rows));
    } catch {
        // Quota exceeded or storage disabled — fail silently in demo mode.
        // Demo data is ephemeral; losing a write is preferable to throwing.
    }
}

// ─── List options application ───────────────────────────────────────────

function applyWhere<T extends TableName>(
    rows: Row<T>[],
    where: ListOptions<T>["where"]
): Row<T>[] {
    if (!where) return rows;
    const filters = Object.entries(where).filter(([, v]) => v !== undefined);
    if (filters.length === 0) return rows;
    return rows.filter((row) =>
        filters.every(
            ([col, val]) => (row as unknown as Record<string, unknown>)[col] === val
        )
    );
}

function applyOrder<T extends TableName>(
    rows: Row<T>[],
    orderBy: ListOptions<T>["orderBy"]
): Row<T>[] {
    if (!orderBy) return rows;
    const col = orderBy.column;
    const asc = orderBy.ascending ?? true;
    return [...rows].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[col];
        const bv = (b as unknown as Record<string, unknown>)[col];
        if (av === bv) return 0;
        if (av === null || av === undefined) return asc ? -1 : 1;
        if (bv === null || bv === undefined) return asc ? 1 : -1;
        const cmp = (av as never) < (bv as never) ? -1 : 1;
        return asc ? cmp : -cmp;
    });
}

// ─── Accessor factory ───────────────────────────────────────────────────

export function makeDemoLocalNounAccessor<T extends TableName>(
    table: T,
    deps: Partial<DemoLocalDeps> = {}
): NounAccessor<T> {
    const { storage, generateId, now } = { ...defaultDeps(), ...deps };
    // Match the network client: most tables key on `id`, but a few
    // (workspace_profile) key on another column. get/update/remove
    // resolve the row by the table's real primary key.
    const pk = pkColumn(table);
    const keyOf = (row: unknown): string | undefined =>
        (row as Record<string, unknown>)[pk] as string | undefined;

    return {
        async list(options?: ListOptions<T>): Promise<Row<T>[]> {
            let rows = readAll(table, storage);
            rows = applyWhere(rows, options?.where);
            rows = applyOrder(rows, options?.orderBy);
            const limit = options?.limit ?? 500;
            return rows.slice(0, limit);
        },

        async get(id: string): Promise<Row<T> | null> {
            const rows = readAll(table, storage);
            return rows.find((row) => keyOf(row) === id) ?? null;
        },

        async insert(row: InsertRow<T>): Promise<Row<T>> {
            const all = readAll(table, storage);
            const partialRow = row as unknown as Record<string, unknown>;
            const id =
                typeof partialRow.id === "string" ? partialRow.id : generateId();
            const createdAt =
                typeof partialRow.created_at === "string"
                    ? partialRow.created_at
                    : now();
            const fresh = {
                ...partialRow,
                id,
                created_at: createdAt,
                updated_at: now()
            } as unknown as Row<T>;
            all.push(fresh);
            writeAll(table, storage, all);
            return fresh;
        },

        async update(id: string, patch: UpdateRow<T>): Promise<Row<T>> {
            const all = readAll(table, storage);
            const idx = all.findIndex((row) => keyOf(row) === id);
            if (idx < 0) {
                throw new Error(
                    `demo-local: row not found in ${String(table)}: ${id}`
                );
            }
            const merged = {
                ...(all[idx] as unknown as Record<string, unknown>),
                ...(patch as unknown as Record<string, unknown>),
                updated_at: now()
            } as unknown as Row<T>;
            all[idx] = merged;
            writeAll(table, storage, all);
            return merged;
        },

        async remove(id: string): Promise<void> {
            const all = readAll(table, storage);
            const next = all.filter((row) => keyOf(row) !== id);
            writeAll(table, storage, next);
        },

        subscribe(
            _handler: (payload: RealtimePostgresChangesPayload<Row<T>>) => void
        ): RealtimeChannel {
            // Demo-local mode has no realtime — return a no-op channel that
            // matches the shape callers depend on (unsubscribe()).
            return {
                unsubscribe: () => Promise.resolve("ok" as const)
            } as unknown as RealtimeChannel;
        }
    };
}

// ─── Mode detection ─────────────────────────────────────────────────────

/**
 * Returns true when the current browser session has been marked as demo by
 * `js/demo-storage-bootstrap.js` or when an explicit override has been set
 * via `setDemoModeOverrideForTests`.
 *
 * The bootstrap script sets `sessionStorage.gtmos_env_mode = "demo"` before
 * any room boots so demo flows route consistently. We honor the same signal
 * here so the data-client picks the right accessor shape at boot.
 */
let demoModeOverride: boolean | null = null;

export function isDemoModeActive(): boolean {
    if (demoModeOverride !== null) return demoModeOverride;
    try {
        if (typeof sessionStorage === "undefined") return false;
        return sessionStorage.getItem("gtmos_env_mode") === "demo";
    } catch {
        return false;
    }
}

export function __setDemoModeOverrideForTests(value: boolean | null): void {
    demoModeOverride = value;
}
