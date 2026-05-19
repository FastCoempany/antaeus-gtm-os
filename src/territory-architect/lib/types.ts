/**
 * Phase 4 / Room 12 — Territory Architect types.
 *
 * Per canon §4.5 the room turns the ICP into a tiered territory with
 * focuses, approaches, and a hard 300-account ceiling that forces
 * strategic ownership. The territory is a map of focused groups of
 * buyers, not a list. Per founder directive (2026-04-28) the room is
 * bright (no dark surfaces).
 */

export type TierId = "t1" | "t2" | "t3" | "t4";

export const TIER_IDS: ReadonlyArray<TierId> = ["t1", "t2", "t3", "t4"];

export const TIER_LABELS: Readonly<Record<TierId, string>> = {
    t1: "Strategic (must-win)",
    t2: "Core (recurring focus)",
    t3: "Develop (research-led)",
    t4: "Watch (monitor only)"
};

/** Recommended target counts per tier (used for the 300 ceiling math). */
export const TIER_DEFAULTS: Readonly<Record<TierId, number>> = {
    t1: 30,
    t2: 90,
    t3: 120,
    t4: 60
};

export const ACCOUNT_CEILING = 300;

// ─── Setup + territory health ──────────────────────────────────────────

export type SalesCycle = "fast" | "medium" | "slow";

export interface TerritorySetup {
    readonly salesCycle: SalesCycle;
    readonly icpId: string;
    readonly icpStatement: string;
    readonly createdAt: string;
}

export interface TerritoryState {
    readonly healthScore: number;
    readonly lastPulse: string | null;
    readonly pulseSkips: number;
    readonly salesCycle: SalesCycle | "";
    readonly createdAt: string | null;
}

export const EMPTY_TERRITORY_STATE: TerritoryState = {
    healthScore: 100,
    lastPulse: null,
    pulseSkips: 0,
    salesCycle: "",
    createdAt: null
};

// ─── Focus + Approach ──────────────────────────────────────────────────

export interface Focus {
    readonly id: string;
    /** Focus name e.g. "Procurement consolidation Q2". */
    readonly title: string;
    /** Pressure / why-now narrative. */
    readonly pressure: string;
    /** Segment (industry/size/geo summary). */
    readonly segment: string;
    /** Why this team is the right seller. */
    readonly whyUs: string;
    readonly tier: TierId;
    /** Account ids tagged with this focus. */
    readonly accountIds: ReadonlyArray<string>;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface Approach {
    readonly id: string;
    /** Approach name e.g. "Procurement-led intro". */
    readonly name: string;
    /** When to use it. */
    readonly trigger: string;
    /** The send-line / talk-track skeleton. */
    readonly script: string;
    /** Bridge phrasing for objection handling. */
    readonly bridge: string;
    readonly focusId: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

// ─── Account + Disposition ─────────────────────────────────────────────

export type DispositionState =
    | "active"
    | "paused"
    | "closed-won"
    | "closed-lost"
    | "reroute";

export interface TerritoryAccount {
    readonly id: string;
    readonly name: string;
    readonly tier: TierId;
    readonly focusId: string;
    readonly approachId: string;
    readonly disposition: DispositionState;
    readonly notes: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

// ─── Drafts (form state) ───────────────────────────────────────────────

export interface FocusDraft {
    readonly title: string;
    readonly pressure: string;
    readonly segment: string;
    readonly whyUs: string;
    readonly tier: TierId;
}

export const EMPTY_FOCUS_DRAFT: FocusDraft = {
    title: "",
    pressure: "",
    segment: "",
    whyUs: "",
    tier: "t1"
};

export interface ApproachDraft {
    readonly name: string;
    readonly trigger: string;
    readonly script: string;
    readonly bridge: string;
    readonly focusId: string;
}

export const EMPTY_APPROACH_DRAFT: ApproachDraft = {
    name: "",
    trigger: "",
    script: "",
    bridge: "",
    focusId: ""
};

export interface AccountDraft {
    readonly name: string;
    readonly tier: TierId;
    readonly focusId: string;
    readonly approachId: string;
    readonly notes: string;
}

export const EMPTY_ACCOUNT_DRAFT: AccountDraft = {
    name: "",
    tier: "t2",
    focusId: "",
    approachId: "",
    notes: ""
};

// ─── Tier allocation summary ───────────────────────────────────────────

export interface TierAllocation {
    readonly tier: TierId;
    readonly count: number;
    readonly target: number;
    readonly delta: number;
}

export interface AllocationReadout {
    readonly perTier: ReadonlyArray<TierAllocation>;
    readonly total: number;
    readonly ceiling: number;
    readonly remaining: number;
    readonly status: "headroom" | "at-cap" | "over";
}
