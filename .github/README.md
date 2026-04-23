# GitHub Actions + repo setup

This directory holds the CI/CD workflows that gate PRs and handle deploys.

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| `workflows/ci.yml` | Every PR + push to non-main | Typecheck + Vitest + Playwright E2E + build. Required to pass before merge. |
| `workflows/pr-preview.yml` | Every PR (open/sync/reopen) | Builds the site and deploys to a Cloudflare Pages preview URL; posts URL as a PR comment. |
| `workflows/deploy.yml` | Push to `main` | Re-runs all CI gates against `main`, then deploys to production via `wrangler versions upload`. |

## One-time repo setup required

These must be configured in the GitHub repo before the workflows will run successfully. Setting them is a founder (or repo-admin) action — the CI workflows cannot configure them.

### 1. Required secrets

Set in **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret | How to obtain | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token with `Cloudflare Pages:Edit` + `Workers Scripts:Edit` scopes for the Antaeus account | `deploy.yml`, `pr-preview.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → any zone page → right sidebar "Account ID" | `deploy.yml`, `pr-preview.yml` |

### 2. Required repository variable

Set in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value | Used by |
|---|---|---|
| `CLOUDFLARE_PAGES_PROJECT_NAME` | The Cloudflare Pages project name (e.g., `antaeus-gtm-os`) | `pr-preview.yml` |

### 3. Required branch protection on `main`

**Settings → Branches → Branch protection rules → Add rule** for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Required checks:
    - `Typecheck`
    - `Unit + component tests (Vitest)`
    - `E2E smoke tests (Playwright)`
    - `Vite build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

### 4. Environment setup

Optional but recommended: **Settings → Environments → New environment** named `production`. Attach `deploy.yml`'s `deploy` job to it. Allows you to require manual approval before any production deploy if desired — turn on "Required reviewers" on the environment. Especially useful during Phase 2+ of the foundation migration.

## What the workflows assume

- Node.js 22 is the runtime.
- Python 3.11 is available (for the static server that Playwright's webServer invokes).
- `npm ci` is clean on every run (lockfile is committed and deterministic).
- `npm run build` produces a `dist/` directory.
- `npm run build:cloudflare` produces the static asset tree the existing deploy script expects.
- Playwright's chromium CDN is reachable from GitHub runners (it is by default; the Puppeteer-Chrome workaround in `tools/qa/capture-demo-room.js` is only needed for restrictive local environments).

## What to do if CI is red

1. **Typecheck red** — run `npm run typecheck` locally. Fix TS errors.
2. **Vitest red** — run `npm test` locally. Fix failing unit/component tests.
3. **Playwright E2E red** — download the `playwright-report` artifact from the failing run; inspect the trace. Run locally with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(node -e 'console.log(require("puppeteer").executablePath())')" npm run test:e2e` to reproduce.
4. **Build red** — run `npm run build` locally. Usually a TS error the typecheck job would have caught; occasionally a Vite-specific issue (missing asset, bad import).

Never merge with red CI.

## Where to go for context

- Stack rationale: `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md`
- Room-level contracts: `CLAUDE.md` (operating canon)
- Rendering pipeline conventions: `CLAUDE.md` Part V §4
