# Architecture Decision Records (ADRs)

This directory contains architecture decision records — the canonical log of major technical choices Antaeus has committed to and why.

## What an ADR is

An ADR captures a single architectural decision at the moment it's made, so that a future session (or person, or team) can see:
- Why the decision was made at all
- What alternatives were considered and rejected
- What consequences and risks were accepted
- How it's being implemented
- How to unwind it if needed

ADRs are **higher authority than implementation plans** but **lower authority than the canon** (`CLAUDE.md`). If an ADR conflicts with the canon, the canon wins (and the ADR should be updated or superseded). If the canon ever needs to change because of an ADR's findings, the canon is updated via the mind-correction protocol in Part IV §4 of the canon.

## When to write an ADR

Write an ADR any time a decision:
- Shapes the product's architecture for years to come
- Is hard to reverse
- Involves adding or removing a major dependency
- Changes the deploy or runtime model
- Changes how components communicate or share state
- Would confuse a future session reading only the git log

Do NOT write an ADR for:
- Routine code changes
- Feature additions that fit existing patterns
- Refactors scoped to one file
- Styling or copy changes

## Numbering convention

ADRs are numbered sequentially in the filename: `adr-001-<short-slug>-<date>.md`. Numbers never reuse. If an ADR is superseded, the superseding ADR gets the next number and references the older one in both files' frontispieces.

## Status values

Every ADR has a status in its frontispiece:

- `DRAFT` — actively being written
- `PROPOSED` — complete, awaiting approval
- `APPROVED` — accepted and being implemented
- `IMPLEMENTED` — fully rolled out
- `SUPERSEDED` — replaced by a later ADR (links to the superseding one)
- `REJECTED` — written, considered, rejected (kept for the record)

## Approval

Every ADR requires founder approval before moving from `PROPOSED` to `APPROVED`. The approval block is filled in at the bottom of the ADR, with a date and any conditions noted.

## Current ADRs

| # | Title | Status |
|---|---|---|
| 001 | [Foundation Stack Migration](./adr-001-foundation-stack-migration-2026-04-21.md) | APPROVED 2026-04-21 |
| 002 | [Phase 2 Data Architecture Rescope — Supabase Branches + Existing Schema Adoption](./adr-002-phase-2-data-architecture-rescope-2026-04-24.md) | APPROVED 2026-04-24. Supersedes ADR-001 §9 Q2 + rescopes ADR-001 §6 Phase 2. |
| 003 | [Refacing Completion and Pre-Beta](./adr-003-refacing-completion-and-pre-beta-2026-05-01.md) | APPROVED 2026-05-01 |
| 004 | [Orchestration Layer Foundation](./adr-004-orchestration-layer-foundation-2026-05-19.md) | APPROVED 2026-05-19 |
| 005 | [Data Layer Parity (Phase 4.5)](./adr-005-data-layer-parity-2026-05-20.md) | APPROVED 2026-05-20. Depends on ADR-001/002/003/004. |
| 006 | [Briefing Room](./adr-006-briefing-room-2026-05-23.md) | APPROVED 2026-05-23. |
| 007 | [Commercial Identity Layer](./adr-007-commercial-identity-layer-2026-05-26.md) | APPROVED 2026-05-26. |
| 008 | [Orchestration Layer Doctrine + Additive Boundary](./adr-008-orchestration-doctrine-2026-05-29.md) | APPROVED 2026-05-29. Amends ADR-004 (records source + thesis + boundary). Depends on ADR-004/005/006. |
| 009 | [Workspace-scope observations as a distinct stream](./adr-009-workspace-scope-observations-2026-05-31.md) | APPROVED 2026-05-31. Supersedes ADR-006 §"Phasing" Phase-B-absorption clause. Resolves ADR-008's §"Correction note" open question. |
| 010 | [Skills layer (Phase C of the orchestration layer)](./adr-010-skills-layer-2026-05-31.md) | APPROVED 2026-05-31. Builds on ADR-004 §Phasing. Three-action union, bundled markdown recipes, Cmd+K palette extension, 5 starter skills. |
| 011 | [Birdseye Float (Phase D of the orchestration layer)](./adr-011-birdseye-float-2026-05-31.md) | APPROVED 2026-05-31. Builds on ADR-009 (observations) + ADR-010 (skills). Floating collapsible icon on every room with one ranked "what to look at next" line. |
