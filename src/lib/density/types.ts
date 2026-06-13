/**
 * Density gradient — the canonical types (spec 02 §2.1).
 *
 * Two operator-facing states for two operating realities: the day-one
 * operator (Show me how — the system walks every surface) and the
 * fluent operator (Step back — the system trusts them and gets out of
 * the way). The technical layer uses the snake-case enum the DB column
 * stores; the operator-facing labels render in peer voice.
 *
 * This is the home of DensityState; the component library's contract
 * (src/components/contract.ts) re-exports it so a component and the
 * persistence layer never disagree on the spelling.
 */

/** The DB enum stored on `workspace_profile.density_state`. */
export type DensityState = "show_me_how" | "step_back";

export const DENSITY_STATES: ReadonlyArray<DensityState> = [
    "show_me_how",
    "step_back"
];

/** Brand-new workspaces walk the operator through (spec 02 §2.2). */
export const DEFAULT_DENSITY_STATE: DensityState = "show_me_how";

export function isDensityState(v: unknown): v is DensityState {
    return v === "show_me_how" || v === "step_back";
}

/**
 * The five fluency milestones that fire a density proposal (spec 02
 * §2.4). Detection generators (deferred) emit these; the apply path
 * and Settings consume the resulting state change.
 */
export type DensityMilestone =
    | "onboarding_complete"
    | "first_deal_closed"
    | "first_proof_cast"
    | "first_discovery_completed"
    | "gradient_available";

/**
 * The Phase F payload for a `density_change` proposal (spec 02 §2.3).
 * Extends the ADR-017 proposed_modifications.kind union with a third
 * value; the apply path writes `to_state` to the workspace profile.
 */
export interface DensityChangePayload {
    readonly kind: "density_change";
    readonly from_state: DensityState;
    readonly to_state: DensityState;
    readonly milestone: DensityMilestone;
}

export function isDensityChangePayload(
    v: unknown
): v is DensityChangePayload {
    if (v === null || typeof v !== "object") return false;
    const o = v as Record<string, unknown>;
    return (
        o["kind"] === "density_change" &&
        isDensityState(o["from_state"]) &&
        isDensityState(o["to_state"])
    );
}
