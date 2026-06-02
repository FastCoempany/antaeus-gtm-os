/**
 * Phase F (ADR-017) apply logic — the side-effect path for an
 * accepted proposal.
 *
 * Called by `decidePendingProposal` after the decision write succeeds.
 * Reads the proposal's payload + writes to the appropriate side-effect
 * table:
 *
 *   Lane 1 (skill_default) → workspace_skill_overrides (upsert on
 *     workspace_id + skill_id; replaces any prior override)
 *
 *   Lane 2 (observation_generator) → active_observation_variants
 *     (upsert on workspace_id + base_generator_id + variant_name)
 *
 * Idempotent — re-applying the same accepted proposal is a no-op (the
 * unique constraint catches duplicates; the dispatcher / heartbeat
 * read the same row regardless of how many accept calls landed).
 *
 * Defensive throughout: failures bubble back to the caller as
 * { ok: false, error } so the UI can surface a "couldn't apply"
 * banner. The decision row stays `accepted`; PR 5+ could surface a
 * retry path if we see real failure rates.
 */

import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import type { Json } from "@/lib/database-helpers";

export interface ApplyResult {
    readonly ok: boolean;
    readonly error: string | null;
}

/** Pull the proposal row by id + apply its side effect. Called by
 * `decidePendingProposal` after the operator accepts. */
export async function applyAcceptedProposal(
    proposalId: string,
    opts: { readonly data?: DataClient } = {}
): Promise<ApplyResult> {
    try {
        const data = opts.data ?? createDataClient();
        const row = (await data.proposedModifications.get(proposalId)) as
            | {
                  id: string;
                  kind: string;
                  payload: Json;
                  workspace_id: string;
              }
            | null;
        if (!row) {
            return { ok: false, error: "Proposal not found." };
        }
        if (row.kind === "skill_default") {
            return applySkillDefault(data, row);
        }
        if (row.kind === "observation_generator") {
            return applyObservationGenerator(data, row);
        }
        return { ok: false, error: `Unknown proposal kind: ${row.kind}` };
    } catch (err) {
        reportError(err, { op: "briefing.applyAcceptedProposal", proposalId });
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

async function applySkillDefault(
    data: DataClient,
    row: { id: string; payload: Json; workspace_id: string }
): Promise<ApplyResult> {
    const payload = row.payload as unknown as {
        skill_id?: string;
        params?: Record<string, unknown>;
    } | null;
    const skillId = payload?.skill_id;
    if (!skillId || typeof skillId !== "string") {
        return { ok: false, error: "Proposal payload missing skill_id." };
    }
    const params = payload?.params ?? {};

    // Upsert via (workspace_id, skill_id) unique index. We do a
    // delete-then-insert because the data-client doesn't expose upsert
    // directly — and replace semantics is exactly what we want
    // (accepting a new proposal replaces the prior override).
    try {
        const existing = await data.workspaceSkillOverrides.list({
            where: { skill_id: skillId } as never,
            limit: 1
        });
        if (Array.isArray(existing) && existing.length > 0) {
            const ex = existing[0] as { id: string };
            await data.workspaceSkillOverrides.update(ex.id, {
                params: params as Json,
                accepted_proposal_id: row.id,
                applied_at: new Date().toISOString()
            });
        } else {
            await data.workspaceSkillOverrides.insert({
                skill_id: skillId,
                params: params as Json,
                accepted_proposal_id: row.id
            });
        }
        return { ok: true, error: null };
    } catch (err) {
        reportError(err, {
            op: "briefing.applySkillDefault",
            skill_id: skillId
        });
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

async function applyObservationGenerator(
    data: DataClient,
    row: { id: string; payload: Json; workspace_id: string }
): Promise<ApplyResult> {
    const payload = row.payload as unknown as {
        generator_id?: string;
        variant_name?: string;
        filter?: Record<string, unknown>;
    } | null;
    const generatorId = payload?.generator_id;
    const variantName = payload?.variant_name;
    if (!generatorId || typeof generatorId !== "string") {
        return { ok: false, error: "Proposal payload missing generator_id." };
    }
    if (!variantName || typeof variantName !== "string") {
        return { ok: false, error: "Proposal payload missing variant_name." };
    }
    const filter = payload?.filter ?? {};
    try {
        const existing = await data.activeObservationVariants.list({
            where: {
                base_generator_id: generatorId,
                variant_name: variantName
            } as never,
            limit: 1
        });
        if (Array.isArray(existing) && existing.length > 0) {
            const ex = existing[0] as { id: string };
            await data.activeObservationVariants.update(ex.id, {
                filter: filter as Json,
                accepted_proposal_id: row.id,
                applied_at: new Date().toISOString()
            });
        } else {
            await data.activeObservationVariants.insert({
                base_generator_id: generatorId,
                variant_name: variantName,
                filter: filter as Json,
                accepted_proposal_id: row.id
            });
        }
        return { ok: true, error: null };
    } catch (err) {
        reportError(err, {
            op: "briefing.applyObservationGenerator",
            generator_id: generatorId,
            variant_name: variantName
        });
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
