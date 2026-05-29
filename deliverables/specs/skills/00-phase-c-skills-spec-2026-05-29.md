# Phase C — Skills Layer Spec

**Date:** 2026-05-29
**Status:** Draft for founder review
**Governing ADR:** ADR-008 (orchestration doctrine + additive boundary)
**Phase:** C of the orchestration arc (A shipped; B via Briefing; C is next)

---

## What a skill is (one paragraph)

A skill is a saved recipe that composes what several rooms already know
into one output, invoked in one move. The operator types
`pre-call brief Meridian` into the Ctrl+K palette; the system reads the
relevant engines (Discovery Studio's open questions, Deal Workspace's
vitals, Advisor Deploy's coverage, Call Planner's agenda) for the
focused account and hands back a single composed brief. It is a **fixed,
deterministic recipe** — same inputs produce the same output, no LLM at
runtime, no surprise behavior. It is authored in plain-English markdown
so a non-developer can write one. It is additive: it reads existing
room engines and renders a composition; it does not change any room.

---

## The decision locked in the source conversation

Per the OpenClaw-inspiration conversation (`deliverables/openclaw/`) and
ADR-008 §rejected-list, Antaeus skills are **Option 1 — pure
deterministic.** A skill composes existing hand-written room engines via
a template. It does NOT summon an LLM to interpret instructions at
runtime (that is OpenClaw's model; it is explicitly rejected as
CRM-with-AI territory). A later Option-2 hybrid may let a *specific*
skill opt into an LLM for the narrow case where no deterministic engine
can do the work (e.g. writing an email body) — but that is not Phase C.0
and not the default.

---

## Scope: what Phase C.0 builds, and what it defers

Phase C is large. This spec carves the **C.0 foundation slice** — the
part that is cleanly buildable now, fully additive, and useful
standalone — and explicitly defers the rest with reasons. This carving
is the whole point of the spec: it prevents the half-built-feature trap.

### In scope (C.0)

1. **A skill file format** — markdown with a small frontmatter header.
   See §"Skill file format" below.
2. **A skill registry** — the set of available skills, parsed at build
   time (skills ship in-repo for C.0; operator-authored skills come
   later). Mirrors the shape of `src/lib/palette/registry.ts`.
3. **A deterministic executor** — parses a skill, reads the named room
   engines for the focused object, composes the output via the skill's
   template. Pure functions, fully unit-testable. No network beyond the
   reads the engines already do, no LLM.
4. **Ctrl+K palette integration** — the existing palette
   (`src/lib/palette/`) gains a skills section alongside rooms. Typing a
   skill name + an account runs it.
5. **One real skill: `pre-call-brief`** — the cleanest pure-composition
   case. Reads Discovery + Deal Workspace + Advisor + Call Planner for
   the focused account; renders a one-page brief inline. Writes nothing.
6. **An inline render surface** — where the composed output appears when
   a skill is run by hand. For C.0 this is a modal/overlay summoned from
   the palette (NOT a new room, NOT a change to any existing room).

### Deferred (with reasons)

- **Auto-running skills** ("fire the pre-call brief 24h before the
  calendar event"). Needs Phase E (scheduling) + Phase D (a quiet place
  to land the output). Building auto-run now = a feature with nowhere to
  surface. **Defer to after D + E.**
- **`weekly-pipeline-review` + the observation-shaped half of
  `post-loss-debrief`.** These produce what are effectively
  *workspace-scope observations* (decaying/advancing/stuck deals with
  the system's read on each). That overlaps directly with the open
  question ADR-008 flagged: do we build a separate workspace-scope
  observation stream, or let the Briefing's Watchlist Trigger grammar
  cover it? **Defer until the founder answers that question** — building
  these skills now risks conflicting with how it resolves.
- **Operator-authored skills** (skills written by the operator at
  runtime, stored in Supabase). C.0 ships skills in-repo. Operator
  authoring is a later C.x once the format + executor are proven.
- **The birdseye strip** as a landing surface. That is Phase D.

### The clean C.0 boundary

Everything in C.0 is: **manual-invoke, inline-render, reads-only,
zero room changes, no scheduling, no observation writes.** That is the
slice with no upstream dependency and no decision debt. It proves the
skills direction and is independently useful (a one-move pre-call brief
is worth having on its own).

---

## Skill file format (proposed)

```markdown
---
id: pre-call-brief
label: Pre-Call Brief
description: Assemble the brief for the next call on the focused account
inputs:
  - focused-account        # the executor requires a focused account
reads:
  - discovery-studio        # named engines the executor will pull from
  - deal-workspace
  - advisor-deploy
  - call-planner
output: inline-modal        # C.0 only supports inline-modal
writes: none                # C.0 skills never write
---

# Pre-Call Brief

## Who's in the room
{{deal-workspace.economic_buyer}}, {{deal-workspace.champion}}

## What we learned last call
{{discovery-studio.recent_learned_facts}}

## What's still unknown
{{discovery-studio.open_questions}}

## What to ask for
{{call-planner.advance_ask}}

## Advisor coverage
{{advisor-deploy.coverage_for_account}}
```

The header is structured (machine-parsed). The body is a template with
`{{engine.field}}` placeholders the executor resolves against the named
engines. Unresolved placeholders render as an honest "not yet captured"
line, never a crash (defensive, per the Phase 4 parser doctrine).

**Open design question for the build PR (not blocking this spec):**
whether the body template is a fixed set of supported placeholders
(safest, most predictable) or a small expression grammar. Recommendation:
fixed placeholder set for C.0 — each skill declares the engine fields it
reads, the executor resolves a known map. No grammar to parse, no
injection surface.

---

## Executor contract (proposed)

```
runSkill(skill: Skill, ctx: { focusedAccount: AccountRef }): SkillResult
```

- Pure function. Given a parsed skill + a focused-object context, returns
  a composed result (the filled template + metadata: which fields
  resolved, which were missing).
- Reads happen through the same room-engine read paths the rooms use
  (the typed engines under each room's `lib/`). No new data access.
- No writes. No network beyond what the engine reads already do. No LLM.
- Fully unit-testable: feed it a skill + a fixture account, assert the
  composed output + the resolved/missing field accounting.

The reads are the one genuine integration cost: the executor needs a
stable read surface per room. Some rooms already expose a `getState()`
adapter (the Briefing's read contracts, canon §6); where they don't,
C.0's `pre-call-brief` defines the minimal read it needs per room and we
add a thin typed reader. This is additive — a read accessor, not a room
change.

---

## Why this is additive (the boundary check, per ADR-008)

- No shipped room is restructured. Skills read room engines; they don't
  modify rooms.
- The Briefing is untouched (ADR-008 hard rule).
- The Ctrl+K palette gains a section — additive, the palette was built
  to be registry-driven.
- The render surface is a summoned modal — additive, not a new room and
  not a change to an existing one.
- No schema changes in C.0 (skills ship in-repo; no operator-authored
  storage yet).

---

## Test plan (C.0)

- Skill parser: header parse + defensive handling of malformed headers.
- Executor: composition over a fixture account; resolved-vs-missing
  field accounting; missing-field renders honest line not crash.
- `pre-call-brief` end-to-end: fixture account with partial data →
  assert the brief composes + flags the gaps.
- Palette integration: a Playwright walk — Ctrl+K, type the skill,
  pick an account, see the brief modal.

---

## PR sequence (proposed)

- **C.0a** — skill file format + parser + registry + executor (pure
  logic + tests). No UI. Ships the engine.
- **C.0b** — `pre-call-brief` skill + the per-room read accessors it
  needs + executor wiring. Tests.
- **C.0c** — Ctrl+K palette integration + the inline-modal render
  surface + Playwright walk.

Three small PRs, each green before the next. Each is additive; none
touches a shipped room's structure.

---

## What this spec does NOT decide (founder calls)

1. **The workspace-scope observation question** (ADR-008). Until
   answered, `weekly-pipeline-review` + the observation-shaped skills
   stay deferred. C.0 does not depend on the answer because
   `pre-call-brief` writes nothing.
2. **Operator-authored skills + storage.** C.0 ships in-repo skills only.
3. **The render surface's eventual home.** C.0 uses a summoned modal;
   when Phase D's birdseye strip exists, skill output may also land
   there. Not decided here.

---

## Recommendation

Build C.0a → C.0b → C.0c as three additive PRs. It is the cleanest
genuinely-unbuilt orchestration work, it touches no shipped room, and
`pre-call-brief` is useful the day it ships. Hold the
observation-shaped skills until the founder answers the workspace-scope
question; hold auto-run until D + E exist.
