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

export const COMMAND_MODES = ["brief", "spotlight", "queue"] as const;
export type CommandMode = (typeof COMMAND_MODES)[number];

/** Default mode if neither URL nor localStorage has a value. */
export const DEFAULT_COMMAND_MODE: CommandMode = "spotlight";

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
    readonly commandFamily: CommandFamily;
    readonly badge?: string;
    readonly badgeTone?: string;
    readonly meta: ReadonlyArray<string>;
    readonly score: number;
    readonly scoreReasons: ReadonlyArray<string>;
    readonly actions: ReadonlyArray<CommandAction>;
    /** Inferred destination room label (e.g. "Deal Workspace"). */
    readonly roomLabel?: string;
    /** Anchor href of the dominant move for cross-room handoff. */
    readonly primaryHref?: string;
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

/** Engine input bundle consumed by `buildCommandObjects` (Wave 2). */
export interface CommandEngineInput {
    readonly riskCards: ReadonlyArray<RawCommandCard>;
    readonly opportunityCards: ReadonlyArray<RawCommandCard>;
    readonly moveCards: ReadonlyArray<RawCommandCard>;
    readonly advisorCards: ReadonlyArray<RawCommandCard>;
    readonly icpCards: ReadonlyArray<RawCommandCard>;
    readonly systemCards: ReadonlyArray<RawCommandCard>;
    readonly healthSummaries: HealthSummaries;
}

export const EMPTY_ENGINE_INPUT: CommandEngineInput = {
    riskCards: [],
    opportunityCards: [],
    moveCards: [],
    advisorCards: [],
    icpCards: [],
    systemCards: [],
    healthSummaries: {}
};
