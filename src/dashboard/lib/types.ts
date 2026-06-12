/**
 * Phase 4 / Room 2 — Dashboard domain types.
 *
 * Per CLAUDE.md §4.2 (Command Chamber family), the Dashboard ranks
 * objects under pressure and surfaces one dominant move per surface.
 * It is a synthesis room: it doesn't own data, it consumes published
 * snapshots from every deep room.
 *
 * The legacy ranking engine (`js/command-intelligence.js`) is being
 * ported to typed code in Wave 2. These types lock the shape Wave 1's
 * scaffold will plug into.
 *
 * The legacy field names are preserved so the legacy callers
 * (still on the old stack until they migrate) can pass identical
 * objects through to the typed engine while the new room consumes
 * them directly.
 */
import { t } from "@/lib/voice/t";

export const COMMAND_MODES = ["brief", "spotlight", "queue"] as const;
export type CommandMode = (typeof COMMAND_MODES)[number];

// Operator-facing labels. Internal keys stay as brief/spotlight/queue
// (cross-tab localStorage preserves the user's saved preference); only
// the visible string changes. Per Dashboard audit decisions (2026-05):
//   brief → Read     (narrative; the first-time default)
//   spotlight → Focus (single dominant object)
//   queue → Triage   (ranked list)
export const COMMAND_MODE_LABELS: Record<CommandMode, string> = {
    brief: t("Read"),
    spotlight: t("Focus"),
    queue: t("Triage")
};

// Dashboard audit: first-time default flipped from spotlight → brief.
// A CRO opening a sales dashboard expects to read first ("here's what's
// happening today, in 2-3 sentences") before drilling into a single
// focal object. Operators who prefer Focus can switch and the choice
// persists via gtmos_dashboard_command_mode.
export const DEFAULT_COMMAND_MODE: CommandMode = "brief";

/**
 * Family classifies a command object's source. Drives ranking weight
 * (`familyPriority` in the legacy engine), reason copy, and which
 * room it routes back to.
 */
export const COMMAND_FAMILIES = [
    "risk",
    "advisor",
    "opportunity",
    "move",
    "icp",
    "system"
] as const;
export type CommandFamily = (typeof COMMAND_FAMILIES)[number];

export interface CommandAction {
    readonly label: string;
    readonly href: string;
    readonly variant?: "primary" | "ghost";
    readonly tone?: string;
    readonly roomLabel?: string;
}

export interface CommandReason {
    readonly text: string;
    readonly weight?: number;
}

/**
 * One ranked object. Built by the engine from raw card data + health
 * snapshots; rendered in any of the three modes.
 */
export interface CommandObject {
    readonly id: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly copy?: string;
    readonly objectType: string;
    readonly commandFamily: CommandFamily;
    readonly badge: string;
    readonly badgeTone: string;
    readonly metricLabel: string;
    readonly metricValue: string;
    readonly meta: ReadonlyArray<string>;
    readonly actions: ReadonlyArray<CommandAction>;
    readonly sheetKey: string;
    readonly focusObject: string;
    readonly focusRoom: string;
    readonly stateKey: string;
    readonly rankingSignals: Readonly<Record<string, unknown>> | null;
    readonly score: number;
    readonly baseScore: number;
    readonly stabilityBonus: number;
    readonly rankingConfidence: number;
    readonly rankingConfidenceLabel: string;
    readonly roomFamilyLabel: string;
    readonly scoreReasons: ReadonlyArray<string>;
    readonly truthDebtCount: number;
    readonly nextStepOverdue: boolean;
    readonly stageStuck: boolean;
    readonly causeId: string;
    readonly pressureType: string;
    readonly readinessFragility: number;
    readonly readinessIcpWeak: boolean;
    readonly quotaPressureScore: number;
    readonly signalRoomMotionReady: boolean;
    /** Optional anchor href of the dominant move for cross-room handoff. */
    readonly primaryHref?: string;
    /** Original raw input that produced this object (debug-only). */
    readonly source?: unknown;
}

/**
 * Snapshot inputs from per-room publishers. The Dashboard reads these
 * each tick and feeds them to the ranking engine.
 *
 * Phase 4 / Room 1 publishes `gtmos_deal_workspace_health` →
 * `dealHealth`. The other keys are still published by legacy rooms
 * until they migrate.
 */
export interface HealthSummaries {
    readonly deal?: unknown;
    readonly signal?: unknown;
    readonly readiness?: unknown;
    readonly quota?: unknown;
}

/** Raw card data from each publishing room. Shape is permissive. */
export interface RawCommandCard {
    readonly id?: string;
    readonly title?: string;
    readonly subtitle?: string;
    readonly badge?: string;
    readonly badgeTone?: string;
    readonly meta?: ReadonlyArray<string>;
    readonly actions?: ReadonlyArray<CommandAction>;
    /** Optional pre-computed ranking signals merged into engine input. */
    readonly rankingSignals?: Readonly<Record<string, unknown>>;
}

/**
 * Optional fallback "primary" object — the legacy engine accepts a
 * pre-rendered card to inject when there's no risk/move data yet.
 */
export interface PrimaryCard {
    readonly title?: string;
    readonly copy?: string;
    readonly label?: string;
    readonly tags?: ReadonlyArray<string>;
    readonly actions?: ReadonlyArray<CommandAction>;
    readonly sheetKey?: string;
}

/** Engine input bundle consumed by `buildCommandObjects` (Wave 2). */
export interface CommandEngineInput {
    readonly riskCards: ReadonlyArray<RawCommandCard>;
    readonly moveCards: ReadonlyArray<RawCommandCard>;
    readonly healthSummaries: HealthSummaries;
    readonly shellContext?: Readonly<Record<string, unknown>>;
    readonly dependencyWarnings?: ReadonlyArray<unknown>;
    readonly primary?: PrimaryCard | null;
}

export interface EngineOptions {
    readonly previousSnapshot?: {
        readonly spotlightObjectId?: string;
        readonly spotlightTitle?: string;
        readonly topQueueIds?: ReadonlyArray<string>;
        readonly topQueueTitles?: ReadonlyArray<string>;
    } | null;
}

export const EMPTY_ENGINE_INPUT: CommandEngineInput = {
    riskCards: [],
    moveCards: [],
    healthSummaries: {}
};

export interface CommandContextSummary {
    readonly ranked: ReadonlyArray<CommandObject>;
    readonly spotlight: CommandObject | null;
    readonly queue: ReadonlyArray<CommandObject>;
    readonly riskCards: ReadonlyArray<CommandObject>;
    readonly moveCards: ReadonlyArray<CommandObject>;
    readonly systemCards: ReadonlyArray<CommandObject>;
}

export interface CommandExplanation {
    readonly label: string;
    readonly title: string;
    readonly copy: string;
}
