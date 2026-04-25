# Phase 1 External Setup — Founder Walkthrough

**Goal:** complete the external setup steps that let the ADR-001 Phase 1 foundation actually function end-to-end.

**Updated 2026-04-24:** Revised after discovery that Cloudflare Workers Builds already handles deploys natively (steps 3 + 4 removed) and that significant Supabase work already exists (step 6 replaced by ADR-002 Supabase Branches plan).

**Time estimate:** 30–45 minutes total for the remaining steps if done in one sitting.

**Order:**
1. **Sentry** (step 1) — if you don't already have the project
2. **Posthog** (step 2) — if you don't already have the project
3. **Branch protection on main** (step 3, formerly step 5) — do LAST; requires at least one green CI run to populate the required-checks dropdown
4. **Supabase staging branch** (step 4) — see ADR-002 for the plan; branches created via Supabase dashboard when Phase 2 begins

## Retired sections

Previous versions of this doc included steps for:
- Creating Cloudflare API tokens and adding them as GitHub secrets
- Adding `CLOUDFLARE_PAGES_PROJECT_NAME` as a GitHub variable
- Creating a separate Supabase project for staging

All three were superseded on 2026-04-24 because:
- Cloudflare Workers Builds handles deploys natively (no GH Actions deploy workflows needed; see ADR-002)
- Supabase Branches is the better staging approach than separate projects (see ADR-002)

---

## 1. Sentry project + VITE_SENTRY_DSN

### 1.1 Create the Sentry project

1. Go to https://sentry.io → **Sign up** (use your company/founder email) or **Sign in** if you already have an account.
2. If creating new org: pick a name (e.g., `antaeus` or your company name). This becomes part of the URL.
3. From the dashboard, click **Projects** (left sidebar) → **Create Project** (top-right button).
4. Platform: search and select **Browser JavaScript**. Not Node, not any framework-specific option — plain Browser JavaScript is correct for Preact/vanilla.
5. Alert frequency: pick "Alert me on high priority issues" (recommended for pre-beta; Sentry's smart default).
6. Project name: `antaeus-web`.
7. Team: default team is fine.
8. Click **Create Project**.

### 1.2 Get the DSN

1. On the project setup wizard that appears, scroll to find the `dsn: "https://...@o....ingest.sentry.io/..."` line. That whole URL is the DSN.
2. Alternative path: **Settings** (gear icon, top of left sidebar) → **Projects** → click your project → **Client Keys (DSN)** → copy the value under "DSN".
3. Copy the full DSN URL (starts with `https://`, contains `@`).

### 1.3 Paste into Cloudflare Workers Builds variables

1. Go to https://dash.cloudflare.com → **Workers & Pages** → click your Antaeus Workers service (`autumn-water-148a`).
2. **Settings** tab → scroll down to the **Build** panel (or click "Build" in the right sidebar).
3. Inside the Build panel, find the **Variables and secrets** row → click the **+ Add** button.
4. In the dialog:
   - Variable name: `VITE_SENTRY_DSN`
   - Value: [paste DSN]
   - Encrypt: leave OFF (Sentry DSN is public-safe; it ends up in the client bundle anyway)
5. Save.
6. Click **+ Add** again:
   - Variable name: `VITE_SENTRY_ENV`
   - Value: `production`
7. Save.

**Note on scoping:** Cloudflare Workers Builds variables apply to all builds (main + feature branches). There is no per-environment split at this layer. For `VITE_SENTRY_ENV`, set it to `production` and accept that feature-branch builds will also tag as `production` — this is acceptable for pre-beta. A future optimization can override per-branch via the Deploy/Version commands if needed.

### 1.4 Verify (deferred to Phase 3)

Verification requires a live page that actually calls `initObservability()` from `src/lib/observability.ts`. No existing page does this yet; the wiring happens in Phase 3 when the first Preact room migrates. At that point, the first deploy from main will automatically fire a Sentry init + capture any errors.

For optional early verification: write a temporary local-dev page that imports `observability.ts` and calls `initObservability()`, run `npm run dev`, deliberately throw an error, and confirm the Sentry dashboard receives it. This is optional; skip unless you want to prove the wire-up before Phase 3 lands.

---

## 2. Posthog project + VITE_POSTHOG_API_KEY

### 2.1 Create the Posthog project

1. Go to https://posthog.com → **Sign up** or **Sign in**.
2. If prompted for region: **US Cloud** (matches the `https://us.i.posthog.com` default in `src/lib/observability.ts`). If you pick EU, you'll also need to set `VITE_POSTHOG_HOST` = `https://eu.i.posthog.com`.
3. Create organization if new.
4. Project name: `antaeus-web`. Use case: **Product analytics**.
5. On the "What do you want to do with PostHog?" screen, pick **"I'll pick myself"**. On the product selection that follows, enable at minimum: Product analytics + Feature flags. Optionally enable Session replay. Skip Surveys, Experiments, Error tracking (Sentry handles errors).
6. Skip the AI install wizard — the SDK is already in the codebase.

### 2.2 Get the Project API Key

1. **Settings** → **Project** → **Project variables** or **General**.
2. Look for **Project API Key**. It's a string starting with `phc_`.
3. Copy it.

### 2.3 Paste into Cloudflare Workers Builds variables

Same panel as the Sentry vars. Click **+ Add**:

- Variable name: `VITE_POSTHOG_API_KEY`
- Value: [paste `phc_...` key]
- Encrypt: leave OFF (project API key is public-safe)
- Save

Optionally: add `VITE_POSTHOG_HOST` = `https://us.i.posthog.com` (only strictly needed if EU; defaults to US in code).

### 2.4 Verify (deferred to Phase 3)

Same reason as Sentry: no existing page calls `initObservability()` yet. Verification happens naturally in Phase 3 when the first Preact room lands on main.

---

## 3. Branch protection on `main`

**Do this LAST.** The required-checks dropdown only shows checks that have actually run at least once. If you do this first, the four check names won't appear and you'll have to come back.

### 3.1 Trigger a first CI run

1. Push a trivial commit to any branch (or let an existing branch like `claude/generate-work-report-pnrJu` run its CI — the workflow file `.github/workflows/ci.yml` runs on pushes to non-main branches).
2. Go to GitHub → **Actions** tab. Watch the CI run. Wait until all four jobs complete (green or red doesn't matter for this step — they just need to have RUN).
3. The four job names that must appear on the dropdown later are:
   - `Typecheck`
   - `Unit + component tests (Vitest)`
   - `E2E smoke tests (Playwright)`
   - `Vite build`

### 3.2 Create the branch protection rule

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

### 3.3 Verify

1. Open a PR against `main` from a branch.
2. You should see all four required checks listed on the PR.
3. Merge button should be disabled until all four are green.

---

## 4. Supabase staging (deferred — see ADR-002)

Original plan called for creating a second Supabase project for staging. That plan was superseded on 2026-04-24 in favor of using Supabase Branches, which provide the same isolation with less operational overhead and built-in schema propagation from production.

**No action is needed during Phase 1.** The staging branch is created during Phase 2 when schema migrations actually need a target to run against without risking production data.

See `deliverables/adr/adr-002-*.md` for the full Phase 2 rescope and Supabase Branches plan.

---

## After all steps

Push any commit to trigger a fresh Cloudflare Workers Builds run. It picks up the new env vars on the next build. Verify in Cloudflare Pages → Deployments that the most recent build succeeded and the variables are listed in the Variables and secrets panel.

## If something doesn't work

- **Variables in the wrong panel:** Cloudflare's top-level "Variables and Secrets" is for Worker runtime variables (blocked for static-asset-only Workers). You want the "Variables and secrets" row INSIDE the Build panel, which is for build-time env vars.
- **CI still blocks merge to main even when green:** confirm you added the rule for branch `main` exactly (not `master`), and that the check names exactly match (case-sensitive).

## Reference

- `.github/README.md` — summary of the CI workflow
- `.env.example` — template of every env var with provenance notes
- `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md` — stack rationale
- `deliverables/adr/adr-002-*.md` — Phase 2 rescope + Supabase Branches decision
