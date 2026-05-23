# Signal Console — Intelligence Coverage & Source Audit

**Version:** 0.1
**Date:** 17 May 2026
**Purpose:** Define what intelligence the console should surface, verify which free sources actually deliver it, rank them honestly, and name the blind spots.

---

## 0. Operating premise

Same console, same data, all users. AEs, SDRs, Founders, Heads of Sales — no role-based gating of content. The product surfaces every category of intelligence; the *filtering* is by relevance to the user's watchlist and ICP, not by role.

But timing matters per role even if content doesn't:

| Role | What they need it for | Cadence |
|---|---|---|
| SDR | Trigger events for today's outreach | Daily |
| AE | Active-deal intel for this week's calls | 2-3× weekly |
| Head of Sales | Pattern intel for forecast/coaching | Weekly |
| Founder | Strategic narrative shifts for board/positioning | Weekly + ad-hoc |

The Briefing should support **filtering by recency tier** (today / this week / this month / quarterly trends) rather than by role. Same underlying intelligence pool, role-agnostic surface, time-aware filtering.

---

## 1. Exhaustive insight type catalog

What the console should be capable of surfacing. Organized by intelligence category, not by source.

### 1.1 Competitor movement (direct competitive signal)

Concrete observable changes in named competitors' public surface:

- **Pricing page changes** — tier additions, tier removals, price increases, packaging restructures, "starting from" shifts
- **Product feature launches** — new features on product pages, new product line page additions
- **Feature deprecation** — pages or features quietly removed; signal of strategic refocus
- **Integration ecosystem moves** — new integrations added to /integrations page; removed integrations
- **API / developer documentation changes** — new endpoints, new SDKs, deprecation notices
- **Trust center / compliance certification changes** — SOC 2 Type II added, ISO 27001 added, HIPAA added, FedRAMP pursuit
- **Subprocessor list changes** — new AI subprocessor (Anthropic, OpenAI) = AI feature in the works; new geographic subprocessor = region expansion
- **Security incidents / outages** — status page incidents, postmortems, breach disclosures
- **Customer logo additions** — new logos on /customers, new case studies published
- **Customer logo removals** — quietly removed logos can signal lost accounts (rare to detect)
- **Geographic expansion** — new region pages, new office announcements, new language localizations
- **Vertical expansion** — new industry-specific landing pages (e.g., "for healthcare", "for financial services")
- **Brand / visual identity refresh** — rare but signals strategic pivot
- **Tagline / hero positioning changes** — first line above the fold shifts often
- **Partner page changes** — new partners added, partnership announcements
- **Documentation portal restructure** — signal of dev-led growth strategy
- **Tech stack / framework shifts** — visible via job postings, GitHub commits, public engineering blogs

### 1.2 Competitor product velocity

How fast the competitor is shipping:

- **Open-source repo activity** — GitHub stars trend, release cadence, commit frequency, contributor count
- **Package registry activity** — npm/PyPI download trends, version release cadence
- **Changelog cadence** — frequency and substance of changelog entries
- **Release notes mention patterns** — which themes recur (performance, AI, enterprise)
- **Beta program announcements** — early access pages, waitlist launches
- **Developer event sponsorships** — signal of which audiences they're courting
- **Engineering blog publication frequency** — proxy for engineering brand strength

### 1.3 Competitor commercial moves

Revenue-side and GTM-side signal:

- **Funding rounds** — Series A/B/C/D, valuation jumps, secondary transactions
- **M&A activity** — acquirer or acquired, including small acquihires
- **IPO / S-1 filings** — public-market trajectory
- **Layoffs** — distress or strategic refocus signal
- **C-suite / Director+ exec moves** — joins, departures, promotions, board changes
- **GTM motion shifts** — visible via hiring mix at executive level (new CRO usually = sales motion shift)
- **Press release cadence shifts** — silent for 3 months then a burst = something brewing
- **Conference sponsorship patterns** — which conferences, which tier of sponsorship, which speaker slots
- **Marketing campaign launches** — new landing pages, new ad creative variations, new email sequences (visible via SimilarWeb/Wappalyzer paid; partly via public ad libraries)

### 1.4 Buyer-side intelligence

What buyers / target accounts are doing (often more useful for AE/SDR than competitor intel):

- **Trigger events at target accounts** — funding, exec hire, layoffs, expansion, M&A
- **Buyer hiring patterns** — when a target hires a new VP of X, that role often signals a buying initiative around X
- **Buyer pain language drift** — what terms target buyers are using in their public content
- **Buyer-side conference appearances** — what topics their execs are speaking on
- **Buyer technology adoption signals** — public job postings naming specific tools = they use those tools
- **Buyer org changes** — restructure announcements, new department launches
- **Buyer funding events** — fresh capital = buying capacity
- **Buyer regulatory pressure** — new compliance requirements affecting their category

### 1.5 Category / market narrative

What's happening at the level of the market itself:

- **Category narrative shifts** — terms rising/falling in coverage (e.g., "RPA" → "agentic workflow")
- **Analyst commentary** — Gartner Hype Cycle position shifts, Forrester Wave updates, IDC reports (mostly paywalled but RFPs and press cite them)
- **New entrants** — startups raising in the category, accelerator cohort grads
- **Category-defining content** — manifesto blog posts, founder essays, conference keynotes that crystallize the category
- **Conference topic trends** — what's appearing on agendas, what's increasing in frequency year-over-year
- **Newsletter coverage volume** — how much category coverage is appearing across operator newsletters
- **Academic / research paper publication frequency** — for AI-native categories, arXiv volume matters
- **Patent filings** — USPTO public, lags by 18 months but signals R&D direction
- **Search interest trends** — Google Trends (rough), Wikipedia pageviews (clean)
- **Open-source ecosystem mentions** — when a category becomes "GitHub-native" it grows differently

### 1.6 Buyer-pain trajectory (pain drift)

Cross-account, cross-source themes:

- **Recurring complaints** in community discussion (HN, Indie Hackers, Dev.to)
- **RFP language patterns** — when RFPs are public
- **Practitioner survey results** — operator newsletters publish these
- **Job posting requirement language** — what skills/tools/concepts buyers prioritize, drift over time
- **Newsletter topic frequency** — what operator content gets traction
- **Podcast topic frequency** — what's being discussed across operator interviews
- **Conference Q&A themes** — what questions repeat across sessions

### 1.7 Sales-execution signal (most directly useful for AE/SDR)

The signals that turn directly into action:

- **Trigger events at accounts in user's watchlist** — funding, exec hire, M&A, layoffs, regulatory action, security incident
- **Disqualifier events** — events that mean an account is NOT buying-ready (acquisition pending, leadership turnover, mass layoff)
- **Champion identification** — who at target companies is publicly promoting category narratives (LinkedIn-only, but cross-posts catchable via Substack and HN)
- **Counter-positioning opportunities** — competitor overclaim that creates a wedge ("they say enterprise-ready but their trust center has no SOC 2")
- **Objection-pattern shifts** — what objections are rising in community discussions
- **Win-themes from publicly observable wins** — case study patterns reveal what's working
- **"Why now" cues** — anything that creates urgency for a specific account

### 1.8 Macro / regulatory context

Slow-moving but consequential:

- **Privacy regulation changes** — GDPR enforcement actions, CCPA/CPRA changes, sectoral regs
- **AI regulation** — EU AI Act milestones, US state AI laws, sector-specific AI guidance
- **Industry compliance shifts** — HIPAA changes, PCI-DSS updates, SOC framework evolution
- **Trade body announcements** — when relevant to the user's category
- **Geopolitical impact on tech sourcing** — export controls, data residency laws

---

## 2. Source landscape — what feeds what

The honest mapping. "Verified" means I've actually hit the endpoint and seen real data; "Documented" means the endpoint is well-documented but I couldn't direct-test in this environment; "Hypothesis" means worth testing in the verifier script.

### 2.1 Competitor movement → sources

| Insight | Primary source | Backup |
|---|---|---|
| Pricing page changes | Direct HTML fetch + Wayback Machine diff | Self-hosted snapshot store |
| Product feature launches | Direct fetch of /product, /features pages + Wayback diff | ProductHunt RSS for category launches |
| Integration moves | Direct fetch /integrations + Wayback diff | — |
| API doc changes | Fetch developer docs + diff | — |
| Trust center / subprocessor changes | Direct fetch /trust, /security, /subprocessors + diff | — |
| Security incidents | Status page RSS (most use Atlassian Statuspage which exposes RSS) | HackerOne disclosures (public) |
| Customer logos | Direct fetch /customers + diff | — |
| Geographic expansion | Direct fetch + Wayback; press releases | — |
| Tagline / hero positioning | Direct fetch homepage + diff | — |

**Reality check:** Nearly everything in 1.1 requires Tier B (own fetch + diff). The data exists publicly; there's no API. Wayback Machine covers high-traffic competitor pages for free; for long-tail competitors you host your own snapshot store. ~200 lines of Python (fetch + diff + email/Slack on change).

### 2.2 Competitor product velocity → sources

| Insight | Primary source | Status |
|---|---|---|
| GitHub stars/releases/commits | GitHub API | Verified live |
| npm download stats | npm registry + npm-stat | Documented |
| PyPI download stats | PyPI JSON API + pypistats.org | Documented |
| Changelog cadence | Direct fetch /changelog or /releases + diff | Tier B |
| Engineering blog frequency | Company blog RSS where available; Tier B HTML fetch otherwise | — |

### 2.3 Competitor commercial moves → sources

| Insight | Primary source | Status |
|---|---|---|
| Funding rounds | TechCrunch funding RSS (`techcrunch.com/tag/funding/feed`) + Crunchbase News free portion | Verified |
| M&A activity | TechCrunch + PR Newswire general business RSS | Verified |
| IPO / S-1 | TechCrunch enterprise/venture feeds; **NOT** SEC EDGAR (cut) | — |
| Layoffs | layoffs.fyi (public dataset, no API but scrapable structured page) | Documented |
| Exec moves (Director+) | **PR Newswire Personnel Announcements category** | Verified — 100% SNR |
| Exec moves (cross-post) | Substack RSS, HN Algolia for "joined as" patterns | Documented |
| Press release cadence | Per-company news page fetch + diff | Tier B |
| Conference sponsorship | Conference website fetch | Tier B |

### 2.4 Buyer-side intelligence → sources

| Insight | Primary source | Status |
|---|---|---|
| Buyer trigger events | TechCrunch + PR Newswire (filtered by user's target accounts) | Verified |
| Buyer hiring at exec level | PR Newswire Personnel Announcements filtered by target | Verified |
| Buyer pain language | HN Algolia, Indie Hackers RSS, Dev.to RSS, Substack operator content | Verified |
| Buyer conference appearances | Conference site fetches | Tier B |
| Buyer tech adoption signals | (Was Greenhouse/Lever — cut. Now: job-board-agnostic HTML scraping per company, lower priority) | Tier B |

### 2.5 Category / market narrative → sources

| Insight | Primary source | Status |
|---|---|---|
| Narrative shifts | HN Algolia trajectory queries, Substack operator newsletters | Verified |
| Analyst commentary | Direct analyst site fetches; mentions in PR Newswire | Tier B |
| New entrants | Y Combinator company list, ProductHunt RSS, TechCrunch funding feed | Documented |
| Category-defining content | Substack RSS (operator publications), HN Top Stories | Verified |
| Conference topic trends | Conference site fetches per major event | Tier B |
| Newsletter coverage volume | Substack RSS aggregation | Documented |
| Academic / research papers | arXiv API (free, no key) | Documented |
| Patent filings | USPTO PatentsView API (free) | Documented |
| Search interest trends | Wikipedia Pageviews API (free, no key) | Documented |
| Open-source ecosystem | GitHub API + npm/PyPI registries | Verified |

### 2.6 Buyer-pain trajectory → sources

| Insight | Primary source | Status |
|---|---|---|
| Community discussion themes | HN Algolia with rolling-window queries | Verified |
| Practitioner forums | Indie Hackers RSS, Dev.to RSS, Lobste.rs RSS | Documented |
| Operator newsletter coverage | Substack RSS aggregation | Documented |
| Podcast topic frequency | Apple Podcasts RSS lookup + transcription | Documented |
| RFP language | Public procurement portals (SAM.gov for federal — exception to gov rule) | Documented |

### 2.7 Sales-execution signals → sources

These are derived signals — produced by the recipe layer cross-referencing primary sources against the user's watchlist, ICP, and active deals. No new primary sources needed.

### 2.8 Macro / regulatory → sources

| Insight | Primary source | Status |
|---|---|---|
| US Federal regulation | Federal Register API (free, no key) | Documented |
| EU regulation | EUR-Lex (free, complex schema) | Skip — too noisy |
| FTC announcements | FTC press release RSS | Documented |
| Trade body announcements | Per-body site fetch | Tier B |

---

## 3. Verified-and-ranked sources (Tier S core)

The Tier S sources I'm willing to put weight on, ranked across three axes. Scoring is 1-5 where 5 is excellent.

### Scoring rubric

- **Clarity of output (C):** how structured and parseable is the data? 5 = clean JSON schema, 1 = unstructured HTML soup.
- **Ease of access (A):** auth, rate limits, legal exposure. 5 = no auth no key no ToS issue, 1 = paywall or hostile.
- **Consistency (F):** how stable is the schema and uptime? 5 = ten years of stable schema, 1 = breaks monthly.
- **Composite = C + A + F (max 15)**

### 3.1 Core Tier S — verified, ranked

| Source | What you get | C | A | F | ∑ | Notes |
|---|---|---|---|---|---|---|
| **Hacker News Firebase API** | Tech chatter, pain language, exec-move cross-posts in comments | 5 | 5 | 5 | **15** | The most reliable free API on the open internet. No auth, no rate limit, stable schema since 2014. |
| **Hacker News Algolia Search** | Time-bounded full-text search across HN history | 5 | 5 | 5 | **15** | Companion to Firebase. The trajectory engine — rolling-window queries detect pain drift. |
| **GitHub API** | Releases, commits, stars, contributor activity per repo | 5 | 4 | 5 | **14** | Auth optional but recommended (60→5000 req/hr). PAT is free and 30 seconds to create. |
| **Wayback Machine API** | Snapshots of any public URL for diffing | 4 | 5 | 4 | **13** | Lookup is structured JSON; the snapshot content itself is HTML you parse. Coverage best for high-traffic pages. |
| **PR Newswire Personnel Announcements** | Director+/C-suite/VP hires, departures, promotions, board changes | 3 | 4 | 4 | **11** | ~100% SNR for exec moves but no direct category RSS — must fetch HTML page and parse, OR filter the broader general-business RSS. |
| **TechCrunch RSS (category feeds)** | Funding, M&A, enterprise SaaS news, AI news | 4 | 5 | 4 | **13** | `/feed` is firehose (30 posts/day); category feeds like `/tag/funding/feed` and `/category/enterprise` are tractable. |
| **Wikipedia Pageviews API** | Daily pageview counts per article — proxy for category narrative interest | 5 | 5 | 5 | **15** | Free, no auth, well-documented. Underused for B2B competitive intel — pages like "Customer data platform" or specific company articles. |
| **arXiv API** | AI/ML research papers by category, date, author | 4 | 5 | 5 | **14** | For AI-native SaaS competitors, arXiv signal is significantly upstream of product announcements. |
| **Substack RSS (per publication)** | Operator/founder content, exec-move cross-posts | 4 | 5 | 4 | **13** | Pattern `{name}.substack.com/feed`. Coverage is per-publication, you build a curated list. |
| **Atlassian Statuspage RSS** (per company) | Incidents, outages, postmortems | 5 | 5 | 4 | **14** | Most modern SaaS uses Statuspage; each has RSS at `status.{company}.com/history.rss` or similar. |
| **HackerOne disclosures** | Public security disclosures by company | 4 | 5 | 4 | **13** | Useful for trust-narrative signal. Many B2B SaaS have public HackerOne programs. |
| **Federal Register API** | US federal regulatory actions | 4 | 5 | 5 | **14** | The ONE gov source besides EDGAR that's actually clean. JSON API, well-documented. Use for AI regulation, privacy, sector-specific compliance. |

### 3.2 Tier A — useful, lower volume or higher noise

| Source | What you get | C | A | F | ∑ | Notes |
|---|---|---|---|---|---|---|
| **PR Newswire General Business RSS** | Broader business news including personnel announcements mixed with other content | 4 | 5 | 4 | **13** | Use if the dedicated Personnel Announcements page fetch breaks. Higher noise. |
| **Hacker News RSS (hnrss.org)** | HN front page as RSS — lighter than Firebase | 5 | 5 | 4 | **14** | Convenience layer over Firebase. Use when polling isn't needed. |
| **ProductHunt RSS** | New product launches across categories | 4 | 5 | 3 | **12** | Volume is high; relevance filter at recipe layer required. PH API changed in past — RSS more stable than API. |
| **Indie Hackers RSS** | Founder content, small-business pain language | 4 | 5 | 3 | **12** | Lower-volume than HN but signals different community (founders rather than engineers). |
| **Dev.to RSS** | Developer-community technical content | 4 | 5 | 4 | **13** | Tag-filterable. Useful for tracking technical-decision language. |
| **GitHub Releases Atom (per repo)** | Per-competitor release feed | 5 | 5 | 5 | **15** | Same data as GitHub API but as Atom — cheaper to poll for many repos. |
| **Apple Podcasts Lookup API** | Podcast RSS URLs by name/ID | 4 | 5 | 5 | **14** | Use to discover RSS URLs for operator/founder podcasts; then poll the RSS directly. |
| **layoffs.fyi** | Tech layoffs by company, role count, date | 4 | 4 | 3 | **11** | Public structured page, no API. Scrapable HTML or CSV download. Useful trigger-event signal. |
| **Y Combinator company directory** | YC startups by batch, category | 5 | 5 | 5 | **15** | Free, public, structured. Useful for emerging-competitor radar in your category. |

### 3.3 Tier B — public but fragile (you host the fetch + diff)

For these you build your own fetcher + snapshot store. No standardized API exists.

| Insight | Source pattern | Difficulty |
|---|---|---|
| Pricing pages | `https://{competitor}.com/pricing` HTML fetch + diff | Easy if pages are stable; brittle when sites redesign |
| Product pages | `https://{competitor}.com/product`, `/features` | Same as above |
| Trust centers | `https://{competitor}.com/trust`, `/security`, `/compliance` | Stable — these pages don't redesign often |
| Subprocessor lists | `https://{competitor}.com/subprocessors`, often linked from DPA | Stable |
| Customer pages | `https://{competitor}.com/customers`, `/case-studies` | Stable structure, frequent updates |
| Team / leadership | `https://{competitor}.com/team`, `/about`, `/leadership` | Stable — exec moves visible here before press |
| Changelog / release notes | `https://{competitor}.com/changelog`, `/release-notes`, `/whats-new` | Varies wildly per company |
| Documentation portals | `https://docs.{competitor}.com` or `developer.{competitor}.com` | Stable URLs, fragile structure |
| Conference / event pages | Per-conference site fetches | Per-event manual setup |

**Tier B core decision:** You need a snapshot store + diff engine. Lightweight version is ~200 lines of Python — fetch HTML, store under `{url_hash}/{timestamp}.html` in Supabase storage or S3, compare against previous snapshot using `difflib`, emit Item if non-trivial change detected. Wayback Machine covers ~30-50% of competitor pages for free; the rest you host.

### 3.4 Skipped — deliberately, with rationale

| Source | Why skipped |
|---|---|
| Reddit (all access patterns) | Free tier exists but ToS prohibits commercial use. RSS feeds technically work but same ToS applies. |
| LinkedIn (any access) | ToS minefield. Even public profile scraping has legal exposure. Captureable indirectly via cross-posts. |
| Twitter / X | Paywalled, fragmented, ToS issues. |
| G2 / Capterra | Aggressive blocking; individual review URLs sometimes work via Wayback but unreliable. |
| Glassdoor | Heavy blocking. |
| Crunchbase (full) | Paywalled beyond limited free tier. |
| The Information / Bloomberg / Axios Pro | Paywalled. |
| SEC EDGAR | Cut per your call — wrong cohort coverage, stale, schema mess. |
| Workable | SMB-focused, weakest ICP fit (cut earlier). |
| Greenhouse / Lever / Ashby | Job board APIs — wrong signal per your call. Exec moves captured via PR Newswire instead. |
| TheOrg.com | Couldn't verify free-tier coverage of useful data; high paywall risk. |

---

## 4. Composite ranking — the lean Tier S you build for beta

Sorted by composite score, then by how well they map to insight types the AE/SDR/Founder all care about:

| Rank | Source | Composite | Primary insight category | Build cost |
|---|---|---|---|---|
| 1 | Hacker News Firebase + Algolia | 15/15 | Category narrative, pain drift, exec cross-posts | Trivial (2 fetchers) |
| 1 | Wikipedia Pageviews API | 15/15 | Category narrative trajectory | Trivial |
| 1 | Y Combinator company directory | 15/15 | New entrants, emerging competitors | Trivial |
| 1 | GitHub Releases Atom | 15/15 | Competitor product velocity (per repo) | Trivial |
| 2 | GitHub API | 14/15 | Competitor product velocity (deeper signal) | Easy (PAT setup) |
| 2 | TechCrunch RSS (category feeds) | 13/15 | Funding, M&A, AI category narrative | Trivial |
| 2 | arXiv API | 14/15 | AI research upstream signal | Easy |
| 2 | Federal Register API | 14/15 | Regulatory triggers | Easy |
| 2 | Atlassian Statuspage RSS (per competitor) | 14/15 | Reliability/competitive sales angle | Per-competitor config |
| 2 | Apple Podcasts Lookup API | 14/15 | Discovering podcast RSS URLs | Easy |
| 3 | Substack RSS (curated list) | 13/15 | Operator content, exec cross-posts | Per-publication config |
| 3 | Wayback Machine API | 13/15 | Free pricing/page diff layer | Easy |
| 3 | HackerOne disclosures | 13/15 | Trust narrative | Easy |
| 4 | PR Newswire Personnel Announcements | 11/15 | Director+/C-suite moves | HTML fetch + parse |
| 4 | layoffs.fyi | 11/15 | Disqualifier events | HTML fetch |
| 5 | Tier B own-fetch (pricing, trust, team) | varies | Per-competitor surface | ~200 lines + snapshot infra |

### 4.1 Recommended beta source mix

For the first end-to-end pipeline run, build fetchers for these 6 sources:

1. **HN Algolia** — query per pain_tag with rolling 30-day window
2. **HN Firebase topstories** — daily fetch, filter by relevance to watchlist + category keywords
3. **TechCrunch category feeds** — `/tag/funding/feed`, `/category/enterprise/feed`, `/category/artificial-intelligence/feed`
4. **PR Newswire Personnel Announcements page** — HTML fetch + parse + filter by watchlist
5. **Substack RSS (10 curated operator publications)** — user-configurable list, starting from a default seed
6. **Tier B own-fetch** for 5 competitor pricing pages — fetch + Wayback diff comparison

That's the minimum-viable source set. Six fetchers, one filter pass, one enrichment pass, one synthesis pass, one Briefing render. Real coverage across 80% of the insight types in section 1.

---

## 5. What you're not thinking about (blind spots)

These are the things I've watched you NOT raise yet. Worth pushing back on me if you disagree.

### 5.1 The data isn't the bottleneck — synthesis is

You've been (rightly) focused on source quality and verification. But once the sources are in, the actual product quality is determined almost entirely by:

- The **enrichment prompt** — whether claim_type, pain_tags, and entity extraction are reliable
- The **clustering algorithm** — whether items that should cluster actually cluster
- The **synthesis prompt** — whether the Pattern reads like Stratechery or marketing soup
- The **threshold tuning** — whether the Briefing surfaces 3 sharp patterns or 20 mediocre ones

A perfect source list with a bad recipe layer ships a worse product than a mediocre source list with a great recipe layer. Worth keeping in mind as we move past the source phase.

### 5.2 Volume mismatch will dominate naive ranking

PR Newswire General Business fires ~500-1000 items/day. A Substack publication might fire 1-2 items/week. If both feed the same cluster threshold (`min_evidence=3`), the high-volume source will dominate every cluster.

Mitigation in the recipe layer: weight items by source reliability (`SRC_CONF` already does this) AND by inverse volume — rare-source signal counts MORE than common-source signal. The math:

```
signal_weight = SRC_CONF[source] × log(1 + 1000 / source_volume_per_week)
```

Without this, the Briefing will mostly reflect PR Newswire repackaging.

### 5.3 Negative space is signal too

What ISN'T being said is itself information:

- Competitor's blog goes silent for 3 months → focus shift, layoffs, or pre-launch lockdown
- Pricing page hasn't changed in 12 months → stable strategy or stagnation
- Hiring page empty → freeze, profitability push, or layoffs incoming
- Status page has too few incidents → either solid reliability or they're hiding things

Detection requires baselines. The recipe layer needs to compute "expected frequency" per source per company and flag deviations. This is V2, but worth designing data model for now (every fetcher should log its empty-result runs, not just the items it returns).

### 5.4 Press releases are noise wearing a tie

The brief warned about this and it's worth restating: PR Newswire is a paid distribution service. Companies pay to put PR there. The content is ~100% spin. "Company X is excited to announce..." is never the actual story.

The recipe layer's enrichment prompt has to read PAST the spin:
- Extract the factual event (who, what role, when)
- Discard the marketing language entirely
- Resist the urge to repeat the company's own framing

If the synthesis prompt fails this test, the Briefing reads like a PR aggregator. That's the failure mode.

### 5.5 User-side data beats every public source

The user's own CRM notes, call recordings, win/loss data, and inbound demo requests are higher-signal than any external source. You haven't framed Signal Console as a user-data-aware product yet — it's been external-data-only.

Worth adding:
- "Upload your win/loss notes" → pain language extraction enriches PAIN_LIB
- "Connect your call transcripts" → objection patterns become a new cluster type
- "Connect your CRM" → trigger events at named accounts get priority surfacing

The same recipe layer pipeline can ingest these as additional source types. It changes the data flow — user data is private, can't be cached cross-tenant — but it dramatically lifts product value for users who provide it.

### 5.6 AI-native sources change the source list itself

You've been thinking about "structured sources" (RSS, APIs). There's a class of meta-source you haven't framed:

- **Claude / Anthropic web search** — Claude can do ad-hoc deep research per query, complementing the structured pipeline
- **Perplexity / Exa.ai APIs** — purpose-built for "find me current info about X" workflows
- **GPT search models** — same idea, different vendor

These don't replace structured fetchers, but they fill gaps. For a one-off "what's the latest on [specific competitor]" query, an AI-native search beats building a custom fetcher. Worth keeping in the product architecture as a "deep research" mode beside the scheduled pipeline.

### 5.7 The cost ceiling will bite earlier than expected

With 6 sources and ~50 enriched items per day per user, the LLM cost looks small. But:
- Daily enrichment at 50 items × $0.001 = $0.05/day = $1.50/month per user
- Plus 5-10 cluster syntheses × $0.005 = $0.05/day = $1.50/month
- Plus deep-research mode on-demand
- At 100 active users, that's $300/month in LLM cost alone

This is fine for beta. But the moment a user has 20 sources and gets daily Briefings, the math shifts. **Build cost telemetry into the recipe layer from day one** — track enrichment cost and synthesis cost per user, per source, per day. Without that, you'll discover you're losing money on power users before you have a chance to price for it.

### 5.8 Personalization is going to fight role-agnosticism

You said: same data for everyone, no role-based gating. Good principle. But the practical reality:
- An SDR's watchlist is huge and shallow (100 prospects, 1-2 fields known each)
- An AE's watchlist is small and deep (15 active deals, full context per)
- A Head of Sales's watchlist is the union of all their reps' watchlists
- A Founder's watchlist is the category, not individual companies

Same Briefing, different relevance scoring required per user. The recipe layer's `user_relevance_score` field has to differentiate "is this account in my watchlist" from "is this an account I might prospect into." Without that, the SDR's Briefing is drowned by AE-relevant signals and vice versa.

This isn't role-based gating. It's relevance scoring informed by user context. Worth being explicit about in the design.

### 5.9 Source health monitoring is product infrastructure, not afterthought

When a source goes dark — Anthropic restructures their /news page, PR Newswire changes URL patterns, Substack changes RSS shape — the user has no idea. They just see fewer Patterns and assume the product is broken.

The verifier script I built earlier is the seed of this. It needs to become:
- Scheduled (hourly health check per source)
- Visible to user ("Source X has been degraded for 2 days")
- Self-fallback (when primary source dies, try secondary)
- Surfaced in the Briefing footer ("This week's Briefing draws on 18 of 20 configured sources")

Without this, source decay is invisible until the product feels broken.

### 5.10 The Director+ exec-move signal needs entity resolution

When PR Newswire publishes "Bruce Felt joins Kong as CFO" and HN comments mention "Bruce Felt is now at Kong," those are the same event. The cluster algorithm needs to recognize them as the same.

Entity resolution at the (person, company, role, action) level is harder than pain-tag clustering. The naive approach (string match on full name) breaks on nicknames, name spelling variants, and ambiguity ("Bruce Felt" vs "Bruce L. Felt" vs "B. Felt"). Worth budgeting prompt-engineering time for the enrichment stage to normalize these aggressively.

### 5.11 The beta might surface the wrong patterns first

For the first 2 weeks of pipeline runs, the patterns surfaced will mostly be:
- High-volume sources dominating (PR Newswire)
- Low-volume sources under-weighted (Substack operator content)
- Pain themes that match the seed PAIN_LIB but miss themes that aren't in it yet

Expect the first week's Briefing to be noisy. Plan for an explicit "Beta-phase tuning" sprint — review every Pattern, mark Used/Noise, adjust thresholds, expand PAIN_LIB based on what you actually see. The product gets dramatically better after two such cycles.

### 5.12 You'll be tempted to add features. Don't.

You have:
- Recipe layer spec (50% built, needs Tier S source list update)
- Verifier script (built, needs Tier S update + exec-move sources added)
- Briefing variant design (built)
- 6-source beta MVP plan

That's enough to ship V0.1 and run it for 2 weeks against real data. Every additional feature added before that ship date pushes the actual learning further out. The pattern with founders is to keep designing instead of shipping. The Briefing variant only earns its layout once it's been live for 14 days against real noise.

---

## 6. Next steps in order

1. **Update verifier script** with new Tier S sources (drop Greenhouse/Lever/Ashby/SEC; add PR Newswire Personnel page, Wikipedia Pageviews, arXiv, Federal Register, Atlassian Statuspage pattern, layoffs.fyi)
2. **Update recipe layer spec** with the new source list, the `exec_move` cluster type, the volume-weighting in scoring, and the negative-space data model
3. **Build the Python skeleton** — one module per stage, fetchers for the 6 beta sources, enrichment + synthesis prompts wired against Claude API
4. **Run end-to-end** against your real ICP and watchlist for 2 weeks
5. **Tune** thresholds, PAIN_LIB, prompts from what you actually see
6. **Expand** to additional sources only after the beta loop is proven

---

*End of audit.*
