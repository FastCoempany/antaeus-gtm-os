# Briefing spec-vs-shipped audit

**Audited:** 2026-06-02
**Baseline:** ADR-006 (Briefing room scoped 2026-05-23) + the 13 promoted specs at `deliverables/specs/briefing/` + ADR-009 (workspace observations as a distinct stream) + ADR-014 (Briefing as daily two-stream surface) + canon §4.21 (current Briefing mind)
**Auditor:** Claude (B-arc completion — spec-vs-shipped batch)

> **Note on baseline.** Briefing is a complex new room with the most spec backing of any in the system. Five ADRs touch it (006/009/010 implicitly via Skills/013/014). This audit confirms each named spec's lock-in against the shipped surface; it does NOT re-validate the Recipe Layer pipeline (separately validated by the Evaluation Harness per `09-evaluation-harness-v0.2.md`).

---

## Mind preservation — PASS

Canon §4.21 (post-ADR-014) preserved end-to-end:

- ✅ **Daily check-in for what the system saw, both inside the operator's work and in the world.** Implementation: top-of-room `ViewToggle` switches between Workspace (`WorkspaceReads.tsx`, ADR-009 heartbeat-driven workspace observations) and World (Briefing Patterns + Contrarian + Periphery + Lead).
- ✅ **Workspace view default per ADR-014.** `activeBriefingView()` reads `localStorage.gtmos_briefing_view_v2` (key bumped from v1 for the FirstVisitPrimer copy refresh); default = workspace.
- ✅ **Provocative posture per Design Posture v0.1.** Three obligations:
  - **Coverage** — Periphery surface (`PeripheryRail.tsx`) surfaces entities the operator hasn't named
  - **Framing** — Contrarian surface (`ContrarianRail.tsx`) challenges operator's stated assumptions
  - **Defensibility** — Audit Envelopes (`ShowYourWork.tsx`) preserve enough state at every synthesis to let the operator reconstruct what the system said, on what basis, with what supporting evidence
- ✅ **Voice Document as editorial brain.** Every Pattern's text passes through `src/lib/voice/voice-document.ts:validateObservation()` at synthesis time. Per the Voice Document v0.1 spec, banned vocab + structural rules + hedging rules apply. Voice = "conversational gravity" — sharp operator with B2B sales scars explaining what they see.
- ✅ **Audit envelope chain** — `briefing_audit_envelopes` Postgres table, FK from `briefing_patterns`. Each envelope captures cluster + hydrated context + LLM call chain + cost. Renderable in the operator's UI via the "Show your work" affordance.
- ✅ **Cost discipline.** Per-user weekly LLM ceiling + separate harness-cost ceiling. Degradation policy: warning 80% / throttle 100% (Sonnet substitution + relevance tightening) / pause 150%. Footer telemetry visible on `BriefingFooter.tsx`.
- ✅ **Substrate dependency on Signal Console.** Briefing reads from `signal_console_accounts` + `signals` Postgres tables; never writes back. Confirmed: no Briefing module imports any Signal Console write API.
- ✅ **`recommended_moves[].destination` draft routing** per ADR-013 PR #230. `src/briefing/lib/destinations.ts` parses the `Room · Section · action · id?` token grammar; `MoveRow` renders clickable continuity-paramed routes. `BriefingDraftBanner` mounted globally on destination rooms shows `FROM BRIEFING · {action}` with Save (persists breadcrumb to `gtmos_briefing_drafts_pending`) + Dismiss.
- ✅ **DraftsTray** per PR #234 — collapsed by default, renders pending draft list with Open + Clear buttons.
- ✅ **OutdoorsEventsChip** per ADR-015/016 — navigation-only chip on the World view (visible only when World is active) routes to `/outdoors-events/`.
- ✅ **Suggestions section** per ADR-017 PR 3 — `SuggestionsSection.tsx` mounts between `ViewToggle` and the view-specific sections. Visible on both views (proposals don't care about view).

No mind drift.

---

## Posture invariants (Design Posture v0.1) — all preserved

The Briefing serves the operator's stated preferences AND takes on three additional obligations:

1. **Coverage** — Periphery rail surfaces entities the operator hasn't named. Verified: `PeripheryRail.tsx` reads `peripheryCandidates` signal, populated by `loadPeripheryCandidates`.
2. **Framing** — Contrarian rail challenges operator interpretations. Verified: `ContrarianRail.tsx` reads `contrarianPatterns` signal, populated by `loadContrarianPatterns` (Anthropic API call per Recipe Layer spec).
3. **Defensibility** — Audit envelopes always reachable. Verified: `ShowYourWork.tsx` opens against `envelopeCache` + `envelopeOpen` signals.

---

## Structural drift — minor

### A. Things shipped that drift from the spec (FIX in this PR)

None caught.

### B. Explicitly deferred

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| ADR-006's Phase B supersession via Briefing Patterns | Re-reversed by ADR-009 — workspace + world are now distinct streams. Cross-dedup wired in `dashboard/lib/observation-deduper.ts` no-op until both streams ship. | Patterns + workspace observations both fire and overlap on the same entity |
| Outdoors Events chip preview / count badge | Per ADR-015 explicit decision: navigation-only chip, no data flow. | Founder asks for preview |
| Asset Builder destination routing | Asset Builder room not yet shipped; `recommended_moves[].destination` for Asset Builder fall back to plain text per `destinations.ts`. | Asset Builder ships |

---

## Voice — PASS

Voice Document v0.1 is the authoritative editorial brain. Every Pattern's `pattern_text`, `headline`, `confidence_reason`, and `evidence_excerpts` pass through the same validator before write. Operator-facing copy elsewhere in the room:

- Topbar kicker: `BRIEFING · weekly read` (mono, uppercase) — internal mode label, not chrome
- FirstVisitPrimer (v2 per ADR-014): explains both Workspace and World views in peer voice
- StaleRunBanner: "It's been N days since the last brief was synthesized." — peer voice, no jargon
- EmptyState: condition-agnostic post-PR-#232 fix; no "the pipeline hasn't run yet" assertion
- SuggestionsSection (PR #250): "A SUGGESTION" + sentence-shape title + "What I noticed" / "What would change" peer-voice prose

No banned vocab. The Voice Document's banned-vocab list is enforced server-side at synthesis; client-side copy is hand-authored under the same discipline.

---

## Cross-room compounding — PASS

Per canon §6 + ADR-006, Briefing reads from EVERY other room via `getState()` contracts (`deliverables/specs/briefing/06-gtm-os-read-interface-contracts-v0.1.md`):

| Room | Adapter contract | State |
|---|---|---|
| ICP Studio | `getIcpState()` | shipped |
| Discovery Studio | `getDiscoveryState()` | shipped |
| Call Planner | `getCallPlannerState()` | shipped |
| Outbound Studio | `getOutboundState()` | shipped |
| Asset Builder | `getAssetBuilderState()` | placeholder (room not yet shipped) |
| Deal Workspace (via active deals) | `getActiveDealsState()` (`adapters/active-deals.ts`) | shipped |
| Watchlist Triggers | `getWatchlistState()` | shipped |
| Voice Document | `getVoiceState()` | shipped |
| Behavioral Feedback | `getFeedbackState()` | shipped |

Plus Signal Console substrate (`signal_console_accounts` + `signals` Postgres tables, read directly).

The Briefing writes back via `recommended_moves[].destination` drafts only (PR #230). Verified: no Briefing module mutates any other room's data directly.

---

## Fix scope — none

Doc-only audit. The Briefing is the most heavily specified room in the system; every spec is implemented or explicitly deferred per its own scope.

---

## Acceptance walk

1. `/briefing/` renders with RoomChrome + skip-link + `FirstVisitPrimer` (first visit only) + `Topbar` + `StaleRunBanner` (when last run > 8d old) + `DraftsTray` + `ViewToggle` + `SuggestionsSection` (when proposals pending) + view-specific content + `BriefingFooter`.
2. ViewToggle defaults to Workspace.
3. World view shows `BriefingLead` + `PatternList` + `ContrarianRail` + `PeripheryRail` + `WatchList` + `OutdoorsEventsChip`.
4. Workspace view shows `WorkspaceReads` + `WatchList`.
5. Show-your-work affordance opens the audit envelope for the focused Pattern.
6. `recommended_moves[].destination` are clickable; destination rooms display the `BriefingDraftBanner`.
7. `DraftsTray` lists pending breadcrumbs.
8. Cost footer surfaces the rolling 7-day spend.
9. Voice Document banned vocab never appears in operator-facing text.

All hold against shipped state per spot-checks.
