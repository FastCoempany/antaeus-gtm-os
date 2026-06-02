/**
 * Phase F (ADR-017 PR 4) — workspace skill-override reader.
 *
 * The dispatcher calls `loadSkillOverride(skillId)` on every skill
 * invocation. If the operator's workspace has an active override
 * (workspace_skill_overrides row matching `skill_id`), the dispatcher
 * merges the override params into the URL it built from the recipe.
 *
 * Defensive throughout — failures degrade to "no override," so a
 * temporary network glitch never blocks a routine skill dispatch.
 */

import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

export interface SkillOverride {
    readonly skillId: string;
    readonly params: Readonly<Record<string, unknown>>;
}

export async function loadSkillOverride(
    skillId: string,
    opts: { readonly data?: DataClient } = {}
): Promise<SkillOverride | null> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceSkillOverrides.list({
            where: { skill_id: skillId } as never,
            limit: 1
        });
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const row = rows[0] as unknown as {
            skill_id?: string;
            params?: Record<string, unknown> | null;
        };
        if (!row.skill_id) return null;
        return {
            skillId: row.skill_id,
            params: row.params ?? {}
        };
    } catch (err) {
        reportError(err, { op: "skills.loadSkillOverride", skill_id: skillId });
        return null;
    }
}
