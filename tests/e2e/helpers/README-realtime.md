# Running the `@realtime` Playwright suite

The `@realtime`-tagged tests exercise the Supabase Realtime path
end-to-end: a test user signs in, the room boots and subscribes,
a row gets inserted via the service-role client, and the test
asserts the row appears in the page's DOM within 5 seconds.

The suite **skips cleanly** when env vars aren't set, so casual
`npm run test:e2e` runs don't fail when you don't have a Supabase
dev branch handy. To actually exercise the tests, populate the
three env vars below.

## Env vars

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → your project / branch → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` `secret` key — **NEVER commit this** |

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security. It's used
ONLY in test fixtures to:

- Create the test user via Auth Admin (`auth.admin.createUser`)
- Insert the workspace + workspace_member + account rows that the
  test user needs
- INSERT signals from the "service" side to simulate a write from
  another tab / from the heartbeat generator

It is NEVER baked into the Vite bundle, NEVER persisted to
localStorage, and NEVER required for production code.

## Local run

```bash
export VITE_SUPABASE_URL="https://<your-branch-ref>.supabase.co"
export VITE_SUPABASE_ANON_KEY="<anon key>"
export SUPABASE_SERVICE_ROLE_KEY="<service role key>"
npm run test:realtime
```

Recommended: run against a **dedicated dev branch**, never against
production. Each test run creates a new user + workspace + account
and tears them down afterwards. If a test crashes mid-run, orphaned
fixtures may accumulate — the test names are uniquified with a
timestamp prefix so you can spot them in the Supabase Auth + Tables
UI for manual cleanup.

## CI run

The `.github/workflows/data-parity-ci.yml` workflow provisions a
per-PR ephemeral Supabase branch and extracts all three env vars
from the `supabase branches get` JSON output before invoking the
`realtime-tests` job. No additional secrets are needed in GitHub
Actions for the @realtime suite to run in CI — every retrofit PR
gets its own fresh Supabase branch with fresh credentials.

## Adding a new @realtime test for another room

Pattern (mirrors `tests/e2e/realtime-signal-console.spec.ts`):

1. Compose fixtures via `setupRealtimeFixtures()` in `beforeAll`
2. Build a signed-in browser context via `createSignedInContext`
3. Navigate to your room (`/<room>/`)
4. Wait for the room to boot (use a deterministic visible-element
   probe — the seeded account name in our case)
5. Insert a row via `createAdminClient(fixtures.env)` to bypass RLS
6. Assert the corresponding visible-element appears in the DOM
   within 5 seconds via `expect(page.getByText(...)).toBeVisible({
   timeout: 5_000 })`
7. Tear down in `afterAll` via `fixtures.cleanup()` + `ctx.close()`

The fixtures helper is room-agnostic — it always seeds one account
on `signal_console_accounts`. Rooms that need different table
seeding (Deal Workspace, etc.) can either:

- Add a per-room extension function alongside `setupRealtimeFixtures`
  that takes the fixture output and adds the room's own rows
- Or seed inline in the test's `beforeAll`

Don't deepen `setupRealtimeFixtures` itself with room-specific
seeding; each Step 4 retrofit owns its own row creation if it
needs more than the default.
