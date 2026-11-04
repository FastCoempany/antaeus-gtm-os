---
id: compose-this-weeks-outbound
label: Compose this week's outbound
description: Open Outbound Studio with the highest-priority account from Signal Console preselected.
keywords: [outbound, compose, hottest, signal, account]
action:
  kind: compose-context-and-route
  target: /outbound-studio/
  sources: source=hottest-signal-console-account|paramName=account|required=true
---

# Compose this week's outbound

Selects the account with the highest priority score in Signal Console and
opens Outbound Studio with that account prefilled. Confirm the buyer role,
outreach stage, reason for outreach, and next question before generating a draft.

Skips routing if Signal Console has no accounts (empty workspace).
Add an account through Prospecting Desk, then run the action again.
