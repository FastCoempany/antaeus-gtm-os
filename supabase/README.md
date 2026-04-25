# Supabase — Antaeus GTM OS

This directory is the canonical home for everything the Supabase CLI sees: project config, migrations, and the workflow for pushing schema to preview + production branches.

**Authority:** `deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md` (Phase 2 scope) supersedes `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md` §6 Phase 2 and §9 Q2.

**Canonical context:** `CLAUDE.md` Part II.5 + Part V §1.

---

## Layout

```
supabase/
├── README.md                                    # this file
├── config.toml                                  # Supabase CLI project config
├── .gitignore                                   # .branches/, .temp/
└── migrations/
    ├── 20260424170000_workspaces_and_members.sql        # new tenant boundary
    ├── 20260424170001_backfill_default_workspaces.sql   # one workspace per existing user
    ├── 20260424170002_workspace_id_retrofit.sql         # add workspace_id to existing tables
    ├── 20260424170003_new_noun_tables.sql               # proofs, advisor_deployments, readiness_snapshots, handoff_artifacts
    └── 20260424170004_workspace_scoped_rls.sql          # flip the RLS gate from user-scoped → workspace-scoped
```

Migration files are ordered and one-way. The Supabase CLI requires filenames in `<14-digit-timestamp>_<name>.sql` format (YYYYMMDDHHMMSS); it does **not** recognize short `NNNN_` prefixes — they silently return an empty migration list. New migrations should use `supabase migration new <name>` to get a well-formed timestamp prefix, or hand-author one in the same 14-digit format.

---

## Where the legacy root-level SQL files fit

Before Phase 2, schema was managed as five free-floating SQL files at the repo root:

```
supabase-workspace-persistence.sql
supabase-rls-policies.sql
supabase-profiles-bootstrap.sql
supabase-security-fixes.sql
supabase-public-waitlist.sql
```

These were applied directly via the Supabase SQL editor (no CLI, no version control of what ran when). They are preserved as historical reference for now — **do not re-apply them** after 0005 runs; they would re-create the user-scoped policies that 0005 deliberately replaces.

Plan: once 0005 is merged into the `main` Supabase branch and verified in production, delete the five root-level SQL files and add a note to the session log in `CLAUDE.md`.

---

## What the five new migrations do, in order

| # | File | Effect |
|---|---|---|
| 0001 | `workspaces_and_members.sql` | Creates the `workspaces` + `workspace_members` tables with full RLS. Additive — nothing existing changes. |
| 0002 | `backfill_default_workspaces.sql` | Creates one default workspace per existing `auth.users` row (4 real users as of 2026-04-24) and makes them the owner. Idempotent — re-running does nothing. |
| 0003 | `workspace_id_retrofit.sql` | Adds a `workspace_id uuid` column (nullable, defaulted to caller's first owned workspace) + index to every existing data table. Also installs `current_user_default_workspace_id()` helper. |
| 0004 | `new_noun_tables.sql` | Creates `proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts`. Workspace-scoped from day one. RLS enabled but no policies yet (policies ship in 0005). |
| 0005 | `workspace_scoped_rls.sql` | Installs `is_workspace_member(uuid)` helper. Drops legacy user-scoped policies on every existing table; creates workspace-membership policies. Special-cases `profiles` (self-or-teammate select, self-only write). Creates policies for the four 0004 tables. **This is the migration that flips access control.** |

Net effect: every row in every data table becomes visible/writable only to members of its workspace. A user who is not a member sees nothing.

---

## Workflow — applying these migrations

There are two branches that matter: the `preview` branch (where we test) and `main` (production). Both are managed in the Supabase dashboard; we never apply schema directly to production.

### One-time setup (founder — see §Founder handoff below)

1. Install Supabase CLI locally (`npm i -g supabase` or Homebrew)
2. Create the persistent `preview` branch in the Supabase dashboard
3. Run `supabase link` against the production project + `supabase login` once

### Every schema change (founder or claude session)

1. Write a new `NNNN_descriptive_name.sql` file in `migrations/`
2. Apply to `preview` via `supabase db push --linked` (targets whichever branch is currently selected in the dashboard, which should be `preview` during development)
3. Verify the change in `preview`:
   - Use the Table Editor to visually inspect the new schema
   - Run any verification queries (several migrations ship with a commented-out verification block at the bottom)
   - If the change involves RLS, manually test as one of the 4 real users
4. Once verified, merge `preview` → `main` in the dashboard (the "Merge" button next to the branch)
5. Commit the migration file(s) to git on the current feature branch
6. Push + open PR — CI runs typecheck/test/build but does not touch Supabase (CI doesn't have credentials)
7. On merge to `main`, the schema is already in production because step 4 happened; git is just recording what shipped

**Never apply migrations directly to `main`.** The branch is there for a reason.

**Never skip writing a migration file** and edit schema directly in the Supabase SQL editor. That is how the root-level files ended up untracked.

---

## Founder handoff — Phase 2.1 dashboard actions

Claude has done the repo-side work for Phase 2.1 (config + 5 migration files). The following actions require the founder's Supabase dashboard access and cannot be automated from the repo.

### Action 1 — Install the Supabase CLI (one-time)

On macOS:
```bash
brew install supabase/tap/supabase
```

On Linux / WSL:
```bash
npm i -g supabase
```

Verify: `supabase --version` should print something. If it errors, re-install.

### Action 2 — Link this repo to the production project (one-time)

From the repo root:
```bash
supabase login              # opens a browser; approve access
supabase link --project-ref wjdqmgxwulqxxxnyuzyl
```

The `project-ref` is the subdomain on your Supabase URL (`wjdqmgxwulqxxxnyuzyl.supabase.co`). You can also copy it from Settings → General in the dashboard.

Verify: `supabase projects list` should show `antaeus-gtm-os` with a `●` next to it indicating it's linked.

### Action 3 — Create a persistent `preview` branch

In the Supabase dashboard:
1. Top-left project dropdown → click the branch icon → **Create branch**
2. Name: `preview`
3. Confirm — Supabase provisions a copy of the schema (no data)

After this step, the dashboard dropdown shows two branches: `main` (production) and `preview`.

**Important:** make sure `preview` is the currently-selected branch before step 4.

### Action 4 — Apply migrations 0001–0005 to `preview`

```bash
supabase db push --linked
```

Expected output: five migrations apply in order, each with `NOTICE:` lines from the `raise notice` calls inside the `do $$` blocks.

If any migration fails:
- Copy the full error
- Do not attempt to patch by editing the migration file in place — write a new `000N` migration that corrects the error
- The failed migration leaves the branch partially migrated; re-applying is safe because all migrations are idempotent

### Action 5 — Verify `preview`

In the Supabase dashboard, switch to the `preview` branch, then:

1. **Table Editor check**: confirm `workspaces`, `workspace_members`, `proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts` all exist. Confirm every existing table now has a `workspace_id` column.

2. **Backfill check**: in the SQL editor, run:
   ```sql
   select u.email, count(w.id) as owned_workspaces
   from auth.users u
   left join public.workspaces w on w.owner_id = u.id
   group by u.id, u.email
   order by u.email;
   ```
   Every user should have `owned_workspaces = 1`.

3. **RLS check**: still in the SQL editor, run (while authenticated as yourself):
   ```sql
   select * from public.workspaces;
   ```
   You should see exactly 1 row: the workspace 0002 created for you.

4. **Insert check**: test that insert + select works as a real user. The cleanest way is through the JS client once Phase 2.2 ships; for now, a raw SQL insert from the dashboard (which runs as `postgres`, bypassing RLS) only proves the schema, not the policies. Defer full insert/select round-trip test to Phase 2.2.

### Action 6 — Merge `preview` → `main`

Once steps 1–3 verify clean:

1. In the dashboard, top-right of the branch panel → **Merge**
2. Confirm the diff shows only the 5 migrations
3. Click **Merge**

Production is now updated.

### Action 7 — Record the state

Back in this repo, update `CLAUDE.md` Part V §6 session log with a short entry:

> Phase 2.1 migrations applied to preview + merged to main. Verified 4 users have exactly 1 owned workspace each; workspace-scoped RLS in effect across all data tables.

Then commit + push the canon update on the current claude branch.

---

## Developer workflow from here on

### Writing a new migration

1. Pick the next free number (look at `ls migrations/` and add 1)
2. Create `NNNN_short_descriptive_name.sql`
3. Follow the pattern: big header comment → `do $$ ... $$` block if conditional logic needed → raw DDL otherwise
4. Always be idempotent (`create table if not exists`, `drop policy if exists` before `create policy`, etc.)
5. Reference the governing ADR in the header

### Running migrations locally against a real project

```bash
supabase db push --linked
```

### Resetting a local branch

If `preview` gets into a weird state during development and you want to start over:

1. In the dashboard, delete the `preview` branch
2. Recreate it (Action 3 above)
3. Re-push migrations (Action 4)

**Never do this to `main`.**

### Keeping types in sync (Phase 2.2+)

Once Phase 2.2 lands, the typed data client under `src/lib/data-client.ts` imports generated types from:

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

Run this after any schema change and commit the regenerated file alongside the migration.

---

## Troubleshooting

**`supabase db push` fails with "not linked"** — run `supabase link --project-ref wjdqmgxwulqxxxnyuzyl` first.

**`supabase db push` says "Remote database is up to date" but you just wrote migrations** — your migration filenames are using a short `NNNN_` prefix. Supabase CLI requires `<14-digit-timestamp>_<name>.sql` (e.g., `20260424170000_foo.sql`) and silently ignores other formats — `supabase migration list` will show an empty LOCAL column. Rename the files or use `supabase migration new <name>` to get a well-formed timestamp.

**Migration fails with "cannot use subquery in DEFAULT expression (SQLSTATE 0A000)"** — you wrote something like `default (select auth.uid())` in a column definition. PostgreSQL forbids subqueries in DEFAULT clauses. Use the bare function call instead: `default auth.uid()`. Subqueries in RLS policy `USING` / `WITH CHECK` expressions are fine — only DEFAULT expressions reject them.

**Remote migration history shows a phantom migration you didn't write (timestamp matches when you enabled branches)** — Supabase Branches inserts a snapshot-of-main entry into `supabase_migrations.schema_migrations` when branches are activated on a project. Clear it with `supabase migration repair --status reverted <timestamp> --db-url "<url>"`. This only touches the bookkeeping table; it does not alter any real schema.

**"multiple primary keys for table X" during merge-request "Update branch"** — known limitation of Supabase Branches when preview has only *additively* diverged from main. The rebase step tries to re-apply main's schema snapshot on top of preview's existing tables. Workaround: abandon the merge-request flow and push migrations directly to main via `supabase db push --db-url <main-pooler-url>`. Migrations that were verified on preview will apply cleanly to main because they're idempotent. Delete the failed merge request and orphaned preview branch afterward to keep housekeeping clean.

**"failed to connect... i/o timeout" when using a connection string with port 5432 and `db.<ref>.supabase.co`** — that's the Direct connection, which is IPv6-only on most networks. Use the **Session pooler** URL from the Connect modal instead: host `aws-N-<region>.pooler.supabase.com`, user `postgres.<project-ref>`, port 5432, IPv4-routable.

**Migration fails with "function current_user_default_workspace_id does not exist"** — 0003 didn't run. Check `supabase migration list --linked` to see what actually applied.

**RLS policy fails silently (inserts succeed but selects return nothing)** — the caller isn't a member of the target workspace. Confirm via `select * from public.workspace_members where user_id = auth.uid();` from the SQL editor as the affected user.

**"permission denied for table X"** — grants didn't land. Check that `grant select, insert, update, delete on public.X to authenticated;` ran. All five migrations include grants where relevant.

**`preview` branch appears to have stale data after reset** — Supabase branches snapshot the main schema + seed data at creation time. If main has diverged, delete and recreate the branch.

---

## Open questions (deferred to later phases)

- **NOT NULL on workspace_id** — 0003 adds the column as nullable. Once all data is live, a future migration can `alter column workspace_id set not null;` for each table. RLS already forbids null-workspace rows in practice.
- **Multi-workspace UI** — the schema supports it; the product layer currently assumes one workspace per user. ADR-001 §9 Q1 locks this as "schema-ready, UI single for now."
- **Cross-workspace sharing** — not modeled. A future feature (e.g., sharing a PoC or a handoff artifact) would need explicit share rows or a new policy shape.
