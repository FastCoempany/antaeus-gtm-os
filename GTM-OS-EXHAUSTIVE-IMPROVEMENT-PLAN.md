# Antaeus GTM OS — Exhaustive Improvement Plan

**Source:** Full audit dated February 20, 2026
**Scope:** Every finding that scored below ★★★★★, organized into 9 phases
**Excluded:** Pricing/packaging (per instruction)

Each item has an **audit source** (section + specific finding), **effort estimate**, and **what done looks like**.

---

## Phase 1: Ship-Blocking Fixes
*Things that will break or embarrass you on deploy. Do these before going live.*

### 1.1 — Fix signUp function bug
- **Audit source:** §5 Failure States — `supabase-config.js` line 48 references `supabase.auth.signUp` instead of `supabaseClient.auth.signUp`
- **Effort:** 5 minutes
- **Done looks like:** `signUp` method uses `const client = initSupabase(); return await client.auth.signUp(...)` matching the pattern of `signIn`, `signOut`, `resetPassword`, and `updatePassword`

### 1.2 — Unsaved-changes guard (global)
- **Audit source:** §5 Save Model ★★½ — "No module has an unsaved changes warning on navigation. A user who fills 20 fields in Founding GTM and clicks a nav link loses everything. This should be the #1 UX fix." Also §7 Incremental #1.
- **Effort:** 1-2 hours
- **Scope:** New file `js/unsaved-guard.js` (~30 lines). Included on all `/app/*/index.html` pages.
- **Done looks like:** A global `beforeunload` listener. Any module can call `unsavedGuard.track(formId)` to start watching inputs for changes. On `beforeunload` or nav-link click, if dirty state exists, browser shows "You have unsaved changes" dialog. Cleared on explicit save. Modules that are auto-save (Quota Workback) don't register. Manual-save modules register on page load.
- **Modules that need registration:** Founding GTM, ICP Studio, Outbound Studio, Deal Workspace, CFO Negotiation, Discovery Agenda, PoC Framework, Content Builder

### 1.3 — Auth failure user-facing errors
- **Audit source:** §5 Failure States ★★ — "If Supabase is down, login breaks with no user-facing error message — the submit button spins indefinitely."
- **Effort:** 1 hour
- **Done looks like:** Login, signup, and forgot-password pages show a red callout ("Unable to connect. Check your internet and try again.") after a 10-second timeout or on caught error. Submit button re-enables. Auth callback page shows "Something went wrong — return to login" after 8-second timeout instead of spinning forever.

### 1.4 — Auto-save on Founding GTM Playbook
- **Audit source:** §5 Save Model — "Users will lose data in Founding GTM if they fill 10 fields and navigate away without clicking save." §4 Cross-Module Coherence ★★★ — save behavior inconsistency.
- **Effort:** 1 hour
- **Done looks like:** Debounced auto-save (1.5s after last keystroke) on all 34 fields. Manual "💾 Save" button remains as explicit confirmation. Subtle "Saved ✓" indicator appears near the button after auto-save fires. Removes the single highest-risk data loss path.

---

## Phase 2: Instrumentation & Data Safety
*You can't improve what you can't measure, and you can't retain users whose data you lose.*

### 2.1 — Analytics SDK integration
- **Audit source:** §0 Evidence Baseline ★ — "Zero analytics exist." §11 Instrumentation ★ — entire section. "Without instrumentation, every product decision is a guess."
- **Effort:** 2-3 hours
- **Done looks like:** Posthog (free tier) or Plausible script tag added to all pages. Core events tracked:
  - `page_view` (automatic) — which modules get visited
  - `onboarding_started`, `onboarding_step_N`, `onboarding_completed` — funnel
  - `onboarding_persona_selected` (with persona value) — cohort analysis
  - `module_save` (with module name) — engagement depth
  - `export_clicked` (with module + format) — output usage
  - `guided_rail_clicked` — does the rail work?
  - `guided_rail_dismissed` — is it annoying?
  - `tour_started`, `tour_completed` — tour effectiveness
  - `deal_created`, `deal_updated` — deal workflow adoption
  - `readiness_score_viewed` (with score value) — progress tracking
  - `handoff_kit_generated` — milestone completion
  - `command_center_unlocked` — milestone completion
- **Also captures automatically:** Session duration, page time, bounce rate, device/browser, referral source

### 2.2 — "Export All Data" (JSON backup)
- **Audit source:** §13 Security ★★★ — "No backup mechanism exists." "There is no 'export all my data' feature, no JSON backup, no account data download." Also §1 Efficacy — export gaps.
- **Effort:** 3-4 hours
- **Done looks like:** New "⬇️ Export All Data" button in nav footer (near Sign Out). Clicking it generates a single JSON file containing all 13 localStorage keys (`gtmos_onboarding`, `gtmos_playbook`, `gtmos_icp_analytics`, `gtmos_outbound_seed`, `gtmos_qw_inputs`, `gtmos_angles`, `gtmos_deal_workspaces`, `gtmos_discovery_stats`, `gtmos_qual_texts`, `gtmos_call_handoff`, `gtmos_account_plans`, `gtmos_asset_builder_analytics`, `gtmos_tour_completed`). File named `antaeus-backup-YYYY-MM-DD.json`. Triggers browser download.
- **Bonus:** Matching "⬆️ Import Data" button that reads a JSON backup file and restores all keys. Confirms with "This will overwrite your current data. Continue?"

### 2.3 — "Data stored locally" notice
- **Audit source:** §13 Security ★★★ — "There is no 'your data is stored locally' notice anywhere."
- **Effort:** 30 minutes
- **Done looks like:** Small muted text line in nav footer: "💾 Data saved to this browser" with a `?` tooltip: "Your work is stored in this browser's local storage. Use Export All Data to back up, or to transfer to another device." Visible on every page via nav.js.

### 2.4 — "Delete my data" capability
- **Audit source:** §13 Security ★★★ — "No 'delete my data' feature."
- **Effort:** 1 hour
- **Done looks like:** "🗑️ Delete All Data" button in a Settings/Account section (or in nav footer dropdown). Two-step confirmation: "This will permanently delete all your GTM OS data from this browser. This cannot be undone. Type DELETE to confirm." Clears all 13 `gtmos_*` localStorage keys. Redirects to onboarding.

---

## Phase 3: Export Completeness
*Every module that accepts user input must give it back.*

### 3.1 — Deal Workspace: CSV + clipboard export
- **Audit source:** §1 Efficacy — "Deal Workspace: ❌ No export. **Gap** — no way to export deal data." §6 RevOps ★★ — "Deal data has no export."
- **Effort:** 2-3 hours
- **Done looks like:** Two buttons in Deal Workspace header:
  - "📋 Copy All Deals" — copies a formatted text summary of all deals (name, value, stage, qual score, champion, next step, close date) to clipboard
  - "⬇️ Export CSV" — downloads CSV with all deal fields including qualification scores and account plan fields
  - Per-deal: "📋 Copy Deal Summary" button on each deal card/modal that copies a single deal's full details

### 3.2 — Readiness Score: export/share
- **Audit source:** §1 Efficacy — "Readiness Score: ❌ No export. **Gap** — would be great to export/share."
- **Effort:** 2 hours
- **Done looks like:** "📋 Copy Readiness Report" button that generates a formatted text block: overall score, verdict, each dimension score + key signals, and date. Suitable for pasting into Slack/email to share with a co-founder or advisor. Optional: "⬇️ Export CSV" with dimension breakdowns.

### 3.3 — Command Center: export
- **Audit source:** §1 Efficacy — "Command Center: ❌ No export. **Gap** — no reporting export."
- **Effort:** 1 hour
- **Done looks like:** "📋 Copy Pipeline Summary" button that copies: quota, ACV, deals needed, pipeline needed, daily activity targets, and any deal pattern data. Formatted as a clean text block.

---

## Phase 4: Save Model Consistency
*Users should never wonder "did it save?" across any module.*

### 4.1 — Standardize save behavior with visual indicator
- **Audit source:** §4 Cross-Module Coherence ★★★ — "Save behavior inconsistency." §5 Save Model ★★½ — "Mixed auto-save vs manual save with no visual indicator."
- **Effort:** 3-4 hours
- **Done looks like:** New shared component `js/save-indicator.js` providing:
  - A small status chip near each module's save button: "Saved ✓" (green) / "Unsaved changes" (amber) / "Saving..." (teal pulse)
  - For auto-save modules (Quota Workback): chip shows "Auto-saved ✓" with timestamp on hover
  - For manual-save modules: chip shows "Unsaved changes" in amber until user clicks save, then "Saved ✓" in green
  - CSS class: `.save-indicator` with `.saved`, `.unsaved`, `.saving` states
  - Wired to the unsaved-guard from 1.2 — same dirty-state tracking

### 4.2 — Discovery Agenda: clarify hybrid save
- **Audit source:** §5 Save Model — "Discovery Agenda: Hybrid (auto on generate, manual button). Unclear."
- **Effort:** 30 minutes
- **Done looks like:** Replace ambiguous behavior with explicit: auto-save context fields (contact, title, company) on input change (debounced). "Save to Deal" button remains for deliberate deal-linking. Save indicator chip shows auto-save status for context fields.

---

## Phase 5: Navigation & Label Fixes
*Remove every source of "wait, what is this?" confusion.*

### 5.1 — Rename misleading module labels
- **Audit source:** §4 Label Integrity ★★★★ — four labels scored ★★★ or ★★.
- **Effort:** 1-2 hours (nav.js + page titles + all cross-references)
- **Changes:**

| Current | New | Rationale |
|---------|-----|-----------|
| Live Discovery | Discovery Frameworks | Removes "live" implication of recording. Accurately describes the reference tool. |
| Content Builder | Sales Collateral Builder | More precise — communicates that outputs are prospect-facing assets. |
| Command Center | Pipeline Dashboard | Honest about what it currently does. Earns back "Command Center" when it has live data. |
| Agent Lab | AI Agents (beta) | "Beta" sets expectations. Removes "Lab/marketplace" implication. |

- **Done looks like:** All four labels updated in nav.js, tour-guide.js, module-tooltips.js, guided-rail.js, and each module's `<title>` tag + `<h1>`. Internal references in data-flow.js and onboarding.js updated.

### 5.2 — Add purpose lines to modules missing them
- **Audit source:** §4 Orientation ★★★½ — "Not every module has an inline purpose line visible without clicking. Some modules (Command Center, Readiness) have zero on-screen purpose text."
- **Effort:** 1-2 hours
- **Done looks like:** Every module page has a one-line subtitle below the H1, visible without clicking anything:

| Module | Purpose line |
|--------|-------------|
| Pipeline Dashboard (née Command Center) | "Your quota math and pipeline health in one view." |
| Readiness Score | "How close you are to hiring your first sales rep." |
| Deal Workspace | "Every deal, qualified and tracked." |
| Discovery Frameworks (née Live Discovery) | "Guided scripts and response maps for every discovery territory." |
| Founding GTM Playbook | "The playbook your next hire will run from." |
| CFO Negotiation Studio | "Tested scripts for procurement and finance conversations." |
| Handoff Kit | "Everything your first hire needs on day one." |

- **Style:** Uses `.module-subtitle` class — `font-size: 0.85rem; color: var(--text-tertiary); margin-top: -4px; margin-bottom: var(--space-md);`

### 5.3 — Add in-module "what to do next" guidance
- **Audit source:** §4 Orientation — "Founding GTM just shows 34 fields with no priority guidance beyond 'fill these.' Deal Workspace after your first deal gives no 'what to do next' hint."
- **Effort:** 2-3 hours
- **Done looks like:**
  - **Founding GTM:** Each of the 6 collapsible sections shows a priority indicator: "⚡ Start here" on the first section with empty fields. Sections that are fully auto-populated show "✅ Auto-filled from [source]". Sections with partial data show "3 of 5 fields completed."
  - **Deal Workspace:** After saving first deal, a contextual banner appears: "✅ First deal added. Next: fill in qualification gates to track deal health." Banner dismisses permanently after clicking or after qualification is filled.
  - **ICP Studio:** After saving first ICP, contextual hint: "Good start. Build 2 more ICPs to compare segments and unlock your market map."

### 5.4 — Hide Agent Lab from primary nav
- **Audit source:** §8 Feature Bloat — "Agent Lab: disconnected, nav clutter." "If removed, zero users would complain." §4 Label Integrity — "Agent Lab ★★."
- **Effort:** 15 minutes
- **Done looks like:** Agent Lab nav group hidden entirely from sidebar. Pages remain accessible via direct URL. When AI agents become a real feature, re-add with proper integration.

### 5.5 — Remove legacy route dead weight
- **Audit source:** §8 Complexity vs Payoff — "8 legacy route files still present. Maintenance dead weight."
- **Effort:** 15 minutes
- **Done looks like:** Delete these 1-line redirect files: `icp-builder/index.html`, `icp-library/index.html`, `outbound-os/index.html`, `signal-play-studio/index.html`, `deal-workspaces/index.html`, `deal-review/index.html`, `account-planning/index.html`. Add a generic 404 page or Cloudflare redirect rule if old bookmarks are a concern.

---

## Phase 6: Inline Guidance & Friction Reduction
*Reduce "what do they want from me?" moments without removing necessary complexity.*

### 6.1 — Inline help text for domain-specific concepts
- **Audit source:** §3 Flow — "Outbound Studio 'trigger' concept unclear for non-sales founders." "Discovery Studio pledge gate — users who don't know what 'happy ears' means are confused." "CFO Negotiation requires understanding of negotiation territory concepts." "ICP Studio — what's the difference between 'pain' and 'trigger'?"
- **Effort:** 2-3 hours
- **Done looks like:** Small `ℹ️` icons next to domain-specific labels that expand an inline tooltip on click/hover:

| Module | Term | Tooltip |
|--------|------|---------|
| Outbound Studio | Trigger | "The event or signal that makes this prospect worth contacting now. Examples: new funding, leadership change, job posting, tech adoption." |
| Outbound Studio | Temperature | "How warm is this contact? Cold = never spoken. Warm = they've seen your content or been referred. Hot = they've expressed interest." |
| Outbound Studio | Angle | "Your point of view on why this prospect should care right now. Combines the trigger + your insight about their problem." |
| ICP Studio | Pain | "The problem the buyer lives with daily that your product solves. Must be felt pain, not theoretical." |
| ICP Studio | Trigger | "The event that makes the pain urgent enough to act on now. Without a trigger, pain stays tolerable." |
| Discovery Studio | Happy ears | "Hearing what you want to hear instead of what the buyer actually said. The #1 cause of false pipeline." |
| Discovery Studio | Territory | "A category of information you need to uncover during discovery. Each territory has different response patterns." |
| CFO Negotiation | Negotiation territory | "A specific topic area that comes up in procurement/finance conversations: budget authority, ROI justification, contract terms, etc." |

### 6.2 — ICP scoring transparency
- **Audit source:** §10 Trust Signals — "ICP scoring: criteria are visible but the weighting is opaque." §8 Precision Theater — "ICP scoring produces numerical scores (0-100) from subjective criteria. The precision of '73 vs 71' is meaningless. Consider bucketing."
- **Effort:** 2 hours
- **Done looks like:**
  - Show weight breakdown next to each scoring criterion: "Pain (25%) | Trigger (20%) | Budget (15%) | ..."
  - Add tier labels alongside numeric score: "73 — Strong" / "52 — Moderate" / "31 — Weak" using thresholds (70+ Strong, 40-69 Moderate, <40 Weak)
  - Tooltip on score: "This score reflects weighted criteria. Two ICPs within 5 points are effectively equivalent."

### 6.3 — Stage-aware smart defaults in Quota Workback
- **Audit source:** §7 Minimal #2 — "Only quota + ACV come from onboarding. Win rate, show rate, and conversion rates should have smart defaults based on stage."
- **Effort:** 1-2 hours
- **Done looks like:** During onboarding Q2 (stage selection), the chosen stage pre-populates not just quota/ACV but also conversion rates in Quota Workback:

| Stage | Win Rate | Disco→Opp | Show Rate | Email Book | Dial Book |
|-------|----------|-----------|-----------|------------|-----------|
| Pre-seed | 15% | 30% | 70% | 1.5% | 1.8% |
| Seed | 18% | 35% | 75% | 1.8% | 2.0% |
| Series A | 22% | 40% | 80% | 2.0% | 2.3% |
| Series B+ | 25% | 45% | 85% | 2.5% | 2.8% |

Stored in `gtmos_qw_inputs` by onboarding.js. All remain editable. Tooltip on each: "Default for [stage] companies — adjust based on your actual data."

### 6.4 — Soften the locked Command Center experience
- **Audit source:** §3 Momentum — "The collision point is the locked Command Center — a new user's natural first destination is blocked. The initial 'you're locked out' feeling is mildly punishing." §9 Wow Factor — "No [first wow for Founding AE] if they get stuck on the locked Command Center."
- **Effort:** 1-2 hours
- **Done looks like:** Instead of a blur overlay with a lock icon, show the Pipeline Dashboard in a "preview" state:
  - All sections visible but with placeholder/zero data
  - A contextual banner at top (not overlay): "📊 This dashboard comes alive as you build. Complete 3 modules to see your real numbers here."
  - Each empty section has a subtle "Will show: [metric name] from [source module]" label
  - The "Continue Building →" CTA remains but feels like an invitation, not a locked door
  - Guided rail still provides the "Next →" direction

### 6.5 — "Copy Weekly Game Plan" one-block export in Quota Workback
- **Audit source:** §7 Minimal #3 — "Add a button that formats the entire weekly rhythm as a single copyable block."
- **Effort:** 1 hour
- **Done looks like:** New button in the Operating Rhythm accordion: "📋 Copy Weekly Game Plan." Copies:
  ```
  WEEKLY GAME PLAN — Week of [date]
  Target: $[monthly]/mo → [deals] deals/yr @ $[acv] ACV

  Daily Activity:
  • Emails: [n]/day ([n]/week)
  • Dials: [n]/day ([n]/week)
  • LinkedIn: [n]/day ([n]/week)

  Weekly Pipeline:
  • Meetings booked: [n]
  • Discovery calls: [n]
  • New opportunities: [n]

  Assumptions: [win rate]% win rate, [show rate]% show rate
  ```

### 6.6 — QW interpretation lines
- **Audit source:** §7 Minimal #1 — "Add a one-line 'what this means' interpretation below each derived number."
- **Effort:** 1-2 hours
- **Done looks like:** Below each executive summary metric, a muted interpretation line:
  - "30 deals/year" → *"About 2-3 deals closing per month"*
  - "68 opps/year" → *"You need to generate ~6 new opportunities every month"*
  - "14 touches/day" → *"~7 emails + 5 dials + 2 LinkedIn per day"*
  - Uses `.metric-interpretation` class: `font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 2px;`

---

## Phase 7: Visual Polish & Perceived Quality
*Close the gap between "looks good" and "feels premium."*

### 7.1 — Skeleton loading states
- **Audit source:** §2 Premium Signals — "Missing: No skeleton loading states." §5 Perceived Speed ★★★★ — "No skeleton states on any page."
- **Effort:** 2-3 hours
- **Done looks like:** New CSS utility classes in `app.css`:
  - `.skeleton` — animated shimmer placeholder (light grey pulse on dark bg)
  - `.skeleton-text` — 12px height block
  - `.skeleton-heading` — 20px height block
  - `.skeleton-card` — rounded rect placeholder
  - Applied to: module content areas during the brief moment between nav render and module JS initialization. Most visible on Deal Workspace (card grid), ICP Studio (library panel), and Discovery Studio (framework load from 2,181-line JS file).

### 7.2 — Card hover states
- **Audit source:** §2 Premium Signals — "Missing: No hover state animations on cards."
- **Effort:** 1 hour
- **Done looks like:** CSS additions to `app.css`:
  - `.deal-card:hover`, `.icp-card:hover`, `.angle-card:hover` — subtle `transform: translateY(-2px)` + `box-shadow` increase + `border-color` shift to `var(--border-hover)`
  - Transition: `transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;`
  - Applied to all interactive cards across: Deal Workspace, ICP Studio library, Outbound Studio saved angles, CFO Negotiation session history

### 7.3 — Page transition smoothing
- **Audit source:** §2 Premium Signals — "Missing: No transition when navigating between modules."
- **Effort:** 1 hour
- **Done looks like:** Add a CSS `@keyframes fadeIn` to `.app-main` content area:
  ```css
  .app-main { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  ```
  Applies on every page load. Subtle but removes the hard-cut feel between modules.

### 7.4 — QW benchmark table readability
- **Audit source:** §2 Visual Hierarchy — "Quota Workback benchmark tables use dense 0.65-0.7rem text that requires squinting."
- **Effort:** 30 minutes
- **Done looks like:** Increase benchmark table font size from 0.65rem to 0.78rem. Add more row padding (6px → 10px). Add alternating row backgrounds (`rgba(255,255,255,0.02)` on even rows). Increase column gap slightly.

### 7.5 — Discovery Studio nesting readability
- **Audit source:** §2 Visual Hierarchy — "Discovery Studio frameworks have deep nesting (territory → response → move → transition) that can overwhelm."
- **Effort:** 2 hours
- **Done looks like:**
  - Progressive disclosure: Territory level shows title + summary only. Click to expand response scenarios. Each response shows flag + label only. Click to expand move + transition.
  - Depth indicators: Left border color shifts per nesting level (teal for territory, gold for response, grey for move)
  - "Focus mode" toggle: When enabled, selecting a territory collapses all others. Selecting a response collapses siblings.

---

## Phase 8: Module-Level Improvements
*Specific upgrades that move individual modules from ★★★/★★★★ to ★★★★★.*

### 8.1 — Pipeline Dashboard: earn the "Command Center" name
- **Audit source:** §2 Aesthetic Fit ★★★½ — "The Command Center is weak — it's a calculator with 8 inputs and some derived numbers. A real command center would show: pipeline velocity, deal stage movement, win/loss trends, outbound reply rates, discovery advance rates." §10 Faux Value — "Command Center: ❌ Mostly decorative — mirrors Quota Workback inputs." §14 Competitive — weakest module.
- **Effort:** 1-2 weeks
- **Done looks like:** The Pipeline Dashboard becomes a true ops view by pulling live data from other modules:
  - **Pipeline health bar:** Total open pipeline value (sum of all deal values) vs. required pipeline (from QW). Visual: "You have $480K in pipeline. You need $720K. Gap: $240K."
  - **Stage distribution:** Mini bar chart showing deal count per stage (Prospecting / Discovery / Negotiation / Closed). Data from `gtmos_deal_workspaces`.
  - **Deal velocity:** Average days in each stage. Calculated from deal created_at and stage change timestamps.
  - **Staleness alerts:** List of deals not updated in 7+ days (already tracked via staleness badge — surface it here).
  - **Weekly activity tracker:** Actual vs. target for key metrics (if user logs activity — or show target only with "log your first activity" CTA).
  - **Win/loss feed:** Mini timeline of deal outcomes with ICP + trigger attribution.
  - Keep the existing quota math section but de-emphasize it (it's already in QW).

### 8.2 — Deal Workspace: live auto-qualification
- **Audit source:** §7 Substantial #2 — "Auto-qualify deals based on filled fields. Calculate qual score live as they fill in each gate."
- **Effort:** 3-4 hours
- **Done looks like:** In the deal modal, the qualification score recalculates on every field change (not just on save). The deal card on the main grid updates its qual badge in real-time. As gates are filled: "3/6 gates confirmed → MODERATE" with the color-coded badge updating live. Removes the "fill everything then discover your score" anti-pattern.

### 8.3 — Deal Workspace: deal outcome → cross-module feedback
- **Audit source:** §7 Substantial #3 — "When a deal is marked Won/Lost, auto-update: Readiness Score (proof signals), ICP Studio (mark that ICP profile as 'worked'), Outbound Studio (mark the trigger that generated the deal as 'converted')."
- **Effort:** 4-6 hours
- **Done looks like:** New "Mark Won" / "Mark Lost" buttons in deal modal (alongside existing stages). On Won:
  - `gtmos_discovery_stats.wins` incremented
  - If deal has an associated ICP, that ICP's `workedDeals` counter increments in `gtmos_icp_analytics`
  - Data flow toast: "🔗 Deal outcome synced → Readiness Score, ICP Studio"
  - Proof layer gets a new signal: "Closed $[value] — [account name]"
  On Lost:
  - `gtmos_discovery_stats.losses` incremented
  - If deal has a loss reason field, it feeds into Playbook `step2-notes` as a pattern: "Common loss reasons: [top 3]"
  - Data flow toast fires similarly

### 8.4 — Quota Workback: scenario comparison
- **Audit source:** §7 Substantial #1 — "Real-time what-if modeling. Side-by-side scenario comparison." §9 Wow Factor Missing — "If you improve win rate from 22% to 28%, you need 23% fewer daily touches."
- **Effort:** 1 week
- **Done looks like:** New "What If" toggle button in QW header. When enabled:
  - Current scenario stays on the left
  - A "Scenario B" column appears on the right with identical inputs, all editable independently
  - Delta indicators between columns: "↓ 23% fewer dials/day" / "↑ 4 fewer opps needed"
  - Key insight callout: "Improving win rate from 22% → 28% saves you 4 dials/day and 90 emails/month"
  - Scenario can be named and saved to localStorage
  - This is the #1 "can't do in Notion/Sheets" feature

### 8.5 — Readiness Score: make it actionable
- **Audit source:** §10 Faux Value — "Readiness Score: ⚠️ Partially — motivating but not actionable alone."
- **Effort:** 2-3 hours
- **Done looks like:** Below each dimension card, add a "Next action" line:
  - ICP Clarity (12/20): "→ Add 1 more ICP to reach 15/20. Go to ICP Studio."
  - Discovery (8/20): "→ Log 3 more calls to reach 12/20. Go to Call Planner."
  - Each "Next action" is a direct link with the specific gap and the exact point gain.
  - Top-level summary: "You're 18 points from hire-ready. Fastest path: +8 from Discovery (log 5 calls) + +6 from Outreach (save 3 angles) + +4 from Deals (add 2 more deals)."

### 8.6 — ICP Studio: starter templates
- **Audit source:** §7 Incremental #3 — "Pre-built ICP templates for common verticals."
- **Effort:** 2-3 hours
- **Done looks like:** When ICP library is empty (or via a "Start from template" button), show 5-6 starter templates:
  - "Mid-Market SaaS (B2B)" — pre-filled: 200-2000 employees, VP Engineering buyer, integration pain, budget $30-80K
  - "Enterprise Financial Services" — pre-filled: 5000+ employees, CTO/CISO buyer, compliance pain, budget $100K+
  - "SMB E-Commerce" — pre-filled: 10-100 employees, founder/CEO buyer, growth pain, budget $10-30K
  - "Healthcare / HealthTech" — pre-filled: hospital/clinic, Director of IT buyer, interoperability pain
  - "Startup / Pre-Revenue" — pre-filled: <50 employees, founder buyer, speed-to-market pain
  - Each template populates 6-8 fields. User edits to fit their actual market. Saves as a regular ICP.

### 8.7 — Discovery Studio: reduce pledge gate friction
- **Audit source:** §3 Flow — "Discovery Studio pledge gate — two checkboxes before seeing any content." §8 Feature Bloat — "Pledge Gate in Discovery: Borderline. No [one would complain if removed]. It's a one-time gimmick."
- **Effort:** 30 minutes
- **Done looks like:** Replace the full-screen gate with a subtle inline banner at the top of Discovery Frameworks:
  - "Before every call: Research 3 things. Listen for what's real, not what you want to hear."
  - One-click "Got it" dismiss. No checkboxes. Not a blocker.
  - The principles remain visible as a philosophy statement, not a gate.

### 8.8 — Founding GTM: field priority guidance
- **Audit source:** §4 Orientation — "Founding GTM just shows 34 fields with no priority guidance."
- **Effort:** 1-2 hours
- **Done looks like:**
  - Each section header shows "N of M fields completed" (already exists) PLUS a priority tag:
    - Section 1 "Market & Segmentation" → "⚡ Fill first — everything else builds on this"
    - Section 2-3 (auto-populated) → "✅ Auto-filled from ICP Studio + Quota Workback"
    - Remaining sections → "Fill these as you learn from real deals"
  - Empty fields within each section show which module will auto-fill them: "💡 This field auto-populates from Deal Workspace when you qualify a deal"
  - Fields that can ONLY be filled manually are marked: "✍️ Manual — requires your strategic thinking"

---

## Phase 9: Competitive Moat Strengthening
*Moves that widen the gap between GTM OS and "I could just use Notion."*

### 9.1 — ICP-to-outcome attribution
- **Audit source:** §9 Wow Factor Missing — "No ICP-to-outcome attribution exists." "Your ICP 'Mid-market Fintech' has produced 3 closed-won deals — it's your best-performing segment."
- **Effort:** 3-4 hours
- **Done looks like:** In ICP Studio, each ICP card shows outcome stats if deals have been tagged with that ICP:
  - "3 deals worked | 1 won ($45K) | 1 lost | 1 open"
  - Win rate per ICP: "Mid-market Fintech: 50% win rate vs. your overall 22%"
  - "🏆 Best-performing ICP" badge on the highest-converting profile
  - Requires: Deal Workspace adds an "ICP" dropdown when creating/editing a deal (populated from saved ICPs)

### 9.2 — Deal staleness surfacing
- **Audit source:** §9 Wow Factor Missing — "Deal staleness — currently only a passive badge."
- **Effort:** 1-2 hours
- **Done looks like:**
  - Pipeline Dashboard (8.1) shows a "⚠️ Stale Deals" section listing any deal not updated in 7+ days
  - Guided rail, if the user's top priority gap is "update stale deals," surfaces: "Next → 2 deals haven't been updated in 10+ days"
  - Each stale deal's card gets an amber border (not just a small badge) — impossible to miss
  - Readiness Score: stale deals reduce the "Deal Process" dimension score (e.g., -2 points per stale deal over 14 days)

### 9.3 — Cross-module data wiring: Outbound → Deal attribution
- **Audit source:** §7 Substantial #3 — "Mark the trigger that generated the deal as 'converted'. This closes the feedback loop."
- **Effort:** 2-3 hours
- **Done looks like:** When creating a deal, optional field "Source" with options:
  - "Outbound — [angle name]" (populated from saved angles)
  - "Inbound"
  - "Referral"
  - "Other"
  - In Outbound Studio, angles that generated deals show a badge: "→ 2 deals sourced"
  - This closes the loop: Outbound angle → Deal → Outcome → ICP attribution → Playbook insight

### 9.4 — Founding GTM Playbook: increase auto-populate coverage
- **Audit source:** §1 Efficacy — "Auto-populate covers ~11 of 34 fields. The remaining 23 require manual strategic thinking." §6 Founder adoption — "Feels like homework."
- **Effort:** 3-4 hours
- **Done looks like:** Increase auto-populated fields from ~11 to ~18-20 by mining more localStorage data:
  - `motion-cycle` → already inferred from quota÷ACV (done)
  - `step3-notes` (closing patterns) → from CFO Negotiation session data (if sessions saved)
  - `ops-hiring-score` → from Readiness Score total (direct read)
  - `ops-hiring-when` → from Readiness Score verdict ("You're at 'Building' — estimated 2-3 months to hire-ready based on typical progression")
  - `motion-channels` → from Outbound Studio angle diversity (if angles span email, LinkedIn, phone → "Multi-channel: email-led with phone + LinkedIn support")
  - `comp-landscape` → from Deal Workspace "Why We Win Against Competitors" fields aggregated across deals
  - `step2-patterns` → from Deal Workspace qualification patterns (most common gate gaps across all deals)
  - Each new auto-populate field shows source attribution: "Auto-filled from CFO Negotiation (3 sessions)"

---

## Phase 10: Layout Consistency (Structural)
*Reduce "three different apps" feeling without rewriting everything.*

### 10.1 — Shared page header pattern
- **Audit source:** §4 Cross-Module Coherence ★★★ — "3 different layout paradigms across 13 active modules."
- **Effort:** 2-3 hours
- **Done looks like:** New CSS component `.module-header` used on all 13 active module pages:
  ```
  ┌──────────────────────────────────────────────────┐
  │ [Icon] Module Title                    [? tooltip]│
  │ Purpose line subtitle                             │
  │ [Action buttons: Save, Export, Copy, etc.]        │
  └──────────────────────────────────────────────────┘
  ```
  - Consistent height, spacing, alignment across all modules
  - Action buttons right-aligned, always in the same position
  - This doesn't change the body layout (studio-layout vs grid vs full-width) but gives every module the same "top 80px" visual language

### 10.2 — Consistent action button placement
- **Audit source:** §4 Cross-Module Coherence ★★★ — related to save/export pattern inconsistency
- **Effort:** 1-2 hours
- **Done looks like:** All primary actions (Save, Export, Copy) follow the same pattern:
  - Primary save: gold button, rightmost position in header
  - Export/Copy: ghost buttons to the left of save
  - Reset/Clear: warning-colored button, leftmost
  - This visual pattern is already used in QW and Founding GTM — extend to all modules

---

## Phase 11: Edge Hardening
*Handle the things that go wrong.*

### 11.1 — Module-level validation: "completeness" indicators
- **Audit source:** §5 Failure States — "Module-level validation is sparse — you can save a deal with empty fields, create an ICP with only a name. There's no 'this deal is incomplete' warning."
- **Effort:** 2-3 hours
- **Done looks like:** Non-blocking completeness indicators (not hard validation):
  - Deal cards show "6/9 qualification gates filled" chip. If <4/9, amber "Incomplete" badge.
  - ICP cards show "5/8 fields filled" chip. If <3/8, amber "Draft" badge.
  - Founding GTM sections show field completion progress (already exists in some form — standardize).
  - These are informational, not blocking. Users can still save at any point.

### 11.2 — Input sanitization on text fields
- **Audit source:** §5 Failure States — "Other text fields accept anything with no sanitization."
- **Effort:** 1 hour
- **Done looks like:** Shared utility function `sanitizeInput(str)` that:
  - Strips HTML tags (prevents XSS if content is ever rendered with innerHTML)
  - Trims leading/trailing whitespace
  - Limits field length to reasonable maximums (company name: 100 chars, description fields: 2000 chars, notes: 5000 chars)
  - Applied to all `localStorage.setItem` calls that write user text input

### 11.3 — Supabase db method error handling
- **Audit source:** §5 Failure States ★★ — "The Supabase methods have no user-facing error handling. If they fail, data silently doesn't persist to the server."
- **Effort:** 2 hours
- **Done looks like:** Wrapper around all `db.*` methods that:
  - On success: returns data normally
  - On error: logs to console AND shows a non-blocking toast: "⚠️ Cloud sync failed — your data is saved locally." (This acknowledges the localStorage-first architecture while surfacing server failures.)
  - On network timeout: "📡 Connection issue — working offline. Data saved locally."
  - This is preparation for when modules actually start using Supabase for persistence (currently they mostly don't).

---

## Summary: Phase Effort Estimates

| Phase | Name | Items | Effort |
|-------|------|-------|--------|
| **1** | Ship-Blocking Fixes | 4 items | 3-5 hours |
| **2** | Instrumentation & Data Safety | 4 items | 7-9 hours |
| **3** | Export Completeness | 3 items | 5-6 hours |
| **4** | Save Model Consistency | 2 items | 3.5-4.5 hours |
| **5** | Navigation & Label Fixes | 5 items | 3-5 hours |
| **6** | Inline Guidance & Friction Reduction | 6 items | 9-12 hours |
| **7** | Visual Polish & Perceived Quality | 5 items | 6.5-8.5 hours |
| **8** | Module-Level Improvements | 8 items | 24-38 hours |
| **9** | Competitive Moat Strengthening | 4 items | 10-14 hours |
| **10** | Layout Consistency | 2 items | 3-5 hours |
| **11** | Edge Hardening | 3 items | 5-6 hours |
| **TOTAL** | | **46 items** | **~79-113 hours** |

---

## Audit Finding → Plan Item Cross-Reference

Every non-★★★★★ finding is accounted for below. If a finding appears in the audit but NOT in this plan, it is either (a) a deliberate scope boundary noted in the audit, or (b) covered by pricing/packaging which was excluded.

| Audit Section | Score | Findings | Plan Items |
|---------------|-------|----------|------------|
| §0 Instrumentation baseline | ★ | Zero analytics | 2.1 |
| §1 Efficacy: export gaps | ★★★★ | Deal WS, Readiness, Command Center no export | 3.1, 3.2, 3.3 |
| §1 Efficacy: external tool gaps | ★★★★ | No CRM, no email send, no call recording | *Deliberate scope boundary — not in plan* |
| §2 Visual hierarchy | ★★★★ | QW dense tables, Discovery nesting, Founding GTM field wall | 7.4, 7.5, 8.8 |
| §2 Premium signals: missing | ★★★★ | No hover states, no skeletons, no page transitions | 7.1, 7.2, 7.3 |
| §2 Aesthetic fit | ★★★½ | Command Center weak, not a real ops view | 8.1, 5.1 (rename) |
| §3 Flow: domain confusion | ★★★★ | Trigger, happy ears, territories, pain vs trigger unclear | 6.1 |
| §3 Flow: locked CC punishing | ★★★★ | New user blocked at first destination | 6.4 |
| §3 Flow: ICP guidance | ★★★★ | Mild accidental friction on scoring | 6.2 |
| §4 Labels | ★★★★ | 4 labels misleading | 5.1 |
| §4 Orientation: purpose lines | ★★★½ | CC, Readiness have zero purpose text | 5.2 |
| §4 Orientation: next steps | ★★★½ | Founding GTM, Deal WS no "what next" | 5.3 |
| §4 Coherence: layouts | ★★★ | 3 paradigms, inconsistent patterns | 10.1, 10.2 |
| §4 Coherence: save behavior | ★★★ | Mixed auto/manual, no indicators | 1.2, 1.4, 4.1, 4.2 |
| §5 Perceived speed: skeletons | ★★★★ | No skeleton states | 7.1 |
| §5 Failure: auth errors | ★★ | Spinner forever if Supabase down | 1.3 |
| §5 Failure: API errors | ★★ | Silent failures on Supabase methods | 11.3 |
| §5 Failure: validation | ★★ | Sparse module validation, no "incomplete" warning | 11.1 |
| §5 Failure: input sanitization | ★★ | Text fields accept anything | 11.2 |
| §5 Failure: signUp bug | ★★ | Wrong variable reference | 1.1 |
| §5 Save model | ★★½ | No unsaved-changes guard, no save indicator | 1.2, 4.1 |
| §6 Founder: homework feeling | ★★★½ | 34 fields intimidating | 8.8, 9.4 |
| §6 Founding AE: double entry | ★★★½ | No CRM integration | *Deliberate scope boundary* |
| §6 SDR value | ★★ | No sequence/cadence tracking | *Deliberate scope boundary — SDR is not primary persona* |
| §6 RevOps value | ★★ | No exports, no API | 3.1, 3.2, 3.3, 2.2 |
| §6 Sales Leader value | ★ | Zero multi-user/team features | *Future platform — out of solo-user scope* |
| §7 QW: interpretation lines | ★★★★ | Derived numbers lack plain-English meaning | 6.6 |
| §7 QW: stage-aware defaults | ★★★★ | Only 2 of 8 inputs seeded from onboarding | 6.3 |
| §7 QW: copy game plan | ★★★★ | No single-block weekly plan export | 6.5 |
| §7 QW: scenario comparison | ★★★★ | No what-if modeling | 8.4 |
| §7 Deal WS: auto-qualify | ★★★★ | Score doesn't update live during editing | 8.2 |
| §7 Cross-module: outcome feedback | ★★★★ | Won/Lost doesn't update ICP/Outbound/Readiness | 8.3, 9.1, 9.3 |
| §7 ICP templates | ★★★★ | No starter templates | 8.6 |
| §8 Agent Lab bloat | ★★★★ | Disconnected, nav clutter | 5.4 |
| §8 Legacy routes | ★★★★ | 8 dead-weight files | 5.5 |
| §8 Precision theater: ICP | ★★★ | 73 vs 71 meaningless, opaque weighting | 6.2 |
| §9 Wow: CC blocking first-AE aha | ★★★★ | Locked state prevents wow moment | 6.4 |
| §9 Missing: scenario modeling | ★★★★ | No what-if in QW | 8.4 |
| §9 Missing: staleness alerts | ★★★★ | Only passive badge | 9.2 |
| §9 Missing: ICP attribution | ★★★★ | No ICP-to-outcome tracking | 9.1 |
| §10 Faux: Command Center decorative | ★★★½ | Mirrors QW inputs, no live data | 8.1 |
| §10 Faux: Readiness not actionable | ★★★½ | Motivating but no "next action" | 8.5 |
| §10 Trust: ICP weighting opaque | ★★★★ | Users can't see scoring weights | 6.2 |
| §11 Instrumentation | ★ | Everything | 2.1 |
| §13 Data: localStorage only | ★★★ | No backup, no sync, clearing = destruction | 2.2, 2.3 |
| §13 Data: no export all | ★★★ | No JSON backup | 2.2 |
| §13 Data: no delete | ★★★ | No delete-my-data feature | 2.4 |
| §13 Data: no local storage notice | ★★★ | Users don't know where data lives | 2.3 |
| §14 Competitive: Playbook auto-fill | ★★★½ | Only 11/34 fields auto-populated | 9.4 |
