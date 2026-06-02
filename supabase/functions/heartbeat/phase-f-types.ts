/**
 * Phase F (ADR-017) — proposal-candidate types shared by the two
 * detection generators and the writer module.
 *
 * Self-contained so the heartbeat bundles cleanly. Vitest-importable
 * because every helper is a pure TS function (same pattern as the
 * outdoors-events-discovery _shared.ts module).
 */

// deno-lint-ignore-file no-explicit-any

export type ProposalKind = "skill_default" | "observation_generator";

/** Discriminated payloads per ADR-017 §"payload" comment in the schema. */
export interface SkillDefaultPayload {
    readonly skill_id: string;
    readonly params: Readonly<Record<string, unknown>>;
    /** Diagnostic: how many real-world fires backed this proposal. */
    readonly based_on_fires?: number;
    /** Detection-dedupe input — hash of skill_id + params. */
    readonly dedupe_hash: string;
}

export interface ObservationGeneratorPayload {
    readonly generator_id: string;
    readonly variant_name: string;
    /** Filter (or schedule) the variant applies on top of the base generator. */
    readonly filter: Readonly<Record<string, unknown>>;
    /** Detection-dedupe input. */
    readonly dedupe_hash: string;
}

export type ProposalPayload = SkillDefaultPayload | ObservationGeneratorPayload;

export interface ProposalCandidate {
    readonly kind: ProposalKind;
    readonly title: string;
    readonly what_noticed: string;
    readonly what_changes: string;
    readonly payload: ProposalPayload;
}

export interface PhaseFGeneratorContext {
    readonly workspaceId: string;
    /** Now, ISO string. Tests inject; production passes new Date().toISOString(). */
    readonly nowIso: string;
}
