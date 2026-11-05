---
id: cast-proof-for-hottest-deal
label: Plan a pilot for the highest-risk deal
description: Open Pilot Desk with the highest-ranked open deal preselected for pilot planning.
keywords: [proof, poc, deal, hottest, pressure]
action:
  kind: compose-context-and-route
  target: /pilot-desk/
  sources: source=top-pressure-open-deal|paramName=deal|required=true
---

# Plan a pilot for the highest-risk deal

Selects the open deal with the highest recovery rank and opens Pilot Desk
with that deal linked. Review the deal's evidence gaps before defining the
pilot claim, owner, success measure, and stop condition.

Skips routing when no qualifying open deal is available. Run
"What's at risk this week" first to review the pipeline.
