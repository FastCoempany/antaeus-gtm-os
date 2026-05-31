import { parseSkill } from "./parser";
import type { Skill } from "./types";

import triageWeekReadsMd from "../recipes/triage-week-reads.md?raw";
import prepNextCallMd from "../recipes/prep-next-call.md?raw";
import whatsAtRiskMd from "../recipes/whats-at-risk.md?raw";
import castProofMd from "../recipes/cast-proof-for-hottest-deal.md?raw";
import composeOutboundMd from "../recipes/compose-this-weeks-outbound.md?raw";

/**
 * Skill registry — the bundled v1 set per ADR-010 §"Five starter
 * skills."
 *
 * Each recipe is loaded as a raw markdown string via Vite's ?raw
 * suffix at build time, parsed into a typed Skill, and exported as
 * part of `ALL_SKILLS`. Parse failures throw at module load —
 * recipes that smuggle in voice violations or malformed YAML fail
 * the build, not at runtime.
 *
 * Adding a skill: drop a .md file in src/skills/recipes/, add the
 * import + entry below, ship.
 */

const RECIPE_SOURCES: ReadonlyArray<readonly [string, string]> = [
    ["triage-week-reads", triageWeekReadsMd],
    ["prep-next-call", prepNextCallMd],
    ["whats-at-risk", whatsAtRiskMd],
    ["cast-proof-for-hottest-deal", castProofMd],
    ["compose-this-weeks-outbound", composeOutboundMd]
];

function loadAll(): ReadonlyArray<Skill> {
    const skills: Skill[] = [];
    for (const [expectedId, src] of RECIPE_SOURCES) {
        const result = parseSkill(src);
        if (!result.ok) {
            throw new Error(
                `Skill recipe "${expectedId}" failed to parse: ${result.error}`
            );
        }
        if (result.skill.id !== expectedId) {
            throw new Error(
                `Skill recipe at "${expectedId}.md" declares id "${result.skill.id}"; filename + id must match.`
            );
        }
        skills.push(result.skill);
    }
    return skills;
}

export const ALL_SKILLS: ReadonlyArray<Skill> = loadAll();

/**
 * Filter the skill registry by free-text query. Matches against label,
 * description, and keywords. Returns the full registry on empty query.
 */
export function filterSkills(
    query: string,
    skills: ReadonlyArray<Skill> = ALL_SKILLS
): ReadonlyArray<Skill> {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return skills;
    return skills.filter((s) => {
        if (s.label.toLowerCase().includes(q)) return true;
        if (s.description.toLowerCase().includes(q)) return true;
        if (s.keywords.some((k) => k.toLowerCase().includes(q))) return true;
        return false;
    });
}

export function findSkillById(id: string): Skill | null {
    return ALL_SKILLS.find((s) => s.id === id) ?? null;
}
