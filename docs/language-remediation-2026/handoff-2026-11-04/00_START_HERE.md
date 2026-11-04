# Antaeus completion handoff — 2026-11-04

This is a transfer of unfinished work, not a completion certificate. The owner requested that Claude Code review Codex's work and continue it today. Source editing has stopped for the transfer. Do not merge PR #324.

## Use this worktree on the same Windows computer

`C:\Users\tanya\Documents\Codex\2026-10-30\you-are-taking-over-the-final\work\antaeus`

This is the real Git worktree on `language-remediation-v1`, tracking `origin/language-remediation-v1`. All completion changes are saved but **uncommitted and unpushed**. Opening only the remote PR loses this pass. Do not reset, clean, overwrite, or re-clone over it. Do not run the patch against this already modified worktree.

Repository: `https://github.com/FastCoempany/antaeus-gtm-os`

PR: `https://github.com/FastCoempany/antaeus-gtm-os/pull/324`

Completion-pass starting HEAD: `f01d44ed3a98aa8927e23c308659d3030c8cacad`

Last fetched main: `f6416124732b5a5ebe9c8eb722a8b8557a0768b2`

At handoff, HEAD is still the starting HEAD. No completion commit, push, PR-description update, final certificate, or merge has occurred. The PR was draft at last inspection. GitHub CI evidence currently describes the old remote head, not these local changes.

## Read in this order

1. `01_CLAUDE_PROMPT.txt` — paste-ready owner delegation.
2. `02_OWNER_REQUIREMENTS.md` — faithful task requirements, including approved behavioral evolution and stop conditions.
3. `03_SCORING_METHOD.md` — recovered original equal-weight qualitative rubric.
4. `04_CURRENT_STATE_AND_REMAINING_WORK.md` — current evidence, defects, incomplete work, and specific discoveries.
5. All 17 files in `original-working-set/`; these are the original specification, not optional background.
6. All repository files in `docs/language-remediation-2026/`, especially baseline doc 15 and incomplete reconciliation doc/JSON 16.
7. `audit-notes/backend-audit.md`, `audit-notes/generator-audit.md`, scratch reconciliation evidence, and actual source/test diffs. The generator note is stale; the current-state handoff and actual files supersede it.
8. Both complete diffs: `patches/completion-pass.patch` (Codex's uncommitted tracked edits) and `patches/full-pr-plus-completion.patch` (main to current tracked working state). Also inspect all new files listed in `snapshot-manifest.json`; Git diff alone omits them.

## Bundle contents and recovery

- `working-files/`: byte-for-byte copies of every currently modified tracked file and every nonignored untracked file, with repository-relative paths. Includes generated transcript, source, tests, new tooling, reconciliation and inventory/audit artifacts.
- `snapshot-manifest.json`: tracking status, sizes and SHA-256 hashes of those copies. `DELETED` rows, if any, must be removed when reconstructing; missing files must not be silently ignored.
- `patches/`: full binary-capable Git patches and Git status/branch/remote metadata.
- `baseline-source.zip`: immutable source archive of the starting HEAD, without Git metadata or dependencies. It is a recovery/reference source, not an independently configured Git checkout.
- `original-working-set/` and the original supplied ZIP: all original remediation inputs.
- `audit-notes/`: audit notes, test logs and reconciliation helpers/decision ledgers. Helper scripts contain their original local-path assumptions and some perform edits; **inspect before using, do not blindly rerun**.

For another machine, clone the repository normally, check out `language-remediation-v1` at the recorded starting commit (preserve any newer remote work separately), apply `completion-pass.patch` to a clean tree, and copy the manifest's UNTRACKED files from `working-files/` to their relative paths. The manifest's tracked-file copies can verify exact final bytes. Do not apply both patches: they have different bases. `full-pr-plus-completion.patch` is for review against main. Then install dependencies and rerun checks. The original worktree's `.git` file refers to a Git directory outside the worktree, so copying its directory alone is not a portable Git clone.

## Local environment

PowerShell; Node 24.14.0; npm 11.9.0; Deno installed. Git and `gh` were authenticated. Use `npm.cmd` / `npx.cmd` on Windows. GitHub CI uses Node 22. The worktree already has node_modules and installed Playwright browsers.

The separate `work/baseline-antaeus` directory is a baseline source snapshot with its own built assets/transcript, not the target checkout. Other checkouts (`C:\Users\tanya\antaeus-gtm-os` and especially unrelated dirty `C:\AppDev\v1AntaeusApp\Appv2_290126`) must not be substituted or modified accidentally.

The last full transcript process completed successfully before this snapshot: 21 rooms, 1,610 actions, 501 distinct revealed states. It was built before subsequent source changes, so it is review evidence, not the final acceptance corpus. All Codex subagents have stopped. No Codex source edits should run concurrently with Claude.

No environment secrets, credentials, node_modules, or live database dumps are included. Deployment/authentication access remains whatever is already configured on the user's computer. Do not deploy or merge as part of this transfer.
