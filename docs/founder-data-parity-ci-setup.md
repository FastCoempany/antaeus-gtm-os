# Founder setup — Data Parity CI (Phase 4.5 / ADR-005)

Click-by-click setup for the per-PR ephemeral Supabase branch CI workflow that ADR-005 specifies. Five external systems touch this — Supabase (service account + PAT), GitHub Actions (secret + variable), and Posthog (master flag). All steps need to be done once, by the founder, before the first Tier 1 retrofit PR opens.

**Status pre-setup:** Checkpoint 1 code is on `main`. The workflow file at `.github/workflows/data-parity-ci.yml` is parseable and will be ignored on any PR until the GitHub secret + variable are populated. Without setup, retrofit PRs will fail the "Provision Supabase branch" job — that's a feature, not a bug; it stops a half-configured CI from looking green when it can't actually provision a branch.

**Estimated time:** ~25 minutes total.

---

## Step 1 — Create the ci@antaeus.app Supabase account

The CI workflow runs as a service account, not as your personal Supabase login. This makes audit logs cleaner (every branch operation traces to `ci@`, not to you) and means a token leak doesn't expose your personal account.

1. Decide where `ci@antaeus.app` mail will land. Options:
   - **Recommended:** Forward to your personal inbox via Cloudflare Email Routing (or whatever you use for the domain). The address never receives more than 1-2 mails a year (Supabase invitations, password resets).
   - Alternative: a dedicated mailbox if you want stricter separation.
2. Visit [supabase.com/dashboard](https://supabase.com/dashboard). Make sure you're logged in as your personal account (the one that owns the antaeus-gtm-os project).
3. Click the org switcher in the top-left → settings on the org that owns antaeus-gtm-os.
4. Click "Team" in the org settings sidebar.
5. Click "Invite" and enter `ci@antaeus.app`. Role: **Developer** (or whatever's the minimum that grants branches:write — see Step 2).
6. Submit. Supabase will email an invitation to `ci@antaeus.app`. Accept it through your forwarded inbox.

---

## Step 2 — Generate a PAT for ci@antaeus.app

1. Open a private/incognito window so you're not logged in as your personal account.
2. Visit [supabase.com/dashboard](https://supabase.com/dashboard) and sign in as `ci@antaeus.app`. Set a strong password — this account exists to issue tokens, not for daily use, so the password rotation cadence is just "rotate PAT every 6 months."
3. Once signed in, visit [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
4. Click "Generate new token".
5. Name it `antaeus-gtm-os-ci-<YYYYMM>` (e.g. `antaeus-gtm-os-ci-202605`). The dated suffix makes rotation visible.
6. Submit. **Copy the token immediately** — Supabase only shows it once.
7. Sign out of the private/incognito window (don't leave `ci@` logged in anywhere).

---

## Step 3 — Add SUPABASE_CI_PAT to GitHub Actions secrets

1. Visit [github.com/FastCoempany/antaeus-gtm-os/settings/secrets/actions](https://github.com/FastCoempany/antaeus-gtm-os/settings/secrets/actions).
2. Click "New repository secret".
3. Name: `SUPABASE_CI_PAT`
4. Secret: paste the token from Step 2.
5. Click "Add secret".

The secret is now available to GitHub Actions as `${{ secrets.SUPABASE_CI_PAT }}`. It will not be readable back through the UI; if you need to verify it later, the only confirmation is that workflow runs that reference it succeed.

---

## Step 4 — Add SUPABASE_PROJECT_REF as a GitHub Actions variable

The project ref is not a secret — it appears in every Supabase URL. We store it as a **variable** (not a secret) so it's readable from logs and PR comments without redaction. This keeps debug output useful.

1. Visit [github.com/FastCoempany/antaeus-gtm-os/settings/variables/actions](https://github.com/FastCoempany/antaeus-gtm-os/settings/variables/actions).
2. Click "New repository variable".
3. Name: `SUPABASE_PROJECT_REF`
4. Value: `wjdqmgxwulqxxxnyuzyl` (the production project ref — same one in the heartbeat function URL).
5. Click "Add variable".

---

## Step 5 — Create the master umbrella flag in Posthog

This flag is off until every data-parity room hits Step 5. Flipping it on causes code paths that still need the 2026-04-24 migration blob as a fallback to error loudly.

1. Visit [app.posthog.com](https://app.posthog.com) → your project → Feature Flags in the left sidebar.
2. Click "New feature flag".
3. Key: `data_layer_parity_complete`
4. Name: `Data Layer Parity Complete (ADR-005 master flag)`
5. Description:
   ```
   Off until every Phase 4 room has completed Step 5 of ADR-005 data-layer
   parity retrofit. When on, code paths that still need the 2026-04-24
   migration blob as a fallback will error loudly so missed migrations
   surface immediately.
   ```
6. Release conditions: leave the default ("Roll out to 0% of users"). Do NOT toggle on.
7. Save.

Confirmation that it landed correctly: visit [the GitHub Codespaces or production webapp](https://antaeus.app/) signed in as yourself, open browser DevTools → Console, and run:
```js
window.posthog?.isFeatureEnabled?.("data_layer_parity_complete")
```
Should return `false` (or `undefined` if Posthog hasn't loaded yet — wait a few seconds and retry).

---

## Step 6 — Verify the workflow can provision a branch

This step proves the whole chain works end-to-end before the first real retrofit PR opens.

1. Visit [github.com/FastCoempany/antaeus-gtm-os/actions/workflows/data-parity-ci.yml](https://github.com/FastCoempany/antaeus-gtm-os/actions/workflows/data-parity-ci.yml).
2. The workflow has no `workflow_dispatch` trigger by design — to verify, you'll instead exercise it by opening a small test PR.
3. Easier path: open a one-line PR that touches `supabase/migrations/README.md` (or any other file inside `supabase/migrations/`). The workflow's path filter will pick it up.
4. Wait for the "Data Parity CI" workflow to run on the PR. Expected steps:
   - **Should run data-parity CI?** — outputs `run=true` ✓
   - **Provision Supabase branch** — creates `pr-<num>-run-<id>`, waits ~30-90s, applies migrations ✓
   - **Realtime cross-tab tests** — runs `npm run test:realtime` which matches 0 tests (passes with `--pass-with-no-tests`) ✓
   - **Teardown Supabase branch** — deletes the branch ✓
5. If all four jobs are green, the setup is complete. Close the test PR without merging.

---

## Maintenance — token rotation

The PAT expires in 1 year (Supabase default). Set a calendar reminder to rotate every 6 months:

1. Sign in to Supabase as `ci@antaeus.app` (private window).
2. Visit [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
3. Generate a new token with name `antaeus-gtm-os-ci-<YYYYMM>` (the new month).
4. Update `SUPABASE_CI_PAT` in GitHub Actions secrets (Step 3 above).
5. Revoke the old token in Supabase.

---

## Maintenance — daily janitor

The `.github/workflows/data-parity-branch-janitor.yml` workflow runs daily at 03:00 UTC and sweeps any branches left stranded by cancelled CI runs. No founder action needed for routine sweeps. You can manually trigger one in an emergency from [github.com/FastCoempany/antaeus-gtm-os/actions/workflows/data-parity-branch-janitor.yml](https://github.com/FastCoempany/antaeus-gtm-os/actions/workflows/data-parity-branch-janitor.yml) → "Run workflow".

The janitor's safety rules:
- Only deletes branches matching the pattern `pr-<num>-run-<id>` (the CI-created shape)
- Never touches `main` or the persistent `preview` branch
- Only deletes branches whose linked PR is closed OR which are older than 24 hours

---

## Cost considerations

Supabase Pro tier includes a quota for branch usage. At current PR rates (~5-10 retrofit PRs per week during peak Phase 4.5), each consuming a ~5-10 minute branch lifetime, total branch usage stays well under the Pro tier ceiling. If you ever see "branch quota exceeded" errors in CI:
- Manually trigger the janitor (it'll catch anything stranded)
- Consider whether multiple stuck workflows are holding branches open
- As a last resort, list active branches via `supabase --experimental branches list --project-ref wjdqmgxwulqxxxnyuzyl` and delete any obviously stale entries.

---

## What's next

After this setup is complete and the test PR verifies the workflow end-to-end:
- Close the test PR.
- The first **Tier 1 retrofit PR** opens against Signal Console (ADR-005 §"Room priority order" + canon §6).
- That PR walks Steps 1-5 of the retrofit lifecycle, each step landing as a separate sub-PR with the data-parity CI workflow exercising the live database path.

Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
Ref: .github/workflows/data-parity-ci.yml
Ref: .github/workflows/data-parity-branch-janitor.yml
