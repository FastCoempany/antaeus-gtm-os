# ADR-001 — Foundation Stack Migration

- **Status:** DRAFT — awaiting founder approval
- **Date:** 2026-04-21
- **Authors:** Claude (Anthropic) with Founder direction
- **Approvers:** Founder
- **Supersedes:** None (this is the first ADR)
- **Superseded by:** None
- **Related:** `CLAUDE.md` (canon), `deliverables/audits/antaeus-app-brittleness-audit-2026-04-16.md`, `GTM-OS-EXHAUSTIVE-IMPROVEMENT-PLAN.md`

---

## 0. Executive summary

Antaeus adopts **Preact + TypeScript + Vite + Supabase (Postgres + Realtime) + Vitest/Playwright + Sentry + Posthog + GitHub Actions CI** as its foundation stack, effective on founder approval of this ADR. Current static-HTML + localStorage + string-assembly-innerHTML architecture is deprecated; migration is phased, feature-flagged, and reversible at every stage. Hosting (Cloudflare Pages), auth provider (Supabase), styling (vanilla CSS + variables), and the product's mind (canon Parts I–IV) remain unchanged. The migration is expected to take 3–6 months of foundation-first then room-by-room work, with no user-facing regression and no launch-clock pressure.

This ADR is binding once approved. Future changes to the stack require a superseding ADR.

---

## 1. Context

### 1.1 Where Antaeus is today

At time of writing (2026-04-21):

- **Hosting:** Cloudflare Pages serving static HTML files. Deploy pipeline committed 2026-04-20 (`5889bde`), not yet exercised end-to-end.
- **Auth:** Supabase (email/password + OAuth), already in production use.
- **Data persistence:** `localStorage` is the primary data store. Every room reads and writes `gtmos_*` keys. Supabase is used for auth but not for application data.
- **Rendering:** Every room is an `index.html` file that loads several `<script>` tags. The dynamic parts of each room are built via JavaScript string concatenation (`element.innerHTML = '<div>' + escH(x) + '</div>'`) — a pattern the 2026-04-16 brittleness audit flagged as P1.
- **Dependencies:** Zero runtime dependencies other than Supabase's JS SDK loaded from a CDN. No build step. No bundler. No type system.
- **Tests:** Ad-hoc Playwright probes written per session. No standing test suite. No CI gates.
- **Observability:** None. No error tracking, no product analytics.
- **Canon:** `CLAUDE.md` is the operating canon for any session, established 2026-04-21.

### 1.2 What forced this decision now

The founder has stated that the product's trajectory requires:

- An absolutely beautiful user experience across every surface
- Nothing ever breaks
- Updates are smooth and expertly wired
- Eventually supporting 100,000+ concurrent users
- No clock pressure — willingness to spend significantly more time on foundation work now in exchange for durability later

None of these are achievable with the current architecture. Specifically:

- **"Nothing ever breaks"** cannot be guaranteed without type safety, automated test gates, and production error tracking. The current JS has no compile-time checks, no standing tests, and no Sentry-equivalent.
- **"Smooth updates"** cannot be achieved with `innerHTML` string replacement. Every state change tears down the DOM subtree, which causes focus loss, scroll-jumps, and prevents animated transitions. The next-step docket in Wave 2 already required a workaround (using `change` events instead of `input` events to preserve focus) — that workaround isn't sustainable.
- **"Expertly wired"** implies typed contracts between components and rooms. Current JS has no contracts; a typo in a field name fails silently at runtime.
- **100K concurrent users** with real-time or multi-device behavior requires a real database, not `localStorage`. The current architecture cannot deliver: two tabs open on the same account can silently overwrite each other's data, and data cannot sync across devices or users.

The 2026-04-16 brittleness audit independently flagged the rendering pattern as P1, and the Feb 2026 improvement plan flagged the absence of analytics, error tracking, and data export as ship-blockers. This ADR consolidates those findings into a single coherent response.

### 1.3 What is NOT changing

This is important to state explicitly, so scope does not drift:

- **Cloudflare Pages** remains the hosting layer. The static-site deploy model is unchanged.
- **Supabase auth** remains the auth provider. This ADR *extends* Supabase usage into application data, but does not migrate to another auth system.
- **The canon (`CLAUDE.md`)** remains authoritative. This ADR is subordinate to it and documents HOW the product will be built, not WHAT the product is.
- **The product's mind** — Part I (sacred nouns, architectural truths, room purposes) is not touched.
- **The face direction** — Part II (bright-first, System Ledger darkness, composition families, typography, color semantics) is not touched.
- **The behavioral doctrine** — Part III (seven rules, fourteen principles, hallway suppression, loop transformation) is not touched.
- **The design-principle-strict-bible** is not touched.
- **CSS + CSS variables** stay as the styling system. No Tailwind, no CSS-in-JS, no styled-components.

### 1.4 Governing principle

This ADR serves the trajectory, not any particular tool. Every decision below must pay for itself against at least one of: *nothing breaks*, *smooth updates*, *expertly wired*, *scales to 100K users*. Tools that don't advance those goals — no matter how fashionable — are out of scope.

---

## 2. The decision

Antaeus adopts the following stack:

| Layer | Choice | Role |
|---|---|---|
| Component framework | **Preact 10+** | Reactive rendering with diffing/reconciliation; solves focus loss, scroll preservation, animated transitions, fine-grained updates |
| Template syntax | **Preact + JSX via Vite** | Standard, well-tooled, typeable. `htm` (runtime template literals) is viable but JSX wins long-term for type safety + tooling |
| Language | **TypeScript (strict mode)** | Compile-time type safety, documented contracts, refactor-safety |
| Build tool | **Vite 5+** | Fast dev loop, fast prod builds, excellent TS + Preact support, no config ceremony |
| Styling | **Vanilla CSS + CSS variables** (current approach preserved) | Already well-factored; no need to change. CSS Modules optional later if scoping becomes an issue. |
| Data persistence | **Supabase Postgres** | Real database replacing `localStorage` as primary; localStorage becomes an offline cache + hydration layer |
| Real-time updates | **Supabase Realtime** | Postgres changefeeds subscribed to from the client; enables cross-tab and cross-user reactivity |
| DB access pattern | **supabase-js typed queries** with schema-generated types | End-to-end type safety from DB column → UI prop |
| Unit testing | **Vitest** | Same engine as Vite, fast, Jest-compatible API |
| Component testing | **@testing-library/preact** | Behavior-oriented component tests |
| E2E testing | **Playwright** (already in repo from 2026-04-21) | Full-browser automation; the capture infrastructure carries over |
| Error tracking | **Sentry** | Production error aggregation, alerting, release tagging |
| Product analytics | **Posthog** (already flagged by improvement plan) | Funnel analysis, retention, feature flags, session replay |
| CI/CD | **GitHub Actions** | Test gates, preview deploys, rollback automation |
| Deployment | **Cloudflare Pages** (unchanged) + **Cloudflare Workers** for edge functions if needed | Unchanged hosting, Workers available for server-side logic that shouldn't run in the browser |
| Auth | **Supabase Auth** (unchanged, extended) | No change. Extended to issue JWTs used by Postgres row-level-security policies. |
| Feature flags | **Posthog feature flags** | Feature-flagged rolling migration; any new room can be toggled on/off per user segment |
| Observability | **Sentry** (errors) + **Posthog** (product) + structured logs from **Cloudflare Pages Functions logs** | Three-layer visibility |
| Architecture docs | **ADRs in `deliverables/adr/`**, canon updates in `CLAUDE.md` | This ADR is the template for future architectural decisions |

### 2.1 Rationale per decision

**Preact over React:**
- ~3 KB gzipped vs. React's ~45 KB. Materially better for first paint at 100K users.
- React-compatible API: anyone who knows React (human or AI) can contribute immediately.
- Actively maintained, production-proven (Etsy, Uber, Microsoft).
- Supports Signals for fine-grained reactivity if we ever need it beyond hooks.

**Preact + JSX via Vite over Preact + htm (runtime templates):**
- JSX gets full TypeScript type checking on component props at compile time; htm is runtime-only.
- Vite's dev experience (HMR, instant feedback) is a major productivity multiplier.
- The added build step unlocks tree-shaking, code splitting, and pre-rendering for public pages.
- One-time setup cost, multi-year payoff.

**TypeScript in strict mode:**
- Catches null/undefined bugs, type mismatches, missing fields, and stale refactors before they ship.
- Documents every function signature implicitly — no more "what does this argument accept?"
- Required for the "nothing breaks" guarantee to be real.

**Vite over Webpack/Parcel/esbuild-direct:**
- Fastest HMR on the market (sub-100ms typical).
- Native TypeScript + JSX support out of the box.
- Plugin ecosystem for future needs (PWA, SSR, etc.).
- Simple config. No ceremony.

**Supabase Postgres for data (not Firebase, not custom node + Postgres):**
- Already in the stack for auth — zero additional vendor relationship.
- Row-level security policies enforce per-user data isolation at the database layer (not trusting client code).
- Real SQL + migrations — a well-known, well-tooled universe, unlike NoSQL query languages.
- Supabase Realtime is built on Postgres changefeeds; no separate pubsub infrastructure needed.
- Generated types from the DB schema give end-to-end type safety.

**Vanilla CSS preserved:**
- Current CSS (especially in the refaced rooms) is already well-factored with CSS variables per room.
- Changing styling systems mid-migration is gratuitous risk.
- CSS Modules can be added later if components need scoped styles; Vite supports it natively.

**Sentry + Posthog over alternatives (Datadog, New Relic, LogRocket, etc.):**
- Sentry is the standard for JS error tracking. Cheap, well-integrated with every framework.
- Posthog combines product analytics + feature flags + session replay in one tool. No need to stitch three vendors.
- Both have free tiers sufficient for pre-beta; scale-cost is predictable.

**GitHub Actions over GitLab CI / CircleCI / other:**
- Repo is on GitHub (implied by canon references to `fastcoempany/antaeus-gtm-os`).
- No separate CI vendor to onboard.
- Cloudflare Pages has official GitHub integration.

### 2.2 Summary of what the stack delivers against each trajectory goal

| Trajectory goal | Primary mechanism |
|---|---|
| Nothing ever breaks | TypeScript strict mode + Vitest unit tests + Playwright E2E + Sentry error tracking + CI test gates + feature flags for safe rollout |
| Smooth updates | Preact's diffing reconciler + feature-flagged deploys + service workers (Phase 4+) |
| Expertly wired | TypeScript contracts on component props, DB types generated from schema, ADRs documenting every architectural choice |
| Beautiful UX | Stable DOM across renders enables real transitions, animated states, preserved focus, intact scroll position |
| Secure backend | Supabase Postgres row-level-security policies enforced at DB layer; Sentry catches runtime errors; CI prevents regressions |
| 100K+ concurrent users | Cloudflare CDN (static assets) + Supabase Postgres (proven at this scale) + Preact's small bundle + code splitting via Vite |

<!-- END_OF_DRAFT -->
