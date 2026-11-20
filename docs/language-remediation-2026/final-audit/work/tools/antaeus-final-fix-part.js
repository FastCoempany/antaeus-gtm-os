export const meta = {
  name: 'antaeus-final-fix-part',
  description: 'Apply verified audit findings in isolated checkouts (one per repository partition), then have an independent reviewer check each diff for accuracy and overcorrection',
  phases: [
    { title: 'Fix', detail: 'one fixer per partition, each in its own git worktree; applies the work order, updates tests, sweeps the partition' },
    { title: 'Review', detail: 'an independent reviewer reads each diff against the work order: accuracy, judgment kept, tests not weakened, no contract renames' },
  ],
}

const S = '/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit'
const WS = 'ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/original-working-set'
const PARTS = (args && args.partitions) || []

const FIX = { type: 'object', properties: { partition: { type: 'string' }, resultFile: { type: 'string' }, commit: { type: 'string' }, applied: { type: 'integer' }, amended: { type: 'integer' }, skipped: { type: 'integer' }, sweep: { type: 'integer' }, needsElsewhere: { type: 'integer' }, testsPass: { type: 'boolean' }, notes: { type: 'string' } }, required: ['partition', 'resultFile', 'commit', 'applied', 'amended', 'skipped', 'testsPass', 'notes'] }
const REV = { type: 'object', properties: { partition: { type: 'string' }, reviewFile: { type: 'string' }, commit: { type: 'string' }, problemsFound: { type: 'integer' }, problemsFixed: { type: 'integer' }, testsPass: { type: 'boolean' }, notes: { type: 'string' } }, required: ['partition', 'reviewFile', 'commit', 'problemsFound', 'problemsFixed', 'testsPass', 'notes'] }

function fixPrompt(p) {
  return `You are a fixer in the final audit of the Antaeus language remediation. First read the shared brief in full and follow it exactly: ${S}/FIX_BRIEF.md

YOUR PARTITION: ${p.key}
YOUR CHECKOUT: ${p.wt}  — a git worktree of the repository on its own branch (${p.branch}). Work ONLY inside this directory: every path in your work order is relative to it. Never read from or edit /home/user/antaeus-gtm-os (the orchestrator's checkout; it may differ from yours). \`node_modules\` is linked into your checkout.
Paths you own (edit nothing else): ${p.paths.join(', ')}
Work order (verified findings to fix): ${p.workorder}
${p.docs && p.docs.length ? 'Original rewrite documents that govern this partition (inside your checkout): ' + p.docs.map(d => `${WS}/${d}`).join(', ') : ''}
${p.notes ? 'Notes from the orchestrator:\n' + p.notes : ''}

Each work-order item has: id, category, severity, file, line, state, current (the text or behavior found), problem, governing (the rule), change (the fix that two independent reviewers accepted — apply this unless you can show it is inaccurate to the code), reviewerNotes, checkedBy, testsAffected. Items marked checkedBy "missed-by-refute", "missed-by-rewrite" or "orchestrator" were seen by one reviewer only: verify those with extra care before changing anything, and skip (with the reason) any that are not real.

When a change text contains "OWNER DECISION:", apply only the part before those words (the fix that needs no product decision) and copy the part after them into \`notes\` in your result, prefixed with the item id.

Checks (CPU is shared with many other fixers — keep them narrow):
- \`cd ${p.wt} && npx vitest run ${p.testPaths.join(' ')} --maxWorkers=1\` must pass before you finish. Do NOT run \`npx tsc\`, \`npm test\`, any build, or any browser test: the orchestrator runs the type check and the full suite after merging every partition. Keep types sound by reading the code you change.
${p.deno ? '- For edge-function TypeScript you changed: `/opt/node22/bin/deno check --no-lock <file>`.\n' : ''}
When everything is done and re-read: \`cd ${p.wt} && git add -- ${p.paths.filter(x => x).join(' ')} && git commit -q -m "final-audit: ${p.key}"\` (one commit; never push; never touch another branch). If nothing needed changing, do not commit.

Write your result JSON to: ${p.result}   (shape in the brief §7; every work-order item exactly once in \`items\`)

Return: partition, the result file path, the commit hash (\`git rev-parse HEAD\`), counts of applied / applied-amended / skipped items, the number of sweep changes, the number of needsElsewhere entries, whether your vitest run passed, and a short note with anything the orchestrator must know.`
}

function reviewPrompt(p) {
  return `You are the independent reviewer of one fixer's work in the final audit of the Antaeus language remediation. Read the shared brief the fixer worked from: ${S}/FIX_BRIEF.md , then COPY_STANDARD.md in the checkout below.

PARTITION: ${p.key}
CHECKOUT: ${p.wt} (git worktree, branch ${p.branch}). Work ONLY inside this directory. Never read from or edit /home/user/antaeus-gtm-os.
The fixer's work order: ${p.workorder}
The fixer's result file: ${p.result}
The fixer's change: \`cd ${p.wt} && git show --stat HEAD\` then \`git show HEAD\` (if the fixer made no commit, review \`git status\` / \`git diff\` instead and say so).

The owner's stated fears are (1) unfinished or opaque language and (2) overcorrection. Read EVERY changed line and judge it as a first-time founder or seller would, and as a code reviewer:
- Accurate: does each new string claim only what the code does and the data supports? Open the code that produces it.
- Judgment kept: is any new string generic, bland, hedged into nothing, childish, bureaucratic, awkwardly literal or longer than needed? Did a sharp, correct statement get flattened?
- Plain: would it still need translating? Did private vocabulary survive under a new word?
- Consistent: same concept, same name across the partition and with the naming table in the brief §8.
- Contracts intact: no identifier, storage key, enum key, route, URL parameter, column, CSS class, test id or flag key renamed; stored data still loads.
- Tests: no assertion deleted or loosened, no \`.skip\`; functional fixes have a test that fails without the fix.
- Scope: nothing changed outside ${p.paths.join(', ')}; no drive-by refactors.
- Work order coverage: every item is applied, or skipped for a reason that holds up when you check the source.
Also read the fixer's \`leftForReview\` list and decide each one: fix it or record why it stays.

Fix every problem you find directly in the checkout (same rules as the fixer), re-run \`npx vitest run ${p.testPaths.join(' ')} --maxWorkers=1\`, and commit: \`git add -- ${p.paths.filter(x => x).join(' ')} && git commit -q -m "final-audit: ${p.key} (review)"\`. Do NOT run tsc, npm test, builds or browser tests. Never push.

Write ${p.review} as JSON: { "partition": "${p.key}", "problems": [ { "file": "...", "line": 0, "kind": "inaccurate|bland|awkward|verbose|still-opaque|inconsistent|contract-renamed|test-weakened|out-of-scope|missed-item|other", "before": "what the fixer wrote", "after": "what it is now", "why": "..." } ], "leftForReviewDecisions": [ { "file": "...", "text": "...", "decision": "fixed|stays", "why": "..." } ], "confirmedGood": 0, "notes": "..." }

Return: partition, the review file path, the commit hash now at HEAD, how many problems you found and how many you fixed, whether vitest passes, and a short note.`
}

log(`Fixing ${PARTS.map(p => p.key).join(', ')}`)
const results = await pipeline(
  PARTS,
  p => agent(fixPrompt(p), { label: `fix:${p.key}`, phase: 'Fix', schema: FIX }),
  (fix, p) => fix ? agent(reviewPrompt(p), { label: `review:${p.key}`, phase: 'Review', schema: REV }).then(r => ({ partition: p.key, fix, review: r })) : { partition: p.key, fix: null, review: null }
)
return results.filter(Boolean)
