---
id: whats-at-risk
label: What's at risk this week
description: Open Deal Workspace pre-filtered to the five most stalled open deals in your pipeline.
keywords: [risk, stalled, deals, recovery, pipeline]
action:
  kind: filter-and-route
  target: /deal-workspace/
  source: top-stalled-deals
  filter: passthrough
  paramName: ids
  limit: 5
---

# What's at risk this week

Reads the recovery rank for every open deal in your workspace,
takes the top five, and opens Deal Workspace with those deal ids
passed via the `?ids=` URL param. The room's intervention board
narrows to just those five so you can work the worst-first.

The skill stops without navigating if there are no open deals with a
non-zero recovery rank. (Deal Workspace's Phase 4 rebuild computes
recovery rank on every state change; an empty result means your
pipeline is healthy or there's nothing in it yet.)
