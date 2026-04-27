import { reportError } from "@/lib/observability";
import {
    OUTCOMES,
    PERSONA_KEYS,
    type AgendaSnapshot,
    type CallHandoffPayload,
    type Outcome,
    type PersonaKey
} from "./types";

/**
 * Phase 4 / Room 9 Wave 4 — persistence helpers.
 *
 * Three localStorage keys this room owns:
 *   - `gtmos_discovery_agenda` — full AgendaSnapshot (autosave, load on
 *     resume so the planner doesn't lose context across reloads).
 *   - `gtmos_call_handoff` — CallHandoffPayload that Discovery Studio
 *     reads on boot to prefill its first segment. Same shape as the
 *     legacy `persistAgendaState()` write.
 *   - `gtmos_discovery_stats` — {totalCalls, advancedCalls} shared with
 *     Cold Call Studio; we bump on outcome log per legacy line 1062-64.
 *
 * Defensive throughout: malformed JSON / missing keys / wrong types →
 * safe defaults, errors via reportError per CLAUDE.md Part II.5 §2.
 */

const AGENDA_KEY = "gtmos_discovery_agenda";
const HANDOFF_KEY = "gtmos_call_handoff";
const STATS_KEY = "gtmos_discovery_stats";

const PERSONA_SET: ReadonlySet<string> = new Set(PERSONA_KEYS);
const HANDOFF_OUTCOME_SET: ReadonlySet<string> = new Set([
    ...OUTCOMES,
    "planned"
]);

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
    if (storage !== undefined) return storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function asPersona(v: unknown): PersonaKey {
    return typeof v === "string" && PERSONA_SET.has(v)
        ? (v as PersonaKey)
        : "cxo";
}

function asOutcome(v: unknown): Outcome | "planned" {
    return typeof v === "string" && HANDOFF_OUTCOME_SET.has(v)
        ? (v as Outcome | "planned")
        : "planned";
}

function asLogType(v: unknown): "call_outcome" | "call_plan" {
    return v === "call_outcome" ? "call_outcome" : "call_plan";
}

// ─── Agenda snapshot ───────────────────────────────────────────────────

export function loadAgendaSnapshot(
    storage?: StorageLike | null
): AgendaSnapshot | null {
    const s = getStorage(storage);
    if (!s) return null;
    try {
        const raw = s.getItem(AGENDA_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        const r = parsed as Record<string, unknown>;
        const gates = Array.isArray(r["gates"])
            ? (r["gates"] as unknown[]).map((v) => Boolean(v))
            : [];
        const gateDetails = Array.isArray(r["gateDetails"])
            ? (r["gateDetails"] as unknown[])
                  .map((row) => {
                      if (!row || typeof row !== "object") return null;
                      const o = row as Record<string, unknown>;
                      return {
                          label: asString(o["label"]),
                          met: Boolean(o["met"]),
                          copy: asString(o["copy"])
                      };
                  })
                  .filter(
                      (
                          x
                      ): x is { label: string; met: boolean; copy: string } =>
                          x !== null
                  )
            : [];
        return {
            contact: asString(r["contact"]),
            company: asString(r["company"]),
            persona: asPersona(r["persona"]),
            linkedDeal: asString(r["linkedDeal"]),
            gates,
            gateDetails,
            score: asNumber(r["score"]),
            band: asString(r["band"]),
            nextMove: asString(r["nextMove"]),
            signalHeadline: asString(r["signalHeadline"]),
            customNotes: asString(r["customNotes"]),
            linkedinUrl: asString(r["linkedinUrl"]),
            preparedAt: asString(r["preparedAt"]) || new Date().toISOString()
        };
    } catch (err) {
        reportError(err, { op: "call-planner.loadAgendaSnapshot" });
        return null;
    }
}

export function saveAgendaSnapshot(
    snapshot: AgendaSnapshot,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(AGENDA_KEY, JSON.stringify(snapshot));
    } catch (err) {
        reportError(err, { op: "call-planner.saveAgendaSnapshot" });
    }
}

// ─── Call handoff payload ──────────────────────────────────────────────

export function saveCallHandoff(
    payload: CallHandoffPayload,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(HANDOFF_KEY, JSON.stringify(payload));
    } catch (err) {
        reportError(err, { op: "call-planner.saveCallHandoff" });
    }
}

export function loadCallHandoff(
    storage?: StorageLike | null
): CallHandoffPayload | null {
    const s = getStorage(storage);
    if (!s) return null;
    try {
        const raw = s.getItem(HANDOFF_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        const r = parsed as Record<string, unknown>;
        const linkedDealRaw = r["linkedDeal"];
        return {
            contact: asString(r["contact"]),
            outcome: asOutcome(r["outcome"]),
            timestamp: asString(r["timestamp"]) || new Date().toISOString(),
            linkedDeal:
                typeof linkedDealRaw === "string" && linkedDealRaw.length > 0
                    ? linkedDealRaw
                    : null,
            company: asString(r["company"]),
            persona: asPersona(r["persona"]),
            logType: asLogType(r["logType"]),
            summary: asString(r["summary"]),
            agendaScore: asNumber(r["agendaScore"]),
            agendaBand: asString(r["agendaBand"]),
            nextMove: asString(r["nextMove"])
        };
    } catch (err) {
        reportError(err, { op: "call-planner.loadCallHandoff" });
        return null;
    }
}

// ─── Discovery stats ───────────────────────────────────────────────────

export interface DiscoveryStats {
    readonly totalCalls: number;
    readonly advancedCalls: number;
}

const EMPTY_STATS: DiscoveryStats = { totalCalls: 0, advancedCalls: 0 };

export function loadDiscoveryStats(
    storage?: StorageLike | null
): DiscoveryStats {
    const s = getStorage(storage);
    if (!s) return EMPTY_STATS;
    try {
        const raw = s.getItem(STATS_KEY);
        if (!raw) return EMPTY_STATS;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return EMPTY_STATS;
        const r = parsed as Record<string, unknown>;
        return {
            totalCalls: Math.max(0, Math.floor(asNumber(r["totalCalls"]))),
            advancedCalls: Math.max(
                0,
                Math.floor(asNumber(r["advancedCalls"]))
            )
        };
    } catch (err) {
        reportError(err, { op: "call-planner.loadDiscoveryStats" });
        return EMPTY_STATS;
    }
}

export function saveDiscoveryStats(
    next: DiscoveryStats,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(STATS_KEY, JSON.stringify(next));
    } catch (err) {
        reportError(err, { op: "call-planner.saveDiscoveryStats" });
    }
}

/**
 * Increment discovery stats by 1 logged call (and 1 advanced if outcome
 * is "advanced"). Mirrors legacy lines 1061-1064 — totalCalls bumps
 * always, advancedCalls only on the "advanced" outcome.
 */
export function incrementDiscoveryStats(
    outcome: Outcome,
    storage?: StorageLike | null
): DiscoveryStats {
    const prev = loadDiscoveryStats(storage);
    const next: DiscoveryStats = {
        totalCalls: prev.totalCalls + 1,
        advancedCalls:
            outcome === "advanced"
                ? prev.advancedCalls + 1
                : prev.advancedCalls
    };
    saveDiscoveryStats(next, storage);
    return next;
}
