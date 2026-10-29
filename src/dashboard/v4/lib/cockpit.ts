import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { VERDICT_RANK } from "@/lib/readiness";
import { t } from "@/lib/voice/t";

/**
 * Dashboard status model. Builds the readiness masthead and five status
 * links from the same underlying readiness and room-health data already
 * used by the product. User-facing labels describe the actual business
 * concept rather than a private Antaeus metaphor.
 */

export type GateState = "done" | "on" | "next" | "todo";

export interface Gate {
    readonly label: string;
    readonly state: GateState;
}

const GATE_LABELS: ReadonlyArray<string> = [
    t("Founder-dependent"),
    t("Partially documented"),
    t("Runnable with founder support"),
    t("Runnable independently"),
    t("Documented and repeatable")
];

export interface Masthead {
    readonly verdictLabel: string;
    readonly headlinePre: string;
    readonly headlineEm: string;
    readonly gates: ReadonlyArray<Gate>;
    readonly nextStage: string;
}

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
              ? t("The evidence required for the next readiness state is present. The assessment will update after the next saved workspace change.", { class: "body" })
              : t("The sales process, win and loss patterns, and handoff documentation meet the current highest readiness requirements.", { class: "body" });

    return {
        verdictLabel: summary.verdictLabel,
        headlinePre: t("Current readiness:"),
        headlineEm: summary.verdictLabel,
        gates,
        nextStage
    };
}

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

/** The five status links, derived defensively from shipped health snapshots. */
export function buildStanding(s?: StorageLike | null): ReadonlyArray<StandItem> {
    const store = getStorage(s);
    const deal = readJson<DealHealth>(store, "gtmos_deal_workspace_health") ?? {};
    const signal = readJson<SignalHealth>(store, "gtmos_signal_room_health") ?? {};
    const quota = readJson<QuotaTargets>(store, "gtmos_quota_targets") ?? {};
    const founding = readJson<FoundingHealth>(store, "gtmos_founding_gtm_health") ?? {};

    const pressure = Array.isArray(deal.top_pressure) ? deal.top_pressure : [];
    const riskN = pressure.length;
    const pipeline = typeof deal.pipeline_value === "number" ? deal.pipeline_value : 0;

    const worst = pressure[0];
    const worstName =
        worst && typeof worst.accountName === "string" && worst.accountName.trim()
            ? worst.accountName.trim()
            : null;
    const worstDays = worst?.cause?.match(/(\d+)\s*d(?:ays?)?\b/i)?.[1] ?? null;

    const handoffReady =
        typeof founding.sections_ready === "number" ? founding.sections_ready : 0;

    const hasQuota = typeof quota.monthly_target === "number" && quota.monthly_target > 0;
    const coverageNeeded = hasQuota
        ? quota.monthly_target! * (typeof quota.coverage_target === "number" && quota.coverage_target > 0 ? quota.coverage_target : 3)
        : 0;
    const behind = hasQuota && pipeline < coverageNeeded;

    const priorityName =
        typeof signal.topAccountName === "string" && signal.topAccountName.trim()
            ? signal.topAccountName.trim()
            : null;
    const ready = typeof signal.readyCount === "number" ? signal.readyCount : 0;

    return [
        {
            key: t("Open deal risk"),
            value: riskN > 0 ? `${riskN} ${t("at elevated risk")}` : t("No elevated risk"),
            sub:
                pipeline > 0
                    ? `${t("open pipeline:")} ${money(pipeline)}`
                    : t("no open pipeline recorded"),
            tone: riskN > 0 ? "bad" : "good",
            href: door("/deal-workspace/")
        },
        {
            key: t("Account priority"),
            value: priorityName
                ? `${priorityName}${typeof signal.topHeat === "number" && signal.topHeat > 0 ? ` · ${signal.topHeat}` : ""}`
                : t("None yet"),
            sub: ready > 0 ? `${ready} ${t("accounts ready for outreach")}` : t("no high-priority accounts yet"),
            tone: "",
            href: door("/signal-console/")
        },
        {
            key: t("Quota pace"),
            value: !hasQuota ? t("Not set") : behind ? t("Below required pace") : t("On pace"),
            sub: !hasQuota
                ? t("set your target")
                : behind
                  ? t("pipeline is below the coverage requirement")
                  : t("pipeline meets the coverage requirement"),
            tone: !hasQuota ? "warn" : behind ? "warn" : "good",
            href: door("/quota-workback/")
        },
        {
            key: t("Highest deal risk"),
            value: worstName ? `${worstName}${worstDays ? ` · ${worstDays}d` : ""}` : t("None"),
            sub: worstName ? t("highest-risk open deal") : t("no critical deal risk detected"),
            tone: worstName ? "bad" : "good",
            href: door("/future-autopsy/")
        },
        {
            key: t("Sales handoff"),
            value: `${handoffReady} / 7`,
            sub: t("sections ready for another seller"),
            tone: handoffReady >= 5 ? "good" : "warn",
            href: door("/founding-gtm/")
        }
    ];
}
