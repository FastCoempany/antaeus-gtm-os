# ADR-001 — Foundation Stack Migration

- **Status:** APPROVED
- **Date drafted:** 2026-04-21
- **Date approved:** 2026-04-21
- **Authors:** Claude (Anthropic) with Founder direction
- **Approvers:** Founder (signed §11 on 2026-04-21)
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
- Eventually supporting ~2,500 concurrent users comfortably, with room to scale further without re-architecting
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
- **Mobile responsive design.** The product is explicitly desktop-only. Antaeus is a deep operating tool, not a quick-glance mobile app. Any existing mobile CSS breakpoints or responsive rules that add build complexity, debugging cost, or maintenance overhead during migration may be deleted without further approval. A distinct mobile experience (a lite-view or similar) may be considered separately in a future ADR; it is not part of this foundation migration.
- **Internationalization / i18n.** Out of scope.
- **Mobile-native apps (iOS/Android).** Out of scope. Web remains the target.
- **Going SPA (single-page routing).** Deferred. Each room stays its own HTML entry point.
- **Replacing Playwright with another E2E tool.** Playwright is already set up and working.
- **Replacing the CSS system.** Vanilla CSS + variables stays.

If any of the above becomes desirable later, it gets its own ADR.

---

## 6. Implementation plan

Five phases, each with explicit tasks, gates, acceptance criteria, and rollback points. A phase does not begin until the previous phase's gate is passed.

### Phase 0 — ADR approval

**Purpose:** Founder reviews this document and formally approves or requests revisions.

**Tasks:**
- Founder reads ADR in full
- Founder resolves any open questions (see §9)
- Founder marks status DRAFT → APPROVED in this doc
- Canon (`CLAUDE.md`) Part V §2 updated to reference `deliverables/adr/` as a new canonical-doc location

**Gate before Phase 1 begins:** ADR status = APPROVED, committed to git.

**Rollback:** Trivial — delete the ADR, return to status quo. No code has changed.

---

### Phase 1 — Foundation setup (estimated 3–4 weeks)

**Purpose:** Install the stack alongside the existing static app without disturbing any running room. Every existing room continues to work unchanged throughout this phase.

**Subphase 1.1 — Build tooling (est. 2–4 days)**

Tasks:
- Install Vite + TypeScript + Preact as dev dependencies. Configure `vite.config.ts`, `tsconfig.json`, `package.json` scripts.
- Configure Vite for multi-page mode: each `app/<room>/index.html` stays a separate entry point; Vite bundles its JS module.
- Set up `src/` directory for new TS/TSX code. Old JS files in `js/` remain untouched.
- Set up `src/lib/` for shared utilities.
- Ensure `npm run build` produces a `dist/` folder that matches the current Cloudflare Pages expectation.
- Update `wrangler.jsonc` if needed so the deploy pipeline consumes `dist/` output instead of the repo root.

Gate:
- Running `npm run build` succeeds.
- Running `npm run dev` serves the app locally with HMR.
- Visiting any existing room in dev mode renders exactly as it does today (no regressions).
- Cloudflare Pages preview deploy succeeds against a test branch.

**Subphase 1.2 — Testing infrastructure (est. 2–3 days)**

Tasks:
- Install Vitest + @testing-library/preact. Configure `vitest.config.ts`.
- Carry over existing Playwright setup (`tools/qa/`) — already working as of Wave 4 session.
- Write a canonical template test file that future tests can copy.
- Wire `npm test` → Vitest unit + component. `npm run e2e` → Playwright.

Gate:
- `npm test` runs successfully (even if there are zero real tests yet).
- `npm run e2e` runs the existing capture-demo-room.js against a single room and passes.

**Subphase 1.3 — CI/CD (est. 2–3 days)**

Tasks:
- Set up `.github/workflows/ci.yml`: on PR, run type check + unit tests + E2E tests + build.
- Set up `.github/workflows/deploy.yml`: on merge to `main`, build and deploy to Cloudflare Pages production. Block deploy if CI failed.
- Set up PR preview deploys via Cloudflare Pages' GitHub integration.
- Set required status checks on `main` branch.

Gate:
- A trial PR triggers CI and shows type check, unit tests, E2E tests passing/failing correctly.
- Merging a trial PR to a test branch triggers a preview deploy at a known URL.

**Subphase 1.4 — Observability (est. 1–2 days)**

Tasks:
- Create Sentry project. Add Sentry Browser SDK to the existing shell (loaded via `<script>` tag for now; will be bundled properly in migrated rooms).
- Create Posthog project. Add Posthog JS SDK via the same pattern.
- Configure both with environment-based DSNs (dev vs. prod).
- Verify test error triggers a Sentry event.
- Verify a test `posthog.capture` shows up in the Posthog dashboard.

Gate:
- A test error in production reaches Sentry within seconds.
- A test event reaches Posthog.

**Subphase 1.5 — Canon + ADR maintenance rhythm (est. 1 day)**

Tasks:
- Update `CLAUDE.md` Part V to reflect new stack availability, new working conventions, new test/deploy commands.
- Add a new `deliverables/adr/README.md` documenting the ADR process (when to write one, template, approval flow).
- Establish: any PR touching `src/` or migration-phase rooms references which phase + ADR it serves.

Gate:
- Canon is updated.
- ADR README is in place.
- A dry-run "would a new session reading this understand the stack in 10 minutes" passes.

**Overall Phase 1 gate (must all be true to start Phase 2):**
- All four subphases green.
- No existing room regressed (verified by running the existing Playwright capture script against all rooms — identical screenshots before and after).
- Founder has reviewed and approved the Phase 1 closeout.

**Phase 1 rollback:** Foundation coexists with the old app; removing `src/`, `vite.config.ts`, `tsconfig.json`, and `package.json` build scripts returns the app to its pre-Phase-1 state. No user-visible change.

---

### Phase 2 — Data architecture + migration (estimated 3–4 weeks)

**Purpose:** Design the Postgres schema, set up row-level security, build a one-way migration from localStorage into the database, add realtime subscriptions, and keep localStorage as offline cache. No rooms migrate to Preact yet — this phase is purely backend.

**Subphase 2.1 — Schema design (est. 4–6 days)**

Tasks:
- Model every sacred noun as a Postgres table: `icps`, `accounts`, `signals`, `motions`, `calls`, `deals`, `proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts`.
- Model cross-noun relations as foreign keys (e.g., `deals.account_id`, `calls.deal_id`, `proofs.deal_id`).
- Model workspace state (`workspaces`, `workspace_members`) to support the future multi-user path without building it yet.
- Write migrations in Supabase's migration format (SQL files in `supabase/migrations/`).
- Generate TypeScript types from the schema using the Supabase CLI. Check generated types into `src/lib/db-types.ts`.
- Write an architecture note explaining how the schema maps to each room's state.

Gate:
- All sacred nouns are tables with correct relationships.
- `supabase db reset` then `supabase db push` applies migrations cleanly to a fresh Supabase project.
- Generated TS types compile and expose every expected field.

**Subphase 2.2 — Row-level security policies (est. 3–5 days)**

Tasks:
- Write RLS policies: every row has `workspace_id`; every policy filters on `auth.uid()` → workspace membership.
- Explicitly test RLS: a second user's queries return zero rows for the first user's workspace. Integration test written.
- Document the policy model in a `supabase/README.md` so the rules are legible, not only expressed as SQL.

Gate:
- RLS integration test confirms isolation.
- Admin service role key is stored only in server-side env (Cloudflare Workers env if needed), never in client bundle.
- No client-side code can escalate privilege.

**Subphase 2.3 — Migration from localStorage to Postgres (est. 5–7 days)**

Tasks:
- Write a one-way migration tool (`src/migration/localstorage-to-supabase.ts`) that reads every known `gtmos_*` key and writes it to the correct table.
- Migration is idempotent: rerunning it produces no duplicate rows. Uses deterministic IDs derived from content when possible, otherwise uses localStorage timestamps as tie-breakers.
- Migration is dry-runnable: a preview mode reports what WOULD be written without writing.
- Migration preserves existing data integrity: every noun that was in localStorage is in Postgres after migration, with no field loss.
- Migration runs client-side on first login post-deploy (behind a feature flag), with explicit user consent via a one-time prompt.
- Failed migrations do not corrupt existing localStorage — source is preserved until server-side confirms success.

Gate:
- Dry-run against a seeded demo workspace lists every noun correctly.
- Live migration against a test workspace completes without data loss.
- Post-migration, the workspace reads from Postgres and matches exactly what localStorage had.
- Rerunning migration produces zero duplicate rows.

**Subphase 2.4 — Realtime subscriptions + offline cache (est. 4–6 days)**

Tasks:
- Build `src/lib/data-client.ts`: a typed client that wraps supabase-js for each noun type.
- Subscribe to Postgres changefeeds per workspace. Cache results in-memory and in localStorage (localStorage now serves as offline / fast-reload cache, not primary).
- Implement optimistic updates: client writes to localStorage + issues server write in parallel; on server confirmation, reconcile; on server failure, roll back and surface error.
- Conflict resolution: last-write-wins at the row level by default; per-field LWW for high-churn fields where needed.
- Implement `useSacredNoun<T>(nounType, id)` Preact hook for rooms (used starting Phase 3).

Gate:
- A change made in Tab A appears in Tab B within 1 second (same browser, same account).
- A change made on Device A appears on Device B within 1 second (different browsers, same account).
- Offline: changes buffered locally, synced on reconnect.
- Optimistic update rollback on server failure is user-visible and non-destructive.

**Overall Phase 2 gate:**
- Schema deployed to production Supabase.
- RLS verified.
- Migration tool ready but NOT yet triggered for real users (behind a feature flag defaulting to off).
- Data client library ready to be consumed by the first migrated room in Phase 3.

**Phase 2 rollback:**
- Migration is feature-flagged off by default. No user has been migrated yet. Rolling back means: flip the flag off, delete the Supabase tables, remove the data client. No user impact.

---

### Phase 3 — Pilot room migration: Discovery Studio (estimated 4–6 weeks)

**Purpose:** Rebuild Discovery Studio on the new stack end-to-end as the first full exercise of the foundation. Discovery Studio is chosen as pilot because (a) it has the most in-session context loaded from Waves 1–4; (b) it already has the richest per-room doctrine (five guardian specs); (c) it's where facial + brittleness debt compound most; and (d) it has enough real complexity (21 runtime primitives, 10-segment spine, 9 frameworks) to exercise every stack capability.

**Subphase 3.1 — Component architecture (est. 4–6 days)**

Tasks:
- Author `src/components/DiscoveryStudio/` directory with one Preact component per runtime primitive or UI zone. Structure roughly:
  - `DiscoveryStudio.tsx` (root)
  - `FrameworkRail.tsx`, `SegmentStrip.tsx`, `QuickRow.tsx`
  - `Phase.tsx` (segment container), `Node.tsx`, `Branch.tsx`
  - `LedgerStrip.tsx`, `NextStepDocket.tsx`, `Dossier.tsx`
  - `Dock.tsx` with `RecoverPane.tsx`, `ContextPane.tsx`, `RoutesPane.tsx`
- Each component's props are TypeScript-typed. Props correspond to primitive names from the runtime wiring sheet (`activeFramework`, `activeNode`, `learnedFacts`, etc.).
- State lives in a single top-level `useDiscoveryStudio()` hook that reads from the data client (Phase 2) and exposes action creators for each user intent (`setFramework`, `openSegment`, `toggleBranch`, `markWorked`, etc.).

Gate:
- TypeScript compiles with strict mode, zero `any`, zero suppression comments.
- Every visible element maps to a primitive (the "does this earn its place" test from canon Part IV §5 enforced structurally by the component tree).

**Subphase 3.2 — Data-layer wiring (est. 3–5 days)**

Tasks:
- Discovery Studio reads/writes `learnedFacts`, `nextStep`, `checkedNodes`, `openSegment`, `activeFramework`, `dossierOpen` via the Phase 2 data client.
- Realtime subscription: if another tab or another user edits the same call-in-progress, changes propagate.
- Optimistic updates: branch-click writes to state instantly; server sync happens in background.
- Offline-tolerant: works fully offline, syncs when connection resumes.

Gate:
- Playwright E2E test: open two tabs, click a branch in Tab A, verify the fact appears in Tab B's ledger strip within 1 second.
- Playwright E2E: take Tab A offline, make changes, bring Tab A online, verify sync.

**Subphase 3.3 — Test coverage (est. 3–5 days)**

Tasks:
- Unit tests per component (Vitest + @testing-library/preact): each component renders correctly given props, responds to simulated user events correctly.
- Integration tests for the data-client bindings.
- E2E tests (Playwright) for the critical user journeys: open call → select framework → navigate segment → branch a response → lock next step → hand off to Deal Workspace.
- Visual regression baseline: capture screenshots of key states; CI fails if pixels drift beyond a threshold.

Gate:
- Unit + component test coverage on Discovery Studio code ≥ 85%.
- All seven contract-required rails (framework, segment, recover, learned, worked, next-step docket, support dossier) have at least one E2E test verifying them.
- Visual regression baseline locked.

**Subphase 3.4 — Feature-flag rollout (est. 2–4 days)**

Tasks:
- Wire Posthog feature flag `discovery_studio_preact`. Default: false (users get the old room).
- When flag is on, the Discovery Studio entry point renders the Preact version instead of loading `discovery-studio-segment-jump-room.js`.
- Both old and new rooms coexist in the repo during this window; no file deletion yet.
- Enable flag for internal users (founder + any test accounts) first.
- Monitor Sentry for new-room errors; monitor Posthog for interaction funnels.

Gate:
- New room runs error-free in Sentry for 7 consecutive days with internal users active.
- Interaction funnels in Posthog match or exceed the old room's (no usability regression).
- Founder signs off on the visual + behavioral parity.

**Subphase 3.5 — General rollout (est. 1–3 days)**

Tasks:
- Enable flag for 10% of users.
- Monitor for 48 hours: error rate ≤ existing baseline, session completion rates unchanged or better.
- Enable flag for 50% of users.
- Monitor for 48 hours.
- Enable flag for 100% of users.
- Monitor for 7 days.

Gate:
- 100% rollout stable for 7 days.
- No Sentry regressions.
- No Posthog funnel regressions.
- Founder approves moving to Phase 4.

**Subphase 3.6 — Cleanup (est. 1–2 days)**

Tasks:
- Delete `js/discovery-studio-segment-jump-room.js`, `js/discovery-segment-runtime*.js`, `app/discovery-studio/index.html` (replaced by Vite-generated entry).
- Remove the feature flag (new room is permanent).
- Update canon Part V §1 "refacing status" to reflect that Discovery Studio is now on the new stack.
- Add a post-mortem note: what surprised us, what we'd do differently for the next room.

Gate:
- Old code removed, repo is clean.
- Canon reflects new state.
- Post-mortem captured.

**Overall Phase 3 gate:**
- Discovery Studio running 100% on new stack for 7 days.
- No open critical Sentry issues.
- Test coverage targets met.
- Post-mortem written.
- Founder approves continuing to Phase 4.

**Phase 3 rollback:** Flip the feature flag off. Users return to the old room immediately. The migration tool (Phase 2) can be reversed if any data corruption occurred (localStorage was preserved until sync confirmed).

---

### Phase 4 — Progressive room migration (estimated 3–6 months)

**Purpose:** Migrate every remaining dynamic room to the new stack, one at a time, using the Phase 3 pilot as the template. Each room follows the same subphases (architecture → data wiring → tests → feature flag → gradual rollout → cleanup).

**Migration order** (priority-weighted):

1. **Deal Workspace** — second brittleness-debt P1 room; highest user value after Discovery Studio; good stress-test of the data layer since deals relate to many other nouns.
2. **Dashboard** — ranking layer; already refaced but the command-intelligence logic benefits most from type safety and real-time updates.
3. **Signal Console** — named premium asset; heaviest account-list rendering; realtime payoff is immediate ("new signal just landed" live updates).
4. **Future Autopsy** — named premium asset; recently cleaned of inline handlers (`59aef90`), now ready for the full migration.
5. **PoC Framework** — split-stage hybrid; good test of complex layouts under Preact.
6. **Outbound Studio** — motion craft; benefits from typed message templates.
7. **Cold Call Studio** — live call execution; similar to Discovery Studio in interaction density.
8. **LinkedIn Playbook** — channel-specific logic; simpler migration.
9. **Advisor Deploy** — unique desktop metaphor; worth auditing whether the rolodex metaphor holds up under Preact's stable DOM.
10. **Call Planner (`discovery-agenda/`)** — feeds Discovery Studio; simpler migration.
11. **Territory Architect** — strategic shaping; form-heavy, good test of controlled inputs under Preact.
12. **Sourcing Workbench** — ticket-board metaphor; simpler.
13. **ICP Studio** — already has unsaved-guard wired; simpler migration because strict form behavior is well-scoped.
14. **Readiness Score** — System Ledger, dark room; test of dark-surface components.
15. **Quota Workback** — System Ledger; similar to Readiness.
16. **Founding GTM / Handoff Kit** — System Ledger; export-heavy logic that benefits from typed output contracts.
17. **Welcome** — Threshold room; simpler.
18. **Onboarding** — Threshold room; also enables finally auditing onboarding, which has been blocked by the demo-seed bootstrap gate.
19. **Settings** — Trust Annex; mostly static, minimal migration.

**Per-room estimated cost** (after Phase 3 pilot, velocity should accelerate):
- Rooms 1–3 (Deal Workspace, Dashboard, Signal Console): ~3–4 weeks each. Complex, touch many primitives.
- Rooms 4–9: ~2–3 weeks each.
- Rooms 10–19: ~1–2 weeks each.

**Per-room gate:**
Same as Phase 3 — unit + component + E2E tests pass, visual regression baseline intact, feature flag stable in production for 7 days at 100% rollout, founder approves.

**Phase 4 overall gate:**
- All 19 rooms migrated and stable.
- Old `/app/<room>/index.html` files and old JS `js/<room>-*.js` runtime files deleted.
- Single unified build pipeline in Vite.
- Canon Part V §1 reflects final state.

**Phase 4 rollback per room:** Each room has its own feature flag. Flip off, users return to old room (as long as old room's code has not been deleted — hence the "cleanup" subphase runs only after 7 stable days at 100% rollout).

---

### Phase 5 — Static pages polish + ongoing (open-ended)

**Purpose:** Once dynamic rooms are migrated, polish the remaining static surfaces (landing, auth, legal) with whatever shared Preact components make sense, without sacrificing SEO or first-paint speed.

**Tasks:**
- Audit which static pages share visual chrome (logo, footer, auth-form styling). Extract shared CSS into reusable patterns (no Preact needed).
- For the marketing landing page specifically, consider whether any interactive element (a countdown, A/B-tested hero copy, a demo-triggering CTA) warrants Preact. If yes, add it as a small island — the rest of the page stays static HTML.
- Add prerendering via Vite's SSG capabilities if a public page ever has Preact-rendered content that needs SEO.
- Continue adding new features as Preact components by default. New rooms never get built on the old stack.

**No hard gate.** Phase 5 is ongoing steady-state, not a discrete project.

---

## 7. Acceptance criteria + success metrics

The migration is considered successful when all of the following are true:

**Functional correctness:**
- Every room on new stack renders the same visible output it rendered on the old stack (visual regression baselines pass within tolerance).
- Every sacred noun read/write operation produces identical results across old and new implementations (data migration correctness verified).
- No user-reported data loss during migration (target: zero reports).

**Performance:**
- First paint time on typical room ≤ current baseline (measured via Lighthouse + Posthog web vitals).
- Time to interactive ≤ 2 seconds on 3G emulation for any room.
- Interaction response (click → visible state change) ≤ 100ms for 95th percentile actions.
- Memory footprint per tab ≤ current baseline + 20% (allowance for Preact + Sentry + Posthog runtime).

**Reliability:**
- Sentry unhandled-error rate ≤ 0.1% of sessions (target: lower than current; we cannot measure current because there's no Sentry today, but we set this target for post-migration).
- CI test pass rate ≥ 99% on `main` branch.
- Deploy rollback time (flag flip) ≤ 60 seconds.

**Developer experience:**
- Time from "fresh clone" to "running locally" ≤ 10 minutes for a new contributor.
- Time to add a new CRUD operation on an existing noun ≤ 2 hours for an engineer familiar with the stack.
- Time to write + pass a Preact component test ≤ 30 minutes for an engineer familiar with the stack.

**Security:**
- RLS-isolation verified: no session can read another workspace's rows under any tested attack path.
- No secrets in client bundle (verified by CI linting).
- CSP headers on all room responses.

**Canon alignment:**
- Every room's visible output still passes the canon's four-pass judgment (mind / behavior / face / rubric) per Part IV §2.
- No sacred noun was redefined during migration.
- All compounding flows (Part I §6) still work end-to-end.

---

## 8. Rollback / unwind protocol

The migration is designed to be reversible at every phase. Specifically:

**Phase 0–1 rollback:** Trivial. Delete new files, no user impact.

**Phase 2 rollback (before any room consumes the data layer):** Trivial. Disable migration flag, delete Supabase tables, remove data-client library.

**Phase 2 rollback (after some rooms are migrated):** Destructive if rooms depend on Postgres data that no longer exists in localStorage. Mitigation:
- Every migration run preserves localStorage as the source of truth until server sync confirms.
- A reverse-migration tool (`src/migration/supabase-to-localstorage.ts`) is built and tested in Phase 2 specifically as an unwind path, even though we don't expect to use it.

**Phase 3+ rollback (per room):** Flag flip. ≤ 60 seconds. Old room code is preserved in the repo until 7-day-stable gate passes.

**Total unwind:** If the entire migration needs to be abandoned (extreme scenario), the old room files are deleted only after 7 days of stable 100% rollout per room, so at any mid-migration point, the unmigrated rooms are still in place. Migrated rooms can be rolled back individually via their feature flags.

**Safety net:** Every commit that migrates or removes production code must reference this ADR in its commit message. A future session reviewing an unfamiliar change can trace back to this plan.

---

## 9. Open questions — resolved 2026-04-21

Each question is paired with the founder's answer as given on 2026-04-21. This section is preserved as a historical record; future ADRs should reference the founder answer here rather than re-litigate.

1. **Multi-workspace support.** Should the schema model a user belonging to multiple workspaces (team feature) from day one, or should we start single-workspace-per-user and evolve?
   - **Founder answer:** Yes — model multi-workspace from day one to avoid expensive retrofit later. Schema includes `workspaces` and `workspace_members` tables from Phase 2 Subphase 2.1. UI remains single-workspace-per-user for now; the data model supports expansion without migration.

2. **Staging environment.** Do we spin up a separate Supabase project for staging/preview deploys, or use branching within one project?
   - **Founder answer:** Separate Supabase project for staging/preview. Cleaner isolation. Phase 1 Subphase 1.3 provisions both.

3. **Sentry + Posthog costs at scale.** What scale are we budgeting for?
   - **Founder answer:** Target is ~2,500 concurrent users comfortably, not 100K. Free-tier Sentry and Posthog are likely sufficient for that range; paid plans only if we approach their limits. Budget proportionate to that target.

4. **PR review process.** Founder approval per PR during migration, or auto-merge for routine changes after CI passes?
   - **Founder answer:** Founder approval required during migration phases. Routine auto-merge permitted after migration is complete and the new stack is stable.

5. **Mobile breakpoints.** Stay desktop-first, or target mobile/tablet explicitly?
   - **Founder answer:** 100% desktop-focused. Anything mobile-related that lags the build should be deleted during migration. A distinct mobile experience (a lite-view or similar) may come later as a separate product. See §5 (non-goals) for the hard constraint.

6. **Deferred: SPA routing.** Worth revisiting post-Phase 4?
   - **Founder answer:** Deferring is acceptable only if retrofitting SPA routing later is not a headache vs. doing it now.
   - **Claude's honest read for the record:** Deferring is not a headache later. Each room is already being built as a clean Preact component tree during Phase 3–4. Moving from multi-page to SPA is a top-level bootstrap change (what renders where, how routing intercepts navigation) and touches no room-internal code. The real prerequisite for SPA is having clean components — which Phases 1–3 build. Retrofitting SPA onto unclean components would be painful; retrofitting onto clean components is straightforward. Therefore: deferring is the correct call. A future ADR can introduce SPA routing once Phase 4 is substantially done.

7. **Deferred: real SSR.** Worth revisiting if SEO becomes a competitive need?
   - **Founder answer:** Deferring accepted, but SEO-competitive public pages are a real requirement.
   - **Plan to honor this:** Public pages (landing, privacy, auth) remain plain HTML, which is already the most SEO-competitive posture possible — content is pre-rendered and indexable without any JS. Phase 5 polishes these pages. If at any point a public page needs dynamic content that affects indexing, Vite supports static site generation (SSG) via plugins that pre-render at build time (different from live SSR, which is what was deferred). SSG is viable without a new ADR; full live SSR for authenticated rooms stays deferred.

---

## 10. Canonical references + canon updates

This ADR becomes part of the canon hierarchy. Specifically:

- **Authority order** (from `CLAUDE.md` Part V §2) is updated to include ADRs right after the bible:
  1. `CLAUDE.md` (operating canon)
  2. `deliverables/design-principle-strict-bible/` (deeper authority)
  3. **`deliverables/adr/` (architectural decisions, in order)** ← NEW
  4. `deliverables/plans/` (implementation specs)
  5. `deliverables/prototypes/wireframes/` (triptych archive)

- **`CLAUDE.md` Part V §2** will be edited to add the `deliverables/adr/` location, pointing specifically to this ADR as the first entry.

- **`CLAUDE.md` will get a new Part II.5** (Component + Data Architecture) summarizing the stack decisions from this ADR at the canon level, with a forward-reference to the ADR for rationale + full detail.

- **`CLAUDE.md` Part V §6 (session log)** will get an entry: *"2026-04-21 — ADR-001 Foundation stack migration approved. Stack commits to Preact + TS + Vite + Supabase (extended) + Vitest/Playwright + Sentry + Posthog + GitHub Actions CI. 5-phase implementation plan, 3–6 month horizon. No mind changes; all canon Parts I–IV preserved."*

- This ADR's **status field** will flip from DRAFT to APPROVED only after founder sign-off. The date of approval will be captured in the frontispiece.

---

## 11. Founder approval block

- [x] I have read this ADR in full.
- [x] I have resolved the open questions in §9 (or accepted Claude's recommendations where not otherwise specified).
- [x] I approve the stack choices in §2.
- [x] I approve the 5-phase implementation plan in §6.
- [x] I approve the rollback/unwind protocol in §8.
- [x] I approve updating `CLAUDE.md` per §10.

**Approved by:** Founder
**Date of approval:** 2026-04-21
**Notes / conditions:**
- Scale target is ~2,500 concurrent users initially (not 100K as earlier drafts assumed).
- Desktop-only. Mobile responsive CSS may be deleted during migration if it costs anything.
- SPA routing deferred with Claude's assessment that retrofit is not a headache later.
- SEO competitiveness is a real requirement; public pages stay static HTML; SSG available via Vite without a new ADR if needed.
