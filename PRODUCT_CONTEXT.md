# PRODUCT_CONTEXT.md
## Antaeus GTM OS — Canonical Context Document
**Last updated:** 2025-02-11 | **Current version:** v23 (All 5 changes complete) | **Next version:** TBD

> Paste this at the start of any AI session working on this app. It replaces world-reconstruction.

---

## What This Is

A browser-based GTM operating system for founding AEs and founder-sellers at early-stage companies. Not a CRM. Not a course. Not a content library. A persistent workspace where every action the user takes during their sales motion — discovery calls, outreach angles, deal qualification, win/loss analysis — accumulates into a transferable system that can onboard the company's first sales hire.

**One-line pitch:** The system that makes your first sales hire succeed instead of fail.

**Core thesis:** Founders hire salespeople before the system is ready. The hire inherits chaos, not process, and fails within 5 months. The GTM OS solves this by turning the founder's selling activity into a documented, scorable, exportable playbook — so they know when they're ready to hire, and the hire has something real to run from day one.

---

## Who It's For

- **Primary:** Founding AEs and founder-sellers at seed → Series B companies (1-20 employees, $0-5M ARR)
- **Secondary:** First sales hires who need to ramp without a playbook
- **Buyer persona:** Technical founder tired of carrying sales, or experienced AE hired as founding seller with no system to inherit

---

## What It Is Not

- Not a CRM (no contact database, no pipeline management as primary function)
- Not an AI wrapper (no LLM calls at runtime — all intelligence is baked into frameworks and data structures)
- Not a content product (every module is interactive, not read-only)
- Not a prompt pack or template library

---

## Architecture

**Stack:** Static HTML/CSS/JS hosted on Cloudflare Pages. No backend server. No build step.

| Layer | Technology |
|-------|-----------|
| Hosting | Cloudflare Pages (`antaeuscareerfiles.pages.dev`) |
| Auth | Supabase (email/password, OAuth callback) |
| Storage | localStorage (per-module keys, migrating toward consistent naming) |
| Shared JS | `/js/discovery-frameworks.js` (183K, 5 frameworks), `/js/supabase-config.js`, `/js/tour-guide.js`, `/js/artifact-store.js` |
| Styles | `/css/app.css` (shared) + per-page `<style>` blocks |
| Pages | 20 HTML files in `/app/*/index.html` (~14,600 lines total) |

**No npm, no bundler, no framework.** Each page is a self-contained HTML file with inline JS. Shared data (discovery frameworks) lives in external JS files loaded via `<script src>`.

**Storage keys currently in use:**
- `gtm_playbook_v2` — Founding GTM Playbook
- `antaeus_studio_cfo_v2` — CFO Negotiation Studio
- `discovery_agenda_v2` — <30 Min Discovery Agenda
- `weekly_deal_reviews_v2` — Deal Review
- `account_planning_v2` — Account Planning
- `angles` — Trigger-Outreach saved angles
- `outboundPlanSeed` — Outbound OS
- `antaeus_discovery_stats` — Discovery Studio analytics
- `thin_icp_analytics` — Thin ICP analytics
- `asset_builder_analytics` — Asset Builder analytics
- `conversion_studio_analytics` — Conversion Studio analytics

**Known storage issue:** Naming is inconsistent (some `_v2`, some not, some bare words). Data does not flow between modules. Each page reads/writes its own key in isolation. v23 must establish a consistent naming convention and cross-module data flow.

---

## Current Navigation Structure (v22)

```
WORKSPACES
  🧮 Quota Workback
  🤝 Deal Workspaces

DISCOVERY STUDIO
  🔍 Bulletproof Discovery & Objections
  ⏱️ <30 Min Discovery Agenda

OUTBOUND STUDIO
  🚀 Bulletproof Weekly Outbound
  🎪 Trigger-Outreach Studio
  📄 Content Builder

FOUNDING GTM
  🏗️ GTM Playbook
  📊 Account Planning
  📋 Real Deal Review
  🧪 PoC Framework
  🎯 Quick ICP Builder
  💰 CFO Negotiation

AI TOOLS
  🤖 Agent Marketplace [AI badge]

(Ungrouped)
  📊 Pipeline (Dashboard)
  🎯 ICP Library
```

**v23 nav changes planned:** Founder Readiness Score page added at the top of the left panel (above all groups, first thing the user sees). Thin ICP Studio needs proper nav placement. Sequence Playground currently redirects to Trigger-Outreach.

---

## Module Map (What Each Page Does)

### Workspaces
| Module | Purpose | Interactive? | Stores Data? |
|--------|---------|-------------|-------------|
| **Quota Workback** | Reverse-engineers daily activity from annual quota target | Yes — calculator | Yes |
| **Deal Workspaces** | Kanban-style deal cards with stage tracking | Yes — CRUD deals | Yes (Supabase) |

### Discovery Studio
| Module | Purpose | Interactive? | Stores Data? |
|--------|---------|-------------|-------------|
| **Bulletproof Discovery & Objections** | 5 product-category frameworks × 7 territories with entry questions, response scenarios, "It Worked" tracking, and session notes | Yes — live call companion | Yes (stats) |
| **<30 Min Discovery Agenda** | Pre-call agenda generator with 4 qualification gates | Yes — form + checklist | Yes |

### Outbound Studio
| Module | Purpose | Interactive? | Stores Data? |
|--------|---------|-------------|-------------|
| **Bulletproof Weekly Outbound** | Weekly outbound planning cadence | Yes — planner | Yes |
| **Trigger-Outreach Studio** | 10 triggers × 23 personas → outreach angle generator with reply tracking | Yes — generator + tracker | Yes |
| **Content Builder** | Sales asset generator (one-pagers, battlecards, etc.) | Yes — builder | Yes |

### Founding GTM
| Module | Purpose | Interactive? | Stores Data? |
|--------|---------|-------------|-------------|
| **GTM Playbook** | 5-section strategic playbook + 6-step deal methodology | Yes — structured form | Yes |
| **Account Planning** | Strategic account plans with stakeholder mapping | Yes — form | Yes |
| **Real Deal Review** | 9-field deal health assessment (champion, EB, use case, impact, process, timeline, competition, risks, next step) | Yes — form + scoring | Yes |
| **PoC Framework** | Pilot/proof-of-concept structuring | Yes — form | Yes |
| **Quick ICP Builder** | Rapid ICP definition | Yes — form | Yes |
| **CFO Negotiation** | Negotiation preparation studio | Yes — form | ⚠️ Broken (not populating content) |

### Other
| Module | Purpose | Interactive? | Stores Data? |
|--------|---------|-------------|-------------|
| **Pipeline (Dashboard)** | Quota math + activity metrics | Yes — calculator | Yes |
| **ICP Library** | Pre-built ICP templates | Read + customize | No |
| **Thin ICP Studio** | Deep ICP with persona mapping + trigger alignment | Yes — builder | Yes |
| **Agent Marketplace** | AI agent directory | Browse | No |
| **Conversion Studio** | Reply-to-meeting conversion workflows | Yes — builder | Yes |

---

## Discovery Frameworks (the big data asset)

`/js/discovery-frameworks.js` — 183K, 2,184 lines. Contains 5 complete frameworks:

1. **CX AI / Support Automation** (`cxai`) — 7 territories, full entries + responses
2. **Customer Data Platform** (`cdp`) — 7 territories, full entries + responses
3. **Legal AI** (`legal`) — 7 territories, full entries + responses
4. **Revenue Intelligence** (`revintel`) — 7 territories, full entries + responses
5. **AI Objections — Cross-Category** (`ai-objections`) — 7 territories, full entries + responses ← just upgraded in v22

Each territory has: gate criteria, 3-5 entry questions (with context labels), 2-3 color-flagged response scenarios (with moves, listenFor signals, transitions), red/green flags, and transition lines.

---

## What's Being Built Next (v23 — "First Hire Readiness")

Five changes, in build order. Source: `gtm-os-v22-improvement-plan.md` with founder edits in `App_Patches_10FEB26.docx`.

### Change 1: Deal-Level Qualification Scoring ✅ COMPLETE (v23)
**Where:** Deal Workspaces + Deal Review + Discovery Agenda
**What was built:**
- **`/js/gtmos-store.js`** — New cross-module data layer. Manages `gtmos_deal_quals`, `gtmos_deal_outcomes`, `gtmos_discovery_links` in localStorage. Shared scoring logic (9 fields × 3 levels = 0-18 scale, four tiers: Not Qualified 0-6, Emerging 7-11, Qualified 12-15, Strong 16-18).
- **Deal Review** — New Qualification Score panel in sidebar (live-updating score + breakdown dots). Saves qual score to gtmStore on every deal save. Saved deal list shows qual badges.
- **Deal Workspaces** — Deal cards now show qual badge (score/18 + level). Score auto-computed from deal fields (champion, EB, use case, blockers, etc.). Score freezes when deal moves to Closed Won/Lost.
- **Discovery Agenda** — "Link to Deal" dropdown (pulls open deals from Supabase). Gate checks flow to linked deal's qual score via gtmStore. Title/Role → exhaustive dropdown. Primary Outcome Focus → 30+ grouped options (Growth, Efficiency, Risk, Customer, Decision) + Unknown default.

### Change 2: Win/Loss Capture + Pattern Engine ✅ COMPLETE (v23)
**Where:** Deal Workspaces (close forms) + Dashboard (new "Deal Patterns" panel)
**What was built:**
- **Deal Workspaces — Outcome tab:** New "🏁 Outcome" tab appears when stage is set to Closed Won or Closed Lost. Auto-switches to tab on stage change.
  - *Closed Won form:* Trigger source (9 options), persona, displacement type (greenfield/competitive/internal), cycle length, framework used, "what worked" free text, auto-populated qual trigger tags showing which of the 9 scoring fields were met/partial/empty at close.
  - *Closed Lost form:* Stalled stage (7 options including "Went dark after verbal"), loss reason (11 options including "Couldn't meet demand"), loss detail, objection blocker, "What would you do differently" structured checkboxes (6 options: better disco, multi-threading, market intel, team sell, company research, follow-up timeliness) + required detail text. Validates both required fields before allowing save.
  - All outcome data writes to `gtmStore.outcomes` via `gtmos-store.js`. Qual score freezes at close.
  - Existing outcome data loads when re-opening a closed deal.
- **Dashboard — Deal Patterns panel:** New section below Pipeline Command Center. Locked state until 5 closed deals (shows progress toward unlock). Once unlocked, shows:
  - Win Patterns card: top triggers with bar charts, avg cycle length, avg qual score at close, displacement types, recent "what worked" quotes
  - Loss Patterns card: where deals stall, top loss reasons, avg qual score at loss, most common do-over actions
  - Summary card (when both wins and losses exist): win rate %, wins, losses, total closed
  - All pattern data reads from `gtmStore.outcomes` — no Supabase queries needed.

### Change 3: Founder Readiness Score ✅ COMPLETE (v23)
**Where:** New standalone page `/app/readiness/index.html`, top of left nav across all sidebar pages
**What was built:**
- **New page** at top of every sidebar: "🚦 Readiness Score" — the first thing a founder checks.
- **5-dimension radar chart** (SVG, no dependencies): ICP Clarity, Discovery Repeatability, Outreach System, Deal Process, Playbook Completeness. Each 0-20, total 0-100.
- **Data sources per dimension:**
  - ICP Clarity: `thin_icp_analytics` (profiles + worked), `account_planning_v2` (field count), `gtm_playbook_v2` (company + ACV)
  - Discovery Repeatability: `antaeus_discovery_stats` (calls + advance rate), `discovery_agenda_v2` (agenda used, gates, deal link)
  - Outreach System: `outboundPlanSeed` (quota), `angles` (signal angles + replies), `asset_builder_analytics` (content), `conversion_studio_analytics`
  - Deal Process: `weekly_deal_reviews_v2` (reviews), `gtmStore.quals` (scored deals + avg qual), `gtmStore.outcomes` (total + mix)
  - Playbook Completeness: `gtm_playbook_v2` (company/stage/ACV/cycle/fields/checks/notes)
- **4 threshold tiers** with frank language: 0-25 "You are the sales system" (red), 26-55 "Building, not ready" (amber), 56-79 "Hire-ready with guardrails" (blue), 80-100 "Ready to hand off" (green). Active tier highlighted.
- **Dimension cards** are clickable — each links to the relevant studio. Shows signal breakdown (✓/✗ per data point), progress bar, and score.
- **Nav link added** to all 19 sidebar pages. Positioned at top of nav, above all module groups.

### Change 4: Playbook Export — "The Handoff Kit" ✅ COMPLETE (v23)
**Where:** Founding GTM Playbook page (new sidebar card + modal)
**What was built:**
- **Sidebar card** with live readiness gate: shows current Readiness Score, progress bar toward 56-point unlock threshold, and locked/unlocked state. Recomputes readiness using same algorithm as `/app/readiness/` page.
- **Modal** with 6 auto-populated sections compiled from real app data:
  1. Who We Sell To — from GTM Playbook fields (target buyer, segmentation, wedge), Thin ICP profiles, Account Planning intel
  2. How We Find Them — from Quota Workback targets, Signal Play angles + reply tracking, Content Builder assets, GTM motion/entry
  3. How We Run Discovery — from Discovery Studio call stats + advance rate, Discovery Agenda gates + focus
  4. How We Close — from qual scores (avg across deals), competition/differentiation/pricing fields, win triggers + "what worked" quotes
  5. What to Avoid — from loss patterns: top loss reasons, stall stages, repeated mistakes (do-overs), lessons learned quotes
  6. Scoreboard — from outcomes: total closed, wins, losses, win rate, avg qual, disco calls
- Sections with insufficient data show clear "Insufficient data" label with instructions
- **Export formats:** Markdown download (.md) and clipboard copy. Both produce clean, portable markdown with headers and formatting.
- **Gated** behind Readiness Score ≥ 56 (hire-ready threshold).

### Change 5: Founding GTM Narrative Reframe ✅ COMPLETE (v23)
**Where:** Founding GTM Playbook page (comprehensive reframe), Deal Review page (data-flow banner)
**What was built:**
- **Title reframe:** "Founding GTM Playbook" → "Founding GTM Playbook — Build It So They Can Run It"
- **Subtitle reframe:** Narrative subtitle about building the system your first hire inherits
- **Context card rewrite:** "How to use this playbook" → "This playbook builds itself as you sell"
- **Readiness ribbon:** Compact bar at top of page — live score, deals closed, patterns, playbook sections, tier label, link to full Readiness Score
- **Section 6: Qualification Standard** — free text qual definition, auto-populated qual gates grid from `gtmStore.quals`, win predictors from closed-won pattern analysis, "never advance without" field, data-flow banner
- **Deal Journal sidebar panel:** Mini-feed of recent closures (won/lost) with one-line summaries from `gtmStore.outcomes`
- **Data-flow banners** on Market & Segmentation, Competitive Landscape, Qualification Standard sections, and Deal Review page footer

---

## Sacred Constraints (Don't Violate These)

1. **No LLM dependency at runtime.** The app works because the thinking is baked in, not because it calls an API. This is a feature, not a limitation.
2. **Not a CRM.** Deal Workspaces tracks deal outcomes and qualification, not contacts and activities.
3. **Subscription-worthy means interactive.** Every module must be a tool to think with, not content to read. If a user can't take an action that produces a personalized output, it's not done.
4. **Owner-grade instrumentation.** Every action should emit truth — "It Worked" toggles, qualification scores, reply tracking, win/loss patterns. The app learns from usage.
5. **No framework dependencies.** Pure HTML/CSS/JS. No React, no Vue, no build step. Each page is self-contained. This is non-negotiable for portability and demo-ability.
6. **The app builds the system as you sell.** The founder doesn't fill out a playbook separately from selling. Every discovery call, outreach angle, and deal outcome automatically feeds the playbook, readiness score, and handoff kit.
7. **Data must flow between modules.** v22's biggest structural debt is isolated localStorage keys. v23 must establish cross-module data flow so Deal Review informs Deal Workspaces, Discovery Agenda feeds Deal Review, and all closed-deal data feeds the Dashboard patterns and Readiness Score.

---

## Known Issues / Tech Debt (v22)

- **CFO Negotiation Studio:** Not populating content. Needs rebuild.
- **Discovery Agenda Question Bank:** Static HTML. Needs activation to participate in data flows.
- **localStorage naming:** Inconsistent (`_v2` vs bare names vs `antaeus_` prefix). Needs standardization.
- **Cross-module data flow:** Non-existent. Each page is a silo. The #1 architectural priority for v23.
- **Sequence Playground:** Stub redirect to Trigger-Outreach. Either build or remove.
- **Thin ICP Studio:** Exists but not in main nav on all pages.
- **Deal Workspaces cards:** Need redesign to show qualification badge, richer at-a-glance info.
- **"Where Does Your Data Go" treatment:** Only exists in Trigger-Outreach and Discovery Agenda. Needs to be on Deal Review and Founding GTM Playbook at minimum.

---

## Build Rules (For Any AI Session)

1. **Read before writing.** Always check the current file before editing. The app has 14,600 lines of HTML — assumptions about what exists are often wrong.
2. **No new pages unless explicitly scoped.** Integrate into existing pages. The only new page in v23 is Founder Readiness Score.
3. **Match existing patterns.** Dropdowns, cards, sidebars, color scheme, dark theme, serif headings — match what's already there. Don't introduce new design language.
4. **Test framework data with Node.** `discovery-frameworks.js` is the biggest JS file. Any edits must be validated: `node -e "eval(content); console.log(Object.keys(discoveryFrameworks))"`.
5. **Deliver as zip.** Final output is always `antaeus-gtm-os-v22.zip` (or v23) copied to `/mnt/user-data/outputs/`.
6. **Don't break auth.** Supabase auth flow (login → session check → redirect) must work on every page.
7. **localStorage is the database.** Until a backend exists, all persistent data lives in localStorage. Keys must be consistent, documented, and future-proof for eventual migration.

---

## File You're Probably Looking For

| If you need... | Look at... |
|----------------|-----------|
| Cross-module data layer | `/js/gtmos-store.js` (quals, outcomes, discovery links) |
| Discovery framework data | `/js/discovery-frameworks.js` |
| Any specific page | `/app/{module-name}/index.html` |
| Auth config | `/js/supabase-config.js` |
| Shared styles | `/css/app.css` |
| The improvement plan | `gtm-os-v22-improvement-plan.md` |
| Founder's edits to plan | `App_Patches_10FEB26.docx` |
| This document | `PRODUCT_CONTEXT.md` |
