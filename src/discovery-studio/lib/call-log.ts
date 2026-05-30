import { effect } from "@preact/signals";
import { reportError } from "@/lib/observability";
import {
    activeFramework,
    callDisposition,
    focusedAccount,
    frameworkRegistry,
    signalLedger,
    type CallDisposition,
    type FrameworkId
} from "../state";

/**
 * Per-call log for Discovery Studio.
 *
 * Discovery Studio's existing persistence layer (lib/persistence.ts)
 * autosaves the IN-PROGRESS session blob to Supabase so the operator
 * can leave and resume. It does NOT log COMPLETED calls — there's no
 * record once disposition locks. That gap left Founding GTM §4.19 §3
 * ("the questions that earned the next meeting") unable to ask the only
 * question that matters: which segments showed up on calls that
 * advanced vs. calls that stalled. Aggregate counts (totalCalls /
 * advancedCalls in gtmos_discovery_stats) can't carry that read.
 *
 * This module fills the gap with a local log:
 *
 *   gtmos_discovery_call_log = { calls: DiscoveryCallRecord[] }
 *
 * Each record carries the framework, segments worked, node ids worked,
 * disposition, and the focused account at log time. No notes, no PII —
 * the in-progress session blob (which DOES carry richer state) stays
 * cloud-only.
 *
 * Trigger: a "session" is the window between callDisposition resets to
 * "in-progress". The first transition to a terminal disposition
 * (advanced/stalled/lost/won/no-show) commits a new record; subsequent
 * disposition changes inside the same session update that record.
 * Reset to "in-progress" starts a new session.
 *
 * Errors never throw — every write catches + reports.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export type TerminalDisposition = Exclude<CallDisposition, "in-progress">;

export interface DiscoveryCallRecord {
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly accountName: string;
    readonly activeFramework: FrameworkId | null;
    readonly segmentKeysWorked: ReadonlyArray<string>;
    readonly nodeIdsWorked: ReadonlyArray<string>;
    readonly disposition: TerminalDisposition;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

// ─── Constants ──────────────────────────────────────────────────────────

export const CALL_LOG_KEY = "gtmos_discovery_call_log";
const MAX_HISTORY = 200;

const VALID_DISPOSITIONS: ReadonlySet<TerminalDisposition> = new Set<TerminalDisposition>([
    "advanced",
    "stalled",
    "lost",
    "won",
    "no-show"
]);

// ─── Pure helpers ───────────────────────────────────────────────────────

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function uid(now: number): string {
    return `dcl_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    return asArray(v).filter((s): s is string => typeof s === "string");
}

function asDisposition(v: unknown): TerminalDisposition | null {
    return typeof v === "string" && VALID_DISPOSITIONS.has(v as TerminalDisposition)
        ? (v as TerminalDisposition)
        : null;
}

function asFrameworkId(v: unknown): FrameworkId | null {
    // FrameworkId is a string union derived from FRAMEWORK_IDS; rather
    // than re-import the runtime constant, we accept any string and let
    // the registry lookup discard unknowns.
    return typeof v === "string" ? (v as FrameworkId) : null;
}

function parseRecord(raw: unknown): DiscoveryCallRecord | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    if (!id) return null;
    const disposition = asDisposition(o.disposition);
    if (!disposition) return null;
    const createdAt = asString(o.createdAt);
    return {
        id,
        createdAt,
        updatedAt: asString(o.updatedAt) || createdAt,
        accountName: asString(o.accountName),
        activeFramework: asFrameworkId(o.activeFramework),
        segmentKeysWorked: asStringArray(o.segmentKeysWorked),
        nodeIdsWorked: asStringArray(o.nodeIdsWorked),
        disposition
    };
}

// ─── Load + save ────────────────────────────────────────────────────────

export function loadCallLog(
    storage?: StorageLike | null
): ReadonlyArray<DiscoveryCallRecord> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(CALL_LOG_KEY);
        if (!raw) return [];
        const root = asObject(JSON.parse(raw));
        if (!root) return [];
        return asArray(root.calls)
            .map(parseRecord)
            .filter((r): r is DiscoveryCallRecord => r !== null);
    } catch (err) {
        reportError(err, { op: "discovery-studio.loadCallLog" });
        return [];
    }
}

export function saveCallLog(
    calls: ReadonlyArray<DiscoveryCallRecord>,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        const capped = calls.slice(-MAX_HISTORY);
        s.setItem(CALL_LOG_KEY, JSON.stringify({ calls: capped }));
    } catch (err) {
        reportError(err, { op: "discovery-studio.saveCallLog" });
    }
}

// ─── Snapshot from signals ──────────────────────────────────────────────

/**
 * Map worked node ids to the segments they belong to, using the active
 * framework's segment→node tree. Unknown nodes drop silently — the
 * framework registry is the source of truth.
 */
export function computeSegmentKeysWorked(
    frameworkId: FrameworkId | null,
    nodeIds: ReadonlyArray<string>
): ReadonlyArray<string> {
    if (!frameworkId) return [];
    const fw = frameworkRegistry.value.find((f) => f.id === frameworkId);
    if (!fw) return [];
    const nodeToSegment = new Map<string, string>();
    for (const seg of fw.segments) {
        for (const node of seg.nodes) {
            nodeToSegment.set(node.id, seg.key);
        }
    }
    const seen = new Set<string>();
    for (const id of nodeIds) {
        const key = nodeToSegment.get(id);
        if (key) seen.add(key);
    }
    return Array.from(seen);
}

function snapshotNodeIdsWorked(): ReadonlyArray<string> {
    // Derive from signalLedger (same source workedNodeIds reads) so a
    // call's segments are tied to nodes the operator actually interacted
    // with, not just nodes that appeared on screen.
    const seen = new Set<string>();
    for (const entry of signalLedger.value) {
        seen.add(entry.nodeId);
    }
    return Array.from(seen);
}

// ─── Write trigger ──────────────────────────────────────────────────────

interface TriggerOptions {
    readonly storage?: StorageLike | null;
    readonly now?: () => number;
}

interface TriggerHandle {
    /** Tear down the effect. */
    readonly dispose: () => void;
    /** Test-only — read the in-flight call id without effect side effects. */
    readonly __currentCallIdForTests: () => string | null;
}

/**
 * Subscribe to callDisposition. On the first transition out of
 * "in-progress" within a session, commit a new record. On subsequent
 * disposition changes inside the same session, update the same record.
 * On reset to "in-progress", start a new session (the next terminal
 * value will commit a fresh record).
 *
 * Each call to startCallLogPersistence wires one effect; tear it down
 * with dispose() before re-wiring (e.g. in tests).
 */
export function startCallLogPersistence(
    options: TriggerOptions = {}
): TriggerHandle {
    const storage = getStorage(options.storage);
    if (!storage) {
        return {
            dispose: () => undefined,
            __currentCallIdForTests: () => null
        };
    }
    const nowFn = options.now ?? Date.now;
    let currentCallId: string | null = null;
    // Skip the initial fire — the signal starts in "in-progress" and we
    // don't want a no-op effect to do anything.
    let firstRun = true;

    const dispose = effect(() => {
        const disposition = callDisposition.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        if (disposition === "in-progress") {
            // Session reset → next terminal value will generate a new id.
            currentCallId = null;
            return;
        }
        const now = nowFn();
        const iso = new Date(now).toISOString();
        const existing = loadCallLog(storage);

        if (currentCallId === null) {
            const id = uid(now);
            currentCallId = id;
            const record: DiscoveryCallRecord = {
                id,
                createdAt: iso,
                updatedAt: iso,
                accountName: focusedAccount.value,
                activeFramework: activeFramework.value,
                segmentKeysWorked: computeSegmentKeysWorked(
                    activeFramework.value,
                    snapshotNodeIdsWorked()
                ),
                nodeIdsWorked: snapshotNodeIdsWorked(),
                disposition
            };
            saveCallLog([...existing, record], storage);
            return;
        }

        // Update the in-flight record: disposition changed inside the
        // same session. Refresh segments/nodes from the latest snapshot
        // — they may have grown since the first lock.
        const id = currentCallId;
        const next = existing.map((r) =>
            r.id === id
                ? {
                      ...r,
                      updatedAt: iso,
                      accountName: focusedAccount.value || r.accountName,
                      activeFramework:
                          activeFramework.value ?? r.activeFramework,
                      segmentKeysWorked: computeSegmentKeysWorked(
                          activeFramework.value,
                          snapshotNodeIdsWorked()
                      ),
                      nodeIdsWorked: snapshotNodeIdsWorked(),
                      disposition
                  }
                : r
        );
        saveCallLog(next, storage);
    });

    return {
        dispose,
        __currentCallIdForTests: () => currentCallId
    };
}
