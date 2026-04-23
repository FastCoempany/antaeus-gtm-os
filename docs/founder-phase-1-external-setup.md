# Phase 1 External Setup — Founder Walkthrough

**Goal:** complete the six one-time external setup steps that let the ADR-001 Phase 1 foundation actually function end-to-end.

**Time estimate:** 60–90 minutes total if done in one sitting. Each step is 5–20 minutes.

**Order matters:**
1. **GitHub secrets + variable** (steps 3 + 4) — fastest; unblocks CI immediately once a PR runs
2. **Supabase staging project** (step 6) — can provision in parallel; not urgent but cheap to do now
3. **Sentry project** (step 1) — requires new account if you don't have one
4. **Posthog project** (step 2) — same
5. **Branch protection on main** (step 5) — do LAST; requires at least one green CI run to populate the required-checks dropdown

---

## 1. Sentry project + VITE_SENTRY_DSN

### 1.1 Create the Sentry project

1. Go to https://sentry.io → **Sign up** (use your company/founder email) or **Sign in** if you already have an account.
2. If creating new org: pick a name (e.g., `antaeus` or your company name). This becomes part of the URL.
3. From the dashboard, click **Projects** (left sidebar) → **Create Project** (top-right button).
4. Platform: search and select **Browser JavaScript**. Not Node, not any framework-specific option — plain Browser JavaScript is correct for Preact/vanilla.
5. Alert frequency: pick "Alert me on every new issue" (recommended for pre-beta; you can dial this down later).
6. Project name: `antaeus-web`.
7. Team: default team is fine.
8. Click **Create Project**.

### 1.2 Get the DSN

1. On the project setup wizard that appears, scroll to find the `dsn: "https://...@o....ingest.sentry.io/..."` line. That whole URL is the DSN.
2. Alternative path if you've already closed the wizard:
   **Settings** (gear icon, top of left sidebar) → **Projects** → click your project → **Client Keys (DSN)** → copy the value under "DSN".
3. Copy the full DSN URL (starts with `https://`, contains `@`).

### 1.3 Paste into Cloudflare Pages env vars

1. Go to https://dash.cloudflare.com → **Workers & Pages** (left sidebar).
2. Click your Antaeus Pages project (whatever it's named — likely `antaeus-gtm-os` or similar).
3. **Settings** tab → **Environment variables**.
4. Click **Add variable**:
   - Variable name: `VITE_SENTRY_DSN`
   - Value: [paste DSN]
   - Environment: **Production** — click Save.
5. Click **Add variable** again:
   - Variable name: `VITE_SENTRY_DSN`
   - Value: [same DSN, or a separate DSN if you created a second project for preview]
   - Environment: **Preview** — click Save.
6. Click **Add variable** one more time:
   - Variable name: `VITE_SENTRY_ENV`
   - Value: `production`
   - Environment: **Production** → Save.
7. And one more:
   - Variable name: `VITE_SENTRY_ENV`
   - Value: `preview`
   - Environment: **Preview** → Save.

### 1.4 Verify (after next deploy)

After the next Cloudflare Pages deploy picks up the env vars:
1. Open any page on your Cloudflare Pages URL.
2. Open browser DevTools → Console.
3. Type: `Sentry.captureMessage('hello from sentry test')` and press Enter.
4. Check Sentry dashboard → **Issues** → you should see the event within ~30 seconds.

---

## 2. Posthog project + VITE_POSTHOG_API_KEY

### 2.1 Create the Posthog project

1. Go to https://posthog.com → **Sign up** or **Sign in**.
2. If prompted for region: **US Cloud** (matches the `https://us.i.posthog.com` default in `src/lib/observability.ts`). If you pick EU, you'll also need to set `VITE_POSTHOG_HOST` = `https://eu.i.posthog.com`.
3. Create organization if new.
4. Project name: `antaeus-web`. Use case: **Product analytics**.
5. Click through any onboarding wizard; you can skip the "install the SDK" step — the SDK is already in the codebase.

### 2.2 Get the Project API Key

1. **Settings** (gear icon, left sidebar) → **Project** → **Project variables** or **General**.
2. Look for **Project API Key**. It's a string starting with `phc_...`.
3. Copy it.

### 2.3 Paste into Cloudflare Pages env vars

Same pattern as Sentry (Cloudflare dashboard → Workers & Pages → your project → Settings → Environment variables):
- `VITE_POSTHOG_API_KEY` = [phc_... value] — set for both Production and Preview.
- `VITE_POSTHOG_HOST` = `https://us.i.posthog.com` — only needed if you picked EU Cloud, otherwise skip.

### 2.4 Verify

After deploy:
1. Open any page on your Cloudflare Pages URL.
2. In Posthog dashboard → **Activity** (or **Live Events**).
3. You should see a `$pageview` event within ~30 seconds.

---

## 3. GitHub Actions secrets: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`

### 3.1 Get the Cloudflare Account ID

1. Go to https://dash.cloudflare.com.
2. Click any zone in the sidebar (or **Workers & Pages** → **Overview**).
3. In the right sidebar under "API", you'll see **Account ID** — copy the value (a long hex string).

### 3.2 Create a Cloudflare API token

1. Top-right profile icon → **My Profile** → **API Tokens** tab.
2. Click **Create Token**.
3. Use template: scroll down to **Custom Token** or start from "Edit Cloudflare Workers" if visible. Custom is cleaner.
4. **Token name:** `antaeus-gtm-os-deploy` (or similar).
5. **Permissions:** add these rows (click "+ Add more" between each):
   - `Account` | `Cloudflare Pages` | `Edit`
   - `Account` | `Workers Scripts` | `Edit`
   - `Account` | `Account Settings` | `Read`
6. **Account Resources:** `Include` → Specific account → [your account].
7. **Zone Resources:** `Include` → All zones from an account → [your account]. (Optional — only needed if Workers hit custom domains.)
8. **TTL:** leave blank (no expiration) for now; rotate later if desired.
9. **IP filtering:** leave open unless you have a specific static IP to restrict to.
10. Click **Continue to summary** → **Create Token**.
11. **COPY THE TOKEN NOW.** You will NOT be able to see it again after you navigate away. Paste it into a password manager immediately.

### 3.3 Add both to GitHub as repository secrets

1. Go to GitHub → https://github.com/fastcoempany/antaeus-gtm-os (or wherever the repo lives).
2. **Settings** tab (top of repo page) → **Secrets and variables** → **Actions** (left sidebar).
3. Make sure you're on the **Secrets** tab (not Variables).
4. Click **New repository secret**.
5. Name: `CLOUDFLARE_API_TOKEN` → Value: [paste token] → **Add secret**.
6. Click **New repository secret** again.
7. Name: `CLOUDFLARE_ACCOUNT_ID` → Value: [paste account ID] → **Add secret**.

You should now see both listed under "Repository secrets" (values are masked).

---

## 4. GitHub Actions variable: `CLOUDFLARE_PAGES_PROJECT_NAME`

### 4.1 Find the project name

1. Cloudflare dashboard → **Workers & Pages** → click your Antaeus Pages project.
2. The project name is in the URL path and as the page title. Likely: `antaeus-gtm-os` (exact slug of the project as Cloudflare knows it — usually all-lowercase, dashes, no spaces).
3. Copy the exact slug (the URL slug, not the display name).

### 4.2 Add as a GitHub Actions variable

1. GitHub → repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click the **Variables** tab (not Secrets — variables are public-safe, secrets are encrypted).
3. Click **New repository variable**.
4. Name: `CLOUDFLARE_PAGES_PROJECT_NAME`
5. Value: [project slug, e.g., `antaeus-gtm-os`]
6. Click **Add variable**.

---

## 5. Branch protection on `main`

**Do this LAST.** The required-checks dropdown only shows checks that have actually run at least once. If you do this first, the four check names won't appear and you'll have to come back.

### 5.1 Trigger a first CI run

1. Push a trivial commit to any branch (or let an existing branch like `claude/generate-work-report-pnrJu` run its CI — the workflow file `.github/workflows/ci.yml` runs on pushes to non-main branches).
2. Go to GitHub → **Actions** tab. Watch the CI run. Wait until all four jobs complete (green or red doesn't matter for this step — they just need to have RUN).
3. The four job names that must appear on the dropdown later are:
   - `Typecheck`
   - `Unit + component tests (Vitest)`
   - `E2E smoke tests (Playwright)`
   - `Vite build`

### 5.2 Create the branch protection rule

1. GitHub → repo → **Settings** → **Branches** → **Branch protection rules**.
2. Click **Add rule** (or **Add branch protection rule**).
3. **Branch name pattern:** `main`.
4. Check these boxes:
   - ☑ **Require a pull request before merging**
     - (Optional) ☑ Require approvals: `1` if you want to require an explicit approval even as sole founder-maintainer; `0` if you'll rely on the CI gate alone.
     - ☑ Dismiss stale pull request approvals when new commits are pushed
   - ☑ **Require status checks to pass before merging**
     - ☑ Require branches to be up to date before merging
     - In the search box, type each of the four check names and select them as they appear:
       - `Typecheck`
       - `Unit + component tests (Vitest)`
       - `E2E smoke tests (Playwright)`
       - `Vite build`
   - ☑ **Require conversation resolution before merging** (nice-to-have)
   - ☑ **Do not allow bypassing the above settings** (important — prevents accidental force-pushes through to main)
5. Click **Create** (or **Save changes**).

### 5.3 Verify

1. Open a PR against `main` from a branch.
2. You should see all four required checks listed on the PR.
3. Merge button should be disabled until all four are green.

---

## 6. Supabase staging project

Your existing Supabase project is used for production auth. You need a separate project for staging so Phase 2's schema migrations can be tested safely.

### 6.1 Create the staging project

1. Go to https://supabase.com → **Dashboard** (sign in if needed).
2. Top-right → **New project** (or from the org page).
3. **Organization:** pick your existing org (or create one if new).
4. **Project name:** `antaeus-staging`.
5. **Database Password:** click the generator button for a strong password. **Save this in your password manager immediately** — you'll need it for DB admin tasks. Supabase will not show it again.
6. **Region:** same as your production project (usually `us-east-1` or `us-west-1` — pick same for predictable latency).
7. **Pricing plan:** Free tier is sufficient until real traffic. You can upgrade per-project later.
8. Click **Create new project**. Wait ~1 minute for provisioning.

### 6.2 Get URL + anon key for staging

1. Once provisioned, open the staging project.
2. **Settings** (gear icon, bottom of left sidebar) → **API**.
3. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Project API keys** → **`anon` `public`** (long JWT-looking string starting with `eyJ...`)

### 6.3 Get URL + anon key for production

Same steps, in your existing production Supabase project.

### 6.4 Paste into Cloudflare Pages env vars

Cloudflare Pages → Workers & Pages → your project → Settings → Environment variables:

**Production environment:**
- `VITE_SUPABASE_URL` = [production project URL]
- `VITE_SUPABASE_ANON_KEY` = [production anon key]

**Preview environment:**
- `VITE_SUPABASE_URL` = [staging project URL]
- `VITE_SUPABASE_ANON_KEY` = [staging anon key]

This way, PR previews and dev deploys point at staging; main-branch deploys point at production. Nothing a preview does can affect real user data.

### 6.5 Verify (no action needed yet)

Phase 2 is where the schema gets pushed to these projects. For now, you just need them provisioned and their credentials in Cloudflare. Phase 2's first commit will confirm connectivity by running migrations.

---

## After all six: one deploy

Push any commit to trigger a fresh Cloudflare Pages build. It will pick up all the new env vars. Check in Cloudflare Pages → Deployments that the most recent deploy says "ready" and all variables are listed.

Open the deployed site, open DevTools, verify no `VITE_SENTRY_DSN is not defined` or similar warnings in the console.

## If something doesn't work

- **Sentry events not arriving:** verify DSN has no trailing whitespace, verify `VITE_SENTRY_DSN` is set in the CORRECT environment (Production vs. Preview), verify the deploy actually picked up the env var (Cloudflare Pages → Deployments → most recent → Variables tab should list it).
- **Posthog events not arriving:** same checks. Also check the browser isn't blocking the request (some privacy extensions intercept Posthog).
- **CI still blocks merge to main even when green:** confirm you added the rule for branch `main` exactly (not `master`), and that the check names exactly match (case-sensitive).
- **Supabase connection errors in Preview deploys:** confirm the staging URL+key are in the Preview environment, not Production.

## Reference

- `.github/README.md` — summary of what each workflow needs
- `.env.example` — template of every env var with provenance notes
- `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md` §6 Phase 1.3 + 1.4 — rationale for each of these integrations
