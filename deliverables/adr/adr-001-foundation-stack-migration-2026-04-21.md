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

---

## 3. Alternatives considered

Each alternative is documented here so future sessions know what was weighed and why it was rejected. A future ADR can reopen any of these if circumstances change.

### 3.1 Tagged template literal helper (our earlier "Option A")

- **What it is:** A ~30-line `html\`\`` helper in plain JS that auto-escapes interpolated values. Uses `innerHTML` at the end.
- **Why rejected:** Solves only the escape-maintenance dimension of the brittleness audit. Does not solve focus loss, scroll preservation, fine-grained reactive updates, animated transitions, testability of fragments, or component boundaries. The founder trajectory requires all seven; Option A delivers one. Rejected as tactically correct but strategically insufficient.

### 3.2 Custom DOM builder (our earlier narrowly-framed "Option B")

- **What it is:** A custom `el(tag, props, children)` helper that builds real DOM instead of strings.
- **Why rejected:** Same as Option A but with safer construction. Still does not solve diffing-dependent concerns (focus, scroll, fine-grained updates). Inadequate for trajectory.

### 3.3 Custom VDOM / reactive runtime from scratch

- **What it is:** A custom-built reconciler, diff algorithm, hooks implementation, and reactivity system, all authored in-house.
- **Why rejected:** Estimated 2–4 weeks of framework construction before any room migrates. Ongoing maintenance burden in perpetuity. Debugging burden in perpetuity. High bug-surface in the diffing algorithm itself. Most custom VDOMs end up reinventing Preact or Lit badly. Staff this only if: (a) no viable library exists, or (b) the product requires something fundamentally unlike any library. Neither is true here. The founder's mandate for resilience argues *for* a battle-tested library, not *for* custom code.

### 3.4 Lit (component framework)

- **What it is:** Google-maintained web-standards library using Custom Elements + template literals. 5–6 KB. No build step strictly required.
- **Why Preact won instead:**
  - Preact has a materially larger ecosystem (React-compatible). Any engineer or AI assistant who has worked with React can contribute to Preact immediately; Lit requires learning its specific lifecycle and directives.
  - Preact's type support via TypeScript is more mature (JSX types + Preact types are first-class).
  - Preact with Vite gives us HMR and a first-class dev experience with minimal setup.
  - Lit's Shadow DOM scoping is a strength but also introduces complexity (slots, shadow styles, light vs. shadow DOM semantics) that isn't necessary for our rendering needs.
- **Preserved as fallback:** If Preact proves inadequate for a specific use case (e.g., we need strong Shadow DOM isolation for third-party embeds), a future ADR can introduce Lit alongside or as a replacement. For the foreseeable future, Preact is primary.

### 3.5 React (full, not Preact)

- **What it is:** The industry-standard component library. ~45 KB gzipped.
- **Why rejected:** 15× the size of Preact with no capability advantage for our use case. At 100K users, the bundle-size difference materially affects first-paint latency. Preact's API compatibility means React's ecosystem is mostly available anyway.

### 3.6 Vue / Svelte / SolidJS

- **What it is:** Alternative component frameworks with their own programming models.
- **Why rejected:** All viable, but none offer a compelling reason to pick them over Preact given our constraints:
  - **Vue:** Large, well-maintained, but its Single-File-Component pattern adds complexity without unlocking capability we need.
  - **Svelte:** Compile-to-vanilla approach is elegant but puts more weight on the build toolchain; SvelteKit is opinionated about routing/SSR in ways that don't match our room-based architecture.
  - **SolidJS:** Fine-grained reactivity is appealing but the ecosystem is smaller; harder to onboard new engineers or AI sessions. Worth revisiting in a future ADR if we find ourselves fighting Preact's rendering model.

### 3.7 Firebase instead of Supabase

- **What it is:** Google's real-time database + auth + storage offering.
- **Why rejected:** We already use Supabase for auth; introducing Firebase would be a second vendor relationship. Firebase's NoSQL model (Firestore) has weaker query semantics than Postgres for the relational data we actually have (accounts → deals → calls → proofs → handoffs). Supabase Postgres + Realtime gives us SQL + type safety + realtime in one stack.

### 3.8 No build step (staying fully static)

- **What it is:** Keep serving hand-authored HTML + JS, no Vite, no TypeScript.
- **Why rejected:** The build step is not the goal — it's the enabling condition for TypeScript type checking, Preact + JSX, tree-shaking, and automated testing that actually run against bundled code. Without a build step, all of those become harder or impossible. The "static, no-build" philosophy was pragmatic for early-stage simplicity; for the founder's stated trajectory it becomes a limiting constraint. This ADR trades away that constraint deliberately.

### 3.9 SPA (single-page app) routing

- **What it is:** Collapse all HTML files into one `index.html` and handle routing via client-side JS (React Router, Preact Router, etc.).
- **Why rejected (for now):** Each room being its own HTML file has real benefits: independent bundle per room (code splitting at the page level is free), better SEO on public pages, simpler mental model. SPA routing may be revisited in a future ADR if cross-room transitions need to feel instantaneous, but it is out of scope for this foundation migration.

### 3.10 Status quo + escape audit + inline-handler cleanup

- **What it is:** Keep the current stack; manually audit every `innerHTML` interpolation for correct escaping; convert inline `onclick` to data-attribute delegation (already underway for Future Autopsy).
- **Why rejected:** Addresses only the brittleness audit findings, not the broader trajectory. The user explicitly rejected this level of ambition in favor of a real rebuild.

---

## 4. Consequences

### 4.1 Positive

- **Type safety end-to-end.** Database column types flow through to component props. A renamed column breaks the build, not production.
- **Focus preservation, scroll preservation, animated transitions, fine-grained updates** — all unlocked by Preact's reconciler replacing innerHTML swaps.
- **Real-time data.** A deal edit in one tab appears in another tab (or another user's view) live via Supabase Realtime subscriptions. No polling, no manual refresh.
- **Multi-device sync.** User's workspace is authoritative in Postgres, not trapped in one browser's localStorage.
- **Scale.** Cloudflare CDN handles static assets at any scale. Supabase Postgres handles data at any realistic scale for a B2B SaaS product.
- **Observability.** Every error is captured in Sentry. Every meaningful user action is tracked in Posthog. CI logs every build.
- **Velocity after foundation phase.** Each new room costs a fraction of the time, ships with type safety + tests + error tracking by default.
- **Team-readiness.** Any engineer fluent in React/TypeScript (or an AI assistant) can onboard in a day. No bespoke in-house framework to learn.
- **Testability.** Components test in isolation. Behaviors assert against real DOM. CI catches regressions automatically.
- **Data safety.** Row-level security policies enforce per-user isolation at the database layer. A client-side bug cannot leak another user's data.
- **Feature flags.** Every rollout is toggleable. If something misbehaves in production, we disable the flag and users are back on the old path within seconds.

### 4.2 Negative

- **Foundation-first cost.** 3–4 weeks of user-invisible work before the first room benefits visibly. Feels like going backwards.
- **Hybrid architecture during migration.** Old rooms and new rooms coexist for months. Some patterns will need to work in both. Cognitive overhead during this period is real.
- **Runtime dependencies introduced.** Preact, Supabase Realtime, possibly vendored copies of a few other libs. Breaking changes in these dependencies become our problem.
- **Build step added.** Deploys now go through `npm run build` before hitting Cloudflare Pages. Build can fail; build tooling can have bugs.
- **Learning curve for the founder (if any).** Preact/TypeScript are not new to the industry, but if the founder prefers to read production code, reading TSX is different from reading plain JS.
- **Bundle size increase.** The foundation libraries are small individually (Preact 3 KB, Sentry ~15 KB, Posthog ~15 KB) but they add up. Mitigated by tree-shaking and lazy loading of room-specific code.

### 4.3 Neutral

- **CSS stays the same.** No new styling system to learn.
- **Cloudflare Pages stays the same.** Deploy target doesn't change.
- **Supabase stays the same for auth.** Extended for data but the vendor relationship is unchanged.
- **The canon stays the same.** Mind, face, behavior docs are orthogonal to the stack.

### 4.4 Risks

- **Migration stalls mid-way.** Hybrid state becomes the permanent state. Mitigation: visible progress tracking in the canon, enforced room-by-room schedule, no new rooms allowed on the old stack once a room has been migrated successfully.
- **Team velocity dip during foundation phase.** Mitigation: founder has approved 3–4 weeks of foundation work explicitly; this is not unexpected.
- **Framework-learning bugs.** First few Preact rooms may have subtle rendering issues not caught by tests. Mitigation: feature flags + staged rollouts limit blast radius.
- **Database schema design gets it wrong the first time.** Migrations will be needed. Mitigation: Supabase handles migrations cleanly; we accept that schema v1 will evolve.
- **Vendor risk.** Supabase, Preact, Sentry, Posthog, Vite, Cloudflare — any could have a bad week. Mitigation: none is irreplaceable, all have credible open-source or alternative-vendor paths if needed. We don't build on any one vendor's proprietary lock-in.

---

## 5. Non-goals

To prevent scope creep, this ADR explicitly does NOT include:

- **Rebuilding marketing/auth/legal static pages as Preact components.** These stay as plain HTML for SEO, speed, and robustness. Shared chrome across them can be lifted into small components later if worth it, but not as part of this foundation migration.
- **Switching auth providers.** Supabase auth stays.
- **Switching hosts.** Cloudflare Pages stays.
- **Redesigning the mind.** Canon Parts I–IV are untouched. The room purposes, sacred nouns, compounding rules, facial architecture, and behavioral doctrine are not being changed — only the tools we use to implement them.
- **Adding a new pricing tier, entitlement system, or billing integration.** Out of scope.
- **Building server-side rendering (SSR) for rooms.** Rooms render client-side; only public pages may get prerendered at build time if beneficial for SEO. Full SSR for authenticated rooms is explicitly deferred to a future ADR.
- **Internationalization / i18n.** Out of scope.
- **Mobile-native apps (iOS/Android).** Out of scope. Web remains the target.
- **Going SPA (single-page routing).** Deferred. Each room stays its own HTML entry point.
- **Replacing Playwright with another E2E tool.** Playwright is already set up and working.
- **Replacing the CSS system.** Vanilla CSS + variables stays.

If any of the above becomes desirable later, it gets its own ADR.

<!-- END_OF_DRAFT -->
