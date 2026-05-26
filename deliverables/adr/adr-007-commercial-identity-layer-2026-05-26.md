# ADR-007 — Commercial Identity Layer

**Date:** 2026-05-26
**Status:** Approved (founder, 2026-05-26)
**Supersedes:** none
**Amends:** the B.0c Read Interface Contracts (`deliverables/specs/briefing/signal_console_gtm_os_read_interface_contracts_v0.1.md`) where they misattribute data to rooms that don't own it (see §4).

---

## 0. Context

The Briefing room (ADR-006) is meant to deliver *category-specific* intelligence — a read of the world the operator is selling into, anchored on what they sell and who they compete with. Building toward that surfaced a foundational gap: **the product has no commercial-identity layer.**

A cross-room audit (2026-05-26) of all 14 cloud-backed rooms found that:

1. **No room captures what the operator sells.** Every room is inbound-focused — ICP (who we sell to), accounts (targets), deals (opportunities), outbound (messages to prospects). Nothing captures the operator's own product category or value proposition. The system understands everyone except itself.
2. **No room captures a named competitive set.** Deal Workspace has a free-text `competition` field per deal, but there is no curated, structured "these are the companies we compete with" anywhere.
3. **Signal Console accounts have no relationship type.** Accounts carry a priority `tier` but no flag for prospect vs competitor vs partner vs customer — so a competitor cannot even be represented as a tracked entity.

This is the seed the Briefing needs, and it does not exist. Category-specific intelligence is *defined by* product category + competitive set; without them as structured data, the Briefing can only produce generic news.

The audit also confirmed the persistence layer is healthy: 14 rooms are cloud-backed and cross-device safe. Two rooms (Onboarding, Future Autopsy) hold real work product but are browser-bound — tracked as separate bug fixes, with the Onboarding fix folded into this ADR's `workspace_profile` table (§2).

## 1. Decision

Introduce a **commercial-identity layer** as the single source of truth for the operator's own selling identity, composed of three pieces, each with exactly one home (no duplication, no drift):

### 1.1 Workspace profile — what we sell

A new `workspace_profile` table, **one row per workspace**, holding the company-level commercial identity:

- `product_category` — the category the operator competes in, in their words
- `what_we_sell` — a short description of the offering
- `value_prop` — the core value proposition

This is workspace-level because a company sells one thing and competes in one category, even when it has multiple ICP segments. It is **edited in ICP Studio** — the natural room for declaring commercial identity, and the room the Briefing already treats as a seed source — not in a parallel Briefing-owned config (which would duplicate and drift).

The same table also carries **onboarding state** (`onboarding_completed`, `onboarding_answers`), because onboarding completion is a workspace-level fact and was previously browser-bound (localStorage only), causing re-onboarding on device switch. Folding it here fixes that cross-device bug in the same migration.

### 1.2 Competitive set — who we compete with

**A competitor is a Signal Console account flagged with `relationship_type = "competitor"`.**

Rather than a separate competitor list (which would duplicate company names already in the accounts table and drift from them), we add a `relationship_type` column to `signal_console_accounts`:

```
relationship_type ∈ { prospect, competitor, partner, customer }   default: prospect
```

The competitive set becomes a view over accounts flagged `competitor`. Consequences:

- **Single source of truth**: a company is a company. Its relationship to the operator is one field, not a duplicate record in a second table.
- **Competitors get signal tracking + heat for free** — they're already accounts; flagging one a competitor means its signals are tracked like any other account.
- **Signal Console becomes the literal substrate of competitive intelligence** the Briefing reads from — reinforcing the ADR-006 substrate/surface split (Signal Console = substrate, Briefing = surface).

### 1.3 The Briefing seeds from all three

The Briefing's Context Hydration reads:

- `product_category` + `value_prop` (workspace profile) → anchors relevance scoring + synthesis context
- ICP `industry` / `primary_buyer` (ICP rows) → category-narrative queries
- competitor-flagged accounts (Signal Console) → drives the watchlist-specific source queries (HN search terms, Wikipedia article tracking, GitHub repo watching, page-diff URLs)

This is what makes the intelligence category-specific instead of generic B2B news.

## 2. Schema

```sql
create table public.workspace_profile (
    workspace_id uuid primary key references public.workspaces(id) on delete cascade,
    product_category text,
    what_we_sell text,
    value_prop text,
    onboarding_completed boolean not null default false,
    onboarding_answers jsonb not null default '{}'::jsonb,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- workspace-scoped RLS; one row per workspace (PK is workspace_id)

alter table public.signal_console_accounts
    add column relationship_type text not null default 'prospect'
    check (relationship_type in ('prospect', 'competitor', 'partner', 'customer'));
```

## 3. Single-source-of-truth invariants (binding)

1. Product category / value prop live **only** in `workspace_profile`. No room copies them into its own store. Rooms that need them read `workspace_profile`.
2. The competitive set lives **only** as `relationship_type` on accounts. No separate competitor table. Deal Workspace's free-text `competition` field may later reference account ids, but the canonical list is the relationship-flagged accounts.
3. The Briefing **reads** all of this. It never writes commercial identity — that's authored in ICP Studio (profile) + Signal Console (relationship flags).

## 4. Correction to the B.0c Read Interface Contracts

The audit found the B.0c contracts assumed data layouts that don't match the rooms:

- The **objection bank** was attributed to Call Planner. Call Planner is purely form-driven and owns no objections. Objections live in **Discovery Studio's** framework data (`objectionLibrary`). The Briefing's objection read must target Discovery Studio, not Call Planner.
- The Discovery contract expects **phases with questions**; the real model is Framework → Segment → Node → Branch and needs a translation layer, not a direct field read.

The Briefing adapter rewrite (the build step following this ADR) reconciles the adapters against the real room data models rather than the idealized contract shapes. The contract spec is annotated accordingly.

## 5. Alternatives considered

- **Parallel Briefing-owned config** (product category + competitors stored by the Briefing). Rejected: duplicates data the operator must maintain twice; drifts from ICP Studio + Signal Console. Violates the single-source-of-truth principle.
- **Separate `competitors` table.** Rejected: duplicates company names already in `signal_console_accounts`; a competitor you're tracking would exist as both an account and a competitor row. The `relationship_type` flag keeps one record per company.
- **Product category on each ICP row.** Rejected: duplicates the category across a workspace's multiple ICPs and lets them drift. Category is workspace-level.

## 6. Build sequence

1. This ADR + schema migration (`workspace_profile` + `relationship_type`) + types regen
2. ICP Studio commercial-profile editing surface (reads/writes `workspace_profile`)
3. Signal Console relationship-type UI (flag accounts as competitor) + Onboarding reads/writes `workspace_profile.onboarding_*`
4. Briefing adapter rewrite — read workspace profile + competitor accounts + real Discovery objections; reconcile the B.0c contract mismatches
5. Future Autopsy cloud persistence (the remaining browser-bound bug — independent of this layer)

## 7. Consequences

- The Briefing can deliver category-specific intelligence without an ADR-005 dependency (every room involved is already cloud-backed).
- Onboarding state becomes cross-device persistent (bug fixed).
- Signal Console gains a relationship dimension it lacked, useful beyond the Briefing (e.g. filtering the account grid by relationship).
- Deal Workspace's free-text `competition` becomes a candidate for later structuring against the canonical competitor list — noted, not done here.
