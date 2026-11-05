---
id: prep-next-call
label: Prep for my next call
description: Open Discovery Studio for the highest-priority account in Signal Console, ready to prepare the call.
keywords: [discovery, call, prep, agenda]
action:
  kind: compose-context-and-route
  target: /discovery-studio/
  sources: source=hottest-signal-console-account|paramName=account|required=true
---

# Prep for my next call

Finds the highest-priority account in Signal Console and opens
Discovery Studio with that account set as the focus. Discovery Studio
reads the account and its latest signal, so the pre-call check, the
opening line, and the buyer-specific questions are ready before you
dial.

If you aren't tracking any accounts in Signal Console yet, the skill
stops without navigating — there's no account to prepare for. Add an
account in Signal Console first, then run this skill again.

