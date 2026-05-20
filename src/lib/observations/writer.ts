/**
 * Phase A orchestration layer (ADR-004) — observation writer.
 *
 * Inserts observations into the ledger from the heartbeat Edge
 * Function. Runs server-side with service-role credentials (which
 * bypass RLS).
 *
 * Two responsibilities:
 *   1. Dedupe-on-write — don't insert the same observation text from
 *      the same generator for the same object more than once while
 *      the prior one is still active.
 *   2. Optional supersession — when a generator opts in via
 *      `supersedesPrior: true`, the writer first marks any prior
 *      active observations from the same generator + same object as
 *      superseded by the new one.
 *
 * The writer does NOT rewrite copy. Generators are responsible for
 * ensuring `observation_text` passes the voice rule (canon Part III
 * §11).
 *
 * Note: this module is consumed by the heartbeat Edge Function. It
 * uses the typed data-client because the Edge Function imports it
 * via the shared `src/lib/` tree. We pass an explicit DataClient
 * (service-role-scoped) at the call site.
 */

import { reportError } from "@/lib/observability";
import type { DataClient } from "@/lib/data-client";
import type {
    GeneratorContext,
    ObservationCandidate,
    ObservationView,
    RegisteredGenerator
} from "./types";
import { rowToObservation } from "./types";

export interface WriteResult {
    /** observation_text was deduped against an existing active row; no insert. */
    readonly deduped?: ObservationView;
    /** A new observation was inserted. */
    readonly inserted?: ObservationView;
    /** Observations the new one superseded (also returned). */
    readonly superseded?: ReadonlyArray<ObservationView>;
    /** Error during write — observation NOT inserted. */
    readonly error?: { readonly op: string; readonly message: string };
}

export interface WriteOptions {
    readonly data: DataClient;
    readonly workspaceId: string;
    readonly sourceGenerator: string;
    readonly candidate: ObservationCandidate;
    readonly now?: string;
}

/**
 * Insert one observation candidate. Dedupes against existing active
 * observations from the same generator for the same related object.
 * Optionally supersedes prior observations when the candidate opts in.
 */
export async function writeObservation(
    opts: WriteOptions
): Promise<WriteResult> {
    const { data, workspaceId, sourceGenerator, candidate } = opts;
    try {
        // Step 1 — dedupe scan. Look for an active row from the same
        // generator + same related object.
        const existing = await data.observations.list({
            where: {
                workspace_id: workspaceId,
                source_generator: sourceGenerator,
                related_object_type: candidate.relatedObjectType ?? null,
                related_object_id: candidate.relatedObjectId ?? null,
                status: "active"
            },
            limit: 5
        });
        const existingActive = existing.map(rowToObservation);

        // If the text is identical to a still-active prior observation,
        // skip the insert. This catches the common case where a
        // generator notices the same condition on consecutive heartbeats.
        const textMatch = existingActive.find(
            (o) => o.observationText === candidate.observationText
        );
        if (textMatch) {
            return { deduped: textMatch };
        }

        // Step 2 — supersession (opt-in). If the candidate says it
        // SUPERSEDES prior observations for this generator + object,
        // mark them all as superseded BEFORE inserting the new one.
        // We mark by id so the new row's id can be set as
        // `superseded_by` in step 3.
        let superseded: ObservationView[] = [];
        if (candidate.supersedesPrior && existingActive.length > 0) {
            // We mark superseded NOW; the superseded_by link is set
            // after the insert below.
            for (const prior of existingActive) {
                try {
                    const updated = await data.observations.update(prior.id, {
                        status: "superseded"
                    });
                    superseded.push(rowToObservation(updated));
                } catch (err) {
                    reportError(err, {
                        op: "observations.writer.markSuperseded",
                        observationId: prior.id
                    });
                }
            }
        }

        // Step 3 — insert the new observation.
        const inserted = await data.observations.insert({
            workspace_id: workspaceId,
            observation_text: candidate.observationText,
            related_object_type: candidate.relatedObjectType ?? null,
            related_object_id: candidate.relatedObjectId ?? null,
            source_generator: sourceGenerator,
            confidence: candidate.confidence ?? null,
            status: "active",
            written_at: opts.now
        });
        const insertedView = rowToObservation(inserted);

        // Step 4 — backfill superseded_by on the prior rows so the
        // chain is queryable. Best-effort; we don't fail the whole
        // write if this step errors.
        if (superseded.length > 0) {
            for (const prior of superseded) {
                try {
                    await data.observations.update(prior.id, {
                        superseded_by: insertedView.id
                    });
                } catch (err) {
                    reportError(err, {
                        op: "observations.writer.linkSupersededBy",
                        observationId: prior.id,
                        newObservationId: insertedView.id
                    });
                }
            }
        }

        return {
            inserted: insertedView,
            superseded: superseded.length > 0 ? superseded : undefined
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        reportError(err, {
            op: "observations.writer.write",
            workspaceId,
            sourceGenerator
        });
        return {
            error: { op: "observations.writer.write", message }
        };
    }
}

export interface RunGeneratorOptions {
    readonly data: DataClient;
    readonly ctx: GeneratorContext;
    readonly generator: RegisteredGenerator;
}

/**
 * Run a single generator against a workspace and write any candidates
 * it produces. Used by the heartbeat Edge Function's main loop.
 * Returns a summary the heartbeat can log.
 */
export async function runGenerator(
    opts: RunGeneratorOptions
): Promise<{
    readonly generatorId: string;
    readonly produced: number;
    readonly inserted: number;
    readonly deduped: number;
    readonly errors: number;
}> {
    const { data, ctx, generator } = opts;
    let inserted = 0;
    let deduped = 0;
    let errors = 0;
    let produced = 0;

    let candidates: ReadonlyArray<ObservationCandidate>;
    try {
        candidates = await generator.run(ctx);
        produced = candidates.length;
    } catch (err) {
        reportError(err, {
            op: "observations.writer.runGenerator",
            generatorId: generator.id
        });
        return {
            generatorId: generator.id,
            produced: 0,
            inserted: 0,
            deduped: 0,
            errors: 1
        };
    }

    for (const candidate of candidates) {
        const result = await writeObservation({
            data,
            workspaceId: ctx.workspaceId,
            sourceGenerator: generator.id,
            candidate,
            now: ctx.now
        });
        if (result.inserted) inserted += 1;
        else if (result.deduped) deduped += 1;
        else if (result.error) errors += 1;
    }

    return {
        generatorId: generator.id,
        produced,
        inserted,
        deduped,
        errors
    };
}
