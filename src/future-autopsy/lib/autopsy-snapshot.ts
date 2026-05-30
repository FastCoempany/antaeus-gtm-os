import { effect } from "@preact/signals";
import { reportError } from "@/lib/observability";
import {
    currentAutopsy,
    currentVerdictMode,
    selectedDealId,
    selectedVitals
} from "../state";
import type { VerdictMode } from "./types";

/**
 * Per-deal autopsy snapshot.
 *
 * Future Autopsy regenerates its full diagnosis (verdict story, top
 * causes, kill switch) at render time from the deal's vitals — it
 * persists no durable record of "what the autopsy said." Founding GTM
 * §5 ("the losses we paid for") wants the regenerated verdict + cause
 * + kill switch joined back to the closed-lost deal, so this module
 * captures a thin snapshot of currentAutopsy whenever the operator
 * pins a deal in the room.
 *
 * Snapshot shape (intentionally small — no per-cause weight history,
 * no chapter regeneration trail):
 *   { dealId, accountName, verdictMode, killSwitch, topCauseId,
 *     topCauseLabel, generatedAtIso }
 *
 * Storage key: gtmos_autopsy_snapshots = { snapshots: [...] }
 * Upsert keyed by dealId — opening the same deal twice updates the
 * record in place; opening N deals produces N records.
 *
 * Errors never throw — every write catches + reports. Cloud sync is
 * out of scope here; this is local-only + reads from a state graph
 * the room already owns.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface AutopsySnapshotRecord {
    readonly dealId: string;
    readonly accountName: string;
    readonly verdictMode: VerdictMode;
    readonly killSwitch: string;
    readonly topCauseId: string | null;
    readonly topCauseLabel: string | null;
    readonly generatedAtIso: string;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

// ─── Constants ──────────────────────────────────────────────────────────

export const AUTOPSY_SNAPSHOT_KEY = "gtmos_autopsy_snapshots";
const MAX_HISTORY = 500;

const VALID_VERDICTS: ReadonlySet<VerdictMode> = new Set<VerdictMode>([
    "left",
    "corrected"
]);

// ─── Pure helpers ───────────────────────────────────────────────────────

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
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

function parseRecord(raw: unknown): AutopsySnapshotRecord | null {
    const o = asObject(raw);
    if (!o) return null;
    const dealId = asString(o.dealId);
    if (!dealId) return null;
    const verdictMode = asString(o.verdictMode);
    if (!VALID_VERDICTS.has(verdictMode as VerdictMode)) return null;
    return {
        dealId,
        accountName: asString(o.accountName),
        verdictMode: verdictMode as VerdictMode,
        killSwitch: asString(o.killSwitch),
        topCauseId: typeof o.topCauseId === "string" ? o.topCauseId : null,
        topCauseLabel:
            typeof o.topCauseLabel === "string" ? o.topCauseLabel : null,
        generatedAtIso: asString(o.generatedAtIso)
    };
}

// ─── Load + save ────────────────────────────────────────────────────────

export function loadAutopsySnapshots(
    storage?: StorageLike | null
): ReadonlyArray<AutopsySnapshotRecord> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(AUTOPSY_SNAPSHOT_KEY);
        if (!raw) return [];
        const root = asObject(JSON.parse(raw));
        if (!root) return [];
        return asArray(root.snapshots)
            .map(parseRecord)
            .filter((r): r is AutopsySnapshotRecord => r !== null);
    } catch (err) {
        reportError(err, { op: "future-autopsy.loadAutopsySnapshots" });
        return [];
    }
}

export function saveAutopsySnapshots(
    snapshots: ReadonlyArray<AutopsySnapshotRecord>,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        const capped = snapshots.slice(-MAX_HISTORY);
        s.setItem(
            AUTOPSY_SNAPSHOT_KEY,
            JSON.stringify({ snapshots: capped })
        );
    } catch (err) {
        reportError(err, { op: "future-autopsy.saveAutopsySnapshots" });
    }
}

/** Replace-or-append by dealId. */
function upsert(
    existing: ReadonlyArray<AutopsySnapshotRecord>,
    next: AutopsySnapshotRecord
): ReadonlyArray<AutopsySnapshotRecord> {
    const filtered = existing.filter((r) => r.dealId !== next.dealId);
    return [...filtered, next];
}

// ─── Write trigger ──────────────────────────────────────────────────────

interface TriggerOptions {
    readonly storage?: StorageLike | null;
    readonly now?: () => number;
}

interface TriggerHandle {
    readonly dispose: () => void;
}

/**
 * Subscribe to the pinned-deal state. Each time a real deal is selected
 * (or its verdict mode flips), upsert a snapshot of the regenerated
 * autopsy under that deal id.
 *
 * Skips the initial fire — the signals load with null/default values
 * and we don't want to write an empty snapshot on boot.
 */
export function startAutopsySnapshotPersistence(
    options: TriggerOptions = {}
): TriggerHandle {
    const storage = getStorage(options.storage);
    if (!storage) {
        return { dispose: () => undefined };
    }
    const nowFn = options.now ?? Date.now;
    let firstRun = true;

    const dispose = effect(() => {
        // Subscribe explicitly to every signal we care about so changes
        // re-fire even if currentAutopsy reference is stable.
        const id = selectedDealId.value;
        const verdict = currentVerdictMode.value;
        const autopsy = currentAutopsy.value;
        const vitals = selectedVitals.value;

        if (firstRun) {
            firstRun = false;
            return;
        }

        if (!id || !autopsy || !vitals) return;

        const top = autopsy.causes[0] ?? null;
        const record: AutopsySnapshotRecord = {
            dealId: id,
            accountName: vitals.name,
            verdictMode: verdict,
            killSwitch: autopsy.killSwitch,
            topCauseId: top?.id ?? null,
            topCauseLabel: top?.label ?? null,
            generatedAtIso: new Date(nowFn()).toISOString()
        };
        saveAutopsySnapshots(upsert(loadAutopsySnapshots(storage), record), storage);
    });

    return { dispose };
}
