import type {
    ActiveDealsStateBody,
    HydratedContext,
    ICPStudioStateBody,
    ModuleHealth,
    ModuleName,
    ModuleReadResult,
    ModuleStateContract,
    PainTag
} from "./contracts";
import { CONTRACT_SCHEMA_VERSION } from "./contracts";
import {
    getActiveDealsState,
    getAssetBuilderState,
    getBehavioralFeedbackState,
    getCallPlannerState,
    getDiscoveryStudioState,
    getIcpStudioState,
    getOutboundStudioState,
    getVoiceDocumentState,
    getWatchlistTriggersState
} from "./adapters";

/**
 * Briefing — Context Hydration (Stage 3.0 of the Recipe Layer).
 *
 * Calls every adapter, catches per-adapter errors, produces a single
 * `HydratedContext` the pipeline pins for the duration of one run.
 *
 * Discipline:
 *   - No adapter can fail the hydration. Errors degrade that
 *     module's slot to null; everything else proceeds.
 *   - Reads are synchronous. The Recipe Layer assumes the entire
 *     hydration completes in <100ms with localStorage-backed reads
 *     and <500ms in the worst case.
 *   - Health is named, not hidden. The `modules_read[]` slice
 *     records what each adapter returned (or threw) so the Briefing
 *     can surface "Discovery Studio state unavailable — relevance
 *     scoring may be less accurate" banners when needed.
 *
 * The aggregator below has no opinion on what to DO with the
 * hydrated context. That's the pipeline's job (B.1+).
 */

interface AdapterEntry {
    readonly module: ModuleName;
    readonly contextKey: keyof Omit<
        HydratedContext,
        | "context_id"
        | "user_id"
        | "hydrated_at"
        | "modules_read"
        | "watchlist_companies"
        | "pain_lib"
    >;
    readonly getter: () => ModuleStateContract<unknown>;
}

const ADAPTERS: ReadonlyArray<AdapterEntry> = [
    { module: "icp_studio", contextKey: "icp", getter: getIcpStudioState },
    {
        module: "discovery_studio",
        contextKey: "discovery",
        getter: getDiscoveryStudioState
    },
    {
        module: "call_planner",
        contextKey: "call_planner",
        getter: getCallPlannerState
    },
    {
        module: "outbound_studio",
        contextKey: "outbound",
        getter: getOutboundStudioState
    },
    {
        module: "asset_builder",
        contextKey: "asset_builder",
        getter: getAssetBuilderState
    },
    {
        module: "active_deals",
        contextKey: "active_deals",
        getter: getActiveDealsState
    },
    {
        module: "watchlist_triggers",
        contextKey: "watchlist_triggers",
        getter: getWatchlistTriggersState
    },
    {
        module: "voice_document",
        contextKey: "voice_document",
        getter: getVoiceDocumentState
    },
    {
        module: "behavioral_feedback",
        contextKey: "behavioral_feedback",
        getter: getBehavioralFeedbackState
    }
];

export interface HydrateOptions {
    /** Caller-provided context id. Defaults to a random uuid-shaped string. */
    readonly contextId?: string;
    /** Forward-compat — beta is single-operator. Defaults to "default". */
    readonly userId?: string;
    /** Caller-provided timestamp source (test-injectable). */
    readonly now?: () => Date;
    /** Caller-provided high-res clock (test-injectable). */
    readonly perfNow?: () => number;
    /**
     * Caller-provided pain library. Defaults to empty — the global
     * registry lands in B.2 alongside the first synthesis.
     */
    readonly painLib?: ReadonlyArray<PainTag>;
}

/**
 * Drive every adapter, assemble the HydratedContext, return.
 *
 * Synchronous and side-effect-free. Never throws.
 */
export function hydrateContext(
    options: HydrateOptions = {}
): HydratedContext {
    const now = options.now ?? (() => new Date());
    const perfNow = options.perfNow ?? defaultPerfNow;
    const contextId = options.contextId ?? generateContextId();
    const hydratedAt = now().toISOString();

    const modulesRead: ModuleReadResult[] = [];
    const slots: Partial<
        Record<AdapterEntry["contextKey"], unknown>
    > = {};

    for (const entry of ADAPTERS) {
        const result = driveAdapter(entry, now, perfNow);
        modulesRead.push(result);

        if (result.health === "ok" || result.health === "degraded") {
            // The cast is safe because the slot's key narrows to the
            // adapter's own contextKey at the type level above. Runtime
            // shape conformance is the adapter's contract.
            slots[entry.contextKey] = result.body;
        } else {
            slots[entry.contextKey] = null;
        }
    }

    const watchlistCompanies = deriveWatchlistCompanies(
        (slots.active_deals as ActiveDealsStateBody | null) ?? null,
        (slots.icp as ICPStudioStateBody | null) ?? null
    );

    return {
        context_id: contextId,
        user_id: options.userId ?? "default",
        hydrated_at: hydratedAt,
        modules_read: modulesRead,
        icp: (slots.icp as ICPStudioStateBody | null) ?? null,
        discovery:
            (slots.discovery as HydratedContext["discovery"]) ?? null,
        call_planner:
            (slots.call_planner as HydratedContext["call_planner"]) ?? null,
        outbound: (slots.outbound as HydratedContext["outbound"]) ?? null,
        asset_builder:
            (slots.asset_builder as HydratedContext["asset_builder"]) ?? null,
        active_deals:
            (slots.active_deals as HydratedContext["active_deals"]) ?? null,
        watchlist_triggers:
            (slots.watchlist_triggers as HydratedContext["watchlist_triggers"]) ??
            null,
        voice_document:
            (slots.voice_document as HydratedContext["voice_document"]) ?? null,
        behavioral_feedback:
            (slots.behavioral_feedback as HydratedContext["behavioral_feedback"]) ??
            null,
        watchlist_companies: watchlistCompanies,
        pain_lib: options.painLib ?? []
    };
}

// ─── Internals ─────────────────────────────────────────────────

interface DriveResult extends ModuleReadResult {
    /** State body when health is ok / degraded; null otherwise. */
    readonly body: unknown;
}

function driveAdapter(
    entry: AdapterEntry,
    now: () => Date,
    perfNow: () => number
): DriveResult {
    const readAt = now().toISOString();
    const t0 = perfNow();

    try {
        const contract = entry.getter();
        const health: ModuleHealth = normalizeHealth(contract.health);
        return {
            module: entry.module,
            read_at: readAt,
            health,
            schema_version: contract.schema_version ?? CONTRACT_SCHEMA_VERSION,
            last_modified_at: contract.last_modified_at ?? null,
            read_duration_ms: Math.max(0, Math.round(perfNow() - t0)),
            error_message: null,
            body:
                health === "ok" || health === "degraded"
                    ? contract.state
                    : null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            module: entry.module,
            read_at: readAt,
            health: "error",
            schema_version: CONTRACT_SCHEMA_VERSION,
            last_modified_at: null,
            read_duration_ms: Math.max(0, Math.round(perfNow() - t0)),
            error_message: message,
            body: null
        };
    }
}

function normalizeHealth(value: unknown): ModuleHealth {
    if (
        value === "ok" ||
        value === "degraded" ||
        value === "uninitialized" ||
        value === "error"
    ) {
        return value;
    }
    return "error";
}

function deriveWatchlistCompanies(
    deals: ActiveDealsStateBody | null,
    icp: ICPStudioStateBody | null
): ReadonlyArray<string> {
    const set = new Set<string>();
    if (deals) {
        for (const deal of deals.deals) {
            for (const competitor of deal.competitive_set) {
                const trimmed = competitor.trim();
                if (trimmed.length > 0) set.add(trimmed);
            }
            const name = deal.account_name.trim();
            if (name.length > 0) set.add(name);
        }
    }
    if (icp) {
        for (const industry of icp.target_industries) {
            const trimmed = industry.trim();
            if (trimmed.length > 0) set.add(trimmed);
        }
    }
    return Array.from(set);
}

function defaultPerfNow(): number {
    if (typeof performance !== "undefined" && performance.now) {
        return performance.now();
    }
    return Date.now();
}

function generateContextId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return `ctx_${crypto.randomUUID()}`;
    }
    // Fallback for environments without crypto.randomUUID
    return `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
