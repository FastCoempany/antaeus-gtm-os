/**
 * Phase F (ADR-017) detection generators (Deno + vitest-importable).
 *
 * Two SQL-only generators per the approved doctrine:
 *
 *   G1 — skill_default_refinement: an operator who has scheduled a
 *        skill that fires repeatedly (≥ 5 successful fires in last
 *        30 days) is implicitly telling the system "this configuration
 *        is the one I want." Proposal: make that schedule's params the
 *        recipe default.
 *
 *   G2 — recurring_focus: an operator who focuses on the same room
 *        ≥ 5 times in last 14 days is showing a coherent pattern.
 *        Proposal: register a parameterized observation-generator
 *        variant filtered to that room.
 *
 * Both generators are deterministic (no LLM at runtime per ADR-008
 * §"rejected list"). Each returns ProposalCandidates that the Phase F
 * writer voice-gates + cooldown-checks before committing.
 *
 * Per-workspace toggle gate: each generator checks
 * `workspace_profile.phase_f_proposals_enabled` (ADR-017 §Approved
 * pick 6) — if false, the generator returns [] immediately. Default
 * null = enabled.
 *
 * Pure logic + DB queries colocated here (Deno runtime). Pure
 * helpers are vitest-importable as TS.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
    PhaseFGeneratorContext,
    ProposalCandidate,
    SkillDefaultPayload,
    ObservationGeneratorPayload
} from "./phase-f-types.ts";

// ─── Pure helpers (vitest-importable, no Deno or DB) ─────────────────

/**
 * Canonical stable hash of an object for dedupe purposes. Sorts keys
 * recursively so {a:1,b:2} and {b:2,a:1} hash to the same string. Then
 * a small djb2 hash to keep the output to a fixed length.
 */
export function stableHash(value: unknown): string {
    const stringified = stableStringify(value);
    let h = 5381;
    for (let i = 0; i < stringified.length; i += 1) {
        h = (h * 33) ^ stringified.charCodeAt(i);
    }
    // Force unsigned + base36 for compact output.
    return (h >>> 0).toString(36);
}

function stableStringify(value: unknown): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) {
        return "[" + value.map(stableStringify).join(",") + "]";
    }
    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj).sort();
        return (
            "{" +
            keys
                .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
                .join(",") +
            "}"
        );
    }
    return JSON.stringify(value);
}

/**
 * Build the title for a skill-default proposal — peer voice, no
 * single-noun shorthand.
 */
export function buildSkillDefaultTitle(skillId: string): string {
    const human = humanizeSkillId(skillId);
    return `Make "${human}" default to your scheduled setup?`;
}

/**
 * Build the "what I noticed" line. Stays under 200 chars, plain
 * sentence, no buzzwords (voice-gated downstream).
 */
export function buildSkillDefaultWhatNoticed(
    skillId: string,
    fires: number
): string {
    const human = humanizeSkillId(skillId);
    return `You scheduled "${human}" and it has fired ${fires} times in the last 30 days without a parameter override.`;
}

export function buildSkillDefaultWhatChanges(skillId: string): string {
    const human = humanizeSkillId(skillId);
    return `Your scheduled parameters become the recipe default for "${human}". Manual runs land on the same configuration.`;
}

export function buildRecurringFocusTitle(room: string): string {
    return `Surface ${humanizeRoom(room)} in your weekly brief?`;
}

export function buildRecurringFocusWhatNoticed(
    room: string,
    count: number,
    windowDays: number
): string {
    return `You opened ${humanizeRoom(room)} ${count} times in the last ${windowDays} days.`;
}

export function buildRecurringFocusWhatChanges(room: string): string {
    return `A short read about ${humanizeRoom(room)} lands at the top of your weekly brief, so you do not have to think to start.`;
}

function humanizeRoom(room: string): string {
    return room
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function humanizeSkillId(skillId: string): string {
    return skillId
        .replace(/^\//, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Pure pattern-detection logic for G1. Tests pass synthetic fires +
 * params; production reads them from the DB.
 *
 * Input: a list of scheduled-skill rows + their fire counts + the
 * params they were scheduled with. Output: zero or more
 * SkillDefaultPayload candidates that pass the threshold.
 */
export interface SkillRow {
    readonly skill_id: string;
    readonly params: Readonly<Record<string, unknown>>;
    readonly successful_fires: number;
}

export const SKILL_FIRES_THRESHOLD = 5;

export function detectSkillDefaultCandidates(
    rows: ReadonlyArray<SkillRow>
): ReadonlyArray<SkillDefaultPayload> {
    const out: SkillDefaultPayload[] = [];
    for (const row of rows) {
        if (row.successful_fires < SKILL_FIRES_THRESHOLD) continue;
        out.push({
            skill_id: row.skill_id,
            params: row.params,
            based_on_fires: row.successful_fires,
            dedupe_hash: stableHash({
                kind: "skill_default",
                skill_id: row.skill_id,
                params: row.params
            })
        });
    }
    return out;
}

/**
 * Pure pattern-detection logic for G2. Counts focus events per room
 * across the recent_actions log window; surfaces rooms over threshold.
 */
export interface RoomFocusCount {
    readonly room: string;
    readonly focus_count: number;
}

export const RECURRING_FOCUS_THRESHOLD = 5;
export const RECURRING_FOCUS_WINDOW_DAYS = 14;

export function detectRecurringFocusCandidates(
    counts: ReadonlyArray<RoomFocusCount>
): ReadonlyArray<ObservationGeneratorPayload> {
    const out: ObservationGeneratorPayload[] = [];
    for (const c of counts) {
        if (c.focus_count < RECURRING_FOCUS_THRESHOLD) continue;
        out.push({
            generator_id: roomToBaseGenerator(c.room),
            variant_name: `weekly_focus_${c.room.replace(/-/g, "_")}`,
            filter: { room: c.room, source: "phase_f_recurring_focus" },
            dedupe_hash: stableHash({
                kind: "observation_generator",
                room: c.room,
                variant: "weekly_focus"
            })
        });
    }
    return out;
}

/**
 * Map a room to the base observation generator whose variant would
 * surface it. Most rooms map to deal_decay (deals are the dominant
 * unit of focus); a few have natural alternatives. Falls back to
 * deal_decay for rooms without a more specific generator.
 */
function roomToBaseGenerator(room: string): string {
    if (room === "signal-console") return "signal_decay";
    if (room === "poc-framework") return "proof_staleness";
    if (room === "discovery-studio") return "discovery_rhythm";
    return "deal_decay";
}

// ─── DB-bound generator wrappers (Deno runtime) ──────────────────────

export const SKILL_DEFAULT_GENERATOR_ID = "skill_default_refinement";
export const RECURRING_FOCUS_GENERATOR_ID = "recurring_focus";

/**
 * Check the operator's per-workspace toggle. Returns true (proposals
 * enabled) unless workspace_profile.phase_f_proposals_enabled was
 * explicitly set to false. Default null = enabled.
 */
async function proposalsEnabled(
    sb: SupabaseClient,
    workspaceId: string
): Promise<boolean> {
    const res = await sb
        .from("workspace_profile")
        .select("phase_f_proposals_enabled")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
    if (res.error || !res.data) return true;
    const v = (res.data as { phase_f_proposals_enabled?: boolean | null })
        .phase_f_proposals_enabled;
    if (v === false) return false;
    return true;
}

/**
 * G1 — skill_default_refinement.
 *
 * Reads scheduled_skills for the workspace + counts successful fires
 * per skill in last 30 days from scheduled_skill_fires. Skills past
 * threshold become candidates.
 */
export async function skillDefaultRefinementGenerator(
    ctx: PhaseFGeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ProposalCandidate>> {
    if (!(await proposalsEnabled(sb, ctx.workspaceId))) return [];

    const thirtyDaysAgo = new Date(
        Date.parse(ctx.nowIso) - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Read scheduled skills for the workspace.
    const skills = await sb
        .from("scheduled_skills")
        .select("id, skill_id, payload")
        .eq("workspace_id", ctx.workspaceId);
    if (skills.error || !Array.isArray(skills.data)) return [];

    // For each, count successful fires in the window.
    const rows: SkillRow[] = [];
    for (const s of skills.data) {
        const skillId = (s as { skill_id?: string }).skill_id;
        const params = (s as { payload?: Record<string, unknown> }).payload;
        if (!skillId) continue;
        const scheduledId = (s as { id?: string }).id;
        if (!scheduledId) continue;

        const fires = await sb
            .from("scheduled_skill_fires")
            .select("id", { count: "exact", head: true })
            .eq("scheduled_skill_id", scheduledId)
            .gte("fired_at", thirtyDaysAgo);
        const count =
            typeof fires.count === "number" && fires.count >= 0
                ? fires.count
                : 0;
        rows.push({
            skill_id: skillId,
            params: params ?? {},
            successful_fires: count
        });
    }

    const payloads = detectSkillDefaultCandidates(rows);
    return payloads.map((p) => ({
        kind: "skill_default" as const,
        title: buildSkillDefaultTitle(p.skill_id),
        what_noticed: buildSkillDefaultWhatNoticed(
            p.skill_id,
            p.based_on_fires ?? 0
        ),
        what_changes: buildSkillDefaultWhatChanges(p.skill_id),
        payload: p
    }));
}

/**
 * G2 — recurring_focus.
 *
 * Reads workspace_sessions.recent_actions for the workspace; counts
 * focus events per room in the last RECURRING_FOCUS_WINDOW_DAYS days;
 * surfaces rooms past threshold as proposed observation variants.
 */
export async function recurringFocusGenerator(
    ctx: PhaseFGeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ProposalCandidate>> {
    if (!(await proposalsEnabled(sb, ctx.workspaceId))) return [];

    const session = await sb
        .from("workspace_sessions")
        .select("recent_actions")
        .eq("workspace_id", ctx.workspaceId)
        .maybeSingle();
    if (session.error || !session.data) return [];
    const recent = (session.data as { recent_actions?: unknown[] })
        .recent_actions;
    if (!Array.isArray(recent)) return [];

    const cutoff =
        Date.parse(ctx.nowIso) -
        RECURRING_FOCUS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const perRoom = new Map<string, number>();
    for (const entry of recent) {
        if (!entry || typeof entry !== "object") continue;
        const e = entry as Record<string, unknown>;
        if (e["verb"] !== "focus" && e["verb"] !== "open") continue;
        const at = typeof e["at"] === "string" ? Date.parse(e["at"]) : NaN;
        if (!Number.isFinite(at) || at < cutoff) continue;
        const room = typeof e["room"] === "string" ? e["room"] : null;
        if (!room) continue;
        perRoom.set(room, (perRoom.get(room) ?? 0) + 1);
    }

    const counts: RoomFocusCount[] = Array.from(perRoom.entries()).map(
        ([room, focus_count]) => ({ room, focus_count })
    );
    const payloads = detectRecurringFocusCandidates(counts);

    return payloads.map((p) => ({
        kind: "observation_generator" as const,
        title: buildRecurringFocusTitle((p.filter as { room: string }).room),
        what_noticed: buildRecurringFocusWhatNoticed(
            (p.filter as { room: string }).room,
            perRoom.get((p.filter as { room: string }).room) ?? 0,
            RECURRING_FOCUS_WINDOW_DAYS
        ),
        what_changes: buildRecurringFocusWhatChanges(
            (p.filter as { room: string }).room
        ),
        payload: p
    }));
}

// ─── Registry ───────────────────────────────────────────────────────

export interface PhaseFRegisteredGenerator {
    readonly id: string;
    readonly run: (
        ctx: PhaseFGeneratorContext,
        sb: SupabaseClient
    ) => Promise<ReadonlyArray<ProposalCandidate>>;
}

export const PHASE_F_GENERATORS: ReadonlyArray<PhaseFRegisteredGenerator> = [
    { id: SKILL_DEFAULT_GENERATOR_ID, run: skillDefaultRefinementGenerator },
    { id: RECURRING_FOCUS_GENERATOR_ID, run: recurringFocusGenerator }
];
