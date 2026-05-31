---
id: compose-this-weeks-outbound
label: Compose this week's outbound
description: Open Outbound Studio pre-filled with the hottest account from your Signal Console.
keywords: [outbound, compose, hottest, signal, account]
action:
  kind: compose-context-and-route
  target: /outbound-studio/
  sources: source=hottest-signal-console-account|paramName=account|required=true
---

# Compose this week's outbound

Reads the hottest account from Signal Console (highest heat score),
opens Outbound Studio with that account pre-filled in the operator
rack. The send-line generator is one input away — pick the persona,
the temperature, the trigger, the next question, and the line drafts
itself.

Skips routing if Signal Console has no accounts (empty workspace).
Source an account first via Sourcing Workbench, then re-run.
