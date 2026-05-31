# ADR-010 — Skills layer (Phase C of the orchestration layer)

**Status:** Approved by founder 2026-05-31
**Date:** 2026-05-31
**Builds on:** ADR-004 (orchestration foundation), ADR-008 (additive boundary), ADR-009 (workspace-scope observations)

---

## Context

Phase A shipped the session model + observations ledger + heartbeat (2026-05-19). Phase B shipped four workspace-scope generators + the Dashboard "this week's reads" card (2026-05-31, ADR-009). With the system now writing its own observations, the natural next phase is the **Skills layer** — what ADR-004 §Phasing called "Phase C (skills layer) — markdown skill recipes, executor, Ctrl+K picker, 3-5 starter skills."

ADR-008's rejected list explicitly bans **runtime-LLM-in-skills**. Skills are deterministic composition of existing room engines. The architecture is: operator triggers a skill from the Cmd+K palette → a parser reads the recipe → a dispatcher runs the recipe's declared actions → the operator lands in the right room with the right context. No LLM call ever.

## Decision

Skills are **deterministic markdown recipes** that compose existing room engines via cross-room continuity params. They surface as Cmd+K palette entries alongside rooms. Five starter skills cover the main cross-room flows.

### Six locked design points

1. **Recipe format**: Markdown with YAML frontmatter (Claude-Code convention). Frontmatter declares the action + parameters; the markdown body is human-readable documentation surfaced in the palette description and a help panel.

2. **Storage**: Bundled with the app at `src/skills/recipes/*.md`. Operator-authored skills are deferred to Phase F per canon Part II.5 §7 "bounded self-modification." Bundling avoids a Supabase round-trip on Cmd+K open and keeps the recipe set audit-reviewable in git.

3. **Action union (v1)**: three actions, no more:
   - `route` — navigate to a static URL (rarely used; rooms cover this)
   - `compose-context-and-route` — read state from one or more sources, build a target URL with continuity params, navigate
   - `filter-and-route` — apply a filter expression to a source collection, pass the resulting id(s) to the target room via URL param
   No branching, no loops, no conditional logic. v1 covers the cross-room compositions Phase 4 already enabled via continuity params.

4. **Skills are pure navigation**: the operator's result is the room they land in. No modals, no inline output, no skill-specific UI surface. The room's existing UI handles whatever state the skill pre-loaded. This keeps Skills additive to the shipped rooms (per ADR-008's additive boundary) and avoids inventing new product surfaces.

5. **Cmd+K integration**: extends the existing `src/lib/palette/` registry. Skills appear as a new entry kind alongside rooms, distinguished by a SKILL kicker. The palette's existing filter (`filterRooms`) is generalized to filter both rooms and skills.

6. **Five starter skills** — covering the cross-room flows the system has data for as of Phase B:
   - `triage-week-reads` — opens the Dashboard's WeekReadsCard with focus on undismissed observations
   - `prep-next-call` — reads Call Planner's most-recent agenda + drops into Discovery Studio with `?account=<X>`
   - `whats-at-risk` — opens Deal Workspace's intervention board filtered to top-5 stalled
   - `cast-proof-for-hottest-deal` — opens PoC Framework with `?deal=<top-pressure>` pre-filled
   - `compose-this-weeks-outbound` — opens Outbound Studio with `?account=<hottest>` from Signal Console

### What this is NOT

- **Not an LLM agent.** Recipes are static markdown read once at parse time; the dispatcher runs deterministic JavaScript. ADR-008's runtime-LLM-in-skills rejection holds.
- **Not a workflow engine.** No branching, no conditionals, no scheduled execution. (Scheduled skills are Phase E per ADR-004 §Phasing.)
- **Not operator-authored.** v1 bundles a curated set in `src/skills/recipes/`. Operator-authoring is Phase F.
- **Not a new product surface.** Skills surface in the Cmd+K palette the operator already uses; the result lands in a shipped room. No skill-specific modal, no skill-specific panel.

## Alternatives considered

**Inline UI panel per skill** (skill executes → result renders in a panel). Rejected because it adds a new product surface and breaks the "skills are additive" boundary. Forces every skill author to design a panel.

**Direct execution without palette** (e.g., per-room "Try this skill" buttons). Rejected because it scatters the entry points. Cmd+K is the canonical "summon any room access" affordance per canon Part II §5; skills extend that contract.

**JSON or TOML recipes**. Markdown wins because the body is naturally human-readable (the palette description + a future help panel can use it directly). Frontmatter handles the structured bits.

**LLM at runtime** (recipe describes intent, LLM picks actions). Rejected by ADR-008. Deterministic dispatch keeps skills auditable + free.

## Implementation plan (Phase C build)

Single branch, 10 waves, single PR.

| Wave | Scope |
|---|---|
| 1 | This ADR + canon updates (Part II.5 §7 Phasing reframe — Phase C in scope; Part V §6 session-log entry) |
| 2 | Skill recipe parser: YAML frontmatter + markdown body → typed `Skill` record |
| 3 | Action dispatcher: typed action union + URL builders for each action |
| 4 | Skill registry: bundled `.md` files loaded at build time + a typed `ALL_SKILLS` export |
| 5 | Cmd+K palette extension: register skills alongside rooms; filter generalized; SKILL kicker distinguished from family kickers |
| 6 | Starter skill: `triage-week-reads` |
| 7 | Starter skill: `prep-next-call` |
| 8 | Starter skill: `whats-at-risk` (Deal Workspace filter URL — may require adding a `?filter=` URL inbound to Deal Workspace) |
| 9 | Starter skills: `cast-proof-for-hottest-deal` + `compose-this-weeks-outbound` |
| 10 | E2E smoke + final sweep |

CI gates: typecheck + vitest + Playwright + Vite build, all green before merge.

## Voice rule

Skill recipe descriptions (rendered in the palette + future help) MUST pass canon Part III §11. The Voice Document validator from `src/lib/voice/voice-document.ts` runs against every skill's description at parse time; recipes that fail are rejected at build time (test in CI).

## Authority

This ADR + the per-skill `.md` files in `src/skills/recipes/` + the parser/dispatcher in `src/skills/`. The action union is the binding contract; new actions require a new ADR.
