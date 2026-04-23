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
