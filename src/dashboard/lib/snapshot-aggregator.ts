import type {
    CommandEngineInput,
    HealthSummaries,
    RawCommandCard
} from "./types";
import {
    hrefToDealForDeal,
    hrefToFutureAutopsyForDeal,
    hrefToOutboundForAccount,
    hrefToSignalForAccount
} from "./handoff";

/**
 * Wave 5 — workspace-health snapshot aggregator.
 *
 * The Dashboard is a synthesis room: it does not own data. It reads
 * snapshots that publishing rooms write into localStorage:
 *
 *   gtmos_deal_workspace_health   — Phase 4 / Room 1 (Deal Workspace)
 *   gtmos_signal_room_health      — Signal Console (still legacy)
 *   gtmos_readiness_snapshot      — Readiness Score (still legacy)
 *   gtmos_quota_targets           — Quota Workback (still legacy)
 *
 * Cross-bundle communication during the transitional phase IS
 * localStorage — the Dashboard bundle and the Deal Workspace bundle
 * don't share Preact signals across their separate Vite outputs.
 *
 * `storage` events fire on cross-tab updates; for same-tab updates from
 * sibling rooms we re-read on a short interval (10s) while the page
 * is visible. Wave 6 doesn't change this — once every publishing room
 * migrates, we can replace localStorage with Supabase realtime.
 */

const KEY_DEAL_HEALTH = "gtmos_deal_workspace_health";
const KEY_SIGNAL_HEALTH = "gtmos_signal_room_health";
const KEY_READINESS_SNAPSHOT = "gtmos_readiness_snapshot";
const KEY_QUOTA_TARGETS = "gtmos_quota_targets";
const KEY_SHELL_CONTEXT_PREFIX = "gtmos_"; // workspace counts come from many places

const ALL_KEYS: ReadonlyArray<string> = [
    KEY_DEAL_HEALTH,
    KEY_SIGNAL_HEALTH,
    KEY_READINESS_SNAPSHOT,
    KEY_QUOTA_TARGETS
];

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

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

// ─── Card translators ──────────────────────────────────────────────────

interface DealHealthSnapshot {
    readonly active_count?: number;
    readonly pipeline_value?: number;
    readonly critical_count?: number;
    readonly at_risk_count?: number;
    readonly top_pressure?: ReadonlyArray<{
        readonly id?: string;
        readonly accountName?: string;
        readonly stage?: string;
        readonly score?: number;
        readonly cause?: string;
    }>;
}

function dealSnapshotToRiskCards(
    snapshot: DealHealthSnapshot
): RawCommandCard[] {
    const top = asArray(snapshot.top_pressure);
    return top
        .map((entry) => {
            const e = asObject(entry);
            if (!e) return null;
            // The snapshot's top_pressure rows carry the deal's name
            // under either `accountName` (the Phase 4 Deal Workspace
            // snapshot) or `name` (the Phase 2.2 walk seed + the
            // Tuesday-morning hand-seeded shape). Read both, with
            // accountName winning for backward compatibility.
            const rawName = String(e.accountName ?? e.name ?? "").trim();
            if (!rawName) return null;
            // `score` (legacy) and `riskScore` (Phase 2.2 seed) carry
            // the same value; accept either.
            const score = Number(e.score ?? e.riskScore ?? 0);
            const cause = String(e.cause ?? e.causeId ?? "").trim();
            const id = String(e.id ?? "").trim();
            const stage = String(e.stage ?? "").trim();
            const card: RawCommandCard = {
                ...(id ? { id } : {}),
                title: rawName,
                ...(cause ? { subtitle: cause } : {}),
                badge: String(Math.round(score)),
                meta: stage ? [stage] : [],
                // Sarah's hand-reach intent on a risk card is to OPEN
                // the deal at the gate that's broken. Primary action
                // = open the deal. Secondary = pre-mortem in Future
                // Autopsy. Continuity wraps via buildDashboardHref so
                // the destination back-affordance points at Dashboard.
                actions: [
                    {
                        label: "Open the deal",
                        href: hrefToDealForDeal(id, rawName),
                        roomLabel: "Deal Workspace"
                    },
                    {
                        label: "Pre-mortem the deal",
                        href: hrefToFutureAutopsyForDeal(id, rawName),
                        roomLabel: "Future Autopsy"
                    }
                ],
                rankingSignals: {
                    risk: score,
                    causeId: cause
                }
            };
            return card;
        })
        .filter((c): c is RawCommandCard => c !== null);
}

interface SignalRoomSnapshot {
    readonly hot_accounts?: ReadonlyArray<{
        readonly id?: string;
        readonly name?: string;
        readonly heat?: number;
        readonly recentSignals?: number;
        readonly highConfidenceSignals?: number;
        readonly cause?: string;
    }>;
}

function signalSnapshotToMoveCards(
    snapshot: SignalRoomSnapshot
): RawCommandCard[] {
    const top = asArray(snapshot.hot_accounts);
    return top
        .map((entry) => {
            const e = asObject(entry);
            if (!e) return null;
            const name = String(e.name ?? "").trim();
            if (!name) return null;
            const heat = Number(e.heat ?? 0);
            const id = String(e.id ?? "").trim();
            const recentCount = Number(e.recentSignals ?? 0);
            const highConfidenceCount = Number(e.highConfidenceSignals ?? 0);
            const cause = String(e.cause ?? "").trim();
            const card: RawCommandCard = {
                ...(id ? { id } : {}),
                title: `Outbound to ${name}`,
                badge: "Now",
                meta: [`heat ${Math.round(heat)}`],
                // Sarah's hand-reach intent on a "Outbound to X" card
                // is to COMPOSE outbound — so the dominant CTA lands
                // in Outbound Studio with the account already in the
                // operator rack, not in Signal Console where she'd
                // have to re-pick. Continuity wraps via
                // buildDashboardHref. Secondary = look at the live
                // signals that drove the heat in Signal Console.
                actions: [
                    {
                        label: "Compose outbound",
                        href: hrefToOutboundForAccount(name),
                        roomLabel: "Outbound Studio"
                    },
                    {
                        label: "Check the signals",
                        href: hrefToSignalForAccount(name),
                        roomLabel: "Signal Console"
                    }
                ],
                rankingSignals: {
                    heat,
                    recentCount,
                    highConfidenceCount,
                    ...(cause ? { causeId: cause } : {})
                }
            };
            return card;
        })
        .filter((c): c is RawCommandCard => c !== null);
}

// ─── Health summaries ──────────────────────────────────────────────────

function readHealthSummaries(storage: StorageLike): HealthSummaries {
    const deal = parseJson(storage.getItem(KEY_DEAL_HEALTH));
    const signal = parseJson(storage.getItem(KEY_SIGNAL_HEALTH));
    const readiness = parseJson(storage.getItem(KEY_READINESS_SNAPSHOT));
    const quota = parseJson(storage.getItem(KEY_QUOTA_TARGETS));
    return {
        ...(deal ? { deal } : {}),
        ...(signal ? { signal } : {}),
        ...(readiness ? { readiness } : {}),
        ...(quota ? { quota } : {})
    };
}

// ─── Public aggregation ────────────────────────────────────────────────

export interface AggregateOptions {
    readonly storage?: StorageLike;
}

/**
 * Build the CommandEngineInput from the current localStorage state.
 * Pure — accepts a storage-like object so tests can inject fixtures.
 */
export function aggregateEngineInput(
    options: AggregateOptions = {}
): CommandEngineInput {
    const storage =
        options.storage ??
        (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) {
        return { riskCards: [], moveCards: [], healthSummaries: {} };
    }

    const dealHealth = (parseJson(storage.getItem(KEY_DEAL_HEALTH)) ??
        {}) as DealHealthSnapshot;
    const signalHealth = (parseJson(storage.getItem(KEY_SIGNAL_HEALTH)) ??
        {}) as SignalRoomSnapshot;

    const riskCards = dealSnapshotToRiskCards(dealHealth);
    const moveCards = signalSnapshotToMoveCards(signalHealth);

    const summaries = readHealthSummaries(storage);
    const dealSummary = asObject(summaries.deal);
    const dealActive = Number(dealSummary?.active_count ?? 0);

    return {
        riskCards,
        moveCards,
        healthSummaries: summaries,
        shellContext: {
            // Lightweight workspace counts — used by the engine's ICP
            // and system fallbacks. The dashboard reads what's published;
            // unknown counts default to 0 and the engine treats that as
            // "no inputs of that kind."
            deals: dealActive
        }
    };
}

// ─── Subscription loop ─────────────────────────────────────────────────

interface AggregatorHandle {
    readonly stop: () => void;
}

export interface BootOptions {
    readonly intervalMs?: number;
    readonly onUpdate: (input: CommandEngineInput) => void;
}

const DEFAULT_INTERVAL_MS = 10_000;

/**
 * Start the aggregator: read snapshots immediately, listen for storage
 * events (cross-tab), and re-read on an interval (same-tab updates from
 * legacy rooms). Returns a stop() handle for teardown.
 *
 * Visibility-aware: the interval pauses when the page is hidden so we
 * don't burn CPU on a backgrounded tab.
 */
export function bootSnapshotAggregator(options: BootOptions): AggregatorHandle {
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function refresh(): void {
        try {
            options.onUpdate(aggregateEngineInput());
        } catch {
            // never throw out of the loop
        }
    }

    function startInterval(): void {
        if (intervalId !== null) return;
        intervalId = setInterval(refresh, intervalMs);
    }

    function stopInterval(): void {
        if (intervalId === null) return;
        clearInterval(intervalId);
        intervalId = null;
    }

    function onStorage(event: StorageEvent): void {
        if (!event.key) {
            // a clear() — re-read everything
            refresh();
            return;
        }
        if (
            ALL_KEYS.indexOf(event.key) >= 0 ||
            event.key.startsWith(KEY_SHELL_CONTEXT_PREFIX)
        ) {
            refresh();
        }
    }

    function onVisibility(): void {
        if (typeof document === "undefined") return;
        if (document.hidden) {
            stopInterval();
        } else {
            refresh();
            startInterval();
        }
    }

    refresh();
    if (typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
    }
    if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility);
    }
    if (typeof document === "undefined" || !document.hidden) {
        startInterval();
    }

    return {
        stop(): void {
            stopInterval();
            if (typeof window !== "undefined") {
                window.removeEventListener("storage", onStorage);
            }
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", onVisibility);
            }
        }
    };
}
