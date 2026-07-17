# The Luca Demo — full reseed of both interactive demo lanes

**Date:** 2026-07-16
**Status:** APPROVED (founder, 2026-07-16); BUILT + SHIPPED 2026-07-17 (PR #309). **Post-ship roster call (founder, 2026-07-17):** Duolingo and Figma STAY on the SMB book by founder direction despite crossing $1B in FY2025; Coursera and Miro stay as additions; Cava and Poppi are out. SMB book = 29 names. Original approval note: with one change — **Boeing joins as the 29th enterprise org and takes the Getting to Signed showpiece**; Delta stays on the roster at discovery stage. All other Part 7 items green-lit as proposed. Build in progress.
**Scope:** demo environment ONLY (`sessionStorage.gtmos_env_mode === "demo"`, the
`gtmos_demo__*` localStorage namespace, and the code-side scripted demo content).
Production, real workspaces, and the cloud are untouched.

**Decisions already locked (founder, 2026-07-16):**
1. **People — hybrid.** Real executives appear where the facts are real: research
   briefs and signals cite actual public events and real leaders by name. The
   contacts the demo emails, calls, and pilots with are realistic **fictional**
   people carrying accurate titles for that company. No fabricated reply, meeting,
   or deal behavior is ever attributed to a real named human, and the demo never
   goes stale as real people change jobs.
2. **Luca sells an AI talent platform** — AI-native talent acquisition + workforce
   intelligence (sourcing, screening, interview intelligence, hiring analytics).
   Maps to the shipped Recruiting/Talent/HR discovery framework.
3. **Whose desk — a named AE per demo.** Each lane is one seller's book at Luca:
   an enterprise AE carrying $2MM, an SMB AE carrying $800K.

---

## Part 0 — The company that bought Antaeus

**Luca Industries, Inc.** ("Luca")
- Founded 2019 · 7 years old · **$100MM ARR** · ~620 employees · HQ Chicago
  (the app's operating timezone — the workspace clock already lives there).
- Product: **Luca** — an AI-native talent platform. It finds candidates, screens
  them with AI interview intelligence, and gives talent teams live hiring
  analytics. The one-line the demo's outbound uses: *"Luca cuts time-to-hire
  roughly in half by putting an AI screen in front of every funnel."*
- Sales org: real, mature. Two segments, two books — that's the two demos.
- Product category setting in-app: **Recruiting / Talent / HR** (drives the
  Discovery Studio framework everywhere).

**The two operators (fictional; founder can rename at approval):**

| | Enterprise demo | SMB demo |
|---|---|---|
| AE | **Elena Vasquez**, Enterprise AE | **Jordan Park**, SMB AE |
| Quota | **$2,000,000** | **$800,000** |
| Deal band | $150K–$600K (typical ~$280K) | $25K–$90K (typical ~$55K) |
| Cycle | ~150 days | ~45 days |
| Book | 29 named enterprises | 28 named smaller companies |

**Why a talent platform makes every roster credible:** every company on both
rosters hires at scale or hires hard — frontline ramps (retail, food service,
aviation), engineering wars (AI-native, tech), seasonal surges (DTC, CPG). The
signal layer writes itself from real public hiring events.

---

## Part 1 — The rosters

Revenue figures are public figures or estimates, marked for **verification at
build time via web search** (the build step confirms each is in-band and swaps
any that drifted out). Tiers use Territory Architect's four-tier model.

### 1A · Enterprise book — 29 household names, $1B–$100B revenue

The founder's five required industries are all present: retail, aviation, HR
tech, global contractor management, AI-focused.

| # | Company | Industry | Rev (approx) | Why Luca fits | Tier |
|---|---|---|---|---|---|
| 1 | Delta Air Lines | Aviation | ~$61B | Hires tens of thousands/yr; seasonal surge screening | 1 |
| 2 | United Airlines | Aviation | ~$57B | Pilot + frontline pipeline pressure | 1 |
| 3 | Southwest Airlines | Aviation | ~$27B | High-volume ops hiring, culture-heavy screens | 2 |
| 4 | JetBlue | Aviation | ~$9B | Leaner TA team — automation story lands harder | 3 |
| 5 | Nordstrom | Retail | ~$14B | Seasonal ramp (30k+ holiday hires) | 1 |
| 6 | Gap Inc. | Retail | ~$15B | Multi-brand frontline funnel | 2 |
| 7 | Best Buy | Retail | ~$42B | Blue-shirt hiring at scale + tech roles | 2 |
| 8 | Ulta Beauty | Retail | ~$11B | Store-count growth = standing hiring engine | 2 |
| 9 | Dick's Sporting Goods | Retail | ~$13B | Seasonal + House of Sport expansion hiring | 3 |
| 10 | Workday | HR tech | ~$8B | HR-tech companies buy TA tooling too; co-sell angle | 2 |
| 11 | ADP | HR tech | ~$19B | Massive internal hiring + partner potential | 3 |
| 12 | Dayforce | HR tech | ~$1.8B | Post-rebrand growth hiring | 3 |
| 13 | Paycom | HR tech | ~$1.9B | Sales-org hiring machine | 3 |
| 14 | Deel | Global contractor mgmt | ~$1B | Hypergrowth global hiring; distributed screens | 1 |
| 15 | Randstad | Global staffing/workforce | ~$27B | Staffing giant — volume screening is the product | 2 |
| 16 | OpenAI | AI-focused | ~$4B+ | The hardest hiring market in tech | 1 |
| 17 | Databricks | AI-focused | ~$3B | Eng hiring at war-time pace | 1 |
| 18 | Palantir | AI-focused | ~$2.9B | Unusual screening culture — a fun discovery story | 3 |
| 19 | CoreWeave | AI-focused | ~$2B+ | Datacenter buildout = field + eng hiring surge | 2 |
| 20 | Nike | Apparel/retail | ~$51B | Corporate + retail + supply chain funnels | 2 |
| 21 | Starbucks | Food service | ~$36B | The classic frontline-hiring whale | 1 |
| 22 | Chipotle | Food service | ~$11B | Publicly hires ~20k every spring — evergreen signal | 1 |
| 23 | Marriott | Hospitality | ~$25B | Property-level hiring across hundreds of markets | 2 |
| 24 | Hilton | Hospitality | ~$11B | Same motion, competitive tension with #23 | 3 |
| 25 | Uber | Marketplace/tech | ~$44B | Ops + eng + support hiring breadth | 2 |
| 26 | Airbnb | Marketplace/tech | ~$11B | Selective, brand-heavy hiring — quality-screen story | 3 |
| 27 | Spotify | Media/tech | ~$17B | Distributed-team hiring | 3 |
| 28 | FedEx | Logistics | ~$88B | Peak-season hiring at six-figure headcounts | 2 |
| 29 | Boeing | Aerospace | ~$78B | Production + quality workforce rebuild — hiring at scale under scrutiny | 1 |

Tier counts: T1 ×8, T2 ×10, T3 ×11 — matches a real enterprise book's shape
(few bets, wide middle, long watch tail). Territory's 300-cap reads honest at
28 named + room to grow.

### 1B · SMB book — 28 recognizable companies, $65MM–$999MM revenue

| # | Company | Industry | Rev (approx) | Why Luca fits | Tier |
|---|---|---|---|---|---|
| 1 | Duolingo | Consumer tech | ~$750MM | Eng + content hiring, famously selective | 1 |
| 2 | Figma | Design software | ~$750MM | Hypergrowth eng hiring | 1 |
| 3 | Notion | Productivity software | ~$400MM | Scaling GTM + eng | 2 |
| 4 | Grammarly | AI writing | ~$700MM | AI-native, distributed hiring | 2 |
| 5 | 1Password | Security software | ~$650MM | Remote-first scaling | 2 |
| 6 | Calendly | Scheduling software | ~$280MM | Lean team, high hiring bar | 3 |
| 7 | Webflow | Web software | ~$330MM | Design-eng hybrid roles — hard screens | 3 |
| 8 | Vimeo | Video platform | ~$420MM | Rebuilding teams post-restructure | 3 |
| 9 | Warby Parker | DTC eyewear | ~$770MM | Retail expansion + HQ roles | 1 |
| 10 | Allbirds | DTC footwear | ~$190MM | Lean rebuild — every hire counts | 3 |
| 11 | Gymshark | Fitness apparel | ~$700MM | Global expansion hiring | 2 |
| 12 | Bombas | DTC apparel | ~$300MM | Steady growth, culture-heavy screens | 3 |
| 13 | Rothy's | DTC footwear | ~$140MM | Retail + HQ mix | 3 |
| 14 | Tecovas | Western wear | ~$300MM | Store expansion = standing frontline funnel | 2 |
| 15 | Sweetgreen | Food service | ~$680MM | New-market openings, crew hiring | 1 |
| 16 | Cava | Food service | ~$960MM | Fastest-growing fast casual — hiring is the constraint | 1 |
| 17 | Portillo's | Food service | ~$710MM | Multi-state expansion crews | 2 |
| 18 | Liquid Death | Beverage | ~$330MM | Brand-heavy, unconventional hires | 2 |
| 19 | Oatly | Food/beverage | ~$800MM | Global ops + commercial hiring | 3 |
| 20 | OLIPOP | Beverage | ~$400MM+ | Scaling commercial team fast | 2 |
| 21 | Athletic Brewing | Beverage | ~$110MM | Production + field sales hiring | 3 |
| 22 | Spindrift | Beverage | ~$300MM | Field + ops growth | 3 |
| 23 | Dr. Squatch | CPG | ~$400MM | Creative + ops hiring, meme-brand velocity | 3 |
| 24 | Chomps | CPG/food | ~$500MM | Explosive growth, small TA team | 2 |
| 25 | Siete Foods | CPG/food | ~$500MM | Post-acquisition scaling | 3 |
| 26 | Eventbrite | Ticketing platform | ~$330MM | Rebuilt org, steady eng hiring | 3 |
| 27 | Lemonade | Insurtech | ~$500MM | AI-native insurer — kindred pitch | 2 |
| 28 | BARK | Pet products | ~$490MM | Subscription ops + retail hiring | 3 |

Tier counts: T1 ×5, T2 ×9, T3 ×14 — an SMB book runs wider and shallower.

**Depth tiers (both books).** Not every account carries equal weight — that's
what makes it read real:
- **Deal accounts** (~12–15 per book): 3–5 contacts, 4–6 signals, live deal,
  touches + calls + LinkedIn history, discovery notes.
- **Working accounts** (~8): 2–3 contacts, 2–4 signals, some outreach, no deal yet.
- **Watch accounts** (rest): 1–2 contacts, 1–2 signals, on the radar.

---

## Part 2 — The people model (the hybrid rule, mechanically)

**Where real people appear (facts only):**
- Signal Console signal text + research briefs: *"Delta named [real CHRO name]
  chief people officer"* — a real, cited public event with a source URL.
- Briefing Patterns citing real market moves and the real executives who made them.
- Nowhere else. A real person's name never appears as a contact, an email
  recipient, a reply, a meeting attendee, a pilot participant, or a favor target.

**Where fictional people appear (all interactions):**
- Account contacts (up to 5 per deal account): realistic names, accurate title
  archetypes for that company's actual org shape. The archetype set per account:
  **CHRO/CPO** (economic buyer) · **VP Talent Acquisition** (champion) · **Head
  of Recruiting Ops / TA Ops** (hands-on user) · **HRIS/People-systems lead**
  (IT/integration voice) · **Procurement or Finance partner** (the signed-deal
  gauntlet). SMB accounts compress this: Head of People + a recruiter + a COO.
- Luca's own people (Call in a Favor): the fictional advisor bench — e.g., a
  Series C board partner, a former CHRO of a Fortune 100 as paid advisor, two
  happy-customer champions at accounts Luca closed, a well-connected angel.
- The two AEs and anyone quoted in drafts/notes.

**Naming diligence at build:** fictional names are built common-first +
common-last, cross-checked at build time (quick search) so we don't
accidentally coin the real VP of TA at that company. Any collision → rename.

**Total fictional people:** ~90 per book (contacts) + ~10 shared (Luca bench).
(Enterprise book now counts 29 accounts with Boeing.)

---

## Part 3 — The economics (deal flow that jives with $100MM ARR)

Seed dates are **relative** (days-ago offsets at seed time, like today's
runtime) so the demo never goes stale on the calendar.

### Enterprise book (Elena, $2MM quota)
- **Closed-won YTD:** 3 deals, $840K total (Chipotle $310K frontline-screening
  rollout · Deel $290K global funnel · Dayforce $240K).
- **Closed-lost YTD:** 2 (Palantir — went dark after security review; Gap Inc. —
  chose the incumbent ATS's add-on). These feed Future Autopsy + the loss pages
  of the handoff book.
- **Live pipeline:** 12 deals, $3.4MM face value:
  - 1 at **Getting to Signed** (Boeing, $480K — security questionnaire front
    blocking, the coverage-map showpiece)
  - 2 at proposal (Starbucks $420K · United $380K)
  - 3 at pilot/evaluation (OpenAI $350K — live Pilot Desk pilot · Nordstrom
    $260K · CoreWeave $220K)
  - 3 at discovery (Databricks · Delta · Marriott)
  - 3 early (Uber · FedEx · Best Buy)
  - Health mix: 2 critical (Nordstrom stalled 21d, no dated next step; United
    champion went quiet), 3 at-risk, 7 healthy.
- **Pace math:** $840K closed + weighted pipeline ≈ $1.7MM projected on $2MM —
  honestly short, the Quota room shows the red headline and the move back.

### SMB book (Jordan, $800K quota)
- **Closed-won YTD:** 6 deals, $340K (Sweetgreen $75K · Chomps $62K ·
  1Password $58K · Spindrift $49K · Rothy's $52K · Athletic Brewing $44K).
- **Closed-lost YTD:** 3 (Vimeo — budget freeze; Allbirds — no decision;
  Eventbrite — lost to a cheaper point tool).
- **Live pipeline:** 15 deals, $920K face value: 1 at Getting to Signed (Cava
  $88K), 3 proposal, 4 pilot/evaluation (Duolingo pilot live on Pilot Desk),
  4 discovery, 3 early. 2 critical, 3 at-risk.
- **Pace math:** ≈ $760K projected on $800K — close race, a different tension
  than enterprise.

---

## Part 4 — Per-room seed spec

Every write goes through the demo namespace (`gtmos_demo__<key>` via the
existing bootstrap shim). Key names below are the canonical un-prefixed keys.
Every seeded string obeys canon §11/§13 (no banned words — no "proof," no
"earned," no jargon) and the state-language lock. Both demos get the full
treatment; content differs per Part 1/3 above. Concrete examples shown are the
enterprise book unless marked SMB.

### 4.1 Onboarding + activation context
**Keys:** `gtmos_onboarding` (completed, answers), `gtmos_onboarding_completed_at`,
`gtmos_activation_context`, `gtmos_product_category` (= recruiting),
`gtmos_playbook` (company: "Luca Industries", the one-line pitch), `gtmos_profile_cache`.
**Content:** onboarding reads as already-done by the AE — company Luca
Industries, role "Account Executive," category Recruiting/Talent/HR, the ICP
answer and quota seeded to match Parts 1/3. Welcome and Dashboard read this.

### 4.2 Welcome (derives — verify, don't write)
Welcome computes from the seeded workspace. Verification: the re-entry headline
fires ("what moved since you left"), the one move resolves to the same top card
the Dashboard picks, the operating line reads 28 accounts · 12 live deals ·
$3.4MM in flight (enterprise).

### 4.3 Dashboard (mostly derives + snapshot keys)
**Keys:** `gtmos_deal_workspace_health`, `gtmos_signal_room_health`,
`gtmos_readiness_snapshot`, `gtmos_dashboard_command_mode`.
**Content:** health snapshots computed FROM the seeded deals/accounts (not
hand-faked numbers — build runs the same snapshot builders the rooms use).
The cockpit's one move should resolve to the Boeing blocked front (enterprise) /
the Cava signed-run (SMB) or the most-critical deal — we verify which card wins
and tune deal pressure so the top move is a story worth telling in a demo.

### 4.4 ICP Studio
**Key:** `gtmos_icp_analytics`.
**Content:** one sharp saved ICP per book.
- Enterprise: *"US enterprises 5,000+ employees with standing high-volume
  hiring (frontline, seasonal, or eng-war) — buyer is the VP Talent
  Acquisition, pain is time-to-hire and screen quality at volume, trigger is a
  public hiring surge or new people-leadership."*
- SMB: *"Growth-stage consumer and software companies (200–2,000 employees)
  hiring faster than their recruiting team can screen — buyer is the Head of
  People, trigger is expansion news (new markets, new stores, funding)."*
Persona set, buying-group minimum, trigger vocabulary — all consistent with
the contact archetypes in Part 2 and the triggers used by Outbound.

### 4.5 Territory Architect
**Keys:** `gtmos_territory`, `gtmos_ta_focuses`, `gtmos_ta_approaches`,
`gtmos_ta_accounts`, `gtmos_ta_setup`, `gtmos_ta_calibrations`,
`gtmos_ta_dispositions`, `gtmos_ta_signals`, plus empty-but-valid retier/swap
histories.
**Enterprise carve (vertical × segment blend, 5 divisions):**
1. *Air & Aerospace Frontline* (Boeing, Delta, United, Southwest, JetBlue,
   Marriott, Hilton) — why-you: screening at seasonal volume is Luca's home
   turf; why-now: summer surge hiring is public on the airlines, and Boeing's
   production-workforce rebuild is a standing public story.
2. *Retail & Food Ramp* (Nordstrom, Gap, Best Buy, Ulta, Dick's, Starbucks,
   Chipotle) — charter anchored on published seasonal-hire counts.
3. *AI-Native Talent Wars* (OpenAI, Databricks, Palantir, CoreWeave) — why-you:
   Luca's own AI-first screen speaks their language.
4. *Workforce Platforms* (Workday, ADP, Dayforce, Paycom, Deel, Randstad) —
   why-you: they sell to HR and still buy TA tooling; partner-or-customer double path.
5. *Scale Logistics & Marketplaces* (Nike, Uber, Airbnb, Spotify, FedEx).
**SMB carve (trigger × vertical, 4 divisions):** *Fast-Casual Expansion* (Cava,
Sweetgreen, Portillo's) · *DTC & CPG Velocity* (the 13 consumer brands) ·
*Software Scale-ups* (the 8 tech names) · *Category Oddballs* (Lemonade, BARK,
Eventbrite, Vimeo). Every division carries a written why-you charter; trigger
carves carry why-now. Tier targets + the 300-cap allocation read with real
headroom (28 in, 272 open).

### 4.6 Prospecting Desk
**Keys:** `gtmos_sw_query_cards`, `gtmos_sw_prospects`, `gtmos_sw_persona_maps`.
**Content:** 3 saved searches per book, written as the operator would describe
them (*"US airlines and airports announcing summer hiring waves"* /
*"fast-casual chains announcing 10+ new locations"*), each with cited
results. Funnel spread: 4 just-added companies (NOT on the 28 — the next
wave: e.g., Alaska Airlines, Panda Express for enterprise; Graza, Vuori for
SMB), 3 mid-confirm with the three questions partially answered, 2 ready-to-send,
and a visible history of ones already sent (which is how several of the 28
got into Signal Console — the funnel's story holds together).

### 4.7 Signal Console — the substrate (the hybrid layer lives here)
**Keys:** `gtmos_sc_v4`, `gtmos_signal_room_health`, `gtmos_sc_inbound_v1`
(empty valid), morning/usage keys as today's seed does.
**Content:** all 28 accounts per book with firmographics (real revenue/employee
ranges marked from public sources), heat spread across all four bands, and
**3–6 signals each on deal accounts**. Signals are the REAL layer:
- Real, verifiable public events with source URLs, researched at build time:
  hiring announcements ("Chipotle to hire 20,000 for burrito season"),
  real executive moves (a new CHRO/CPO named, by real name — facts only),
  expansion news (Cava's new-market openings), funding/earnings notes that
  mention headcount.
- Every signal carries recency-decay-friendly relative dates so heat math works.
- Confidence + AI flags set so the heat engine produces the intended band spread
  (the build VERIFIES resulting heat, not hand-sets it).

### 4.8 Outbound Studio
**Keys:** `gtmos_outbound_touches`, `gtmos_angles`, `gtmos_outbound_seed`.
**Content:** ~22 touches (enterprise) / ~28 (SMB) across the last 30 days, each
addressed to a **fictional contact by name + title** at a roster account, with
the actual generated-send-line content style (persona × temperature × trigger),
outcomes spread: mostly sent, 3–4 replied (feeds the Live Edge buyer voice), 1
meeting_booked lineage. 4 saved angles per book (e.g., *"seasonal-surge screening
for airline ops"*). The last touch is recent (< 24h) so the Live Edge count has
something to show on day one.

### 4.9 Cold Call Studio
**Keys:** `gtmos_cold_call_log`, `gtmos_discovery_stats`,
`gtmos_cold_call_custom_pushbacks_v1` (1–2 operator-added pushbacks — a nice
lived-in touch: *"We just bought an ATS module for this"* with Elena's answer).
**Content:** 10 logged calls in the last 3 weeks, outcome spread (2 callbacks,
1 meeting_booked — the call that created the CoreWeave deal, its lineage
visible — 3 voicemail, rest no-answer/rejected). Discovery stats consistent.

### 4.10 LinkedIn Playbook
**Key:** `gtmos_linkedin_log`.
**Content:** 14 actions across the cue ladder on 5–6 accounts (watch → comment
→ connect → give-first → ask), with outcomes that produce believable accept
(~60%) and reply (~25%) rates. The account with the deepest ladder progress
matches an account with a live deal — air cover for a real pursuit.

### 4.11 Discovery Studio
**Keys:** `gtmos_discovery_session_v1`, `gtmos_discovery_call_log`,
`gtmos_discovery_worked`, `gtmos_discovery_agenda`, `gtmos_call_handoff`
(retired-writer key seeded empty-valid only if the reader still tolerates it).
**Content:** 2 persisted sessions per book on the Recruiting framework:
one COMPLETE (the Chipotle discovery that led to the closed-won — learned
facts filled, next-step lock done, post-call routed to the deal) and one
MID-CALL (Databricks — 4 segments worked, 6 learned facts, 2 signals in the
ledger, next-step not locked yet). Pre-call readiness reads green off Signal
Console + the deal. This is the room a demo walkthrough lingers in — the
learned-facts ledger must read like a real call transcript's residue:
*"Screening 400 eng applicants/week with 3 recruiters — they admit half never
get a first review."*

### 4.12 Deal Workspace
**Keys:** `gtmos_deal_workspaces`, `gtmos_deal_stage_history`,
`gtmos_deal_outcomes`, `gtmos_deal_links`.
**Content:** the full Part 3 pipeline, every deal carrying all 9 health fields
written in plain operator voice (champion named — fictional; economic buyer;
use case; pain; competition — real competitor names fine: Greenhouse, Paradox,
HireVue, SeekOut; decision process; notes; forecast; momentum), stage history
showing believable progression dates, next steps DATED (with the 2 critical
deals deliberately missing theirs — that's what the recovery queue is for).
Closed-won/lost carry loss reasons + notes (feeds autopsies + handoff book).

### 4.13 Future Autopsy
**Keys:** `gtmos_autopsy_log_v1`, `gtmos_autopsy_snapshots`.
**Content:** autopsies derive live from the seeded deals — the two critical
deals (Nordstrom, United) will pin themselves. Seed one PAST autopsy run on the
lost Palantir deal with 2 countermeasure tasks checked ("we won't repeat this:
security review starts at discovery, not proposal") so the room shows a lived
history and Founding GTM §5 has evidence.

### 4.14 Pilot Desk
**Keys:** `gtmos_poc_data` (the linked pilot spec) + `gtmos_pilot_desk_v1`
(the v4 guided layer: circle, check-ins, adoption, share-kit state).
**Content — enterprise:** the OpenAI pilot, mid-flight: spec (what it has to
show: *"cut recruiter screening hours 40% on the infra-eng funnel"*; today's
number; who signs off), window day 12 of 21, circle of 6 fictional hands-on
recruiters/ops (right-sized), 2 check-ins done + 1 gated next step, adoption
meter at 4-of-6 active, one who's-missing prompt open ("someone from
recruiting ops for the London funnel"), Mutual pilot plan co-owned with the
champion. **SMB:** the Duolingo pilot, day 5 of 14, circle of 4, adoption 3-of-4.

### 4.15 Call in a Favor
**Keys:** `gtmos_advisor_registry`, `gtmos_advisor_deployments`.
**Content:** Luca's bench (all fictional, archetype-real): the Series C board
partner; a former Fortune-100 CHRO now advising; two happy-customer champions
(at Chipotle and Sweetgreen — accounts Luca closed, so the story is coherent);
an angel with airline-industry weight. 2 favors in flight (enterprise: the
board partner warming Boeing's procurement front — linked to the Getting to
Signed blocking front; a customer reference offered to Starbucks), 1 completed
favor with the loop closed on the deal, 1 gentle over-ask guard case armed
(the board partner was asked 3 weeks ago — the "open with a thank-you" state
is visible). Coverage read shows 2 stuck deals with no one to call on.

### 4.16 Getting to Signed
**Keys:** `gtmos_getting_to_signed_v1` (fronts model), `gtmos_negotiation` +
`gtmos_negotiation_learnings` (engine layer).
**Content — enterprise (Boeing, $480K):** Security front BLOCKING — the
coverage map showpiece: 150-question questionnaire, 118 answered by papers
Luca holds (SOC 2 Type II · pen-test · subprocessor list · DPA), 22 with saved
answers, 10 need engineering; Legal front clearing (liability cap traded at
12-month fees + breach super-cap); Finance to-do (net-60 vs 3% annual-prepay
trade set); Business front warm (committee: champion warm · economic buyer
quiet 9 days · a new stakeholder from procurement), plan-to-signed with 5
dated steps co-owned with the champion. **SMB (Cava, $88K):** a compressed
version — one legal redline, payment terms trade, committee of 3.

### 4.17 Quota Workback
**Keys:** `gtmos_qw_inputs`, `gtmos_quota_targets`, `gtmos_bulk_outreach_v1`,
`gtmos_captured_meetings_v1`.
**Content:** inputs per Part 3 (enterprise: quota 2,000,000 · ACV 280,000 ·
win ~22% · cycle 150d — the believability read lands "solid" or names one
honest stretch; SMB: 800,000 · 55,000 · 28% · 45d). Targets derive from the
real engine at build (never hand-typed `touches_day`). Bulk counts for 4 of
the last 7 working days + a captured-meetings tally (month, 5 held) so the
pace strands and the Live Edge count both light.

### 4.18 Readiness + Founding GTM (mostly derive + two keys)
**Keys:** `gtmos_founding_gtm_health`, `gtmos_readiness_snapshot`,
`gtmos_readiness_last_verdict`, `gtmos_founding_gtm_ceremony_fired` (true — the
ceremony already happened; demos shouldn't fire a one-time set-piece on load).
**Content:** with this depth the gates compute naturally — target resting state
**"Hire-ready"** (every part ≥ threshold, closed-wons exist, an autopsy ran, a
pilot has a result the buyer's boss could act on). Founding GTM's seven parts
read 6-of-7 ready (the day-one rhythm part deliberately "still thin — needs 2
more weeks of pace data" — honest, and it shows the book is alive). The open
book's authored prose is written from the seeded record: who hits (fast-casual
+ AI-native close 2× the book average), the outreach that landed, the
questions that won second meetings (from the Chipotle discovery), where deals
leak (security review — the Palantir lesson), the losses we paid for, why we
win, the default week.

### 4.19 Briefing (code-side demo Patterns + drafts)
**File:** `src/briefing/lib/demo-patterns.ts` — fully re-authored (4 Patterns
per scenario, selected by demo scenario key).
**Content — enterprise examples:** a Pattern on AI-screening regulation
(real: NYC Local Law 144 enforcement posture — cite it), a Pattern reading the
summer aviation hiring wave across Delta/United/Southwest signals, a
Contrarian challenging the stated ICP ("your fast-casual accounts are closing
2× your airline accounts — the ICP says airlines first"), a Periphery
candidate (a roster-adjacent company the data says to watch). Each with
six-question depth + destination moves into rooms that exist. SMB gets its own
four. Workspace view: since demo has no cloud observations, the demo lane gets
3–4 scripted workspace reads (same gate) matching the seeded truth ("Nordstrom
has no dated next step — 21 days").

### 4.20 Outdoors Events
**Key:** the outdoors-events store (cloud in prod; demo-local via the
data-client demo mode — verified at build; if the room is cloud-only in demo it
gets a demo-local fixture path, additive).
**Content:** REAL gatherings, tiered: Direct — HR Transform, UNLEASH America,
SHRM Talent, RecFest USA; Adjacent — SaaStr Annual, NRF Big Show (retail book),
Skift events (aviation/hospitality); Indirect — Expo West (CPG, SMB book).
Real dates verified at build; source URLs real; get-there rail works as built.

### 4.21 Settings + demo meta
**Keys:** `gtmos_demo_seed_meta` (new version stamp `v3-luca`),
`gtmos_noauth_mode`/`email` (demo AE identity: elena@lucaindustries.com /
jordan@lucaindustries.com), category = recruiting.

### 4.22 The Live Edge (code-side demo stream)
**File:** `src/lib/edge/demo-stream.ts` — re-cast from the roster, per
scenario: base wire (a Starbucks reply after 20 quiet days · captured send to
a fictional Boeing contact · calendar Thursday with Duolingo (SMB) · heartbeat
on Nordstrom's missing next step) + the five arrivals. The seeded local
sources (touches/calls/quota/bulk) make the COUNT real on top of the script.

---

## Part 5 — The placeholder eradication sweep

Every AI-placeholder name dies in demo surfaces. Inventory to sweep:
- `js/demo-seed-runtime.js` — Meridian Logistics (+Global), Northstar Capital,
  Trident Pharmaceuticals, Cascadia Health, Beacon Retail, Summit Hospitality,
  and the entire current fictional cast → replaced by the Luca dataset.
- `src/lib/edge/demo-stream.ts` — Northwind, Ramp, Vanta, Mercury, Torch Labs,
  Beacon Health, Coreline → roster names.
- `src/briefing/lib/demo-patterns.ts` — full re-author.
- `demo-seed.html` — scenario cards re-written (see Part 6).
- Anything demo-visible found by a final grep for the usual suspects
  (Meridian/Northwind/Acme/Globex/Initech/Umbrella/Vandelay + the current cast).
**Explicitly NOT swept:** unit-test fixtures, e2e fixtures, mockups already
banked as design history, canon prose — none are user-visible demo surfaces.
(E2e tests that assert seeded demo names get updated to the new cast.)

## Part 6 — Mechanics, naming, and build order

**Where the data lives:** a new typed dataset at `src/demo/luca/` —
`roster-enterprise.ts`, `roster-smb.ts`, `people.ts`, `deals.ts`,
`prose.ts` (every authored string declared through `t()` so the CI voice gate
walks ALL demo copy), and `build-seed.ts` which emits the two scenario
payloads. The legacy `js/demo-seed-runtime.js` keeps its writer/namespace/
autoseed machinery but its DATA block is generated from the typed dataset
(a small build script writes `js/demo-seed-data.generated.js`). One source of
truth, typed, voice-gated, testable.

**Scenario naming:** face labels become **"Enterprise book"** and **"SMB
book"** (Luca Industries framing on the demo-seed page: *"You're an AE at Luca
Industries — a 7-year-old, $100MM ARR AI talent platform. Pick your book."*).
Key `ent` stays; `mm` stays accepted as an alias but the canonical new key is
`smb` (`?autoseed=smb`); Settings sample links + e2e updated.

**Hybrid research at build:** one web-research pass per roster company —
verify revenue band, capture 2–3 real public hiring/people events per deal
account (with URLs) for the signal layer, verify real-exec names used in
signal text, collision-check fictional contact names.

**Derive, don't fake:** every computed surface (heat, health snapshots, quota
targets, readiness verdict, autopsy ranks) is produced by running the real
engines over the seeded inputs at build/verify time — the demo never contains
a number the engines wouldn't compute.

**Build order (after plan approval):**
1. Research pass + final rosters/signals/people dataset (`src/demo/luca/`).
2. Generator + runtime data swap + scenario rename + demo-seed page copy.
3. Code-side re-casts (Live Edge stream, Briefing patterns).
4. New-key seeding (quota targets, pilot layer, fronts, captured meetings,
   bulk counts, activation context, events).
5. Verification: drive all 22 rooms × both scenarios headless from the prod
   bundle — zero pageerrors, every room alive (no empty-state anywhere a seed
   should reach), Live Edge lit, top dashboard move = the intended story;
   screenshot album of every room in both books delivered in chat.
6. Placeholder-sweep grep proves zero residue; e2e updated + green; ship.

**Estimated shape:** the dataset is the weight (~2–3 sessions of authoring +
research); the mechanics are modest (the writer machinery exists).

## Part 7 — What I need from the founder at approval

1. **Roster strikes/swaps** — any of the 56 names you don't want (or must-adds).
2. **AE names** — Elena Vasquez / Jordan Park, or your picks.
3. **Luca details** — HQ Chicago, founded 2019, ~620 employees, the one-line
   pitch: fine as proposed, or adjust.
4. **The pilot showpieces** — OpenAI (enterprise) + Duolingo (SMB): keep or swap.
5. ~~Anything on the Getting to Signed showpiece being **Delta**~~ — RESOLVED:
   founder swapped the showpiece to **Boeing** (29th org); Delta stays on the
   roster at discovery stage. Items 1–4 green-lit as proposed.
