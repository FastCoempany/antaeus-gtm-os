import type { Deal } from "@/deal-workspace/lib/deal-shape";
import { isClosed } from "@/deal-workspace/lib/deal-shape";
import type { Vitals } from "./types";

/**
 * Phase 4 / Room 4 Wave 2 — vitals computation.
 *
 * Faithful TypeScript port of the legacy `dh.computeVitals()` +
 * `dh.computeRisk()` + supporting helpers (`gate`, `assessGates`,
 * `qualScore`, `stageAgeDays`, `threadingDepth`) from
 * `js/deal-health.js` lines 126-331.
 *
 * Per canon §4.14 the autopsy room reads live deal state and projects
 * vitals — staleDays, qualScore, riskScore — that drive both the
 * universe ranking and the cause analysis. Storing these would let
 * them go stale; recomputing on every render keeps the diagnosis
 * honest.
 *
 * Pure: accepts an optional `now` for deterministic tests.
 */

export const DEFAULT_PREFS = {
    staleWarnDays: 7,
    stageStuckDays: 21,
    staleCriticalDays: 30,
    highValueUSD: 75000,
    killValueUSD: 25000,
    coverageTarget: 3,
    autopsyHorizonDays: 45
} as const;

export type Prefs = typeof DEFAULT_PREFS;

const GATE_FIELDS = [
    "champion",
    "eb",
    "usecase",
    "impact",
    "process",
    "timeline",
    "competition",
    "risks",
    "nextstep"
] as const;
type GateField = (typeof GATE_FIELDS)[number];

type GateValue = "missing" | "weak" | "present";

export type Gates = Readonly<Record<GateField, GateValue>>;

export type MissingMap = Readonly<Record<GateField, boolean>>;

const STAGE_LABELS: Record<string, string> = {
    prospect: "Prospect",
    discovery: "Discovery",
    evaluation: "Solution Fit",
    poc: "PoC / Pilot",
    negotiation: "Negotiation",
    verbal: "Verbal Commit",
    "closed-won": "Closed Won",
    "closed-lost": "Closed Lost"
};

const DAY_MS = 24 * 60 * 60 * 1000;

function tx(v: unknown): string {
    return String(v ?? "").trim();
}

function clamp(n: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, n));
}

function daysBetween(stamp: string | undefined, now: number): number {
    if (!stamp) return 0;
    const t = new Date(stamp).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, Math.floor((now - t) / DAY_MS));
}

function daysUntil(stamp: string | undefined, now: number): number | null {
    if (!stamp) return null;
    const t = new Date(stamp + "T23:59:59").getTime();
    if (Number.isNaN(t)) return null;
    return Math.floor((t - now) / DAY_MS);
}

function gate(field: string | undefined): GateValue {
    const v = tx(field);
    if (!v) return "missing";
    if (v.length < 20) return "weak";
    return "present";
}

function assessGates(deal: Deal): Gates {
    return {
        champion: gate(deal.champion),
        eb: gate(deal.economicBuyer),
        usecase: gate(deal.useCase),
        impact: gate(deal.pain),
        process: gate(deal.decisionProcess),
        timeline: gate(deal.closeDate),
        competition: gate(deal.competition),
        risks: gate(deal.notes), // legacy mapped blockers→notes
        nextstep: gate(deal.nextStep)
    };
}

function missingMap(gates: Gates): MissingMap {
    const m = {} as Record<GateField, boolean>;
    for (const k of GATE_FIELDS) m[k] = gates[k] !== "present";
    return m;
}

export function qualScore(gates: Gates): number {
    let s = 0;
    for (const k of GATE_FIELDS) {
        s += gates[k] === "present" ? 2 : gates[k] === "weak" ? 1 : 0;
    }
    return clamp(s, 0, 18);
}

interface StageHistoryEntry {
    readonly to?: string;
    readonly at?: string;
}

type StageHistory = Readonly<Record<string, ReadonlyArray<StageHistoryEntry>>>;

function readStageHistory(
    storage: Pick<Storage, "getItem"> | null
): StageHistory {
    if (!storage) return {};
    try {
        const raw = storage.getItem("gtmos_deal_stage_history");
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as StageHistory)
            : {};
    } catch {
        return {};
    }
}

function stageAgeDays(deal: Deal, history: StageHistory, now: number): number {
    const entries = history[deal.id];
    if (Array.isArray(entries)) {
        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i]?.to === deal.stage && entries[i]?.at) {
                return daysBetween(entries[i]!.at, now);
            }
        }
    }
    return daysBetween(deal.updated_at ?? deal.created_at, now);
}

interface ThreadingDepth {
    readonly engaged: number;
    readonly roleCount: number;
}

function threadingDepth(deal: Deal): ThreadingDepth {
    const sh = deal.stakeholders ?? [];
    let engaged = 0;
    const roles = new Set<string>();
    for (const s of sh) {
        if (s.role) roles.add(s.role);
        if (s.engaged) engaged++;
    }
    // The legacy adds champion/EB to the engaged count even when not in
    // stakeholders list.
    if (deal.champion) {
        engaged += 1;
        roles.add("champion");
    }
    if (deal.economicBuyer) {
        engaged += 1;
        roles.add("eb");
    }
    return { engaged, roleCount: roles.size };
}

/**
 * Auto-momentum if the deal hasn't set one explicitly.
 *   ≤3d stale  → strong
 *   ≤7d stale  → neutral
 *   else       → stalling
 */
function inferMomentum(staleDays: number): "strong" | "neutral" | "stalling" {
    if (staleDays <= 3) return "strong";
    if (staleDays <= 7) return "neutral";
    return "stalling";
}

export interface ComputedVitals extends Vitals {
    readonly gates: Gates;
    readonly missing: MissingMap;
    readonly stageAgeDays: number;
    readonly nextStepHasDate: boolean;
    readonly nextStepDaysAway: number | null;
    readonly closeDateDaysAway: number | null;
    readonly threading: ThreadingDepth;
    readonly momentum: "strong" | "neutral" | "stalling";
}

export interface ComputeOptions {
    readonly prefs?: Prefs;
    readonly now?: number;
    readonly storage?: Pick<Storage, "getItem"> | null;
}

/**
 * Compute the full vitals record for a single deal. Legacy
 * `dh.computeVitals(deal)` parity — same field names, same values.
 */
export function computeVitals(
    deal: Deal,
    options: ComputeOptions = {}
): ComputedVitals {
    const prefs = options.prefs ?? DEFAULT_PREFS;
    const now = options.now ?? Date.now();
    const storage =
        options.storage === undefined
            ? typeof localStorage !== "undefined"
                ? localStorage
                : null
            : options.storage;
    const history = readStageHistory(storage);

    const gates = assessGates(deal);
    const missing = missingMap(gates);
    const qs = qualScore(gates);
    const staleDays = daysBetween(deal.updated_at ?? deal.created_at, now);
    const stageAge = stageAgeDays(deal, history, now);
    const cdAway = daysUntil(deal.closeDate, now);
    const nsdAway = daysUntil(deal.nextStepDate, now);
    const threading = threadingDepth(deal);
    const closed = isClosed(deal.stage);
    const stageLabel = STAGE_LABELS[deal.stage] ?? deal.stage ?? "Unknown";
    const momentum = deal.momentum ?? inferMomentum(staleDays);

    const nextStepHasDate = !!deal.nextStepDate;
    const hasNextStep = !!tx(deal.nextStep);

    const baseVitals: Omit<ComputedVitals, "riskScore"> = {
        id: deal.id,
        name: deal.accountName || "Unnamed",
        value: deal.value,
        stageRaw: deal.stage ?? "prospect",
        stage: stageLabel,
        qualScore: qs,
        staleDays,
        stageAgeDays: stageAge,
        isClosed: closed,
        hasNextStep,
        nextStepHasDate,
        ...(deal.nextStepDate ? { nextStepDate: deal.nextStepDate } : {}),
        nextStepDaysAway: nsdAway,
        closeDateDaysAway: cdAway,
        ...(deal.closeDate ? { closeDate: deal.closeDate } : {}),
        ...(deal.champion ? { champion: deal.champion } : {}),
        ...(deal.economicBuyer ? { economicBuyer: deal.economicBuyer } : {}),
        ...(deal.useCase ? { useCase: deal.useCase } : {}),
        ...(deal.pain ? { pain: deal.pain } : {}),
        ...(deal.competition ? { competition: deal.competition } : {}),
        gates,
        missing,
        threading,
        momentum
    };

    const riskScore = computeRisk(baseVitals, prefs);
    return { ...baseVitals, riskScore };
}

/**
 * 0-100 risk score. Faithful port of `js/deal-health.js` lines
 * 294-331. Each component capped per the legacy formula; total
 * clamped to 0-100. Closed deals are 0.
 */
export function computeRisk(
    v: Omit<ComputedVitals, "riskScore">,
    prefs: Prefs = DEFAULT_PREFS
): number {
    if (v.isClosed) return 0;
    let s = 0;

    // Staleness (max 30)
    s +=
        v.staleDays <= 3
            ? 0
            : v.staleDays <= 7
                ? 10
                : v.staleDays <= 14
                    ? 20
                    : 30;

    // Stage stuck (max 20)
    s +=
        v.stageAgeDays > prefs.stageStuckDays
            ? 20
            : v.stageAgeDays > 14
                ? 8
                : 0;

    // Next step quality (max 15)
    s += v.missing.nextstep ? 15 : !v.nextStepHasDate ? 8 : 0;

    // Qualification depth (max 20)
    s +=
        v.qualScore >= 16
            ? 0
            : v.qualScore >= 12
                ? 6
                : v.qualScore >= 7
                    ? 12
                    : 20;

    // High-value amplifier (max 10)
    s += v.value >= prefs.highValueUSD ? 10 : 0;

    // Late-stage fragility (max 10)
    if (
        /negotiation|poc|verbal/.test(v.stage.toLowerCase()) &&
        (v.missing.eb || v.missing.process)
    ) {
        s += 10;
    }

    // Overdue close date (max 10)
    if (v.closeDateDaysAway !== null && v.closeDateDaysAway < 0) s += 10;

    // Overdue next step date (max 8)
    if (v.nextStepDaysAway !== null && v.nextStepDaysAway < 0) s += 8;

    // Single-threaded (max 8)
    if (v.threading.engaged < 3 && v.value >= 50000) s += 8;

    return clamp(Math.round(s), 0, 100);
}

/**
 * Convenience wrapper: load all deals from the mirror + compute vitals
 * for each.
 */
export function computeVitalsForAll(
    deals: ReadonlyArray<Deal>,
    options: ComputeOptions = {}
): ReadonlyArray<ComputedVitals> {
    return deals.map((d) => computeVitals(d, options));
}
