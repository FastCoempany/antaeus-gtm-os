# GitHub Actions setup

This directory holds the CI workflow that gates PRs. Deployment is handled natively by Cloudflare Workers Builds (the Git integration on your `autumn-water-148a` Workers service), not by GitHub Actions.

## Workflow

| File | Trigger | Purpose |
|---|---|---|
| `workflows/ci.yml` | Every PR + push to non-main | Typecheck + Vitest + Playwright E2E + build. Required to pass before merge. |

Previously this directory also contained `deploy.yml` and `pr-preview.yml`. Both were removed on 2026-04-24 (superseded by ADR-002) because Cloudflare Workers Builds already handles production deploys on main-branch pushes and version previews on feature-branch pushes. Keeping the GitHub Actions deploy workflows alongside CF's native integration would have created race conditions and required redundant credentials in GitHub secrets.

## One-time repo setup required

**→ For step-by-step click-through instructions, see [`docs/founder-phase-1-external-setup.md`](../docs/founder-phase-1-external-setup.md).** That walkthrough covers every external-service setup in the correct order with verification steps. This README is the summary.

### Branch protection on `main`

Required to gate merges on CI passing.

Set in **GitHub → repo Settings → Branches → Branch protection rules → Add rule**:
- Branch name pattern: `main`
- ☑ Require a pull request before merging
- ☑ Require status checks to pass before merging
  - Required checks (add after at least one CI run has completed so the names populate the dropdown):
    - `Typecheck`
    - `Unit + component tests (Vitest)`
    - `E2E smoke tests (Playwright)`
    - `Vite build`
- ☑ Require branches to be up to date before merging
- ☑ Do not allow bypassing the above settings

## What the workflow assumes

- Node.js 22 is the runtime on GitHub runners.
- Python 3.11 is available (for the static server that Playwright's webServer invokes).
- `npm ci` is clean on every run (lockfile is committed and deterministic).
- `npm run build` produces a `dist/` directory via Vite.
- Playwright's chromium CDN is reachable from GitHub runners (it is by default; the Puppeteer-Chrome workaround in `tools/qa/capture-demo-room.js` is only needed for restrictive local environments).

## What to do if CI is red

1. **Typecheck red** — run `npm run typecheck` locally. Fix TS errors.
2. **Vitest red** — run `npm test` locally. Fix failing unit/component tests.
3. **Playwright E2E red** — download the `playwright-report` artifact from the failing run; inspect the trace. Run locally with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(node -e 'console.log(require("puppeteer").executablePath())')" npm run test:e2e` to reproduce.
4. **Build red** — run `npm run build` locally. Usually a TS error the typecheck job would have caught; occasionally a Vite-specific issue (missing asset, bad import).

Never merge with red CI.

## Where to go for context

- Stack rationale: `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md`
- Phase 2 rescope + Supabase Branches decision: `deliverables/adr/adr-002-*.md`
- Room-level contracts: `CLAUDE.md` (operating canon)
- Rendering pipeline conventions: `CLAUDE.md` Part V §4
