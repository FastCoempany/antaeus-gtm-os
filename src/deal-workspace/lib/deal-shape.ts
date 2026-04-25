/**
 * Deal Workspace — domain types.
 *
 * The room operates on the `Deal` sacred noun (canon §2). Field shapes
 * mirror the legacy `app/deal-workspace/index.html` inline script's
 * deal object so existing data flows in without translation.
 *
 * On the Supabase side, a Deal row spreads across the `deals` table:
 *   - Strongly-typed columns: id, user_id, workspace_id, account_name,
 *     stage, deal_value, close_date, next_step_date, forecast_category,
 *     loss_reason, stage_history (jsonb), created_at, updated_at
 *   - Free-form intel + stakeholders + notes go in `data` jsonb
 *
 * The mapping helpers below (toLegacyDeal / fromLegacyDeal) bridge the
 * column-and-jsonb shape with the flat shape the UI works in.
 */

export const STAGE_IDS = [
    "prospect",
    "discovery",
    "evaluation",
    "poc",
    "negotiation",
    "verbal",
    "closed-won",
    "closed-lost"
] as const;
export type StageId = (typeof STAGE_IDS)[number];

export const STAGE_LABELS: Record<StageId, string> = {
    prospect: "Prospect",
    discovery: "Discovery",
    evaluation: "Solution Fit",
    poc: "PoC / Pilot",
    negotiation: "Negotiation",
    verbal: "Verbal Commit",
    "closed-won": "Closed Won",
    "closed-lost": "Closed Lost"
};

export const STAGE_ORDER: Record<StageId, number> = {
    prospect: 0,
    discovery: 1,
    evaluation: 2,
    poc: 3,
    negotiation: 4,
    verbal: 5,
    "closed-won": 6,
    "closed-lost": 7
};

export const STAGE_PROB: Record<StageId, number> = {
    prospect: 0,
    discovery: 0.1,
    evaluation: 0.25,
    poc: 0.5,
    negotiation: 0.75,
    verbal: 0.9,
    "closed-won": 1,
    "closed-lost": 0
};

export const LOSS_REASONS = [
    "competitor",
    "no_decision",
    "budget",
    "champion_left",
    "timing"
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

export const LOSS_LABELS: Record<LossReason, string> = {
    competitor: "Lost to Competitor",
    no_decision: "No Decision / Status Quo",
    budget: "Budget Killed",
    champion_left: "Champion Left / Reorg",
    timing: "Timing / Not Now"
};

export const STAKEHOLDER_ROLES = [
    "champion",
    "eb",
    "technical",
    "legal",
    "exec_sponsor",
    "end_user"
] as const;
export type StakeholderRole = (typeof STAKEHOLDER_ROLES)[number];

export const ROLE_LABELS: Record<StakeholderRole, string> = {
    champion: "Champion",
    eb: "Economic Buyer",
    technical: "Technical Eval",
    legal: "Legal / Procurement",
    exec_sponsor: "Exec Sponsor",
    end_user: "End User"
};

export type Momentum = "strong" | "neutral" | "stalling";

export interface Stakeholder {
    readonly name: string;
    readonly role: StakeholderRole | "";
    readonly engaged?: boolean;
}

/**
 * Flat working shape used inside the room. Stable because the legacy
 * inline script + js/deal-health.js shared library both expect it.
 *
 * `id` and `accountName` + `stage` + `value` are the minimum to render
 * a card. Everything else is optional intel that fills in over time.
 */
export interface Deal {
    readonly id: string;
    readonly accountName: string;
    readonly value: number;
    readonly stage: StageId;
    readonly nextStep?: string;
    readonly nextStepDate?: string;
    readonly closeDate?: string;
    readonly forecastCategory?: string;
    readonly momentum?: Momentum;
    // Intel fields:
    readonly champion?: string;
    readonly economicBuyer?: string;
    readonly useCase?: string;
    readonly pain?: string;
    readonly competition?: string;
    readonly decisionProcess?: string;
    readonly notes?: string;
    readonly stakeholders?: ReadonlyArray<Stakeholder>;
    // Loss:
    readonly lossReason?: LossReason;
    readonly lossNotes?: string;
    // Audit:
    readonly created_at?: string;
    readonly updated_at?: string;
}

export function isClosed(stage: StageId): boolean {
    return stage === "closed-won" || stage === "closed-lost";
}

export function emptyDeal(): Deal {
    return {
        id: "",
        accountName: "",
        value: 0,
        stage: "prospect"
    };
}
