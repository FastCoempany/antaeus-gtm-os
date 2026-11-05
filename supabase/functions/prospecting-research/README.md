# Prospecting Desk research (canon §4.6)

Cited web research for the Prospecting Desk room. The seller describes who
they are after, or names companies, and this function runs Anthropic's
server-side `web_search` tool (`web_search_20250305`, model `claude-sonnet-4-6`
— the same transport as `outdoors-events-discovery`) and returns companies
with links to where each fact was found. On demand only; there is no cron.

## Actions

```json
POST { "action": "find", "workspaceId": "<uuid>",
       "description": "Series B fintech companies hiring sales leaders",
       "icp": "<optional ICP summary>", "focus": "<optional territory group>",
       "exclude": ["names already in the workspace"] }
```

Returns up to 8 companies (4 when throttled): `name`, `domain`, `why_fit`,
`signal {what, date|null, dated, source_url}` or null, `sources[]` (1–4),
`who_to_target {role, why}`, `opening_angle`, `confidence` (high/medium/low).

```json
POST { "action": "research", "workspaceId": "<uuid>",
       "companies": ["Vanta", "Drata"], "description": "...", "icp": "...", "focus": "..." }
```

Returns one brief per named company (1–5): `what_they_do`, up to 5 dated
`signals`, `fit_matches`, `fit_unknowns`, `who_to_target`, `opening_angle`,
`draft_answers {target_fit, way_in, outreach}`, `sources[]`, plus
`not_found[]` for names with no public sources. Draft answers are
suggestions — the room shows them under each qualification question and only
fills a field when the seller clicks "Use this".

Every response carries `budget {state, spent_usd, ceiling_usd}`,
`cost_usd`, `search_count`, `run_id`, `status`.

## Guards (all in `_shared.ts`)

- A source counts only if it is an `https` URL that the web search actually
  returned (from `web_search_tool_result` blocks or text citations). A
  company with no such source is dropped; a signal without one is dropped.
- Signals with no date in the source come back `date: null, dated: false`.
- Duplicate companies and names in `exclude` are dropped (case, punctuation
  and legal-suffix insensitive: "Vanta, Inc." = "vanta").
- Every visible sentence passes a voice gate (banned vocabulary, 320-char
  cap). A company whose fit sentence fails is dropped; other failing fields
  fall back to empty.

## Auth

`--no-verify-jwt` deploy; the handler itself requires a user JWT whose owner is
a member of `workspaceId` (checked before any paid call or ledger write), or
the service-role key.

## Cost

Per-workspace weekly ceiling of $3.00, read from the last seven days of
`prospecting_research_runs.total_cost_usd`:

| Spent this week | State | Behavior |
|---|---|---|
| < $2.40 | ok | full run (find: 8 searches; research: 2 + 2 per company, max 10) |
| ≥ $2.40 (80%) | warn | full run; the room shows a plain budget note |
| ≥ $3.00 (100%) | throttled | 3 searches, at most 4 companies |
| ≥ $4.50 (150%) | paused | no paid call, no ledger row; the room says the budget is used up |

Cost per run = Sonnet 4.6 tokens ($3 / $15 per million in/out) + $0.01 per
web search. Search results count as input tokens, so a typical `find` lands
around $0.15–$0.40.

## Deploy

- The function auto-deploys from `.github/workflows/deploy-supabase-functions.yml`
  on merge to `main` (it is in the deploy matrix and the manual-dispatch list).
- It needs the `ANTHROPIC_API_KEY` Supabase secret, which already exists for
  `outdoors-events-discovery`. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  are provided by the runtime.
- The ledger table ships in
  `supabase/migrations/20261105120000_prospecting_research_runs.sql`. The
  functions workflow does not apply migrations — run `supabase db push`
  (or apply the file in the SQL editor) before the first search, or every
  call fails at the cost lookup.

## Demo lane

The demo has no backend. When `sessionStorage.gtmos_env_mode === "demo"` or
Supabase isn't configured, the client (`src/prospecting-desk/lib/research.ts`)
never calls this function and returns labeled sample results built only from
the demo dataset (`src/prospecting-desk/lib/research-demo.ts`).
