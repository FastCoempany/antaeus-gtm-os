/**
 * Phase F (ADR-017) Lane 2 variant runner.
 *
 * Closes the Lane 2 gap noted in PR #251: accepted observation_generator
 * proposals land in active_observation_variants but the heartbeat
 * didn't yet act on them. This module does.
 *
 * For each workspace, for each active variant: look up the matching
 * Phase B base generator, invoke it with the heartbeat context, write
 * the resulting candidates to the observations ledger with a tagged
 * source_generator string of the form:
 *
 *   source_generator = `${base_generator_id}:${variant_name}`
 *
 * Dedupe is per (workspace_id, source_generator, related_object_*)
 * inside writeObservation, so the variant's attribution track is
 * independent of the base generator's untagged track. The operator
 * sees the variant-attributed observations in their Dashboard
 * "this week's reads" with the variant_name as the attribution label,
 * confirming the system did what they accepted.
 *
 * Voice-gating runs the same way as the base generators — the
 * candidate's text passes through validateObservation before write.
 *
 * Cost-bounded: each variant invocation runs the base generator
 * exactly once per heartbeat tick. No LLM calls; SQL-only generators
 * means trivial added cost.
 *
 * What this DOES NOT do: plumb the variant's `filter` payload through
 * the base generators. The base generators are invoked as-is, so the
 * candidate set is identical to the base run. The variant's value is
 * the distinct attribution track — operator can disable the variant
 * by deleting its row if they decide the duplicate observations are
 * noise. Filter plumbing through each Phase B generator's SQL query
 * is a future-PR concern (Phase G).
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import type { GeneratorContext, ObservationCandidate } from "./types.ts";

// The base generator registry + voice validator are INJECTED into
// the runner rather than imported directly. Both source modules
// (./generators.ts + ./voice-document.ts) use .ts extension imports
// that the vitest typecheck (moduleResolution: bundler) flags. The
// Deno runtime resolves them at deploy. Heartbeat's index.ts wires
// PHASE_B_GENERATORS + a validateObservation closure at the call site.
export interface BaseGenerator {
    readonly id: string;
    readonly run: (
        ctx: GeneratorContext,
        sb: any
    ) => Promise<ReadonlyArray<ObservationCandidate>>;
}

export interface VoiceValidator {
    (text: string): { valid: boolean; reason?: string };
}

export interface VariantRunOutcome {
    readonly variants_seen: number;
    readonly variants_run: number;
    readonly variants_unknown_base: number;
    readonly candidates_produced: number;
    readonly candidates_written: number;
    readonly candidates_voice_dropped: number;
    readonly errors: ReadonlyArray<string>;
}

const EMPTY: VariantRunOutcome = {
    variants_seen: 0,
    variants_run: 0,
    variants_unknown_base: 0,
    candidates_produced: 0,
    candidates_written: 0,
    candidates_voice_dropped: 0,
    errors: []
};

/**
 * Read active variants for the workspace + run each one's base
 * generator with the variant attribution. Returns per-tick outcome
 * for heartbeat logging.
 *
 * `writeFn` is injected (in production, the heartbeat's writeObservation
 * with `source_generator` already plumbed). Tests pass a stub.
 */
export async function runPhaseFVariantsForWorkspace(
    sb: SupabaseClient,
    ctx: GeneratorContext,
    writeFn: (
        sourceGenerator: string,
        candidate: ObservationCandidate
    ) => Promise<{ inserted: boolean; deduped: boolean; errored: boolean }>,
    baseGenerators: ReadonlyArray<BaseGenerator>,
    voiceValidate: VoiceValidator
): Promise<VariantRunOutcome> {
    const variants = await sb
        .from("active_observation_variants")
        .select("base_generator_id, variant_name")
        .eq("workspace_id", ctx.workspaceId);
    if (variants.error || !Array.isArray(variants.data)) {
        // Defensive: if the table doesn't exist yet (PR 4 migration not
        // applied) or RLS denies the read, return the empty outcome.
        return EMPTY;
    }

    const rows = variants.data as Array<{
        base_generator_id: string;
        variant_name: string;
    }>;
    if (rows.length === 0) return EMPTY;

    let variantsRun = 0;
    let unknown = 0;
    let produced = 0;
    let written = 0;
    let voiceDropped = 0;
    const errors: string[] = [];

    for (const variant of rows) {
        const base = baseGenerators.find(
            (g) => g.id === variant.base_generator_id
        );
        if (!base) {
            unknown += 1;
            continue;
        }
        variantsRun += 1;
        const sourceTag = `${variant.base_generator_id}:${variant.variant_name}`;
        try {
            const candidates = await base.run(ctx, sb);
            produced += candidates.length;
            for (const candidate of candidates) {
                const v = voiceValidate(candidate.observationText);
                if (!v.valid) {
                    console.warn(
                        `[phase-f-variant] ${sourceTag} voice-failed:`,
                        v.reason ?? "(no reason)"
                    );
                    voiceDropped += 1;
                    continue;
                }
                try {
                    const result = await writeFn(sourceTag, candidate);
                    if (result.inserted) written += 1;
                } catch (err) {
                    errors.push(
                        `${sourceTag}: ${
                            err instanceof Error ? err.message : String(err)
                        }`
                    );
                }
            }
        } catch (err) {
            errors.push(
                `${sourceTag}: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    }

    return {
        variants_seen: rows.length,
        variants_run: variantsRun,
        variants_unknown_base: unknown,
        candidates_produced: produced,
        candidates_written: written,
        candidates_voice_dropped: voiceDropped,
        errors
    };
}
