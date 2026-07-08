import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { VERDICT_RANK } from "@/lib/readiness";

/**
 * Dashboard v4 cockpit model (canon §4.2) — the "command + standing
 * cockpit". Pure builders over the readiness summary + the per-room
 * health snapshots. The command board (the one move + skip) is composed
 * directly from the existing commandSummary signal in the surface; this
 * module owns the masthead (the whole-motion standing) + the standing
 * row (each part is a door). Engines reused unchanged — presentation
 * wiring only.
 */

export type GateState = "done" | "on" | "next" | "todo";

export interface Gate {
    readonly label: string;
    readonly state: GateState;
}

const GATE_LABELS: ReadonlyArray<string> = [
    "You are the system",
    "Building",
    "Inheritable",
    "Hire-ready",
    "Repeatable"
];

export interface Masthead {
    readonly verdictLabel: string;
    /** Grammatical headline split into a plain lead + the emphasized state. */
    readonly headlinePre: string;
    readonly headlineEm: string;
    readonly gates: ReadonlyArray<Gate>;
    readonly nextStage: string;
}

/** The 5-gate ladder + verdict + the "what gets you to the next stage" line. */
export function buildMasthead(summary: ReadinessSummary): Masthead {
    const rank = VERDICT_RANK[summary.verdict as Verdict] ?? 1;
    const gates: Gate[] = GATE_LABELS.map((label, i) => {
        const pos = i + 1;
        const state: GateState =
            pos < rank ? "done" : pos === rank ? "on" : pos === rank + 1 ? "next" : "todo";
        return { label, state };
    });
    const nextStage =
        summary.gateBlockers && summary.gateBlockers.length > 0
            ? summary.gateBlockers[0]!
            : summary.nextVerdict
              ? "Everything the next stage needs is in place — it'll settle the next time you save a change in any room."
              : "You're at the top — multiple wins, losses analyzed, and the handoff kit composed.";
    // "You're {label}." reads wrong for the base verdict ("You are the
    // system"), so compose a grammatical headline per verdict.
    const isBase = summary.verdict === "you_are_the_system";
    return {
        verdictLabel: summary.verdictLabel,
        headlinePre: isBase ? "Right now," : "You're",
        headlineEm: isBase ? "you're the system" : summary.verdictLabel,
        gates,
        nextStage
    };
}

// ─── The standing row — each part is a door ────────────────────────────

export type StandTone = "bad" | "warn" | "" | "good";

export interface StandItem {
    readonly key: string;
    readonly value: string;
    readonly sub: string;
    readonly tone: StandTone;
    readonly href: string;
}

interface StorageLike {
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function readJson<T>(store: StorageLike | null, key: string): T | null {
    if (!store) return null;
    try {
        const raw = store.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function money(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

function door(path: string): string {
    return `${path}?returnTo=%2Fdashboard%2F&returnLabel=Dashboard&fromMode=room&fromSurface=dashboard`;
}

interface DealHealth {
    readonly pipeline_value?: number;
    readonly top_pressure?: ReadonlyArray<{
        readonly title?: string;
        readonly name?: string;
        readonly cause?: string;
        readonly meta?: ReadonlyArray<string>;
    }>;
}
interface SignalHealth {
    readonly topName?: string;
    readonly topHeat?: number;
    readonly readyCount?: number;
}
interface QuotaTargets {
    readonly onPace?: boolean;
    readonly behind?: boolean;
    readonly coverageOk?: boolean;
}
interface FoundingHealth {
    readonly readyCount?: number;
    readonly ready?: number;
}

/** The 5 standing doors, derived defensively from the health snapshots. */
export function buildStanding(s?: StorageLike | null): ReadonlyArray<StandItem> {
    const store = getStorage(s);
    const deal = readJson<DealHealth>(store, "gtmos_deal_workspace_health") ?? {};
    const signal = readJson<SignalHealth>(store, "gtmos_signal_room_health") ?? {};
    const quota = readJson<QuotaTargets>(store, "gtmos_quota_targets") ?? {};
    const founding = readJson<FoundingHealth>(store, "gtmos_founding_gtm_health") ?? {};

    const pressure = Array.isArray(deal.top_pressure) ? deal.top_pressure : [];
    const slipN = pressure.length;
    const pipeline = typeof deal.pipeline_value === "number" ? deal.pipeline_value : 0;

    const worst = pressure[0];
    const worstName = worst?.title ?? worst?.name ?? null;
    const worstDays =
        (worst?.meta ?? [])
            .map((m: string) => m.match(/(\d+)\s*d/i)?.[1])
            .find(Boolean) ?? null;

    const handoffReady =
        typeof founding.readyCount === "number"
            ? founding.readyCount
            : typeof founding.ready === "number"
              ? founding.ready
              : 0;

    const behind = quota.behind === true || quota.onPace === false || quota.coverageOk === false;

    return [
        {
            key: "Deals",
            value: slipN > 0 ? `${slipN} will slip` : "Holding",
            sub: slipN > 0 && pipeline > 0 ? `${money(pipeline)} of pipeline this week` : "pipeline is steady",
            tone: slipN > 0 ? "bad" : "good",
            href: door("/deal-workspace/")
        },
        {
            key: "Hottest",
            value: signal.topName ? `${signal.topName}${signal.topHeat != null ? ` · ${signal.topHeat}` : ""}` : "None yet",
            sub: signal.readyCount ? `${signal.readyCount} accounts ready to reach` : "no hot accounts yet",
            tone: "",
            href: door("/signal-console/")
        },
        {
            key: "Pace",
            value: Object.keys(quota).length === 0 ? "Not set" : behind ? "Behind" : "On pace",
            sub: Object.keys(quota).length === 0 ? "set your number" : behind ? "not enough pipeline yet" : "pipeline covers the number",
            tone: Object.keys(quota).length === 0 ? "warn" : behind ? "warn" : "good",
            href: door("/quota-workback/")
        },
        {
            key: "Dying",
            value: worstName ? `${worstName}${worstDays ? ` · ${worstDays}d` : ""}` : "None",
            sub: worstName ? "your worst open deal" : "nothing critical",
            tone: worstName ? "bad" : "good",
            href: door("/future-autopsy/")
        },
        {
            key: "Handoff",
            value: `${handoffReady} / 7`,
            sub: "a hire could inherit",
            tone: handoffReady >= 5 ? "good" : "warn",
            href: door("/founding-gtm/")
        }
    ];
}
