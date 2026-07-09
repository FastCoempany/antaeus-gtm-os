import type { Benchmark, PlanInputs, PlanMetrics, CoverageSnapshot } from "../../lib/types";
import { computeMetrics } from "../../lib/engine";
import { EMPTY_COVERAGE } from "../../lib/types";
import { t } from "@/lib/voice/t";

/**
 * Quota Workback v4 — the pace model (canon §4.18, "pace + fused
 * strands"). Pure reads over the shipped engine + the rooms' own logs:
 *
 *  · the ACTUALS strand ("where you actually are") from the outbound /
 *    linkedin / cold-call logs + the deal mirror — all defensive;
 *  · the BELIEVABILITY read ("is the plan real?") — names the ONE
 *    optimistic assumption vs the benchmark and what it costs;
 *  · the PACE projection — closed-won so far + what the current
 *    pipeline is worth at stage odds (never a fabricated trend).
 *
 * The calc engine (computeMetrics/benchmarkFor) and computeCoverage are
 * reused unchanged. §13: no touches/opps/m2o on the face — the surface
 * renders plain words; this module only computes.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function readJson<T>(s: StorageLike | null, key: string): T | null {
    if (!s) return null;
    try {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function monthStart(now: Date): number {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}
function yearStart(now: Date): number {
    return new Date(now.getFullYear(), 0, 1).getTime();
}
function stamp(v: unknown): number | null {
    if (typeof v !== "string" || !v) return null;
    const n = Date.parse(v);
    return Number.isFinite(n) ? n : null;
}

export interface Actuals {
    /** Outreach (emails + calls + public touches) per working day, this month. */
    readonly outreachPerDay: number;
    /** First meetings booked this month (cold-call meeting_booked). */
    readonly meetingsThisMonth: number;
    /** Deals closed-won this month. */
    readonly closedThisMonth: number;
    /** Closed-won value this calendar year (raw dollars). */
    readonly closedWonYtd: number;
    /** Any activity at all this month? Drives plan-vs-pace read. */
    readonly hasActivity: boolean;
}

export function readActuals(s?: StorageLike | null, now: Date = new Date()): Actuals {
    const st = store(s);
    const mStart = monthStart(now);
    const yStart = yearStart(now);

    // outreach this month: outbound touches + linkedin actions + cold calls
    let outreach = 0;
    const ob = readJson<{ touches?: ReadonlyArray<{ createdAt?: string; savedAt?: string }> }>(st, "gtmos_outbound_touches");
    for (const x of ob?.touches ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.savedAt);
        if (ts != null && ts >= mStart) outreach += 1;
    }
    const li = readJson<{ actions?: ReadonlyArray<{ createdAt?: string; at?: string }> }>(st, "gtmos_linkedin_log");
    for (const x of li?.actions ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts != null && ts >= mStart) outreach += 1;
    }
    let meetings = 0;
    const cc = readJson<{ calls?: ReadonlyArray<{ createdAt?: string; at?: string; outcome?: string }> }>(st, "gtmos_cold_call_log");
    for (const x of cc?.calls ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts != null && ts >= mStart) {
            outreach += 1;
            if (x.outcome === "meeting_booked") meetings += 1;
        }
    }

    // closes: from the deal mirror
    let closedThisMonth = 0;
    let closedWonYtd = 0;
    const dealsRaw = readJson<unknown>(st, "gtmos_deal_workspaces");
    const deals: ReadonlyArray<Record<string, unknown>> = Array.isArray(dealsRaw)
        ? (dealsRaw as ReadonlyArray<Record<string, unknown>>)
        : Array.isArray((dealsRaw as { deals?: unknown })?.deals)
          ? ((dealsRaw as { deals: ReadonlyArray<Record<string, unknown>> }).deals)
          : [];
    for (const d of deals) {
        const stage = String(d["stage"] ?? "");
        if (stage !== "closed-won") continue;
        const ts =
            stamp(d["updated_at"]) ??
            stamp(d["updatedAt"]) ??
            stamp(d["created_at"]) ??
            stamp(d["createdAt"]);
        const value = typeof d["value"] === "number" ? (d["value"] as number) : 0;
        if (ts != null && ts >= yStart) closedWonYtd += value;
        if (ts != null && ts >= mStart) closedThisMonth += 1;
    }

    // working days elapsed this month (Mon–Fri), at least 1
    let workdays = 0;
    const cursor = new Date(mStart);
    while (cursor.getTime() <= now.getTime()) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) workdays += 1;
        cursor.setDate(cursor.getDate() + 1);
    }
    workdays = Math.max(1, workdays);

    return {
        outreachPerDay: Math.round((outreach / workdays) * 10) / 10,
        meetingsThisMonth: meetings,
        closedThisMonth,
        closedWonYtd,
        hasActivity: outreach > 0 || meetings > 0 || deals.length > 0
    };
}

// ─── Believability — "is the plan real?" ───────────────────────────────

export interface Believability {
    /** true = the plan matches the benchmark; no stretch to call out. */
    readonly solid: boolean;
    readonly read: string;
    readonly cost: string | null;
    /** The one optimistic input + the benchmark value to reset it to. */
    readonly fix: { key: "win" | "m2o"; value: number } | null;
}

export function buildBelievability(
    inputs: PlanInputs,
    benchmark: Benchmark,
    metrics: PlanMetrics
): Believability {
    // Relative optimism vs benchmark on the two assumptions a first-
    // timer actually sets: win rate and meetings→real-opportunities.
    const winOver = benchmark.winRate > 0 ? inputs.win / benchmark.winRate : 1;
    const m2oOver = benchmark.m2o > 0 ? inputs.m2o / benchmark.m2o : 1;
    const worst = m2oOver >= winOver ? "m2o" : "win";
    const over = Math.max(winOver, m2oOver);

    if (over <= 1.1) {
        return {
            solid: true,
            read: t(
                "How often you win, your typical deal, and your cycle all match what teams your size actually see. The plan holds up.",
                { class: "body" }
            ),
            cost: null,
            fix: null
        };
    }
    if (worst === "m2o") {
        const honest = computeMetrics({ ...inputs, m2o: benchmark.m2o }, EMPTY_COVERAGE);
        const moreADay = Math.max(0, Math.round((honest.touchesDay - metrics.touchesDay) * 2) / 2);
        return {
            solid: false,
            read: `${t("The one stretch: you're assuming", { class: "body" })} ${inputs.m2o}% ${t("of first meetings become real opportunities — teams your size usually see", { class: "body" })} ${benchmark.m2o}%.`,
            cost:
                moreADay > 0
                    ? `${t("At", { class: "body" })} ${benchmark.m2o}% ${t("that means about", { class: "body" })} ${moreADay} ${t("more messages & calls a day — plan for it now, not in month three.", { class: "body" })}`
                    : null,
            fix: { key: "m2o", value: benchmark.m2o }
        };
    }
    const honestWin = computeMetrics({ ...inputs, win: benchmark.winRate }, EMPTY_COVERAGE);
    const moreADayW = Math.max(0, Math.round((honestWin.touchesDay - metrics.touchesDay) * 2) / 2);
    return {
        solid: false,
        read: `${t("The one stretch: you're assuming you win", { class: "body" })} ${inputs.win}% ${t("of real opportunities — teams your size usually land near", { class: "body" })} ${benchmark.winRate}%.`,
        cost:
            moreADayW > 0
                ? `${t("At", { class: "body" })} ${benchmark.winRate}% ${t("that means about", { class: "body" })} ${moreADayW} ${t("more messages & calls a day to hit the same number.", { class: "body" })}`
                : null,
        fix: { key: "win", value: benchmark.winRate }
    };
}

// ─── Pace — where today's rate lands you ───────────────────────────────

export interface Pace {
    /** Projected year-end landing (raw dollars): closed + pipeline at odds. */
    readonly projected: number;
    readonly short: number;
    readonly onTarget: boolean;
    /** 0..1 of the target, clamped, for the track bar. */
    readonly pct: number;
}

export function buildPace(
    quota: number,
    actuals: Actuals,
    coverage: CoverageSnapshot
): Pace {
    // Honest projection: what's closed this year + what the open
    // pipeline is worth at stage odds. No fabricated trend lines.
    const projected = Math.round(actuals.closedWonYtd + (coverage.hasDeals ? coverage.weighted : 0));
    const short = Math.max(0, quota - projected);
    return {
        projected,
        short,
        onTarget: quota > 0 && projected >= quota,
        pct: quota > 0 ? Math.max(0.02, Math.min(1, projected / quota)) : 0
    };
}

export function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}
