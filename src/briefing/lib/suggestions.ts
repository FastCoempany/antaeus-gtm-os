/**
 * Phase F (ADR-017) proposal-suggestion client — Briefing room
 * surface. Loads pending proposed_modifications + writes decisions
 * (accept / dismiss / snooze) back through the data-client.
 *
 * PR 3 of 4. PR 2 wrote the proposals via the heartbeat. PR 4 will
 * apply the side-effects of an accepted proposal; this PR ships the
 * surface where the operator decides.
 */

import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

export type ProposalKind = "skill_default" | "observation_generator";
export type ProposalDecision = "accepted" | "dismissed" | "snoozed";

export interface PendingProposal {
    readonly id: string;
    readonly kind: ProposalKind;
    readonly title: string;
    readonly whatNoticed: string;
    readonly whatChanges: string;
    readonly proposedAt: string;
    readonly viewedAt: string | null;
}

function parseKind(v: unknown): ProposalKind | null {
    if (v === "skill_default" || v === "observation_generator") return v;
    return null;
}

/** 30 days after dismiss/snooze per ADR-017 §Approved pick 3. */
const COOLDOWN_DAYS = 30;

function cooldownIso(nowMs: number = Date.now()): string {
    return new Date(nowMs + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Read pending proposals for the operator's workspace, ordered newest
 * first. Returns [] on any failure (defensive — the room must not
 * crash if Phase F isn't fully wired upstream).
 */
export async function loadPendingProposals(
    opts: { readonly data?: DataClient } = {}
): Promise<ReadonlyArray<PendingProposal>> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.proposedModifications.list({
            where: { decision: null as never },
            orderBy: { column: "proposed_at", ascending: false },
            limit: 25
        });
        const out: PendingProposal[] = [];
        for (const r of rows as unknown[]) {
            if (!r || typeof r !== "object") continue;
            const row = r as Record<string, unknown>;
            const id = typeof row.id === "string" ? row.id : null;
            const kind = parseKind(row.kind);
            const title = typeof row.title === "string" ? row.title : null;
            const whatNoticed =
                typeof row.what_noticed === "string" ? row.what_noticed : null;
            const whatChanges =
                typeof row.what_changes === "string" ? row.what_changes : null;
            const proposedAt =
                typeof row.proposed_at === "string" ? row.proposed_at : null;
            if (!id || !kind || !title || !whatNoticed || !whatChanges || !proposedAt) {
                continue;
            }
            out.push({
                id,
                kind,
                title,
                whatNoticed,
                whatChanges,
                proposedAt,
                viewedAt:
                    typeof row.viewed_at === "string" ? row.viewed_at : null
            });
        }
        return out;
    } catch (err) {
        reportError(err, { op: "briefing.loadPendingProposals" });
        return [];
    }
}

/** Mark a proposal as viewed (first render). Defensive — failures are
 * silent; the UI doesn't need a confirmation. */
export async function markProposalViewed(
    id: string,
    opts: { readonly data?: DataClient } = {}
): Promise<void> {
    try {
        const data = opts.data ?? createDataClient();
        await data.proposedModifications.update(id, {
            viewed_at: new Date().toISOString()
        });
    } catch (err) {
        reportError(err, { op: "briefing.markProposalViewed", id });
    }
}

export interface DecideResult {
    readonly ok: boolean;
    readonly error: string | null;
}

/**
 * Write the operator's decision on a proposal. Cooldown is set when
 * dismiss/snooze; accepted proposals have no cooldown (the apply
 * logic in PR 4 will consume them).
 */
export async function decideProposal(
    id: string,
    decision: ProposalDecision,
    opts: { readonly data?: DataClient; readonly now?: number } = {}
): Promise<DecideResult> {
    try {
        const data = opts.data ?? createDataClient();
        const now = opts.now ?? Date.now();
        const decidedAt = new Date(now).toISOString();
        await data.proposedModifications.update(id, {
            decision,
            decided_at: decidedAt,
            cooldown_until:
                decision === "accepted" ? null : cooldownIso(now)
        });
        return { ok: true, error: null };
    } catch (err) {
        reportError(err, { op: "briefing.decideProposal", id, decision });
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
