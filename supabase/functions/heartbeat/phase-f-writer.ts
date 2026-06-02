/**
 * Phase F (ADR-017) proposal writer — voice gate + cooldown dedupe.
 *
 * The heartbeat's Phase F lap calls into this writer after each
 * generator returns its ProposalCandidate[]. The writer:
 *
 *   1. Voice-gates every operator-facing string (title, what_noticed,
 *      what_changes). Failed candidates are logged + dropped.
 *
 *   2. Cooldown-checks each candidate against existing
 *      proposed_modifications rows in the same workspace with the
 *      same payload.dedupe_hash and cooldown_until > now. Existing
 *      cooled rows block new writes.
 *
 *   3. Inserts the passing candidates. RLS allows the service-role
 *      bypass to write; client SDK is locked out.
 *
 * Defensive throughout: a failed write doesn't abort the loop. Errors
 * are logged + the writer reports per-candidate outcomes.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateObservation, formatViolations } from "./voice-document.ts";
import type {
    ProposalCandidate,
    ProposalPayload
} from "./phase-f-types.ts";

export interface PhaseFWriteOutcome {
    readonly written: number;
    readonly voice_dropped: number;
    readonly cooldown_skipped: number;
    readonly errors: ReadonlyArray<string>;
}

const EMPTY: PhaseFWriteOutcome = {
    written: 0,
    voice_dropped: 0,
    cooldown_skipped: 0,
    errors: []
};

function extractDedupeHash(payload: ProposalPayload): string | null {
    if (typeof payload === "object" && payload !== null) {
        const p = payload as Record<string, unknown>;
        const h = p["dedupe_hash"];
        if (typeof h === "string" && h.length > 0) return h;
    }
    return null;
}

/**
 * Voice-gate one candidate. Returns null if any of the three text
 * fields fails the voice document.
 */
export function gateThroughVoice(
    generatorId: string,
    candidate: ProposalCandidate
): ProposalCandidate | null {
    for (const [field, text] of [
        ["title", candidate.title],
        ["what_noticed", candidate.what_noticed],
        ["what_changes", candidate.what_changes]
    ] as const) {
        const v = validateObservation(text);
        if (!v.ok) {
            console.warn(
                `[phase-f] ${generatorId} ${field} voice-failed:`,
                formatViolations(v.violations)
            );
            return null;
        }
    }
    return candidate;
}

/**
 * Look up whether an active cooldown exists for this dedupe_hash in
 * this workspace. Returns true if a row should be skipped.
 */
async function isOnCooldown(
    sb: SupabaseClient,
    workspaceId: string,
    dedupeHash: string,
    nowIso: string
): Promise<boolean> {
    // Postgres JSONB path filter via -> + ->>. We compare cooldown_until
    // against now to find still-active cooldowns.
    const res = await sb
        .from("proposed_modifications")
        .select("id, decision, cooldown_until")
        .eq("workspace_id", workspaceId)
        .eq("payload->>dedupe_hash", dedupeHash)
        .limit(1);
    if (res.error || !Array.isArray(res.data)) return false;
    for (const row of res.data) {
        const r = row as {
            decision?: string | null;
            cooldown_until?: string | null;
        };
        // Pending proposals also block — never write a duplicate of an
        // unanswered proposal.
        if (r.decision === null || r.decision === undefined) return true;
        if (r.decision === "accepted") return true; // already applied
        if (r.cooldown_until && r.cooldown_until > nowIso) return true;
    }
    return false;
}

/**
 * Write all passing candidates for one generator's lap. The cooldown
 * default for new rows is 30 days per ADR-017 §Approved pick 3;
 * dismiss/snooze decisions set this on update, so a freshly-written
 * row has cooldown_until = null until the operator acts.
 */
export async function writePhaseFCandidates(
    sb: SupabaseClient,
    workspaceId: string,
    generatorId: string,
    candidates: ReadonlyArray<ProposalCandidate>,
    nowIso: string
): Promise<PhaseFWriteOutcome> {
    if (candidates.length === 0) return EMPTY;

    let written = 0;
    let voiceDropped = 0;
    let cooldownSkipped = 0;
    const errors: string[] = [];

    for (const candidate of candidates) {
        const gated = gateThroughVoice(generatorId, candidate);
        if (!gated) {
            voiceDropped += 1;
            continue;
        }
        const hash = extractDedupeHash(gated.payload);
        if (!hash) {
            errors.push(`${generatorId}: candidate missing dedupe_hash`);
            continue;
        }
        try {
            if (await isOnCooldown(sb, workspaceId, hash, nowIso)) {
                cooldownSkipped += 1;
                continue;
            }
            const ins = await sb.from("proposed_modifications").insert({
                workspace_id: workspaceId,
                kind: gated.kind,
                title: gated.title,
                what_noticed: gated.what_noticed,
                what_changes: gated.what_changes,
                payload: gated.payload as any,
                proposed_at: nowIso
            });
            if (ins.error) {
                errors.push(`${generatorId}: ${ins.error.message}`);
                continue;
            }
            written += 1;
        } catch (err) {
            errors.push(
                `${generatorId}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }

    return { written, voice_dropped: voiceDropped, cooldown_skipped: cooldownSkipped, errors };
}
