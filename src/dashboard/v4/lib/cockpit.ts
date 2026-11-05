import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { VERDICT_RANK } from "@/lib/readiness";
import { t } from "@/lib/voice/t";
import { computeHandoffSectionsReady } from "@/founding-gtm/lib/sections-ready";
import { readLiveSignalRoomHealth } from "@/signal-console/lib/health-snapshot";
import { readCoverageStanding } from "@/quota-workback/lib/coverage";
import { legacyDealToDeal } from "@/deal-workspace/lib/deal-bridge";
import { dealsToHealthSummary } from "@/deal-workspace/lib/health-snapshot";

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
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

function door(path: string): string {
    return `${path}?returnTo=%2Fdashboard%2F&returnLabel=Dashboard&fromMode=room&fromSurface=dashboard`;
}

interface DealHealth {
    readonly pipeline_value?: number;
    readonly critical_count?: number;
    readonly at_risk_count?: number;
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

/**
 * Deal Workspace's health summary computed live from the deal mirror
 * (`gtmos_deal_workspaces`) with Deal Workspace's own summarizer, so
 * "elevated risk" and open pipeline match that room. Null when no deals
 * can be read (the caller then falls back to the published snapshot).
 */
function readLiveDealHealth(store: StorageLike | null): DealHealth | null {
    if (!store) return null;
    try {
        const raw = store.getItem("gtmos_deal_workspaces");
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const rows = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).deals)
              ? ((parsed as Record<string, unknown>).deals as unknown[])
              : null;
        if (!rows || rows.length === 0) return null;
        const deals = rows.map((item, idx) => legacyDealToDeal(item, `legacy_${idx}`));
        return dealsToHealthSummary(deals);
    } catch {
        return null;
    }
}

/** The five status links, derived defensively from shipped health snapshots. */
export function buildStanding(s?: StorageLike | null): ReadonlyArray<StandItem> {
    const store = getStorage(s);
    // Deal risk, account priority and coverage are computed live from the
    // same sources and functions the owning rooms use (Deal Workspace,
    // Signal Console, Quota Workback), so the numbers here always match
    // those rooms. Published snapshots are only fallbacks.
    const deal = (readLiveDealHealth(store) ??
        readJson<DealHealth>(store, "gtmos_deal_workspace_health") ??
        {}) as DealHealth;
    const signal = ((store ? readLiveSignalRoomHealth(store) : null) ??
        readJson<SignalHealth>(store, "gtmos_signal_room_health") ??
        {}) as SignalHealth;
    const quota = readJson<QuotaTargets>(store, "gtmos_quota_targets") ?? {};
    const founding = readJson<FoundingHealth>(store, "gtmos_founding_gtm_health") ?? {};

    const pressure = Array.isArray(deal.top_pressure) ? deal.top_pressure : [];
    // Count of deals outside the lower-risk band — the number Deal
    // Workspace shows ("N deals have elevated risk"). `top_pressure` is
    // only the top five ranked deals, so its length is not a count.
    const riskN =
        typeof deal.critical_count === "number" || typeof deal.at_risk_count === "number"
            ? (deal.critical_count ?? 0) + (deal.at_risk_count ?? 0)
            : pressure.length;
    const pipeline = typeof deal.pipeline_value === "number" ? deal.pipeline_value : 0;

    const worst = pressure[0];
    const worstName =
        worst && typeof worst.accountName === "string" && worst.accountName.trim()
            ? worst.accountName.trim()
            : null;
    const worstDays = worst?.cause?.match(/(\d+)\s*d(?:ays?)?\b/i)?.[1] ?? null;

    // Computed live with the same function the Founding GTM room uses,
    // so the two rooms always show the same "N / 7". The published
    // snapshot is only a fallback for a storage we can't read sections
    // from (it is written only after Founding GTM has been opened).
    let liveHandoff: number | null = null;
    if (store) {
        try {
            liveHandoff = computeHandoffSectionsReady({ storage: store }).ready;
        } catch {
            liveHandoff = null;
        }
    }
    const handoffReady =
        liveHandoff !== null
            ? liveHandoff
            : typeof founding.sections_ready === "number"
              ? founding.sections_ready
              : 0;

    // Same coverage read as the Quota Workback room (stage-weighted open
    // pipeline vs annual target × the ACV-band benchmark).
    const coverage = readCoverageStanding(store);
    const hasQuota =
        coverage.hasQuota ||
        (typeof quota.monthly_target === "number" && quota.monthly_target > 0);
    const behind = coverage.hasQuota
        ? coverage.behind
        : hasQuota &&
          pipeline <
              quota.monthly_target! *
                  (typeof quota.coverage_target === "number" && quota.coverage_target > 0
                      ? quota.coverage_target
                      : 3);

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
            key: t("Pipeline coverage"),
            value: !hasQuota
                ? t("Not set")
                : coverage.hasQuota
                  ? `${coverage.ratio.toFixed(1)}× / ${coverage.targetMultiple}×`
                  : behind
                    ? t("Below benchmark")
                    : t("Meets benchmark"),
            sub: !hasQuota
                ? t("set your target")
                : behind
                  ? t("weighted pipeline is below benchmark")
                  : t("weighted pipeline meets benchmark"),
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
