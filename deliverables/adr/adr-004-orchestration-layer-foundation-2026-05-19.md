# ADR-004 — Orchestration Layer Foundation

**Date:** 2026-05-19
**Status:** Approved
**Supersedes:** None
**Depends on:** ADR-001 (Foundation Stack), ADR-002 (Phase 2 Data Architecture), ADR-003 (Refacing Completion)

---

## Context

Antaeus today is structurally a passive workspace. Every room reads from + writes to its own slice of Supabase / localStorage. Continuity params (canon §6) carry state between rooms via URL strings. Every action requires the operator to be present and clicking. Background activity is limited to cloud sync — there is no concept of time passing on the system, no concept of the system having its own observations or behaviors that emerge between user sessions.

This is the right shape for a workspace that "stores what the operator types in." It is the wrong shape for a workspace that **has its own voice across time**.

The OpenClaw architecture (Krentsel, May 2026) maps cleanly onto a deeper truth that surfaces in Antaeus's own canon §3 architectural truths:

> "Intelligence is native system truth, not side analysis. Signals, discovery notes, proof state, readiness, workspace health — these are not reports about the system. They *are* the system. Rooms read and write them as native state."

The current implementation honors this for the rooms (each carries its own native state). It does not yet honor it for the **system as a whole**. The system does not write its own observations. It does not notice patterns over time. It does not surface things that emerge between user sessions. It has no opinions of its own.

This ADR introduces the **orchestration layer** beneath the rooms: a foundational layer that gives Antaeus a heartbeat, a session model that all rooms read from + write to, and an observations ledger where the system writes what it has noticed. It is the layer that lets Antaeus become a workspace the operator opens to see what is pulling, rather than a workspace the operator opens to file things into.

---

## Decision

Adopt a four-component orchestration layer beneath the existing room architecture, in this order:

1. **Session model** — a workspace-scoped session object that carries the operator's current focused object across all rooms. Real-time synced via Supabase Realtime. Cross-tab consistent. Replaces the URL-string limitations of continuity params with a structured shared context.

2. **Heartbeat** — a server-side cron process (Supabase Edge Function + scheduled trigger) that wakes up every N minutes, reads each workspace's state, and calls registered observation generators. Gives the system a sense of time independent of the operator.

3. **Observations ledger** — a Supabase table where the system writes its own observations of the workspace. Each observation is a plain-English sentence the system authored (not a metric, not a chart). Workspace-scoped via RLS, append-with-dismissal model, surfaces to rooms via the data-client.

4. **Skills layer** *(Phase C, not Phase A)* — markdown recipes that compose existing room engines deterministically. Authored cheaply, no LLM at runtime, executed by a parser+dispatcher.

This ADR scopes Phase A: the foundation that makes the rest possible. Phases B-F implement progressively visible surfaces on top of this foundation. See "Phasing" below.

---

## What the system writes is not what a CRM writes

A critical distinction that this ADR has to defend explicitly, because the line is easy to slide across.

A CRM's "observation" is a number in a report: *"win rate by champion role: VP Ops 78%, CTO 12%."* An Antaeus observation is a sentence written like a peer would say it: *"VP Ops is the champion role you close on. Three deals at the $50K band confirm the pattern. Don't waste cycles on CTO-led deals at this stage."*

Five rules keep us out of CRM territory:

1. **Format is prose, not metric.** A peer would say "Tuesday mornings get 3x the replies," not show a chart with two bars. The system writes sentences.
2. **Sharp, not exhaustive.** A CRM dashboard tries to surface everything; the Antaeus ledger surfaces one thing at a time — the read that is actually pulling — the rest stays invisible until pulled.
3. **It feeds back into the system's behavior, not just into a report.** A CRM observation lives in a Tuesday-afternoon dashboard the operator may or may not open. An Antaeus observation changes what the system recommends — the Dashboard's ranking shifts, the Outbound Studio suggests new send-windows, the Founding GTM Kit gets a new paragraph in §1.
4. **Names the why, not just the what.** A CRM says "5 deals stuck >30 days in evaluation." Antaeus says "5 deals stuck in evaluation. All 5 are missing the decision-maker confirmation step. That's the same pattern from the two losses last quarter."
5. **It has a destination — making the workspace inheritable.** The observation is not "for the operator to feel informed." It is "what the first hire needs to know on Monday morning." Authored, prescriptive, opinionated. CRMs aspire to be neutral systems of record; the Antaeus ledger explicitly takes positions.

The format IS the differentiation. If we ship a "Win Rate by Champion Role" chart we are a CRM. If we ship a paragraph in Founding GTM §1 that says "stop selling to CTOs at this band" — that is Antaeus.

---

## Architecture

### Session model

```typescript
interface WorkspaceSession {
  readonly id: string;                    // uuid
  readonly workspaceId: string;
  readonly focusedObjectType: FocusedObjectType | null;
  readonly focusedObjectId: string | null;
  readonly focusedObjectName: string | null;  // denormalized for fast strip render
  readonly focusedObjectRoom: RoomId | null;  // which room is "the home" for this object
  readonly recentActions: ReadonlyArray<SessionAction>;  // last 20 cross-room actions
  readonly createdAt: string;
  readonly updatedAt: string;
}

type FocusedObjectType =
  | "account"  | "deal"   | "signal"  | "call"   | "proof"
  | "advisor"  | "focus"  | "approach";
```

One session per workspace, mutated by any room. Real-time synced — when the operator focuses Meridian in Signal Console, every other open tab + every other room sees the focus change.

Storage: new Supabase table `workspace_sessions` (one row per workspace, upsert pattern). Realtime subscription via `data.workspaceSessions.subscribe()`.

Read API: `getCurrentSession()`, `subscribeToSession(handler)`, both exported from `src/lib/session/`.

Write API: `setFocusedObject(type, id, name, room)`, `pushRecentAction(action)`, `clearFocus()`.

Cross-tab consistency comes free from Supabase Realtime — every tab subscribes to the same row.

### Heartbeat

A Supabase Edge Function at `supabase/functions/heartbeat/index.ts`, invoked by a scheduled trigger every 30 minutes.

Pseudocode:

```typescript
async function heartbeat() {
  const workspaces = await listActiveWorkspaces();
  for (const workspace of workspaces) {
    const state = await loadWorkspaceState(workspace.id);
    for (const generator of REGISTERED_GENERATORS) {
      const observations = generator(state);
      for (const obs of observations) {
        await maybeWriteObservation(workspace.id, obs);
      }
    }
  }
}
```

Phase A ships the heartbeat skeleton with `REGISTERED_GENERATORS = []`. Phase B registers the first generator (signal-decay detection). Subsequent phases register more.

`maybeWriteObservation` dedupes — does not write the same observation text twice for the same object within a configurable window.

Frequency is workspace-aware: workspaces with no activity in 7+ days skip heartbeat. Workspaces actively used get full 30-min cadence.

### Observations ledger

New Supabase table `observations`. Schema:

```sql
create table public.observations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    written_at timestamptz not null default now(),
    observation_text text not null,
    related_object_type text,            -- account/deal/signal/proof/focus/etc, nullable
    related_object_id text,               -- nullable
    source_generator text not null,       -- which generator wrote this
    confidence text,                       -- 'high'/'medium'/'low', nullable
    status text not null default 'active',-- active/dismissed/superseded
    superseded_by uuid references public.observations(id) on delete set null,
    dismissed_at timestamptz,
    dismissed_reason text
);
```

RLS: workspace-scoped (read for all members, write reserved for the service role i.e. the heartbeat Edge Function).

Append-with-dismissal model: observations are never hard-deleted, only marked dismissed or superseded. This preserves the audit trail of what the system noticed and when.

### Why a session AND a ledger, not just one

The session is the operator's CURRENT context. The ledger is the system's MEMORY OF WHAT IT HAS NOTICED. Different shapes, different consumers, different update patterns.

- Session: ~1 row per workspace, updated frequently (every focus change), read by every room
- Ledger: many rows per workspace, written by the heartbeat, read by the Dashboard + Founding GTM + the birdseye strip

---

## Phasing

This ADR scopes Phase A only. Subsequent phases land as their own work, each independently shippable:

| Phase | Visible | Scope |
|---|---|---|
| **A** Foundation | Invisible | Session model, heartbeat skeleton, observations ledger, this ADR, canon update |
| **B** First observable signal | Yes | One observation generator (signal-decay detection), "This week's reads" card on the Dashboard |
| **C** Skills layer | Yes | Markdown skill files, executor, Ctrl+K picker, 3-5 starter skills |
| **D** Birdseye strip + inter-room push | Yes | Strip on every room, wired to session + ledger + push queue, inline observation kickers |
| **E** Operator scheduling | Yes | "Remind me Friday", scheduled skill execution, the full "Antaeus has a calendar" feeling |
| **F** Bounded self-modification | Yes | System refines skill defaults from usage, system proposes new observations from patterns |

Each phase produces a real shippable capability. Stops at any phase boundary leave nothing dangling.

---

## Tradeoffs + risks

**Cost of getting it right:** Phase A alone is 8-12 hours of work. The full arc through Phase F is 80-120 hours. This is not a quick build.

**Backward compatibility:** The session model REPLACES the implicit "current focus" logic that lives today in continuity params + room-local state. Existing rooms continue to work via continuity params during the transition; they progressively read from the session as Phases B-F land.

**Cron reliability:** Supabase scheduled functions are pg_cron-based. We use 30-min cadence to avoid hammering the DB. If a heartbeat fails, the next one will pick up — observations are dedupe-on-write so missed runs don't duplicate.

**LLM-at-runtime question:** This ADR does NOT introduce LLM-at-runtime behavior. Observations are written by deterministic generators that read structured state and pattern-match. Phase C skills are pure-deterministic (Option 1 from the design discussion). LLM-at-runtime is a possible Phase F+ extension, NOT scoped here.

**Privacy + trust:** Observations are workspace-scoped, never cross-workspace. The system never writes observations about people, only about the operator's own workspace data. There is no analytics share-out, no benchmarks against other workspaces.

---

## Test plan

Phase A is invisible but heavily tested at the foundation level:

- Session model: types pass typecheck, signals layer + Supabase subscription wired, helpers exposed, ~15-20 unit tests covering set/get/subscribe/clear + cross-tab consistency (mocked Realtime)
- Observations ledger: Supabase migration applied + verified, RLS policies hold (workspace isolation + service-role-only writes), ~10 unit tests for the writer/reader interfaces
- Heartbeat skeleton: Edge Function deployable, schedule trigger registered, empty-registry run succeeds + logs, dedupe logic tested
- Canon update: CLAUDE.md adds new section documenting the orchestration layer; ADR-004 (this file) lands in deliverables/adr/

Gates that hold throughout Phase A:
- typecheck clean
- vitest passes (current baseline 1763/1763 + new Phase A tests)
- Playwright 260/260 still passes (no UI changes in Phase A so the suite stays green)

---

## Open questions resolved by this ADR

- **Q: Is this Antaeus becoming an autonomous agent?** No. The system writes observations but does not take autonomous actions. Every action remains operator-driven. The system has a voice; it does not have hands.

- **Q: Does this replace the rooms?** No. Rooms are the operator's authored surfaces. The orchestration layer is the system's read of what's happening across them. Both layers coexist.

- **Q: Is this CRM territory?** No. See "What the system writes is not what a CRM writes" above.

- **Q: When do operators start seeing the value?** Phase B (next phase) ships the "This week's reads" card on the Dashboard. That's the first visible payoff.

---

## References

- canon §3 architectural truths (object-first, command-first, intelligence is native system truth)
- canon §4.19 Founding GTM / Handoff Kit (the existing manually-authored equivalent of the observations ledger)
- canon Part III §11 voice rule (every observation the system writes must pass this)
- ADR-001 (foundation stack — the infrastructure this builds on)
- ADR-002 (data architecture — the Supabase + workspace-scoping this extends)
- ADR-003 (refacing completion — establishes the "first-fold sentence-shaped headline" pattern observations will populate)
- OpenClaw architecture deep-dive by Alex Krentsel (May 2026), the architectural precedent for the heartbeat + session + observations pattern adapted here
