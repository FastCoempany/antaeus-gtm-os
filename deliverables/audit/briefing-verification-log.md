# Briefing pipeline — verification log

**Verification entries now live in workflow run summaries, not this file.**

Each deploy of the `briefing-pipeline` Edge Function triggers a
`verify-briefing-pipeline` job that calls the function and writes a
formatted summary of the response (stage outcomes, costs, cost-gate
state, totals) directly into the workflow run's job summary panel.
That panel renders at:

```
https://github.com/FastCoempany/antaeus-gtm-os/actions/workflows/deploy-supabase-functions.yml
```

Click any run to see its verification entry.

## Why not a git-tracked log

The earlier design (Apr 2026 PRs #195 + #196) appended each entry to
this file and pushed the commit back to main. That push was rejected
by the `main protection` repository ruleset (rule: "Require a pull
request before merging"), and the cleanest fix — adding the
`github-actions[bot]` to the ruleset bypass list — isn't available
on all GitHub plans.

Rather than weaken the ruleset or add a bot-PR step that leaves
noise on every merge, the workflow now treats the job summary as
the only surface. Same content, 90-day retention, accessible from
the same workflow run URL.

## What's in each entry

- Timestamp + the commit SHA that triggered the verification
- First line of the commit message
- Top-line totals (patterns, clusters, cost)
- Per-stage outcomes with the first 140 chars of each stage's notes
- Workspace status (`complete` / `aborted` / etc.)
- Cost gate state at the start of the run (so paused runs are visible)

## When to look

- After every Briefing PR merge — confirms the deploy + verify chain
  ran cleanly
- When debugging a Monday cron fire that produced unexpected output
- When comparing pipeline behavior across deploys (e.g., did patterns
  count drop after a prompt change?)

The full Supabase function logs (stack traces, per-call Anthropic
IDs, raw request/response bodies) live in the Supabase dashboard
function-logs surface for the same run, indexed by the `runId`
shown in the verification summary.
