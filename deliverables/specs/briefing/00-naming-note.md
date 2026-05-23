# Naming note — these specs describe the room now called "Briefing"

**Date:** 23 May 2026

The thirteen design documents in this directory were authored as
**"Signal Console"** specs over the 17 May 2026 design phase. On
23 May 2026 the founder locked the room separation (ADR-006):

- The existing room at `/signal-console/` keeps its name. It is the
  **data substrate** — accounts, signals, heat, cross-room handoffs,
  the Supabase schema we just retrofitted through Phase 4.5 / Tier 1
  / Step 5 (PR #149).
- The new room described by these specs is named **Briefing**. It is
  the **intelligence surface** — runs the Recipe Layer pipeline,
  hydrates context from every other room's `getState()`, produces
  Patterns, Contrarian Patterns, Periphery Candidates, Trigger fires,
  Deal-Watch alerts, and Audit Envelopes.

The specs were preserved as authored. Wherever they say
"Signal Console," read "Briefing." The substrate-vs-surface split
is the load-bearing distinction.

The product-preview HTML, the IA HTML, and the editorial triptych
HTML all use the "Signal Console" brand and a dark-and-gold visual
direction. The visual direction will be re-skinned to canon Part II §1
(bright field, navy ink, orange accent) during face work; the
information architecture stays.

**Authority order for this directory:**

1. `signal_console_design_posture_v0.1.md` — foundational; everything
   else derives
2. `signal_console_voice_document_v0.1.md` — editorial voice; binds
   every synthesized Pattern
3. `signal_console_gtm_os_read_interface_contracts_v0.1.md` — the
   `getState()` contracts every other room must expose
4. `signal_console_watchlist_trigger_grammar_v0.1.md` — five trigger
   types; user-issued standing orders
5. `signal_console_recipe_layer_spec_v0.4.md` — pipeline architecture,
   data shapes, stage prompts
6. `signal_console_evaluation_harness_v0.2.md` — pre-merge gates +
   production sampling + retroactive scoring
7. `signal_console_intelligence_coverage_audit.md` — what categories
   to surface; source ranking
8. `signal_console_end_to_end_walkthrough_v0.1.md` — one full
   pipeline run against fictional worked-example data
9. `signal_console_cost_model_v0.2.md` — economics. **Pricing tiers
   in this doc are stale and should be ignored;** the cost-per-stage
   line items are still load-bearing.
10. `signal_console_source_verifier.py` — source-availability check
    script (not part of the spec, used during source curation)

**HTML files** (visual + IA exploration; outdated CSS but the
information architecture is the load-bearing part):

- `signal_console_product_preview.html` — full briefing surface mockup
- `signal_console_information_architecture.html` — surface inventory + nav
- `signal_console_editorial_triptych.html` — three voice variants compared

Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
Ref: CLAUDE.md §4.X (Briefing room mind)
