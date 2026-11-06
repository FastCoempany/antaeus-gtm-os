import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import {
    sectionOrder,
    tablesToDelete,
    tablesToRestore,
    WORKSPACE_TABLES,
    type WorkspaceTable
} from "./workspace-tables";

/**
 * Cloud-sync visibility helpers for the Settings room.
 *
 * Each migrated room has its own independent cloud-persistence loop
 * (boot / auto-save / realtime). The Settings room is where the
 * operator confirms the workspace is connected + sees per-noun row
 * counts to verify their data is actually in the cloud.
 */

export type CloudConnectionStatus =
    | "connected"
    | "no-credentials"
    | "auth-missing"
    | "error";

export interface CloudWorkspaceInfo {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string | null;
}

export interface CloudConnectionState {
    readonly status: CloudConnectionStatus;
    readonly userEmail: string | null;
    readonly workspace: CloudWorkspaceInfo | null;
    readonly errorMessage: string | null;
}

export interface CloudRowCounts {
    readonly icps: number;
    readonly deals: number;
    readonly proofs: number;
    readonly advisorDeployments: number;
    readonly signalConsoleAccounts: number;
    readonly sequences: number;
    readonly discoveryCallLogs: number;
    readonly studioArtifacts: number;
    readonly pipelineSettings: number;
}

export const EMPTY_COUNTS: CloudRowCounts = {
    icps: 0,
    deals: 0,
    proofs: 0,
    advisorDeployments: 0,
    signalConsoleAccounts: 0,
    sequences: 0,
    discoveryCallLogs: 0,
    studioArtifacts: 0,
    pipelineSettings: 0
};

/**
 * Probe the cloud connection. Returns "no-credentials" when env vars
 * are missing (expected in dev), "auth-missing" when the SDK loaded
 * but no user session is active, "connected" when both pass, "error"
 * for anything else.
 */
export async function checkCloudConnection(
    factory: () => DataClient
): Promise<CloudConnectionState> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        return {
            status: "no-credentials",
            userEmail: null,
            workspace: null,
            errorMessage: err instanceof Error ? err.message : null
        };
    }
    try {
        const { data, error } = await client.client.auth.getUser();
        if (error) {
            reportError(error, { op: "settings.checkCloudConnection.auth" });
            return {
                status: "error",
                userEmail: null,
                workspace: null,
                errorMessage: error.message
            };
        }
        const user = data.user;
        if (!user) {
            return {
                status: "auth-missing",
                userEmail: null,
                workspace: null,
                errorMessage: null
            };
        }
        const workspace = await client.currentWorkspace();
        return {
            status: "connected",
            userEmail: user.email ?? null,
            workspace: workspace
                ? {
                      id: workspace.id,
                      name: workspace.name,
                      createdAt: workspace.created_at ?? null
                  }
                : null,
            errorMessage: null
        };
    } catch (err) {
        reportError(err, { op: "settings.checkCloudConnection" });
        return {
            status: "error",
            userEmail: null,
            workspace: null,
            errorMessage: err instanceof Error ? err.message : null
        };
    }
}

/**
 * Fetch row counts per noun. We use limit=1 + the row data we get back
 * by calling list with a small limit — the Supabase JS client does
 * NOT expose count without a separate `select(..., { count: 'exact' })`
 * which our typed data-client doesn't surface. As a pragmatic
 * substitute we call .list({ limit: 5000 }) per table; for early-stage
 * workspaces with low row counts this is fine.
 *
 * Returns EMPTY_COUNTS on error so the UI never crashes.
 */
export async function loadCloudRowCounts(
    factory: () => DataClient
): Promise<CloudRowCounts> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.loadCloudRowCounts.factory" });
        return EMPTY_COUNTS;
    }
    try {
        const [
            icps,
            deals,
            proofs,
            advisorDeployments,
            signalConsoleAccounts,
            sequences,
            discoveryCallLogs,
            studioArtifacts,
            pipelineSettings
        ] = await Promise.all([
            client.icps.list({ limit: 5000 }).catch(() => []),
            client.deals.list({ limit: 5000 }).catch(() => []),
            client.proofs.list({ limit: 5000 }).catch(() => []),
            client.advisorDeployments.list({ limit: 5000 }).catch(() => []),
            client.signalConsoleAccounts
                .list({ limit: 5000 })
                .catch(() => []),
            client.sequences.list({ limit: 5000 }).catch(() => []),
            client.discoveryCallLogs.list({ limit: 5000 }).catch(() => []),
            client.studioArtifacts.list({ limit: 5000 }).catch(() => []),
            client.pipelineSettings.list({ limit: 100 }).catch(() => [])
        ]);
        return {
            icps: icps.length,
            deals: deals.length,
            proofs: proofs.length,
            advisorDeployments: advisorDeployments.length,
            signalConsoleAccounts: signalConsoleAccounts.length,
            sequences: sequences.length,
            discoveryCallLogs: discoveryCallLogs.length,
            studioArtifacts: studioArtifacts.length,
            pipelineSettings: pipelineSettings.length
        };
    } catch (err) {
        reportError(err, { op: "settings.loadCloudRowCounts" });
        return EMPTY_COUNTS;
    }
}


// ─── Download my workspace / Delete everything / Restore ─────────────
//
// Every table these cover lives in ./workspace-tables.ts — one registry
// so the download, the delete, and the restore can't drift apart.

/**
 * The loose slice of the Supabase query builder these helpers use.
 * Table names come from the registry at runtime, so the strict
 * per-table generics can't narrow; we type the surface we touch.
 */
interface LooseResult {
    readonly data: unknown;
    readonly error: { readonly message: string; readonly code?: string } | null;
    readonly count?: number | null;
}
interface LooseQuery extends PromiseLike<LooseResult> {
    select(columns: string, opts?: { count?: "exact" }): LooseQuery;
    eq(column: string, value: string): LooseQuery;
    order(column: string, opts: { ascending: boolean }): LooseQuery;
    range(from: number, to: number): LooseQuery;
    upsert(rows: unknown[], opts?: { ignoreDuplicates?: boolean }): LooseQuery;
    delete(opts?: { count?: "exact" }): LooseQuery;
}
interface LooseSupabase {
    from(table: string): LooseQuery;
    rpc(fn: string, args: Record<string, unknown>): PromiseLike<LooseResult>;
}

function looseClient(client: DataClient): LooseSupabase {
    return client.client as unknown as LooseSupabase;
}

function messageOf(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object" && "message" in err) {
        return String((err as { message: unknown }).message);
    }
    return String(err);
}

/** Rows fetched per request while paging through a table. */
export const EXPORT_PAGE_SIZE = 1000;
/** Safety stop so a misbehaving endpoint can't loop forever. */
const EXPORT_MAX_PAGES = 500;

export interface CloudExportTableErr {
    readonly table: string;
    readonly reason: string;
}

export interface ExportedTable {
    readonly table: string;
    readonly label: string;
    readonly rowCount: number;
    readonly rows: ReadonlyArray<Record<string, unknown>>;
    /** Set when the read failed; rows is then empty. */
    readonly error: string | null;
}

export interface ExportedSection {
    readonly name: string;
    readonly rowCount: number;
    readonly tables: ReadonlyArray<ExportedTable>;
}

export interface ExportManifestRow {
    readonly section: string;
    readonly label: string;
    readonly table: string;
    readonly rowCount: number;
    readonly error: string | null;
}

export interface CloudExportSnapshot {
    readonly schemaVersion: 2;
    readonly source: "antaeus-workspace-export-v2";
    readonly capturedAt: string;
    readonly workspaceId: string | null;
    readonly workspaceName: string | null;
    readonly userEmail: string | null;
    /** Keyed by plain-English section name, in the order the app presents them. */
    readonly sections: Readonly<Record<string, ExportedSection>>;
    /** One line per table: what it is, where it sits, how many rows. */
    readonly manifest: ReadonlyArray<ExportManifestRow>;
    /** What the download leaves out on purpose, in plain words. */
    readonly notIncluded: ReadonlyArray<string>;
    readonly perTableCount: Readonly<Record<string, number>>;
    readonly errors: ReadonlyArray<CloudExportTableErr>;
    readonly totalRows: number;
}

export const NOT_INCLUDED_NOTE: ReadonlyArray<string> = [
    "Your sign-in and password",
    "Who else is a member of this workspace",
    "Anything saved only in this browser — use Device copy for that"
];

async function readEveryRow(
    sb: LooseSupabase,
    spec: WorkspaceTable,
    scopeValue: string | null
): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    for (let page = 0; page < EXPORT_MAX_PAGES; page++) {
        const from = page * EXPORT_PAGE_SIZE;
        let q = sb.from(spec.table).select("*");
        if (scopeValue) q = q.eq(spec.scopeColumn, scopeValue);
        const { data, error } = await q
            .order(spec.orderBy, { ascending: true })
            .range(from, from + EXPORT_PAGE_SIZE - 1);
        if (error) throw new Error(error.message);
        const batch = Array.isArray(data)
            ? (data as Record<string, unknown>[])
            : [];
        rows.push(...batch);
        if (batch.length < EXPORT_PAGE_SIZE) break;
    }
    return rows;
}

function emptySnapshot(error: CloudExportTableErr): CloudExportSnapshot {
    return {
        schemaVersion: 2,
        source: "antaeus-workspace-export-v2",
        capturedAt: new Date().toISOString(),
        workspaceId: null,
        workspaceName: null,
        userEmail: null,
        sections: {},
        manifest: [],
        notIncluded: NOT_INCLUDED_NOTE,
        perTableCount: {},
        errors: [error],
        totalRows: 0
    };
}

/**
 * Download my workspace: every row of every workspace table in
 * ./workspace-tables.ts, paged so nothing is cut off at a row limit,
 * filtered to the current workspace, and filed under its plain-English
 * section.
 *
 * Defensive: each table is read on its own. A table that fails lands
 * with empty rows and its error recorded (in the manifest, the
 * section, and `errors`); the rest of the download is unaffected.
 */
export async function exportCloudWorkspace(
    factory: () => DataClient
): Promise<CloudExportSnapshot> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.factory" });
        return emptySnapshot({ table: "<client>", reason: messageOf(err) });
    }
    const sb = looseClient(client);

    let workspaceId: string | null = null;
    let workspaceName: string | null = null;
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
        const ws = await client.currentWorkspace();
        workspaceId = ws?.id ?? null;
        workspaceName = ws?.name ?? null;
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.workspace" });
    }
    try {
        userId = await client.currentUserId();
        const auth = (client.client as { auth?: unknown }).auth;
        if (
            userId &&
            auth &&
            typeof auth === "object" &&
            typeof (auth as { getUser?: unknown }).getUser === "function"
        ) {
            const res = await (
                auth as {
                    getUser: () => Promise<{
                        data: { user: { email?: string | null } | null };
                    }>;
                }
            ).getUser();
            userEmail = res.data.user?.email ?? null;
        }
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.user" });
    }

    const bySection = new Map<string, ExportedTable[]>();
    for (const name of sectionOrder()) bySection.set(name, []);
    const manifest: ExportManifestRow[] = [];
    const perTableCount: Record<string, number> = {};
    const errors: CloudExportTableErr[] = [];
    let totalRows = 0;

    for (const spec of WORKSPACE_TABLES) {
        if (!spec.memberRead) continue;
        const scopeValue =
            spec.scopeColumn === "user_id" ? userId : workspaceId;
        // A per-person table with no known person would read teammates'
        // rows too; skip it rather than over-share.
        if (spec.scopeColumn === "user_id" && !scopeValue) continue;
        let rows: Record<string, unknown>[] = [];
        let error: string | null = null;
        try {
            rows = await readEveryRow(sb, spec, scopeValue);
        } catch (err) {
            error = messageOf(err);
            errors.push({ table: spec.table, reason: error });
            reportError(err, {
                op: "settings.exportCloudWorkspace.read",
                table: spec.table
            });
        }
        bySection.get(spec.section)?.push({
            table: spec.table,
            label: spec.label,
            rowCount: rows.length,
            rows,
            error
        });
        manifest.push({
            section: spec.section,
            label: spec.label,
            table: spec.table,
            rowCount: rows.length,
            error
        });
        perTableCount[spec.table] = rows.length;
        totalRows += rows.length;
    }

    const sections: Record<string, ExportedSection> = {};
    for (const [name, tables] of bySection) {
        if (tables.length === 0) continue;
        sections[name] = {
            name,
            rowCount: tables.reduce((n, t) => n + t.rowCount, 0),
            tables
        };
    }

    return {
        schemaVersion: 2,
        source: "antaeus-workspace-export-v2",
        capturedAt: new Date().toISOString(),
        workspaceId,
        workspaceName,
        userEmail,
        sections,
        manifest,
        notIncluded: NOT_INCLUDED_NOTE,
        perTableCount,
        errors,
        totalRows
    };
}

// ─── Restore ─────────────────────────────────────────────────────────

export interface CloudRestoreResult {
    readonly restoredRows: number;
    readonly errors: ReadonlyArray<CloudExportTableErr>;
    /** Tables in the file the system rebuilds on its own (not put back). */
    readonly skippedTables: ReadonlyArray<string>;
}

/** Is this parsed JSON a cloud download we know how to put back? */
export function isCloudExportFile(parsed: unknown): boolean {
    if (!parsed || typeof parsed !== "object") return false;
    const o = parsed as { source?: unknown; tables?: unknown; sections?: unknown };
    if (o.source === "antaeus-workspace-export-v2") {
        return typeof o.sections === "object" && o.sections !== null;
    }
    if (o.source === "antaeus-cloud-export-v1") {
        return typeof o.tables === "object" && o.tables !== null;
    }
    return false;
}

/** Flatten either download version into table → rows. */
export function rowsByTable(
    snapshot: unknown
): Record<string, ReadonlyArray<unknown>> {
    const out: Record<string, ReadonlyArray<unknown>> = {};
    if (!snapshot || typeof snapshot !== "object") return out;
    const o = snapshot as {
        tables?: Record<string, unknown>;
        sections?: Record<string, { tables?: unknown }>;
    };
    if (o.sections && typeof o.sections === "object") {
        for (const section of Object.values(o.sections)) {
            if (!section || !Array.isArray(section.tables)) continue;
            for (const t of section.tables as Array<{ table?: unknown; rows?: unknown }>) {
                if (typeof t?.table === "string" && Array.isArray(t.rows)) {
                    out[t.table] = t.rows;
                }
            }
        }
        return out;
    }
    if (o.tables && typeof o.tables === "object") {
        for (const [table, rows] of Object.entries(o.tables)) {
            if (Array.isArray(rows)) out[table] = rows;
        }
    }
    return out;
}

/**
 * Put a download back. Accepts both the current sectioned download and
 * the older flat one. Writes tables in registry order (parents before
 * children); upserts on the primary key so running it twice is safe.
 * Tables the system writes on its own are skipped — they rebuild
 * themselves. Defensive per table.
 */
export async function restoreCloudExport(
    factory: () => DataClient,
    snapshot: unknown
): Promise<CloudRestoreResult> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.restoreCloudExport.factory" });
        return {
            restoredRows: 0,
            errors: [{ table: "<client>", reason: messageOf(err) }],
            skippedTables: []
        };
    }
    const sb = looseClient(client);
    const byTable = rowsByTable(snapshot);
    let restoredRows = 0;
    const errors: CloudExportTableErr[] = [];
    const skippedTables: string[] = [];

    for (const spec of tablesToRestore()) {
        const rows = byTable[spec.table];
        if (!rows || rows.length === 0) continue;
        try {
            const { error } = await sb
                .from(spec.table)
                .upsert(rows as unknown[], {
                    ignoreDuplicates: spec.restore === "insert"
                });
            if (error) errors.push({ table: spec.table, reason: error.message });
            else restoredRows += rows.length;
        } catch (err) {
            errors.push({ table: spec.table, reason: messageOf(err) });
        }
    }
    const restorable = new Set(tablesToRestore().map((t) => t.table));
    for (const [table, rows] of Object.entries(byTable)) {
        if (!restorable.has(table) && rows.length > 0) skippedTables.push(table);
    }
    return { restoredRows, errors, skippedTables };
}

// ─── Delete everything ───────────────────────────────────────────────

export interface CloudDeleteResult {
    readonly totalDeleted: number;
    readonly perTable: Readonly<Record<string, number>>;
    readonly errors: ReadonlyArray<string>;
    readonly cancelled: boolean;
    /** "server" = the delete_workspace_data RPC; "per-table" = fallback. */
    readonly method: "server" | "per-table" | "none";
}

const EMPTY_DELETE_RESULT: CloudDeleteResult = {
    totalDeleted: 0,
    perTable: {},
    errors: [],
    cancelled: false,
    method: "none"
};

function parseRpcDelete(
    data: unknown
): { perTable: Record<string, number>; errors: string[] } | null {
    if (!data || typeof data !== "object") return null;
    const o = data as { deleted?: unknown; errors?: unknown };
    if (!o.deleted || typeof o.deleted !== "object") return null;
    const perTable: Record<string, number> = {};
    for (const [t, n] of Object.entries(o.deleted as Record<string, unknown>)) {
        perTable[t] = typeof n === "number" ? n : Number(n) || 0;
    }
    const errors: string[] = [];
    if (o.errors && typeof o.errors === "object") {
        for (const [t, msg] of Object.entries(o.errors as Record<string, unknown>)) {
            errors.push(`${t}: ${String(msg)}`);
        }
    }
    return { perTable, errors };
}

/**
 * Delete everything: removes every row in every workspace table in
 * ./workspace-tables.ts (`deleteScope: "workspace"`). Keeps the
 * workspace row, its membership, and your own profile so you can keep
 * signing in.
 *
 * Path 1 — the `delete_workspace_data` RPC (migration 20261105130000),
 * which runs server-side and reaches the tables members can't delete
 * under RLS (system-written logs, append-only history).
 *
 * Path 2 — if the RPC isn't deployed yet or errors, a per-table delete
 * through RLS for every table members can delete. Tables only the
 * server can empty are reported as errors so nothing is claimed that
 * didn't happen.
 */
export async function deleteCloudWorkspace(
    factory: () => DataClient
): Promise<CloudDeleteResult> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.deleteCloudWorkspace.factory" });
        return {
            ...EMPTY_DELETE_RESULT,
            cancelled: true,
            errors: [messageOf(err) || "no-client"]
        };
    }
    const sb = looseClient(client);

    let workspaceId: string | null = null;
    try {
        workspaceId = (await client.currentWorkspace())?.id ?? null;
    } catch (err) {
        reportError(err, { op: "settings.deleteCloudWorkspace.workspace" });
    }
    if (!workspaceId) {
        return {
            ...EMPTY_DELETE_RESULT,
            cancelled: true,
            errors: ["No workspace found for this sign-in — nothing was deleted."]
        };
    }

    // ── Path 1: server-side wipe ──────────────────────────────────
    let rpcFailure: string | null = null;
    try {
        const { data, error } = await sb.rpc("delete_workspace_data", {
            ws: workspaceId
        });
        if (error) {
            rpcFailure = error.message;
        } else {
            const parsed = parseRpcDelete(data);
            if (parsed) {
                const totalDeleted = Object.values(parsed.perTable).reduce(
                    (n, v) => n + v,
                    0
                );
                for (const e of parsed.errors) {
                    reportError(new Error(e), {
                        op: "settings.deleteCloudWorkspace.rpc_table"
                    });
                }
                return {
                    totalDeleted,
                    perTable: parsed.perTable,
                    errors: parsed.errors,
                    cancelled: false,
                    method: "server"
                };
            }
            rpcFailure = "unexpected response from delete_workspace_data";
        }
    } catch (err) {
        rpcFailure = messageOf(err);
    }
    reportError(new Error(rpcFailure ?? "rpc failed"), {
        op: "settings.deleteCloudWorkspace.rpc"
    });

    // ── Path 2: per-table fallback through RLS ────────────────────
    const perTable: Record<string, number> = {};
    const errors: string[] = [];
    let totalDeleted = 0;
    for (const spec of tablesToDelete()) {
        if (!spec.memberDelete) {
            perTable[spec.table] = 0;
            errors.push(
                `${spec.table}: only the server can delete these rows (${rpcFailure ?? "server delete unavailable"})`
            );
            continue;
        }
        try {
            const { error, count } = await sb
                .from(spec.table)
                .delete({ count: "exact" })
                .eq("workspace_id", workspaceId);
            if (error) {
                perTable[spec.table] = 0;
                errors.push(`${spec.table}: ${error.message}`);
            } else {
                const n = typeof count === "number" ? count : 0;
                perTable[spec.table] = n;
                totalDeleted += n;
            }
        } catch (err) {
            perTable[spec.table] = 0;
            errors.push(`${spec.table}: ${messageOf(err)}`);
            reportError(err, {
                op: "settings.deleteCloudWorkspace.table",
                table: spec.table
            });
        }
    }
    return {
        totalDeleted,
        perTable,
        errors,
        cancelled: false,
        method: "per-table"
    };
}
