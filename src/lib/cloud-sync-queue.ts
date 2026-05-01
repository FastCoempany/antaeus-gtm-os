import type { DataClient } from "./data-client";
import type { Json, TableName } from "./database.types";
import { reportError, trackEvent } from "./observability";

/**
 * Cloud sync retry queue (Priority B3).
 *
 * When a save<Noun> call fails (network hostile, auth expired,
 * Supabase blip), the existing per-room cloud-persistence catches
 * the error, reports through Sentry, and returns the in-memory
 * value. The state stays correct LOCALLY but the cloud row is
 * stale.
 *
 * This module adds resilience: failed operations get enqueued to
 * localStorage; the queue auto-flushes on `online` / `visibilitychange`
 * events + a periodic timer. When the next session boots, pending
 * ops retry transparently.
 *
 * The queue is intentionally simple:
 *   - Per-operation: { id, table, op, payload, originalId, attempts, queuedAt }
 *   - Persisted to gtmos_cloud_pending_queue (capped at 200 to bound disk)
 *   - Realtime subscriptions in each room dedupe successful retries
 *     against in-memory state, so a flushed insert doesn't show as a
 *     duplicate row in the UI.
 *
 * Public API:
 *   enqueueRetry(op)         — call from save<Noun> catch blocks
 *   flushQueue(client)       — try all pending ops; remove successes
 *   bootRetryAutoFlush(...)  — wire online + visibilitychange listeners
 *
 * The queue stores a Json payload (the same shape the bridge produces).
 * On retry, the stored payload is sent through data-client without
 * re-running the bridge — bridge logic is pure and stable, so the
 * stored payload is canonical.
 */

const QUEUE_KEY = "gtmos_cloud_pending_queue";
const MAX_QUEUE_SIZE = 200;

export type QueueOp = "insert" | "update" | "delete";

export interface PendingOperation {
    /** Internal id for the queue entry itself (NOT the row id). */
    readonly queueId: string;
    /** Supabase table the operation targets. */
    readonly table: TableName;
    readonly op: QueueOp;
    /** For update + delete: the row id (uuid). */
    readonly rowId: string | null;
    /** Insert / update payload — already shaped by the bridge. Empty for delete. */
    readonly payload: Json | null;
    /** ISO timestamp when the op was first enqueued. */
    readonly queuedAt: string;
    /** Number of failed retry attempts. */
    readonly attempts: number;
    /** ISO timestamp of the most-recent attempt failure. */
    readonly lastAttemptAt: string | null;
    /** Originating room — purely diagnostic. */
    readonly source: string;
}

interface MinimalStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

interface MinimalWindow {
    addEventListener(
        type: "online" | "visibilitychange",
        handler: () => void
    ): void;
    removeEventListener(
        type: "online" | "visibilitychange",
        handler: () => void
    ): void;
    setInterval(handler: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
}

interface MinimalDocument {
    visibilityState: DocumentVisibilityState;
}

interface MinimalNavigator {
    onLine: boolean;
}

export interface QueueContext {
    readonly storage?: MinimalStorage | null;
    readonly win?: MinimalWindow | null;
    readonly doc?: MinimalDocument | null;
    readonly nav?: MinimalNavigator | null;
}

function getStorage(ctx?: QueueContext): MinimalStorage | null {
    if (ctx?.storage !== undefined) return ctx.storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function getWin(ctx?: QueueContext): MinimalWindow | null {
    if (ctx?.win !== undefined) return ctx.win;
    if (typeof window === "undefined") return null;
    return window as unknown as MinimalWindow;
}

function getDoc(ctx?: QueueContext): MinimalDocument | null {
    if (ctx?.doc !== undefined) return ctx.doc;
    if (typeof document === "undefined") return null;
    return document as unknown as MinimalDocument;
}

function getNav(ctx?: QueueContext): MinimalNavigator | null {
    if (ctx?.nav !== undefined) return ctx.nav;
    if (typeof navigator === "undefined") return null;
    return navigator as unknown as MinimalNavigator;
}

function asArray(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function isQueueOp(v: unknown): v is QueueOp {
    return v === "insert" || v === "update" || v === "delete";
}

function parseOperation(raw: unknown): PendingOperation | null {
    const o = asObject(raw);
    if (!o) return null;
    const queueId = asString(o["queueId"]);
    const table = asString(o["table"]);
    const op = o["op"];
    if (!queueId || !table || !isQueueOp(op)) return null;
    return {
        queueId,
        table: table as TableName,
        op,
        rowId: typeof o["rowId"] === "string" ? o["rowId"] : null,
        payload:
            o["payload"] === undefined ? null : (o["payload"] as Json),
        queuedAt: asString(o["queuedAt"]) || new Date().toISOString(),
        attempts: asNumber(o["attempts"]),
        lastAttemptAt:
            typeof o["lastAttemptAt"] === "string"
                ? o["lastAttemptAt"]
                : null,
        source: asString(o["source"]) || "unknown"
    };
}

function loadQueue(ctx?: QueueContext): PendingOperation[] {
    const storage = getStorage(ctx);
    if (!storage) return [];
    try {
        const raw = storage.getItem(QUEUE_KEY);
        if (!raw) return [];
        const arr = asArray(JSON.parse(raw));
        return arr
            .map(parseOperation)
            .filter((o): o is PendingOperation => o !== null);
    } catch (err) {
        reportError(err, { op: "cloud-sync-queue.loadQueue" });
        return [];
    }
}

function writeQueue(
    ops: ReadonlyArray<PendingOperation>,
    ctx?: QueueContext
): void {
    const storage = getStorage(ctx);
    if (!storage) return;
    try {
        // Cap to bound localStorage. Drop the OLDEST when over.
        const capped = ops.slice(-MAX_QUEUE_SIZE);
        storage.setItem(QUEUE_KEY, JSON.stringify(capped));
    } catch (err) {
        reportError(err, { op: "cloud-sync-queue.writeQueue" });
    }
}

function genQueueId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface EnqueueOptions {
    readonly table: TableName;
    readonly op: QueueOp;
    readonly rowId?: string | null;
    readonly payload?: Json | null;
    readonly source: string;
    readonly now?: number;
}

/**
 * Push a failed cloud operation onto the retry queue. Idempotent in
 * the sense that duplicate ops for the same table+rowId+op collapse
 * to the latest payload (so an update fired three times while offline
 * doesn't replay all three — only the final state).
 */
export function enqueueRetry(
    options: EnqueueOptions,
    ctx?: QueueContext
): PendingOperation {
    const queue = loadQueue(ctx);
    const queuedAt = new Date(options.now ?? Date.now()).toISOString();
    const next: PendingOperation = {
        queueId: genQueueId(),
        table: options.table,
        op: options.op,
        rowId: options.rowId ?? null,
        payload: options.payload ?? null,
        queuedAt,
        attempts: 0,
        lastAttemptAt: null,
        source: options.source
    };

    // Collapse: same table + rowId + op replaces in place.
    const filtered = queue.filter(
        (q) =>
            !(
                q.table === next.table &&
                q.op === next.op &&
                q.rowId === next.rowId
            )
    );
    filtered.push(next);
    writeQueue(filtered, ctx);
    trackEvent("cloud_sync_queue_enqueue", {
        table: options.table,
        op: options.op,
        source: options.source,
        depth: filtered.length
    });
    return next;
}

/**
 * Drop a single pending operation by its queueId. Used by tests +
 * post-flush cleanup.
 */
export function dequeueOperation(
    queueId: string,
    ctx?: QueueContext
): void {
    const queue = loadQueue(ctx);
    const next = queue.filter((q) => q.queueId !== queueId);
    writeQueue(next, ctx);
}

/**
 * Read the current queue (for diagnostics + the Settings cloud-sync
 * card when we surface queue depth there).
 */
export function readQueue(ctx?: QueueContext): ReadonlyArray<PendingOperation> {
    return loadQueue(ctx);
}

/**
 * Walk pending operations and retry each via the data-client. Removes
 * successes, leaves failures in the queue with bumped attempts +
 * lastAttemptAt. Returns counts so callers can surface results.
 */
export interface FlushResult {
    readonly attempted: number;
    readonly succeeded: number;
    readonly stillPending: number;
}

export async function flushQueue(
    client: DataClient,
    ctx?: QueueContext
): Promise<FlushResult> {
    const queue = loadQueue(ctx);
    if (queue.length === 0) {
        return { attempted: 0, succeeded: 0, stillPending: 0 };
    }
    const remaining: PendingOperation[] = [];
    let succeeded = 0;
    for (const pending of queue) {
        try {
            await runOperation(client, pending);
            succeeded++;
        } catch (err) {
            reportError(err, {
                op: "cloud-sync-queue.flush",
                table: pending.table,
                operation: pending.op,
                rowId: pending.rowId,
                attempts: pending.attempts + 1
            });
            remaining.push({
                ...pending,
                attempts: pending.attempts + 1,
                lastAttemptAt: new Date().toISOString()
            });
        }
    }
    writeQueue(remaining, ctx);
    trackEvent("cloud_sync_queue_flush", {
        attempted: queue.length,
        succeeded,
        stillPending: remaining.length
    });
    return {
        attempted: queue.length,
        succeeded,
        stillPending: remaining.length
    };
}

async function runOperation(
    client: DataClient,
    pending: PendingOperation
): Promise<void> {
    // Type-erase at the boundary — the data-client's accessors all
    // share the same shape so a string indirection is safe here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessor = pickAccessor(client, pending.table) as any;
    if (!accessor) {
        throw new Error(
            `cloud-sync-queue: unknown table "${pending.table}"`
        );
    }
    if (pending.op === "insert") {
        if (pending.payload === null) {
            throw new Error("cloud-sync-queue: insert without payload");
        }
        await accessor.insert(pending.payload);
        return;
    }
    if (pending.op === "update") {
        if (!pending.rowId) {
            throw new Error("cloud-sync-queue: update without rowId");
        }
        if (pending.payload === null) {
            throw new Error("cloud-sync-queue: update without payload");
        }
        await accessor.update(pending.rowId, pending.payload);
        return;
    }
    if (pending.op === "delete") {
        if (!pending.rowId) {
            throw new Error("cloud-sync-queue: delete without rowId");
        }
        await accessor.remove(pending.rowId);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickAccessor(client: DataClient, table: TableName): any {
    switch (table) {
        case "icps":
            return client.icps;
        case "deals":
            return client.deals;
        case "sequences":
            return client.sequences;
        case "signal_console_accounts":
            return client.signalConsoleAccounts;
        case "discovery_frameworks":
            return client.discoveryFrameworks;
        case "discovery_call_logs":
            return client.discoveryCallLogs;
        case "pipeline_settings":
            return client.pipelineSettings;
        case "studio_artifacts":
            return client.studioArtifacts;
        case "proofs":
            return client.proofs;
        case "advisor_deployments":
            return client.advisorDeployments;
        case "readiness_snapshots":
            return client.readinessSnapshots;
        case "handoff_artifacts":
            return client.handoffArtifacts;
        case "profiles":
            return client.profiles;
        case "workspaces":
            return client.workspaces;
        case "workspace_members":
            return client.workspaceMembers;
        default:
            return null;
    }
}

// ─── Auto-flush listeners ────────────────────────────────────────

export interface AutoFlushHandle {
    stop(): void;
}

const FLUSH_INTERVAL_MS = 30_000;

let autoFlushInstalled = false;
let intervalHandle: unknown = null;
let flushInFlight = false;

/**
 * Wire online + visibilitychange listeners + a periodic timer. Each
 * triggers a flushQueue(client) call. Returns a stop() handle.
 *
 * Idempotent: subsequent calls skip if already installed.
 */
export function bootRetryAutoFlush(
    clientFactory: () => DataClient,
    ctx?: QueueContext
): AutoFlushHandle {
    if (autoFlushInstalled) {
        return { stop: () => undefined };
    }
    const win = getWin(ctx);
    const doc = getDoc(ctx);
    const nav = getNav(ctx);
    if (!win) {
        return { stop: () => undefined };
    }

    async function tryFlush(reason: string): Promise<void> {
        if (flushInFlight) return;
        if (nav && nav.onLine === false) return;
        if (loadQueue(ctx).length === 0) return;
        flushInFlight = true;
        try {
            const client = clientFactory();
            const result = await flushQueue(client, ctx);
            trackEvent("cloud_sync_queue_auto_flush", {
                reason,
                attempted: result.attempted,
                succeeded: result.succeeded,
                stillPending: result.stillPending
            });
        } catch (err) {
            // factory throw (no env vars) etc. — leave queue alone.
            reportError(err, {
                op: "cloud-sync-queue.bootRetryAutoFlush.tryFlush",
                reason
            });
        } finally {
            flushInFlight = false;
        }
    }

    const onOnline = (): void => {
        void tryFlush("online");
    };
    const onVisibility = (): void => {
        if (doc?.visibilityState === "visible") {
            void tryFlush("visibilitychange");
        }
    };
    win.addEventListener("online", onOnline);
    win.addEventListener("visibilitychange", onVisibility);
    intervalHandle = win.setInterval(() => {
        void tryFlush("interval");
    }, FLUSH_INTERVAL_MS);
    autoFlushInstalled = true;

    // Try once immediately in case there's pending work from a prior
    // session that ended with the queue non-empty.
    void tryFlush("boot");

    return {
        stop(): void {
            if (!autoFlushInstalled) return;
            win.removeEventListener("online", onOnline);
            win.removeEventListener("visibilitychange", onVisibility);
            if (intervalHandle !== null) {
                win.clearInterval(intervalHandle);
            }
            intervalHandle = null;
            autoFlushInstalled = false;
        }
    };
}

/** Test-only — clear the auto-flush state. */
export function __resetAutoFlushForTests(): void {
    autoFlushInstalled = false;
    flushInFlight = false;
    intervalHandle = null;
}

/** Test-only — clear the queue. */
export function __clearQueueForTests(ctx?: QueueContext): void {
    writeQueue([], ctx);
}
