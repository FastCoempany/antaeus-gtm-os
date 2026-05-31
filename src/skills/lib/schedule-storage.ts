import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import {
    cadenceToJson,
    nextFireAt,
    parseCadence,
    type Cadence
} from "./scheduling";

/**
 * Schedule storage — Phase E client-side CRUD against
 * `scheduled_skills` + reader for unviewed `scheduled_skill_fires`.
 *
 * Per ADR-012 (2026-05-31). Writes are operator-driven (Cmd+K palette
 * UI); reads happen on app load (auto-navigate handler) and inside the
 * palette (showing existing schedules).
 *
 * Errors never throw — every operation catches + reports.
 */

export interface ScheduledSkillRow {
    readonly id: string;
    readonly skillId: string;
    readonly cadence: Cadence | null;
    readonly nextFireAtIso: string;
    readonly lastFiredAtIso: string | null;
}

export interface PendingFire {
    readonly id: string;
    readonly skillId: string;
    readonly firedAtIso: string;
}

// ─── Create / update a schedule (idempotent on (workspace, skill_id)) ──

export async function upsertSchedule(
    skillId: string,
    cadence: Cadence,
    opts: { readonly now?: Date; readonly data?: DataClient } = {}
): Promise<boolean> {
    const data = opts.data ?? createDataClient();
    try {
        const next = nextFireAt(cadence, opts.now ?? new Date());
        // Read existing first to know whether to insert or update.
        const existing = await data.scheduledSkills.list({
            where: { skill_id: skillId },
            limit: 1
        });
        if (existing.length > 0) {
            await data.scheduledSkills.update(existing[0]!.id, {
                cadence_kind: cadence.kind,
                cadence_data: cadenceToJson(cadence) as never,
                next_fire_at: next.toISOString()
            });
        } else {
            await data.scheduledSkills.insert({
                skill_id: skillId,
                cadence_kind: cadence.kind,
                cadence_data: cadenceToJson(cadence) as never,
                next_fire_at: next.toISOString()
            });
        }
        return true;
    } catch (err) {
        reportError(err, { op: "phase-e.upsertSchedule" });
        return false;
    }
}

// ─── List all schedules in this workspace ─────────────────────────────

export async function listSchedules(
    opts: { readonly data?: DataClient } = {}
): Promise<ReadonlyArray<ScheduledSkillRow>> {
    const data = opts.data ?? createDataClient();
    try {
        const rows = await data.scheduledSkills.list({});
        return rows.map((r) => ({
            id: r.id,
            skillId: r.skill_id,
            cadence: parseCadence(r.cadence_kind, r.cadence_data),
            nextFireAtIso: r.next_fire_at,
            lastFiredAtIso: r.last_fired_at
        }));
    } catch (err) {
        reportError(err, { op: "phase-e.listSchedules" });
        return [];
    }
}

// ─── Delete a schedule ────────────────────────────────────────────────

export async function deleteSchedule(
    scheduleId: string,
    opts: { readonly data?: DataClient } = {}
): Promise<boolean> {
    const data = opts.data ?? createDataClient();
    try {
        await data.scheduledSkills.remove(scheduleId);
        return true;
    } catch (err) {
        reportError(err, { op: "phase-e.deleteSchedule" });
        return false;
    }
}

// ─── Read the most-recent unviewed pending fire ───────────────────────

/**
 * Returns the most recent pending fire (viewed_at IS NULL) for the
 * workspace, or null. Used by the auto-navigate handler on app load.
 */
export async function readNextPendingFire(
    opts: { readonly data?: DataClient } = {}
): Promise<PendingFire | null> {
    const data = opts.data ?? createDataClient();
    try {
        const rows = await data.scheduledSkillFires.list({
            where: { viewed_at: null },
            orderBy: { column: "fired_at", ascending: false },
            limit: 1
        });
        if (rows.length === 0) return null;
        const r = rows[0]!;
        return {
            id: r.id,
            skillId: r.skill_id,
            firedAtIso: r.fired_at
        };
    } catch (err) {
        reportError(err, { op: "phase-e.readNextPendingFire" });
        return null;
    }
}

// ─── Mark a pending fire as viewed ────────────────────────────────────

export async function markFireViewed(
    fireId: string,
    opts: { readonly now?: Date; readonly data?: DataClient } = {}
): Promise<boolean> {
    const data = opts.data ?? createDataClient();
    try {
        await data.scheduledSkillFires.update(fireId, {
            viewed_at: (opts.now ?? new Date()).toISOString()
        });
        return true;
    } catch (err) {
        reportError(err, { op: "phase-e.markFireViewed" });
        return false;
    }
}
