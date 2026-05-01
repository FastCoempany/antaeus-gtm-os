import type { ReadinessInput } from "@/lib/readiness";
import { EMPTY_READINESS_INPUT } from "@/lib/readiness";

/**
 * Readiness input aggregator.
 *
 * The Dashboard does not own data. It reads localStorage mirrors that
 * the cloud-synced rooms write on every change. (PR #43 closed every
 * cloud-sync gap, so every legacy `gtmos_*` key is now mirrored from
 * the canonical Supabase row, not the other way around.)
 *
 * Pure — accepts a storage-like object so tests can inject fixtures.
 * Defensive — every key may be missing, malformed, or shaped from a
 * legacy version. Never throws.
 *
 * Sources (per CLAUDE.md §6 cross-room compounding):
 *   gtmos_icp_analytics       — ICP Studio
 *   gtmos_ta_accounts         — Territory Architect
 *   gtmos_sw_prospects        — Sourcing Workbench
 *   gtmos_sc_v4               — Signal Console (accounts + heat)
 *   gtmos_outbound_touches    — Outbound Studio
 *   gtmos_cold_call_log       — Cold Call Studio
 *   gtmos_linkedin_log        — LinkedIn Playbook
 *   gtmos_discovery_agenda    — Call Planner
 *   gtmos_discovery_stats     — Cold Call + Call Planner aggregate
 *   gtmos_deal_workspaces     — Deal Workspace
 *   gtmos_poc_data            — PoC Framework
 *   gtmos_autopsy_log_v1      — Future Autopsy
 *   gtmos_advisor_deployments — Advisor Deploy
 *
 * Founding GTM section count is plumbed in once the §4.19 rebuild
 * lands. Until then, handoffSectionsReady = 0.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

function parseJson(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

/** Pull `arr` from `obj.arr` or return `obj` if it's already an array. */
function maybeArrayWithKey(
    obj: Record<string, unknown> | null,
    key: string
): ReadonlyArray<unknown> {
    if (!obj) return [];
    return asArray(obj[key]);
}

// ─── Per-source readers ────────────────────────────────────────────────

function readIcpAnalytics(
    storage: StorageLike
): { count: number; bestQuality: number } {
    const root = asObject(parseJson(storage.getItem("gtmos_icp_analytics")));
    const icps = maybeArrayWithKey(root, "icps");
    let bestQuality = 0;
    icps.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        const q = asNumber(o.qualityScore);
        if (q > bestQuality) bestQuality = q;
    });
    return { count: icps.length, bestQuality };
}

function readTerritoryAccounts(storage: StorageLike): number {
    const arr = asArray(parseJson(storage.getItem("gtmos_ta_accounts")));
    return arr.length;
}

function readProspectsReady(storage: StorageLike): number {
    const arr = asArray(parseJson(storage.getItem("gtmos_sw_prospects")));
    let count = 0;
    arr.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        const stage = asString(o.stage);
        if (stage === "ready" || stage === "pushed") count += 1;
    });
    return count;
}

function readSignalConsole(
    storage: StorageLike
): { withHeat: number; hot: number } {
    const root = asObject(parseJson(storage.getItem("gtmos_sc_v4")));
    const accounts = maybeArrayWithKey(root, "accounts");
    let withHeat = 0;
    let hot = 0;
    accounts.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        const heat = "heat" in o ? asNumber(o.heat) : asNumber(o["_heat"]);
        if (heat >= 50) withHeat += 1;
        if (heat >= 75) hot += 1;
    });
    return { withHeat, hot };
}

function readOutboundTouches(
    storage: StorageLike
): { touchCount: number; distinctAccounts: number } {
    const root = asObject(parseJson(storage.getItem("gtmos_outbound_touches")));
    const touches = maybeArrayWithKey(root, "touches");
    const seen = new Set<string>();
    touches.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        const name = asString(o.accountName).trim().toLowerCase();
        if (name) seen.add(name);
    });
    return { touchCount: touches.length, distinctAccounts: seen.size };
}

function readColdCalls(storage: StorageLike): number {
    const root = asObject(parseJson(storage.getItem("gtmos_cold_call_log")));
    return maybeArrayWithKey(root, "calls").length;
}

function readLinkedinCues(storage: StorageLike): number {
    const root = asObject(parseJson(storage.getItem("gtmos_linkedin_log")));
    return maybeArrayWithKey(root, "actions").length;
}

function readCallPlanner(storage: StorageLike): number {
    const arr = asArray(parseJson(storage.getItem("gtmos_discovery_agenda")));
    return arr.length;
}

function readDiscoveryStats(
    storage: StorageLike
): { advancedCalls: number; sessions: number } {
    const obj = asObject(parseJson(storage.getItem("gtmos_discovery_stats")));
    return {
        advancedCalls: asNumber(obj?.advancedCalls),
        sessions: asNumber(obj?.totalCalls)
    };
}

function readDeals(storage: StorageLike): {
    active: number;
    withNextStep: number;
    closedWon: number;
    closedLostAnalyzed: number;
} {
    const arr = asArray(parseJson(storage.getItem("gtmos_deal_workspaces")));
    let active = 0;
    let withNextStep = 0;
    let closedWon = 0;
    let closedLostAnalyzed = 0;
    arr.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        const stage = asString(o.stage).toLowerCase();
        const isClosed = stage === "closed-won" || stage === "closed-lost";
        if (!isClosed) {
            active += 1;
            const ns = asString(o.nextStep).trim();
            if (ns.length > 0) withNextStep += 1;
        } else if (stage === "closed-won") {
            closedWon += 1;
        } else if (stage === "closed-lost") {
            const reason = asString(o.lossReason).trim();
            if (reason.length > 0) closedLostAnalyzed += 1;
        }
    });
    return { active, withNextStep, closedWon, closedLostAnalyzed };
}

function readProofs(storage: StorageLike): number {
    const arr = asArray(parseJson(storage.getItem("gtmos_poc_data")));
    let castCount = 0;
    arr.forEach((raw) => {
        const o = asObject(raw);
        if (!o) return;
        // A "cast" proof is one with at least one heat dimension > 0
        // OR a non-blank outcome — i.e. not just an open draft.
        const outcome = asString(o.outcome).trim();
        if (outcome && outcome !== "open") {
            castCount += 1;
            return;
        }
        const heat = asObject(o.heat);
        if (heat) {
            const sum =
                asNumber(heat.claim) +
                asNumber(heat.owner) +
                asNumber(heat.kill);
            if (sum > 0) castCount += 1;
        }
    });
    return castCount;
}

function readAutopsies(storage: StorageLike): number {
    const root = asObject(parseJson(storage.getItem("gtmos_autopsy_log_v1")));
    if (!root) return 0;
    // Shape is { dealId: { taskId: true } } from the Future Autopsy room.
    return Object.keys(root).length;
}

function readAdvisorDeployments(storage: StorageLike): number {
    const root = asObject(
        parseJson(storage.getItem("gtmos_advisor_deployments"))
    );
    return maybeArrayWithKey(root, "deployments").length;
}

function readHandoffSectionsReady(storage: StorageLike): number {
    // Pending the Founding GTM rebuild (Phase 5.B). Once §4.19 lands,
    // it will publish a count to a known key — likely
    // `gtmos_founding_gtm_health.sections_ready` — and this reader
    // will be updated.
    const obj = asObject(parseJson(storage.getItem("gtmos_founding_gtm_health")));
    const n = asNumber(obj?.sections_ready);
    return Math.max(0, Math.min(7, n));
}

// ─── Public aggregator ─────────────────────────────────────────────────

export interface AggregateOptions {
    readonly storage?: StorageLike;
}

export function aggregateReadinessInput(
    options: AggregateOptions = {}
): ReadinessInput {
    const storage =
        options.storage ??
        (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return EMPTY_READINESS_INPUT;

    const icp = readIcpAnalytics(storage);
    const sc = readSignalConsole(storage);
    const ob = readOutboundTouches(storage);
    const ds = readDiscoveryStats(storage);
    const deals = readDeals(storage);

    return {
        icpCount: icp.count,
        bestIcpQualityScore: icp.bestQuality,
        territoryAccountCount: readTerritoryAccounts(storage),
        sourcingProspectsReady: readProspectsReady(storage),
        accountsWithHeat: sc.withHeat,
        hotAccounts: sc.hot,
        outboundTouches: ob.touchCount,
        coldCallsLogged: readColdCalls(storage),
        linkedinCues: readLinkedinCues(storage),
        distinctAccountsTouched: ob.distinctAccounts,
        callPlannerSessions: readCallPlanner(storage),
        discoveryAdvancedCalls: ds.advancedCalls,
        discoveryStudioSessions: ds.sessions,
        activeDeals: deals.active,
        dealsWithNextStep: deals.withNextStep,
        closedWonDeals: deals.closedWon,
        closedLostDealsAnalyzed: deals.closedLostAnalyzed,
        castProofs: readProofs(storage),
        futureAutopsiesRun: readAutopsies(storage),
        advisorDeployments: readAdvisorDeployments(storage),
        handoffSectionsReady: readHandoffSectionsReady(storage)
    };
}
