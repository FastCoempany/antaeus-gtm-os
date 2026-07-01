import { reportError } from "@/lib/observability";
import { roomStage, type SeedingDraft } from "../draft";
import type { EnrichedAccount } from "./enrichment";

/**
 * Seed writer (ADR-019, slice 7). At the landing, the draft is written
 * into the living rooms via the same `gtmos_*` shapes the existing
 * `seedFromDraft` uses (Signal Console, ICP Studio, Deal Workspace,
 * Quota Workback, the activation context, the completion marker) — just
 * richer: the full account list, the live deals. The rooms read these on
 * boot, so the operator lands on a Dashboard that's already alive.
 */

interface StorageLike {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function trySet(store: StorageLike, key: string, value: string): void {
    try {
        store.setItem(key, value);
    } catch (err) {
        reportError(err, { op: "seeding.write", key });
    }
}

function readJson<T = unknown>(store: StorageLike, key: string): T | null {
    try {
        const raw = store.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function uid(prefix: string, now: number, i: number): string {
    return `${prefix}_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`;
}

export interface SeedWriteResult {
    readonly seeded: boolean;
    readonly icps: number;
    readonly accounts: number;
    readonly deals: number;
}

export function writeSeedingDraft(
    draft: SeedingDraft,
    enriched: ReadonlyArray<EnrichedAccount>,
    options: { readonly now?: number; readonly storage?: StorageLike | null } = {}
): SeedWriteResult {
    const store = getStorage(options.storage);
    if (!store) return { seeded: false, icps: 0, accounts: 0, deals: 0 };
    const now = options.now ?? Date.now();
    const iso = new Date(now).toISOString();

    // ── ICP ──────────────────────────────────────────────────────────
    if (draft.icpStatement.trim()) {
        const id = uid("icp", now, 0);
        const icp = {
            id,
            name: draft.icpStatement.trim(),
            statement: draft.icpStatement.trim(),
            pain: "",
            qualityScore: 78,
            qualityBand: "ready",
            createdAt: iso,
            updatedAt: iso,
            source: "seeding-v1"
        };
        const existing = readJson<Record<string, unknown>>(store, "gtmos_icp_analytics");
        const existingIcps = Array.isArray(existing?.["icps"]) ? (existing!["icps"] as unknown[]) : [];
        trySet(
            store,
            "gtmos_icp_analytics",
            JSON.stringify({ ...(existing ?? {}), icps: [...existingIcps, icp], updatedAt: iso })
        );
    }

    // ── Accounts (the full list, enriched) ───────────────────────────
    const accounts = (enriched.length > 0
        ? enriched
        : draft.accountNames.map((name) => ({ name, signal: "", heat: 40, cold: false }))
    ).map((a, i) => ({
        id: uid("acc", now, i),
        name: a.name,
        ticker: "",
        industry: "",
        tier: "tier-2",
        heat: a.heat,
        employees: null,
        hq: "",
        signals: a.signal
            ? [
                  {
                      id: uid("sig", now, i),
                      headline: a.signal,
                      confidence: 0.7,
                      published_date: iso,
                      fetched_at: iso,
                      ai: true,
                      status: "active"
                  }
              ]
            : [],
        source: "seeding-v1",
        capturedAt: iso
    }));
    if (accounts.length > 0) {
        const existing = readJson<Record<string, unknown>>(store, "gtmos_sc_v4");
        const existingAccts = Array.isArray(existing?.["accounts"]) ? (existing!["accounts"] as unknown[]) : [];
        const names = new Set(accounts.map((a) => a.name.toLowerCase()));
        const kept = existingAccts.filter((x) => {
            const n = typeof (x as Record<string, unknown>)?.["name"] === "string" ? ((x as Record<string, unknown>)["name"] as string) : "";
            return !names.has(n.toLowerCase());
        });
        trySet(store, "gtmos_sc_v4", JSON.stringify({ ...(existing ?? {}), accounts: [...kept, ...accounts], updatedAt: iso }));

        // Health snapshot so the Dashboard ranks the hot accounts on boot.
        const sorted = [...accounts].sort((a, b) => b.heat - a.heat);
        const top = sorted[0]!;
        trySet(
            store,
            "gtmos_signal_room_health",
            JSON.stringify({
                capturedAt: iso,
                accountCount: accounts.length,
                signalCount: accounts.reduce((n, a) => n + a.signals.length, 0),
                readyCount: accounts.filter((a) => a.heat >= 75).length,
                topName: top.name,
                topHeat: top.heat,
                hot_accounts: sorted.slice(0, 8).map((a) => ({
                    id: a.id,
                    name: a.name,
                    heat: a.heat,
                    recentSignals: a.signals.length,
                    highConfidenceSignals: 0
                }))
            })
        );
    }

    // ── Live deals → Deal Workspace ──────────────────────────────────
    if (draft.deals.length > 0) {
        const deals = draft.deals.map((d, i) => ({
            id: uid("deal", now, i),
            accountName: d.account,
            value: d.value,
            stage: roomStage(d.stage),
            champion: d.champion,
            economicBuyer: d.whoSigns,
            useCase: "",
            pain: "",
            competition: "",
            decisionProcess: "",
            notes: d.stuck,
            nextStep: "",
            nextStepDate: "",
            momentum: "flat",
            forecast: "pipeline",
            createdAt: iso,
            source: "seeding-v1"
        }));
        const existing = readJson<unknown>(store, "gtmos_deal_workspaces");
        const existingDeals = Array.isArray(existing)
            ? existing
            : Array.isArray((existing as Record<string, unknown>)?.["deals"])
              ? ((existing as Record<string, unknown>)["deals"] as unknown[])
              : [];
        trySet(store, "gtmos_deal_workspaces", JSON.stringify([...existingDeals, ...deals]));
    }

    // ── Quota → Quota Workback + outbound seed ───────────────────────
    if (draft.annualQuota > 0) {
        const acv = draft.avgDeal > 0 ? draft.avgDeal : 50_000;
        trySet(
            store,
            "gtmos_qw_inputs",
            JSON.stringify({
                quota: draft.annualQuota,
                acv,
                win: draft.winRate || 22,
                m2o: 35,
                t2m: 0.7,
                show: 80,
                days: 20,
                tpa: 8,
                cycle: draft.cycleDays || 90
            })
        );
        trySet(
            store,
            "gtmos_outbound_seed",
            JSON.stringify({
                annual_quota: draft.annualQuota,
                avg_deal_size: acv,
                win_rate: draft.winRate || 22,
                cycle_days: draft.cycleDays || 90,
                coverage_target: 3.5
            })
        );
    }

    // ── Activation context + completion marker ───────────────────────
    trySet(
        store,
        "gtmos_activation_context",
        JSON.stringify({
            company: null,
            stageLabel: "Activating the workspace",
            seededAt: iso,
            source: "seeding-v1"
        })
    );
    trySet(
        store,
        "gtmos_onboarding",
        JSON.stringify({ completed: true, completedAt: iso, source: "seeding-v1" })
    );
    trySet(store, "gtmos_onboarding_completed_at", iso);

    // A freshly-seeded workspace opens on Brief — the calm morning read —
    // never on Triage (Queue). Reset the persisted command mode so a
    // leftover "queue" from an earlier session can't drop a new operator
    // into the dense triage list on their first morning.
    trySet(store, "gtmos_dashboard_command_mode", "brief");

    return {
        seeded: true,
        icps: draft.icpStatement.trim() ? 1 : 0,
        accounts: accounts.length,
        deals: draft.deals.length
    };
}
