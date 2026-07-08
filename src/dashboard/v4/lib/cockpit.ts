import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { VERDICT_RANK } from "@/lib/readiness";
import { t } from "@/lib/voice/t";

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
    t("You are the system"),
    t("Building"),
    t("Inheritable"),
    t("Hire-ready"),
    t("Repeatable")
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
    // gateBlockers are engine strings (already t()-wrapped + §13-scrubbed
    // at the source in verdict.ts); the fallbacks are local prose.
    const nextStage =
        summary.gateBlockers && summary.gateBlockers.length > 0
            ? summary.gateBlockers[0]!
            : summary.nextVerdict
              ? t("Everything the next stage needs is in place — it'll settle the next time you save a change in any room.", { class: "body" })
              : t("You're at the top — multiple wins, losses analyzed, and the handoff kit composed.", { class: "body" });
    // "You're {label}." reads wrong for the base verdict ("You are the
    // system"), so compose a grammatical headline per verdict.
    const isBase = summary.verdict === "you_are_the_system";
    return {
        verdictLabel: summary.verdictLabel,
        headlinePre: isBase ? t("Right now,") : t("You're"),
        headlineEm: isBase ? t("you're the system") : summary.verdictLabel,
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

// Shapes MATCH the shipped publishers (verified against the health-
// snapshot / persistence sources — not guessed):
//   gtmos_deal_workspace_health  → pipeline_value, top_pressure[{accountName,stage,score,cause}]
//   gtmos_signal_room_health     → topAccountName, topHeat, readyCount
//   gtmos_quota_targets          → monthly_target, coverage_target
//   gtmos_founding_gtm_health    → sections_ready
interface DealHealth {
    readonly pipeline_value?: number;
    readonly top_pressure?: ReadonlyArray<{
        readonly accountName?: string;
        readonly stage?: string;
        readonly score?: number;
        readonly cause?: string;
    }>;
}
interface SignalHealth {
    readonly topAccountName?: string;
    readonly topHeat?: number;
    readonly readyCount?: number;
}
interface QuotaTargets {
    readonly monthly_target?: number;
    readonly coverage_target?: number;
}
interface FoundingHealth {
    readonly sections_ready?: number;
}

/** The 5 standing doors, derived defensively from the shipped health snapshots. */
export function buildStanding(s?: StorageLike | null): ReadonlyArray<StandItem> {
    const store = getStorage(s);
    const deal = readJson<DealHealth>(store, "gtmos_deal_workspace_health") ?? {};
    const signal = readJson<SignalHealth>(store, "gtmos_signal_room_health") ?? {};
    const quota = readJson<QuotaTargets>(store, "gtmos_quota_targets") ?? {};
    const founding = readJson<FoundingHealth>(store, "gtmos_founding_gtm_health") ?? {};

    const pressure = Array.isArray(deal.top_pressure) ? deal.top_pressure : [];
    const slipN = pressure.length;
    const pipeline = typeof deal.pipeline_value === "number" ? deal.pipeline_value : 0;

    // Worst deal = the top-pressure row's real accountName; pull a day
    // count out of its cause text if one is there (the snapshot carries
    // no explicit days field).
    const worst = pressure[0];
    const worstName =
        worst && typeof worst.accountName === "string" && worst.accountName.trim()
            ? worst.accountName.trim()
            : null;
    const worstDays = worst?.cause?.match(/(\d+)\s*d(?:ays?)?\b/i)?.[1] ?? null;

    const handoffReady =
        typeof founding.sections_ready === "number" ? founding.sections_ready : 0;

    // Pace "behind" is a REAL coverage check: is open pipeline below the
    // number × the coverage multiple? Only judged when a quota is set;
    // never claims "on pace" on an empty quota.
    const hasQuota = typeof quota.monthly_target === "number" && quota.monthly_target > 0;
    const coverageNeeded = hasQuota
        ? quota.monthly_target! * (typeof quota.coverage_target === "number" && quota.coverage_target > 0 ? quota.coverage_target : 3)
        : 0;
    const behind = hasQuota && pipeline < coverageNeeded;

    const hotName =
        typeof signal.topAccountName === "string" && signal.topAccountName.trim()
            ? signal.topAccountName.trim()
            : null;
    const ready = typeof signal.readyCount === "number" ? signal.readyCount : 0;

    return [
        {
            key: t("Deals"),
            value: slipN > 0 ? `${slipN} ${t("will slip")}` : t("Holding"),
            sub:
                slipN > 0 && pipeline > 0
                    ? `${money(pipeline)} ${t("of pipeline this week")}`
                    : t("pipeline is steady"),
            tone: slipN > 0 ? "bad" : "good",
            href: door("/deal-workspace/")
        },
        {
            key: t("Hottest"),
            value: hotName
                ? `${hotName}${typeof signal.topHeat === "number" && signal.topHeat > 0 ? ` · ${signal.topHeat}` : ""}`
                : t("None yet"),
            sub: ready > 0 ? `${ready} ${t("accounts ready to reach")}` : t("no hot accounts yet"),
            tone: "",
            href: door("/signal-console/")
        },
        {
            key: t("Pace"),
            value: !hasQuota ? t("Not set") : behind ? t("Behind") : t("On pace"),
            sub: !hasQuota
                ? t("set your number")
                : behind
                  ? t("not enough pipeline yet")
                  : t("pipeline covers the number"),
            tone: !hasQuota ? "warn" : behind ? "warn" : "good",
            href: door("/quota-workback/")
        },
        {
            key: t("Dying"),
            value: worstName ? `${worstName}${worstDays ? ` · ${worstDays}d` : ""}` : t("None"),
            sub: worstName ? t("your worst open deal") : t("nothing critical"),
            tone: worstName ? "bad" : "good",
            href: door("/future-autopsy/")
        },
        {
            key: t("Handoff"),
            value: `${handoffReady} / 7`,
            sub: t("a hire could inherit"),
            tone: handoffReady >= 5 ? "good" : "warn",
            href: door("/founding-gtm/")
        }
    ];
}
