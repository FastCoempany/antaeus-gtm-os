# Continuity-param invariants

**Authority:** Locked 2026-05-17. The continuity plumbing every Phase 2 PR must preserve.

Per CLAUDE.md §2 the canonical statement is *"the continuity plumbing. Do not break them."* This document inventories the actual params in use, names what reads/writes each one, and defines the invariants every cross-room handoff has to hold.

The invariants here are testable. Every Phase 2 PR's seam test (rubric Test 3) is measured against this document.

---

## The six canonical params

| Param | Purpose | Source of truth |
|---|---|---|
| `returnTo` | Absolute path to navigate back to from the destination. | `src/lib/continuity.ts` |
| `returnLabel` | Human label for the back-button affordance on the destination. | `src/lib/continuity.ts` |
| `focusObject` | The object the operator is focusing on (account name, deal id, ICP industry). | `src/lib/continuity.ts` |
| `focusRoom` | Display label of the source room (so destination can say "from Signal Console"). | `src/lib/continuity.ts` |
| `fromMode` | Source's mode tag — `"system"` / `"room"` / `"sourcing"` / etc. | `src/lib/continuity.ts` |
| `fromSurface` | Source surface within the room (`"workbench"`, `"spotlight"`, `"signal-console"`, etc.). | `src/lib/continuity.ts` |

The shared reader is `readContinuity()` in `src/lib/continuity.ts`. The shared safe-redirect validator is `safeReturnTo()`. **Every destination room must use these readers** — do not parse `window.location.search` directly in a room's `main.tsx`.

## The per-room writers

Every source room owns a `lib/handoff.ts` module that exports `build{Room}Href(options)` and a set of convenience builders for each destination. These are the only places that write the six params.

Audited 2026-05-17 — known writers:

| Room | Writer module | Convenience builders shipped |
|---|---|---|
| Signal Console | `src/signal-console/lib/handoff.ts` | `hrefToOutbound`, `hrefToDealWorkspace`, `hrefToDiscoveryAgenda`, `hrefToColdCall` |
| Outbound Studio | `src/outbound-studio/lib/handoff.ts` | (see file) |
| Cold Call Studio | `src/cold-call-studio/lib/handoff.ts` | (see file) |
| LinkedIn Playbook | `src/linkedin-playbook/lib/handoff.ts` | (see file) |
| Call Planner | `src/call-planner/lib/handoff.ts` | (see file) |
| Future Autopsy | `src/future-autopsy/lib/handoff.ts` | (see file) |
| PoC Framework | `src/poc-framework/lib/handoff.ts` | (see file) |
| Advisor Deploy | `src/advisor-deploy/lib/handoff.ts` | (see file) |
| Sourcing Workbench | `src/sourcing-workbench/lib/handoff.ts` | (see file) |
| Quota Workback | `src/quota-workback/lib/handoff.ts` | (see file) |
| Negotiation (scaffold) | `src/negotiation/lib/cross-room.ts` | (scaffold pre-Phase 4) |

Rooms still owing a `lib/handoff.ts` (Phase 2 work will surface):
- Onboarding
- Welcome
- Dashboard
- ICP Studio
- Territory Architect
- Discovery Studio
- Deal Workspace
- Settings
- Founding GTM (verdict-anchor handoff)

These are not necessarily missing functionality — some rooms are pure destinations and don't write handoffs. But the audit should confirm per-room whether a writer is needed or whether the room legitimately doesn't initiate handoffs.

---

## Invariant 1 — Every cross-room link goes through a builder

**Rule:** No room may construct a cross-room href by string concatenation in a component file. Every cross-room link comes from a builder in `lib/handoff.ts`.

**Why:** Forces every link to set the six params consistently. If a link bypasses the builder, the destination back-button breaks silently.

**Test:** Phase 2 PRs grep their room for `href="/{other-room}/"` literals and confirm any matches are inside the builder file. Component files only consume builder outputs.

## Invariant 2 — Every destination reads continuity via `readContinuity()`

**Rule:** Destination rooms read the six params via `readContinuity()` from `src/lib/continuity.ts`. No direct `URLSearchParams` access for any of the six params.

**Why:** Trim-and-null normalization is centralized. The shape evolves in one place (e.g. if we move to signed params later).

**Test:** Phase 2 PRs grep destinations for `URLSearchParams` or `params.get("returnTo")` style; flag direct access.

## Invariant 3 — Back-button uses `safeReturnTo()`

**Rule:** Any back-button or "return" affordance that consumes `returnTo` runs it through `safeReturnTo()` before navigating.

**Why:** Prevents open-redirect — paths only, no `//` (protocol-relative), no absolute URLs.

**Test:** Phase 2 PRs grep destinations for `location.href = returnTo` or `navigate(returnTo)` style; flag any that skip `safeReturnTo()`.

## Invariant 4 — `focusObject` round-trips intact

**Rule:** If a source room writes `focusObject=Meridian Logistics`, the destination room loads with "Meridian Logistics" already focused, selected, pinned, or otherwise the active object of the destination's primary affordance.

**Why:** Re-entry of context Sarah already provided is the most common seam failure. This invariant makes it testable.

**Test:** Phase 2 PR walkthrough must demonstrate, per seam, that clicking a handoff CTA on the source lands on the destination with the focused object visibly active. Playwright walk asserts the DOM contains the focused object's name in the destination's primary surface.

## Invariant 5 — Destination renders the source breadcrumb

**Rule:** If `returnTo` + `returnLabel` are present, the destination renders a back-affordance using `returnLabel` as its text. If absent, no back-affordance renders (do not invent one).

**Why:** Affordance reflects truth. A back-button that goes to the global Dashboard when the operator came from a different room is a lie.

**Test:** Phase 2 PR per seam: source → destination, confirm back-affordance text matches `returnLabel`; reverse: destination → source (via back), confirm landing matches `returnTo`.

## Invariant 6 — `fromMode` + `fromSurface` propagate without consumption

**Rule:** Sources set `fromMode` + `fromSurface` for downstream analytics + future-room differentiation. Destinations may consume them (e.g. to render different copy depending on origin), but if they don't, the params still must propagate to subsequent hops.

**Why:** Future analytics + multi-hop flows (Signal → Outbound → Cold Call) need provenance.

**Test:** Phase 2 PR walkthrough: confirm multi-hop flows preserve `fromMode` + `fromSurface` from the originating room, not just the most recent hop.

## Invariant 7 — Extra params do not collide with the six canonical params

**Rule:** Builders accept an `extra` map for per-destination context (e.g. `?account=`, `?temperature=`, `?deal=`). The six canonical params may not appear in `extra`.

**Why:** A builder that sets `returnTo` and then has `extra.returnTo` override it is silently incorrect. The shape of `HandoffOptions` should make this impossible by convention (and Phase 2 may add a runtime check).

**Test:** Phase 2 PRs grep builder callers; flag any `extra: { returnTo: ... }` or similar collisions.

## Invariant 8 — Empty `focusObject` placeholders are not written

**Rule:** If the source has no concrete `focusObject` (e.g. operator hit a handoff with no account selected), the builder must omit `focusObject` from the URL. Destination must not be primed with a literal placeholder like `"LinkedIn cue"` or `"no account"`.

**Why:** Caught in the LinkedIn Playbook audit (PR #23, P2): a fallback to `?focusObject=` re-prefilled the cue ledger with the placeholder string. The lesson: empty is empty.

**Test:** Phase 2 PRs walk every "no focus selected" path through each handoff; confirm destination loads empty, not with a placeholder.

---

## What Phase 2 PRs check per seam

For each cross-room transition the flow walkthrough crosses:

- [ ] Source uses a `lib/handoff.ts` builder (Invariant 1)
- [ ] Destination uses `readContinuity()` (Invariant 2)
- [ ] Back-button uses `safeReturnTo()` (Invariant 3)
- [ ] `focusObject` round-trips visibly (Invariant 4)
- [ ] Destination renders the source breadcrumb correctly (Invariant 5)
- [ ] `fromMode` + `fromSurface` propagate (Invariant 6)
- [ ] `extra` map doesn't collide with canonical params (Invariant 7)
- [ ] Empty-focus paths don't write placeholders (Invariant 8)

A `[SEAM]` finding (per rubric tags) is anything that violates one of the eight invariants.

---

## Edge-case behaviors (codified)

These are not bugs — they're intentional behaviors that should be preserved.

### Same-room handoff (e.g. Dashboard → Dashboard mode switch)

When the destination is the same room as the source (e.g. clicking a Dashboard mode switcher), continuity params are not used. The mode is in-page state, not a navigation.

### Hub-back from a destination

If a destination doesn't receive `returnTo`, the back-button (if rendered) goes to `/dashboard/`. **This is rare and explicit** — most navigation should preserve the source. Only acceptable when the destination is a "landing from nowhere" surface (e.g. cold link, email deep-link).

### Multi-hop chains (Signal → Outbound → Cold Call)

The continuity chain SHOULD preserve the original source, not just the most-recent hop. Per Invariant 6: `fromMode` + `fromSurface` originate at the first source. The newest hop's source is reflected in `returnTo` + `returnLabel`.

This is the "where did the operator come from" question. The room that "brought them into this flow" is the `from*` answer; the room "they just left" is the `returnTo` answer.

### Demo / QA escape hatches

`?demo=1` and `?qa=1` query params bypass the Posthog flag-redirect logic at the legacy room shims (PR #45 / Phase 4 deletion sweep). These are not part of the continuity plumbing but are reserved keys — `extra` map writers should not use them.

---

## Living document

This invariant list is the seam-test ground truth. If a Phase 2 PR proves an invariant is wrong (e.g. some legitimate flow needs an exception), the invariant gets revised here before the PR ships. The invariants live; the test method holds.
