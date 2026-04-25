import { effect } from "@preact/signals";
import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import {
    activeFramework,
    activeInterrupt,
    activeNode,
    callDisposition,
    compressionMode,
    expandedResponse,
    frameworkRegistry,
    learnedFacts,
    nextStepLock,
    signalLedger,
    tiebackLedger,
    type CallDisposition,
    type CompressionMode,
    type FrameworkId,
    type LearnedFact,
    type NextStepLock,
    type SignalLedgerEntry,
    type TiebackLedgerEntry
} from "../state";

/**
 * Wave 4 — persistence layer for Discovery Studio sessions.
 *
 * Bridges the in-memory signals to Supabase via the typed data-client.
 * Three responsibilities:
 *
 *   loadDiscoverySession    — fetch the latest persisted row for the
 *                             current user; return null if none.
 *   saveDiscoverySession    — upsert by stored rowId (insert first time,
 *                             update thereafter).
 *   startAutoSave           — subscribe to persistable signals and
 *                             debounce-save on changes. Returns an
 *                             unsubscribe disposer.
 *   unpackMigrationBlob     — look for a Phase 2.3 passthrough blob in
 *                             discovery_call_logs and translate any
 *                             reusable legacy state into the new shape.
 *
 * Storage shape: one row per user in `discovery_call_logs` with
 *   log_type    = "discovery-studio-session"
 *   summary     = active framework label (or "")
 *   data jsonb  = PersistedSessionState
 *
 * RLS handles workspace scoping at the DB layer; we don't filter by
 * workspace_id manually.
 *
 * Errors NEVER throw — every public function catches, calls
 * reportError(), and returns a benign fallback. A persistence outage
 * should not block the live call.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 3
 */

// ─── Types ──────────────────────────────────────────────────────────────

/**
 * Schema-versioned persisted state. Bump SCHEMA_VERSION when adding
 * fields so loaders can fall back gracefully on older shapes.
 */
export const SCHEMA_VERSION = 1;

export interface PersistedSessionState {
    readonly schemaVersion: number;
    readonly activeFramework: FrameworkId | null;
    readonly activeNode: { segmentKey: string; nodeId: string } | null;
    readonly expandedResponse: number | null;
    readonly learnedFacts: ReadonlyArray<LearnedFact>;
    readonly signalLedger: ReadonlyArray<SignalLedgerEntry>;
    readonly tiebackLedger: ReadonlyArray<TiebackLedgerEntry>;
    readonly nextStepLock: NextStepLock;
    readonly compressionMode: CompressionMode;
    readonly callDisposition: CallDisposition;
    readonly activeInterruptId: string | null;
}

export interface LoadedSession {
    readonly rowId: string;
    readonly state: PersistedSessionState;
}

const SESSION_LOG_TYPE = "discovery-studio-session";
const MIGRATION_VERSION_TAG = "phase-2.3-passthrough";

// ─── Snapshot from signals ──────────────────────────────────────────────

/**
 * Read every persistable signal and assemble a session blob. Pure read —
 * does not mutate state. Used by saveDiscoverySession + the auto-save
 * effect.
 */
export function snapshotSession(): PersistedSessionState {
    return {
        schemaVersion: SCHEMA_VERSION,
        activeFramework: activeFramework.value,
        activeNode: activeNode.value,
        expandedResponse: expandedResponse.value,
        learnedFacts: learnedFacts.value,
        signalLedger: signalLedger.value,
        tiebackLedger: tiebackLedger.value,
        nextStepLock: nextStepLock.value,
        compressionMode: compressionMode.value,
        callDisposition: callDisposition.value,
        activeInterruptId: activeInterrupt.value?.id ?? null
    };
}

/**
 * Heuristic — is this snapshot worth saving? Avoid saving an empty
 * session every time the page loads (e.g., user opens the room and
 * then closes the tab without doing anything).
 */
function isWorthSaving(s: PersistedSessionState): boolean {
    return (
        s.activeFramework !== null ||
        s.learnedFacts.length > 0 ||
        s.signalLedger.length > 0 ||
        s.nextStepLock.date !== "" ||
        s.nextStepLock.owner !== "" ||
        s.nextStepLock.purpose !== ""
    );
}

// ─── Seed signals from a loaded session ─────────────────────────────────

/**
 * Restore signal state from a previously-saved blob. Called once at
 * boot after loadDiscoverySession returns a row.
 */
export function seedSignalsFromState(s: PersistedSessionState): void {
    activeFramework.value = s.activeFramework;
    activeNode.value = s.activeNode;
    expandedResponse.value = s.expandedResponse;
    learnedFacts.value = s.learnedFacts;
    signalLedger.value = s.signalLedger;
    tiebackLedger.value = s.tiebackLedger;
    nextStepLock.value = s.nextStepLock;
    compressionMode.value = s.compressionMode;
    callDisposition.value = s.callDisposition;
    // activeInterrupt requires a lookup against the framework's interrupts;
    // resolve once frameworkRegistry is loaded.
    if (s.activeInterruptId && s.activeFramework) {
        const fw = frameworkRegistry.value.find(
            (f) => f.id === s.activeFramework
        );
        const it = fw?.interrupts.find((i) => i.id === s.activeInterruptId);
        activeInterrupt.value = it ?? null;
    } else {
        activeInterrupt.value = null;
    }
}

// ─── Load ───────────────────────────────────────────────────────────────

export async function loadDiscoverySession(
    client: DataClient
): Promise<LoadedSession | null> {
    try {
        const rows = await client.discoveryCallLogs.list({
            where: { log_type: SESSION_LOG_TYPE },
            orderBy: { column: "updated_at", ascending: false },
            limit: 1
        });
        if (rows.length === 0) return null;
        const row = rows[0]!;
        const stored = (row.data as { data?: unknown })?.data;
        // Accept both `data: {...session}` (current Wave 4 shape) and
        // bare `data: {...session}` from older versions.
        const blob: unknown = stored ?? row.data;
        const parsed = parsePersistedSession(blob);
        if (!parsed) return null;
        return { rowId: row.id, state: parsed };
    } catch (err) {
        reportError(err, { op: "loadDiscoverySession" });
        return null;
    }
}

function parsePersistedSession(value: unknown): PersistedSessionState | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    if (typeof v.schemaVersion !== "number") return null;
    return {
        schemaVersion: v.schemaVersion,
        activeFramework: (v.activeFramework as FrameworkId | null) ?? null,
        activeNode:
            v.activeNode &&
            typeof v.activeNode === "object" &&
            "segmentKey" in v.activeNode &&
            "nodeId" in v.activeNode
                ? (v.activeNode as { segmentKey: string; nodeId: string })
                : null,
        expandedResponse:
            typeof v.expandedResponse === "number" ? v.expandedResponse : null,
        learnedFacts: Array.isArray(v.learnedFacts)
            ? (v.learnedFacts as ReadonlyArray<LearnedFact>)
            : [],
        signalLedger: Array.isArray(v.signalLedger)
            ? (v.signalLedger as ReadonlyArray<SignalLedgerEntry>)
            : [],
        tiebackLedger: Array.isArray(v.tiebackLedger)
            ? (v.tiebackLedger as ReadonlyArray<TiebackLedgerEntry>)
            : [],
        nextStepLock:
            v.nextStepLock && typeof v.nextStepLock === "object"
                ? (v.nextStepLock as NextStepLock)
                : { date: "", owner: "", attendees: "", purpose: "", reason: "" },
        compressionMode:
            v.compressionMode === "essentials" ||
            v.compressionMode === "emergency"
                ? v.compressionMode
                : "off",
        callDisposition:
            isCallDisposition(v.callDisposition) ? v.callDisposition : "in-progress",
        activeInterruptId:
            typeof v.activeInterruptId === "string"
                ? v.activeInterruptId
                : null
    };
}

function isCallDisposition(v: unknown): v is CallDisposition {
    return (
        v === "in-progress" ||
        v === "advanced" ||
        v === "stalled" ||
        v === "lost" ||
        v === "won" ||
        v === "no-show"
    );
}

// ─── Save ───────────────────────────────────────────────────────────────

/**
 * Upsert the session row. If `rowId` is provided (returned by a prior
 * save or load), updates that row in place. Otherwise inserts a new row.
 *
 * Returns the row's ID for subsequent saves to use.
 */
export async function saveDiscoverySession(
    client: DataClient,
    state: PersistedSessionState,
    rowId?: string
): Promise<string | null> {
    try {
        const summary = state.activeFramework
            ? frameworkRegistry.value.find((f) => f.id === state.activeFramework)
                  ?.label ?? state.activeFramework
            : "";

        // The PersistedSessionState shape is structurally JSON-compatible
        // (only strings, numbers, booleans, nulls, arrays, and plain objects),
        // but TypeScript can't prove that against the Json type union from
        // database.types.ts. The cast is the canonical workaround for
        // typed clients writing structured payloads.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataPayload = { ...state } as any;
        if (rowId) {
            const updated = await client.discoveryCallLogs.update(rowId, {
                summary,
                data: dataPayload
            });
            return updated.id;
        }
        const inserted = await client.discoveryCallLogs.insert({
            log_type: SESSION_LOG_TYPE,
            summary,
            data: dataPayload
        });
        return inserted.id;
    } catch (err) {
        reportError(err, { op: "saveDiscoverySession", hasRowId: !!rowId });
        return null;
    }
}

// ─── Auto-save ──────────────────────────────────────────────────────────

/**
 * Subscribe to all persistable signals and debounce-save on every
 * meaningful change. Returns an unsubscribe disposer; production
 * callers don't normally need to call it (the room runs for the page's
 * lifetime), but tests do.
 *
 * Debounce window: 800ms. Long enough that bursty signal-ledger writes
 * during a call don't generate dozens of round-trips, short enough that
 * a brief pause flushes recent state.
 *
 * The effect captures `currentRowId` in a closure so subsequent saves
 * update the original row instead of inserting duplicates.
 */
export function startAutoSave(
    client: DataClient,
    initialRowId: string | null = null,
    options: { debounceMs?: number } = {}
): () => void {
    const debounceMs = options.debounceMs ?? 800;
    let currentRowId = initialRowId;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let pending: PersistedSessionState | null = null;

    const flush = async (): Promise<void> => {
        if (!pending || inFlight) return;
        const state = pending;
        pending = null;
        inFlight = true;
        try {
            const id = await saveDiscoverySession(
                client,
                state,
                currentRowId ?? undefined
            );
            if (id) currentRowId = id;
        } finally {
            inFlight = false;
            // If a new write came in while flushing, schedule another flush.
            if (pending) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    void flush();
                }, debounceMs);
            }
        }
    };

    const dispose = effect(() => {
        const state = snapshotSession();
        if (!isWorthSaving(state)) return;
        pending = state;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            void flush();
        }, debounceMs);
    });

    return () => {
        if (timer) clearTimeout(timer);
        dispose();
    };
}

// ─── Migration blob unpack ──────────────────────────────────────────────

/**
 * Detect a Phase 2.3 passthrough migration row in discovery_call_logs
 * and translate any reusable legacy fields into a fresh session state.
 *
 * The Phase 2.3 migration packed `gtmos_discovery_stats`,
 * `gtmos_discovery_agenda`, `gtmos_call_handoff`, and
 * `gtmos_cold_call_log` into the row's `data.migrated_from_localstorage`
 * jsonb. Most of those don't directly map to the new room's signals
 * (they were per-Call-Planner state); but `gtmos_call_handoff` carries
 * inbound context worth surfacing and `gtmos_discovery_agenda` may
 * carry next-step intent.
 *
 * Returns the unpacked session if a blob was found; null otherwise.
 *
 * Wave 4 ships a conservative unpack — fields that don't have a clean
 * mapping land in a default-initialized session. Future room-team
 * work can refine.
 */
export async function unpackMigrationBlob(
    client: DataClient
): Promise<PersistedSessionState | null> {
    try {
        const rows = await client.discoveryCallLogs.list({
            limit: 50
        });
        const blobRow = rows.find((r) => {
            const d = r.data as { migration_version?: unknown };
            return d?.migration_version === MIGRATION_VERSION_TAG;
        });
        if (!blobRow) return null;

        // The blob is permissive shape; we treat it as a hint, not as
        // canonical state. Build a fresh default session and overlay
        // anything we can confidently map.
        const fresh: PersistedSessionState = {
            schemaVersion: SCHEMA_VERSION,
            activeFramework: null,
            activeNode: null,
            expandedResponse: null,
            learnedFacts: [],
            signalLedger: [],
            tiebackLedger: [],
            nextStepLock: {
                date: "",
                owner: "",
                attendees: "",
                purpose: "",
                reason: ""
            },
            compressionMode: "off",
            callDisposition: "in-progress",
            activeInterruptId: null
        };

        const blob = (blobRow.data as { migrated_from_localstorage?: unknown })
            ?.migrated_from_localstorage;
        if (!blob || typeof blob !== "object") return fresh;

        const callHandoff = (blob as Record<string, unknown>)[
            "gtmos_call_handoff"
        ];
        if (callHandoff && typeof callHandoff === "object") {
            // Conservative: legacy handoffs sometimes carry next-step text
            // under varying keys. Best-effort overlay of the reason field.
            const reason = (callHandoff as { summary?: unknown }).summary;
            if (typeof reason === "string" && reason.length > 0) {
                return {
                    ...fresh,
                    nextStepLock: { ...fresh.nextStepLock, reason }
                };
            }
        }

        return fresh;
    } catch (err) {
        reportError(err, { op: "unpackMigrationBlob" });
        return null;
    }
}

// ─── Boot orchestration ─────────────────────────────────────────────────

/**
 * Boot-time persistence wiring. Call once after frameworkRegistry is
 * loaded. Runs:
 *   1. loadDiscoverySession — recover the user's last session
 *   2. (if no native row) unpackMigrationBlob — recover from Phase 2.3
 *   3. seedSignalsFromState — restore signals
 *   4. startAutoSave — subscribe debounced saves
 *
 * Returns the auto-save disposer for completeness; production code
 * doesn't normally call it.
 */
export async function bootPersistence(
    client: DataClient
): Promise<() => void> {
    let session: LoadedSession | null = null;
    try {
        session = await loadDiscoverySession(client);
        if (!session) {
            const unpacked = await unpackMigrationBlob(client);
            if (unpacked) {
                seedSignalsFromState(unpacked);
                const id = await saveDiscoverySession(client, unpacked);
                if (id) session = { rowId: id, state: unpacked };
            }
        } else {
            seedSignalsFromState(session.state);
        }
    } catch (err) {
        reportError(err, { op: "bootPersistence" });
    }
    return startAutoSave(client, session?.rowId ?? null);
}
