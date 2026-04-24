# Phase 2.4 — Cloudflare Workers Builds branch-aware env vars

**Goal:** split Cloudflare Workers Builds Variables into Production + Preview so main-branch deploys point at the production Supabase project and feature-branch deploys point at the preview Supabase branch.

**Authority:** `deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md` §6 Subphase 2.4.

**Replaces:** the §1.3 "Note on scoping" in `docs/founder-phase-1-external-setup.md` — that note said "Variables apply to all builds (main + feature branches). There is no per-environment split at this layer" which was true for the simple flat setup Phase 1 shipped with. CF Workers Builds supports a Production/Preview split; Phase 2.4 activates it.

**Time:** ~10 minutes of dashboard clicks.

---

## The env var matrix

| Variable | Production (main branch) | Preview (feature branches) | Why different |
|---|---|---|---|
| `VITE_APP_ENV` | `production` | `preview` | UI shows which environment the user is pointed at |
| `VITE_SENTRY_DSN` | *(same)* | *(same)* | One Sentry project; env tag distinguishes |
| `VITE_SENTRY_ENV` | `production` | `preview` | Sentry event grouping |
| `VITE_POSTHOG_API_KEY` | *(same)* | *(same)* | One Posthog project |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | `https://us.i.posthog.com` | Same region |
| `VITE_SUPABASE_URL` | `https://wjdqmgxwulqxxxnyuzyl.supabase.co` | `https://<preview-ref>.supabase.co` | **Different Supabase projects** |
| `VITE_SUPABASE_ANON_KEY` | main project's anon key | preview branch's anon key | Anon keys differ per Supabase branch |

**Critical:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are the ones that must differ between Production and Preview. The others can stay identical and still be correct. If you only split the two Supabase vars and leave the rest as-is, the setup works.

---

## Prerequisite — recreate the preview Supabase branch (if you deleted it)

If you deleted the `preview` branch after the failed merge request cleanup:

1. Go to https://supabase.com/dashboard/project/wjdqmgxwulqxxxnyuzyl/branches
2. Click **Create branch** → name `preview` → Create
3. Wait ~30 seconds for provisioning
4. Apply the 5 Phase 2.1 migrations to it (same process as Phase 2.1 Step 4–7 in `supabase/README.md`)

Alternatively, if you kept the old `preview` branch and it still has the 5 migrations applied, no action needed.

**Note:** the preview branch's `project-ref` and `anon-key` are independent of main. You need both.

---

## Step 1 — Get the preview branch credentials

In the Supabase dashboard:

1. Top-left project switcher → select **preview** branch (it should show `PREVIEW` badge)
2. Left sidebar → **gear icon** → **API**
3. Copy these two values (paste both to Notepad):
   - **Project URL** — looks like `https://<ref>.supabase.co` where `<ref>` is the preview branch's own ref (e.g. `ijibuijlcnykbjkbjlgi`, distinct from main's `wjdqmgxwulqxxxnyuzyl`)
   - **`anon` public key** (under "Project API keys")

**Do not** copy the service-role key. The anon key is what the client-side bundle uses; RLS enforces access control.

---

## Step 2 — Open the CF Workers Builds Variables panel

1. Go to https://dash.cloudflare.com
2. Left sidebar → **Workers & Pages**
3. Click your Antaeus Workers service (`autumn-water-148a`)
4. Top tabs → **Settings**
5. Scroll down to the **Build** panel
6. Find the **Variables and secrets** row

**There are two tabs inside Variables and secrets: `Production` and `Preview`.** If you only see one list, click around — the tabbed UI is sometimes collapsed. The matrix below assumes both tabs are visible.

---

## Step 3 — Set Production variables

Click the **Production** tab, then for each variable, click **+ Add** and fill in:

| Variable name | Value | Encrypt |
|---|---|---|
| `VITE_APP_ENV` | `production` | OFF |
| `VITE_SUPABASE_URL` | `https://wjdqmgxwulqxxxnyuzyl.supabase.co` | OFF |
| `VITE_SUPABASE_ANON_KEY` | *(main branch anon key)* | OFF |

If `VITE_SENTRY_ENV` isn't already in the Production list at value `production`, add it too. Same for `VITE_SENTRY_DSN` and `VITE_POSTHOG_API_KEY` — those were set during Phase 1 and typically already carry over; confirm they're present.

Click **Save** after each, or **Save all** if the UI batches.

---

## Step 4 — Set Preview variables

Click the **Preview** tab. For each variable:

| Variable name | Value | Encrypt |
|---|---|---|
| `VITE_APP_ENV` | `preview` | OFF |
| `VITE_SUPABASE_URL` | `https://<preview-ref>.supabase.co` (from Step 1) | OFF |
| `VITE_SUPABASE_ANON_KEY` | *(preview branch anon key from Step 1)* | OFF |
| `VITE_SENTRY_ENV` | `preview` | OFF |

Copy the Sentry DSN + Posthog API key values from the Production tab (same values) so preview builds still report errors + analytics.

Save.

---

## Step 5 — Trigger a fresh build + verify

1. Push any commit to your working branch (or re-run the latest CI on a dummy commit) to trigger a preview build
2. In CF Workers Builds → your service → **Deployments**, wait for the newest build to complete
3. Click into the build → scroll to the env vars list → confirm Preview vars are what you set

**Smoke test the migration page under preview:**

1. Visit `https://<branch-subdomain>.autumn-water-148a.workers.dev/data-migration/` (or whatever CF preview URL your build got)
2. You should see the **environment banner** showing:
   > **Target environment: PREVIEW · Supabase `<preview-ref>.supabase.co`**
3. If the banner says `production` or shows the main project's host, the Preview vars aren't applied. Back to Step 4.

**Smoke test under production:**

1. Merge to main (triggers a prod build)
2. Visit `https://antaeus.app/data-migration/`
3. Banner should read:
   > **Target environment: PRODUCTION · Supabase `wjdqmgxwulqxxxnyuzyl.supabase.co`**

---

## Troubleshooting

**Banner reads `development` even on a CF URL** — the build didn't see `VITE_APP_ENV` at compile time. CF Workers Builds injects vars at build, not at runtime. Confirm the var is in the correct tab (Production or Preview) and trigger a fresh build. Vite bundles the value into the JS at `vite build` time; you can't override it after deploy.

**Preview builds error with "Supabase client requested but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set"** — the Preview tab is missing those variables. Add them.

**Migration page shows blank Supabase host** — the URL didn't parse. Confirm you copied the full `https://<ref>.supabase.co` URL without trailing slashes or accidental surrounding quotes.

**Both main-branch and feature-branch builds show `production` in the banner** — CF might not have the Preview tab enabled for your Workers plan. In that case: leave all env vars on the single flat list (same as Phase 1) and accept that feature-branch builds also tag as production. Not ideal but works.

---

## After verification

Tell me (founder → Claude next session): **"Phase 2.4 env matrix verified — banner shows production on main and preview on feature branches."** I'll write the close-out session log entry in `CLAUDE.md` Part V §6 and move the Phase 2.4 todo to completed.
