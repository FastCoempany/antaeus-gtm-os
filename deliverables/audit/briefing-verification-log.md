# Briefing pipeline — verification log

Auto-appended by `.github/workflows/deploy-supabase-functions.yml` (the
`verify-briefing-pipeline` job). Every Edge Function deploy that lands
on main triggers a real call against the production project and the
formatted response lands below.

**What each entry shows:**
- Timestamp + the commit SHA that triggered the verification
- First line of the commit message
- Top-line totals (patterns, clusters, cost)
- Per-stage outcomes with the first 140 chars of each stage's notes
- Workspace status (`complete` / `aborted` / etc.)
- Cost gate state at the start of the run (so paused runs are visible)

**What this log is for:**
- A durable, git-tracked record of every pipeline run that happened in
  response to a code change. Lets any future session see what shipped
  cleanly vs. what aborted, without needing to dig through Edge
  Function logs in the Supabase dashboard.
- A canary for silent regressions. If a deploy starts producing 0
  patterns where the previous deploy produced 4, the diff between
  consecutive entries surfaces it immediately.

**What this log is NOT for:**
- Replacing the Supabase function logs (which carry stack traces, full
  request/response bodies, and per-call Anthropic IDs).
- Operator-facing surfaces in the room (those read `briefing_runs`
  directly via the data client).

---
