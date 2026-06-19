# ADR-018 — Operator support (how Antaeus supports its own operators)

**Status:** First version shipped 2026-06-19; shape open for founder confirmation (see §Decision points)
**Date:** 2026-06-19
**Resolves:** the held item flagged 2026-06-16/06-17 — *"customer support as a service Antaeus should give its own operators"* (distinct from the CX AI product category)

---

## Context

Two different things share the phrase "customer support" in this codebase:

1. **The CX AI product category** — the Discovery Studio framework for buyers who *sell* customer-support tooling (momos / yoobic / Decagon / Sierra / Intercom-Fin). That's a framework, and it's done.
2. **Support Antaeus gives its own operators** — when a founder or first GTM hire is *using Antaeus* and gets stuck, confused, or unsure what a room is for, how do they get unstuck? That was flagged on 2026-06-16/06-17 and never designed.

This ADR is about (2).

The end-to-end new-operator pass (2026-06-17) found the activation arc strong and the rooms guiding — "no confusing dead-ends to support around." So operator support is **not** triage for a broken journey. It's the calm, always-available answer to two ordinary questions a real operator asks in any room: *what is this for,* and *what do I do here* — plus one honest way to reach a person when self-serve isn't enough.

### Doctrine constraints this has to obey

- **Not friendly-first, not AI-magic-theater** (canon §1 emotional territory). No chirpy chatbot mascot, no "Hi! How can I help? 😊". The product is severe, calm, unsentimental; its support reads the same way.
- **Calm plainspoken utility** (canon §4.20 Trust Annex). Support is closest to Settings in family — no drama, no internal architecture language, clear recovery.
- **Object-first, command-first** (canon §3). Help should be *contextual to the room the operator is actually in*, not a generic help center they have to go searching in.
- **No runtime LLM in the support path** (ADR-008 rejected list). The system already has a voice (the observations ledger, the room minds); operator support is that voice explaining the room, not a live model answering free-text.
- **Voice** (canon §11). Every help string is written the way you'd say it out loud to the operator sitting next to you. Sourced from the canon §4 room minds.

## Decision

**Operator support is a contextual help affordance in the Wayfinder bar.** A small `?` next to `⌘K` on every room. Click it and a calm panel grows inline below the bar — the same disclosure shape as the Why panel — carrying **three plain sentences about the room the operator is actually in**:

- **What this room is for** — one plain sentence (the room's job).
- **What to do here** — the one dominant move the room wants.
- **If it looks empty or wrong** — what to do when the room is sparse or confusing.

…plus **one honest channel to a human**: "Still stuck? Email us" — a `mailto` to the support address with the room named in the subject, so a stuck operator reaches a person in one click, never a ticket maze.

### Why the Wayfinder bar, not a float or a room

- The bar is **already on all 22 DS surfaces** (the universal `.ds-wayfinder`). Putting help there radiates through one shared component, not 22 per-room mounts.
- Help **belongs in the wayfinding bar** — it's part of orienting ("where am I, what is this"), right next to the room crumb and the palette.
- It **doesn't add a fourth bottom-corner float** (Birdseye + Schedule already live there); no clutter, no collision.
- It is **contextual by construction** — the panel reads the current path, so the answer is always about the room in front of the operator.

### What it is NOT

- Not a chatbot. No free-text box, no model in the loop (ADR-008).
- Not a help center / docs site. The answer is in the room, not a separate destination.
- Not onboarding or a tour. It's pull (the operator asks), never push.
- Not a new room. It's an affordance on the shared chrome.

## Architecture

- **`src/lib/operator-help/registry.ts`** — the content. `HelpEntry { whatItIsFor, theMoveHere, ifStuck }` keyed by room path; `helpForPath()` matches the longest prefix and falls back to `GENERIC_HELP` so the affordance is never empty. `supportMailto(roomLabel)` builds the `mailto`. Copy is sourced from the canon §4 room minds, written in canon §11 voice. It lives under `src/lib/` (not `@/components`) so the design-system library may import it without inverting the dependency.
- **`src/components/navigation.tsx`** — `WayfinderBar` gains the `?` button (module-level `wayfinderHelpOpen` signal, the hook-free one-bar-per-page pattern) and the `WayfinderHelpPanel`. The panel reads `helpForPath(window.location.pathname)`; only the surrounding labels are `t()`-wrapped.
- **`src/components/components.css`** — `.ds-wayfinder__help` + `.ds-wayfinder__help-panel`. The panel wears a **blue** left rule — help is the system explaining itself (the intelligence/system role), not a pressure move (orange).

## Decision points open for the founder

These are live picks; the first version ships sensible defaults that are cheap to retarget:

1. **The support email address.** Default is `support@antaeus.app` (in `registry.ts` as `SUPPORT_EMAIL`). Swap to whatever inbox actually receives operator mail. If there should be **no** human channel pre-beta, drop the foot link — the three help lines stand alone.
2. **Radiation is automatic** — because the affordance lives in the shared `WayfinderBar`, every DS surface already has it. No per-room rollout. If any room should *not* show help, that's a one-line opt-out we can add.
3. **Depth of content.** The registry covers ~20 rooms with hand-authored entries today; the rest fall back to GENERIC. As room minds evolve, the entries should track them. (A future option: generate the "what this is for" line from the room's canon §4 entry so it can't drift.)
4. **Assisted help later (rejected for now).** A version where the system answers free-text questions about the operator's own workspace would need a runtime LLM — out of scope per ADR-008. If the founder wants it, it's a separate ADR with its own cost discipline.

## Consequences

- Every operator, in every room, has a one-click calm answer to "what is this and what do I do," plus a human channel — without a chatbot, a docs site, or a tour.
- The content has one home (`registry.ts`) sourced from canon, so it can't fragment across rooms.
- The bar gains one affordance; the shell stays recessive (canon Part II §5).

## Verification

- `src/lib/operator-help` + `src/components/library.test.tsx` unit/render tests green; voice gate green (one banned-vocab catch fixed: "The move here" → "What to do here").
- Typecheck clean; Vite build green.
- Headless across Dashboard / Signal Console / Deal Workspace: the `?` renders, opens room-specific help (each room shows its own content), the email channel names the room; zero pageerrors.
