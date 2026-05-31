---
id: cast-proof-for-hottest-deal
label: Cast a proof for the hottest deal
description: Open PoC Framework with the top-pressure open deal pre-linked, ready to forge a proof.
keywords: [proof, poc, deal, hottest, pressure]
action:
  kind: compose-context-and-route
  target: /poc-framework/
  sources: source=top-pressure-open-deal|paramName=deal|required=true
---

# Cast a proof for the hottest deal

Picks the open deal with the highest recovery rank (most pressure)
and opens PoC Framework with it pre-linked. The forge panel mounts
with the deal selected in the linked-deal dropdown; you start
casting a proof against the moment that needs evidence most.

Skips routing if there are no open deals with pressure (clean
pipeline or empty workspace). Run "What's at risk this week" first
if you want to see the pipeline before forging.
