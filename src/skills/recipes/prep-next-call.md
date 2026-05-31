---
id: prep-next-call
label: Prep for my next call
description: Drop into Discovery Studio for the account on your most recent Call Planner agenda.
keywords: [discovery, call, prep, agenda]
action:
  kind: compose-context-and-route
  target: /discovery-studio/
  sources: source=latest-call-planner-agenda|paramName=account|required=true
---

# Prep for my next call

Reads your most recent Call Planner agenda, grabs the account name,
and drops you into Discovery Studio with that account pre-set as the
focus. The first segment is ready to go; the seven contract rails
mount with the account already in the kicker.

If no agenda is saved yet, the skill stops without navigating —
there's nothing to prep against. Build an agenda in Call Planner
first, then re-run this skill.
