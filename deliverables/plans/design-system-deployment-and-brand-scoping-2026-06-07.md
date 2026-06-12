# Antaeus — Deployment & Brand Identity Scoping

**Status:** DECIDED — all seven Part IX decisions answered by the founder 2026-06-08. This document is now the decision record and execution plan.
**Date:** 2026-06-07.
**Author:** Claude, working session with the founder (mrcoe7@gmail.com).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Scope:** Scopes the work between *"the design system specs are written"* and *"the Dashboard build can start." It covers five pieces of work the founder named: brand identity, full lexicon enforcement, full iconography production, a deployment system for the design system as a whole, and versioning — plus the rollout pattern with options, and the dependency sequence that ties everything together. This is a plan, not a build; founder reads it, picks the open decisions, and then the building starts.

---

## 0. Why this exists

The design system has ten siblings (`00`–`09` plus the README front door) and three rendered mockups. What it does **not** have is a way to reach the running product. Specs are prose; mockups are HTML; production rooms are Preact + TypeScript + CSS. The bridge between the two is unbuilt. The lexicon's banned-vocabulary list and the readable spec are not synced. The validator the voice spec describes only exists in part (the Briefing's `validateObservation()`). The icon set is 46 inline SVGs in a mockup, not a `<Icon>` component anywhere. Tokens are CSS at the top of mockups, not consumed by any room. None of this is in CI.

At the same time, brand identity has not been done in the current pass. The charter locked the operator-facing face direction (bright field, the three-font stack, orange as the rationed accent), and the older brand bible at `deliverables/design-principle-strict-bible/02-brand-and-visual-system/` carries foundational material. But the *current* brand identity work — logo, wordmark, brand colors as brand, brand voice as a register distinct from product voice, marketing visual system, brand typography across all surfaces — has not been done. The design system has been treating the face direction as the brand, which is correct but incomplete.

The founder direction is clear: scope all of this thoroughly before any Dashboard build begins. This document is the scope.

---

## Part I — What needs to be built, in one map

Six pieces of work, each with its own Part below.

1. **Brand identity** — the visual identity layer the product carries. Logo, wordmark, brand color system, brand voice, brand typography across surfaces, marketing visual system. *Part II.*
2. **Lexicon enforcement** — the strict-everywhere, CI-blocking validator with `banned-vocabulary.ts` and `blessed-labels.ts`. *Part III.*
3. **Iconography production** — drawing the 46 glyphs as real component files, building the `<Icon>` API, hooking the rationed-tick accent system into Preact + Vite. *Part IV.*
4. **The deployment system** — the bridge between specs/mockups and production rooms. Token publishing pipeline, mockup-to-component-to-room flow, spec-change-to-code-change discipline. *Part V.*
5. **Versioning** — the model that lets a room know which version of the design system it targets. *Part VI.*
6. **The rollout pattern** — how the migrated rooms swap from old to new (per-room, per-axis, or feature-flag gradient). Three options, founder picks. *Part VII.*

These are not independent. Brand identity gates iconography (the proprietary style depends on the brand). Lexicon enforcement gates new strings being written safely, including Dashboard's. Versioning gates the rollout pattern's safety. The dependency map is *Part VIII.*

---

## Part II — Brand identity, scoped

### 2.1 What's in

The current brand identity pass covers:

- **The logo and wordmark.** A drawn logomark plus the "Antaeus" wordmark, the lockup that puts them together, the spacing and minimum-size rules, monochrome variants, the dark-on-light and reverse-on-dark versions. The charter's bright field is the primary surface; reverse versions are for occasional dark contexts (marketing slides, social, the start page above the fold). No dark mode in the product.
- **The brand color system.** The product currently uses orange / blue / green / amber / red as *semantic roles* (the one move, intelligence, real health, caution, real risk). Brand identity decides whether these double as the brand palette or whether brand has its own palette, with the semantic palette derived from it. My recommendation: the semantic palette IS the brand palette — the product's orange is the brand's orange — because spending a different orange on a logo than on the one-move accent would split the visual identity. But the brand pass confirms this and adds any *secondary* brand colors (a deep navy beyond the ink token, a cream beyond the warm surface, accents reserved for marketing only).
- **Brand voice as a register.** The product voice is settled (lexicon `07`, voice `01`): peer-operator with B2B sales scars, plain English, declarative, specific. Brand voice — the voice of the marketing site, the landing page, the public-facing copy where Antaeus is talking to *prospects* not *operators* — is a different register. Less peer-direct, more positioning-aware. This pass writes the brand voice spec as a register the validator can also enforce (with different family-temperature rules per `01 §3`).
- **Brand typography across surfaces.** The product is already locked on DM Serif Display + Public Sans + JetBrains Mono. Brand identity confirms this and extends it to marketing surfaces (where headlines may want larger sizes, more dramatic settings) and the logo (which may or may not use the same families). My recommendation: keep the same families to avoid a brand-product split; the system already has the range.
- **The marketing visual system.** Landing page, "why Antaeus" page, auth pages, the start page — the public face. These currently sit at `start.html`, `/why-antaeus/`, auth surfaces, and use the bright-field operator visual language with adjusted copy. Brand identity decides whether marketing surfaces use the *same* visual system as the operator-facing rooms (composition language, components) or a distinct one. My recommendation: same composition language, distinct compositions — marketing surfaces *can* run wider than the 1200px column, *can* use larger display sizes, *can* sit on cream or warm-surface backgrounds, but draw from the same token system and don't introduce a separate visual world.
- **Brand motion.** The motion spec (`08`) governs operator-facing motion — sparse, consequential, decelerating, never playful. Brand identity decides whether marketing surfaces follow the same grammar (recommended) or get a separate, more expressive motion vocabulary for the landing page hero, etc. (only if there is a real need; absence is the safer default).

### 2.2 What's out — already handled or genuinely not in scope

- **The product face direction.** Locked in the charter (Part II §1). Brand identity inherits and confirms, it does not re-decide.
- **The semantic color roles.** Locked across `00`, `03`, `09`. Brand identity confirms; the roles do not change.
- **The product voice.** Locked in `01` and `07`. Brand voice is a separate register.
- **Mobile, tablet, sub-1024 layouts.** Non-goals across the system (`05 §2.1`). Brand identity holds the same line.
- **Sound, haptics.** Non-goals (`08`). Brand identity holds.

### 2.3 What depends on this

- **Iconography production** (Part IV) gates on brand identity confirming the proprietary style (24px grid, 2px keyline, flat terminals, miter joins, the edge-rule signature, the rationed tick). The brand pass either confirms the spec `09` style or pushes back on it; deploying icons before brand confirms means redoing them if brand differs.
- **The marketing visual system** is part of brand identity itself.
- **Brand voice** is a register the validator (Part III) needs to know about to enforce on marketing strings.

### 2.4 Who does the work — the three paths, in tactical detail

This is decision #1 in Part IX and the calendar driver for everything else, so here is each path at the level you can actually choose from.

**Path 1 — Internal (founder + me, no outside hands).**

What it looks like on a Tuesday: I generate logo/wordmark explorations as SVG (I can produce composition, letterform selection from existing typefaces, and lockup geometry — I cannot produce hand-drawn custom letterforms), you react, we iterate in rounds the way we did the component library. Brand color confirmation, the brand voice register, and the marketing visual system run as spec + mockup work, identical in shape to the design-system sessions we have already done.

- **Cost:** $0 beyond the time.
- **Calendar:** ~1–2 weeks for color + voice register + marketing visual system. The logo is the wildcard — an SVG-composition logo can land in days *if* a type-based wordmark with a simple geometric mark satisfies you; it can also burn weeks of rounds and still feel generic, because the thing a strong identity designer brings (drawn letterforms, optical correction, decades of taste about what reads as cheap) is exactly what I lack.
- **Honest risk:** the logo and wordmark come out *fine* but not *distinctive* — competent type-lockup territory, the same way every AI-built product's brand looks. For a product whose whole positioning is "not the same kind of tool," a fine-but-generic mark quietly undercuts the claim at the front door.
- **Choose this if:** you see the brand mark as a placeholder you'll invest in post-revenue, and you want zero calendar drag now.

**Path 2 — External (a brand designer or small studio owns identity end to end).**

What it looks like: you brief them with the charter + the lexicon + the component-library mockup (these are unusually strong brand-brief inputs — most clients show up with a mood board; you'd show up with a locked design system), they come back with mark directions, you pick, they deliver a brand package.

- **Cost bands (2026, US/EU market):** solo identity designer of real quality: **$5–15K** for mark + wordmark + basic guidelines. Small studio: **$15–40K** for the full package (mark, wordmark, color, type, usage guidelines, marketing templates). Name-brand studio: $50K+ — not worth it pre-revenue.
- **Calendar:** 4–8 weeks elapsed for a solo designer; 6–10 for a studio. Your involvement: the brief (a day, mostly assembled from existing docs), 2–3 review rounds (a few hours each), final approval.
- **How to find/vet:** look at portfolios for B2B tools with severe/editorial registers (not consumer-playful work); ask specifically for identity systems where the *product UI* and the brand had to share a visual language; a designer who asks to see the product before quoting is a good sign, one who sends a questionnaire about "brand personality adjectives" is not. I can draft the brief and a shortlist of vetting questions when you're ready.
- **Honest risk:** the wrong hire produces something beautiful that ignores the locked face direction, and you spend the engagement defending the bright field and the three-font stack. Mitigated by the brief making the locked decisions explicitly non-negotiable.
- **Choose this if:** you believe the mark is a durable asset worth real money now, and the 6–10 week calendar is acceptable.

**Path 3 — Hybrid (recommended). External does the mark; internal does everything else.**

The tactical split: a solo identity designer is engaged for **the logomark + wordmark + lockup rules only** ($5–15K band, ~4–6 weeks) while in parallel I build the rest of the brand layer internally — brand color confirmation (§2.1), the brand voice register (§2.7 below), the marketing visual system, and the icon glyph production (§4.4: the icons follow the *design system's* construction spec, which the designer reviews for compatibility with the mark but does not draw).

- **Why this split:** the mark is the one deliverable where external craft genuinely outperforms what we can do internally, and it is also the most *separable* — everything else in the brand layer is spec-and-mockup work in a system we already run well. Paying a studio $30K to also "do" color and voice would buy us re-derivation of decisions the charter already locked.
- **Calendar:** the internal work fills the same 4–6 weeks the designer needs, so the elapsed time is the designer's timeline, not the sum.
- **The one coordination point:** the designer sees the icon construction spec (`09 §1`) early and confirms the mark and the icon style will sit together; if the mark direction pushes on the icon style, that surfaces in week 2, not at delivery.

### 2.5 Deliverables, per path

So "done" is concrete, the brand identity pass — whichever path — must produce:

1. **The mark + wordmark + lockup** (SVG masters, mono + reverse variants, minimum sizes, clearspace rules).
2. **The brand color decision** — confirmation that the semantic palette IS the brand palette, plus any marketing-only secondary colors, written into the charter as an amendment.
3. **The brand voice register** — the spec + exemplars + validator config (§2.7).
4. **The marketing visual system** — a spec + one mockup (the landing page re-skinned) proving the system, same shape as the design-system siblings.
5. **Brand usage guidelines** — one document, lives at `deliverables/design-system/10-brand-2026-*.md` as the tenth sibling once approved.

### 2.6 Effort summary

Internal-only: ~1–2 weeks, weak-mark risk. External-full: $15–40K, 6–10 weeks. **Hybrid: $5–15K, 4–6 weeks elapsed, internal work runs in parallel — recommended.**

### 2.7 The brand voice register, scoped (decision #7)

What it actually means to make brand voice "a register the validator learns," so decision #7 is answerable:

**The work.** The voice system today has seven family temperatures (`01 §3`) — all *operator-facing*, all the peer-operator register. Brand voice adds an eighth configuration: the **visitor register** — how Antaeus speaks to a prospect who has not bought, on the landing page, `/why-antaeus/`, auth pages, and any future marketing surface. Concretely, building it means: (a) writing the register spec — what changes vs. the operator voice (more positioning-aware, can name the category and the enemy, still zero marketing-deck words) and what is invariant (the banned list applies in full; the claim from `01 §2.6` is the anchor); (b) authoring 5 exemplars, same as each family temperature has; (c) adding a `visitor` entry to `family-temperatures.ts` with its own sentence-length and hedging thresholds; (d) tagging the marketing surfaces so the validator applies the visitor register there and the operator registers in-product.

**Effort:** 2–4 days inside the brand identity pass. It is small *because* the validator infrastructure (Part III) carries it — the register is configuration, not a new system.

**The risk of not doing it:** marketing copy gets written with no enforced register, drifts toward the deck-speak the product banned, and the front door ends up sounding like every other AI-built GTM tool while the product inside sounds like Antaeus. The existing landing copy already passed a human Sarah-CRO audit (canon Phase 5), so the floor is decent — but it is human-memory enforcement, which is exactly what the validator exists to replace.

**My recommendation, restated with the scope visible:** yes — build it inside the brand pass, as configuration on the Part III validator.

---

## Part III — Lexicon enforcement, scoped

### 3.1 The validator design

The validator is a function: `validate(string, context) → { ok: boolean, violations: Violation[] }`. Context includes the string's class (label / body prose / authored prose, per `01 §2.1`) and the family-temperature (per `01 §3`). It runs in three places:

- **Build-time** via `npm run voice:check`, which the umbrella `npm run check` invokes alongside `typecheck` and `test`.
- **CI** in `.github/workflows/ci.yml`, blocking the merge on failure. No override path; no warning-and-ship.
- **Synthesis-time**, called by the Briefing's pipeline, the heartbeat's observation generators, and any future LLM output the system produces. This is what `validateObservation()` does today, generalized.

### 3.2 File structure

Under `src/lib/voice/`:

- `banned-vocabulary.ts` — typed array, the source of truth. Spine, earned, verdict, the marketing words, sycophancy patterns, manifesto fragments. Imported by the validator and by the runtime checks.
- `blessed-labels.ts` — typed allowlist for short surface strings the validator should not reject (OK, Yes, No, Cancel, Next, Previous, More, Less, Back, Close, plus the canon §10 state vocabulary).
- `family-temperatures.ts` — the seven family temperature configurations, each with its sentence-length threshold, its allowed register, its example fragments.
- `voice-document.ts` — already exists; the Briefing's structured voice document, extended to cover the broader validator.
- `validator.ts` — the function itself, plus the violation types.
- `validator.test.ts` — comprehensive test cases per `01 §2`.

### 3.3 CI integration

A new step in `.github/workflows/ci.yml` after `typecheck` and before the Playwright suite: `npm run voice:check`. The script walks the diff, identifies operator-facing strings (via a marker function — see §3.5 below), and runs each through `validate()`. A failed validation prints the file path, line number, rejected string, and the specific rule it broke. The build exits non-zero; the PR cannot merge.

### 3.4 Editor and pre-commit integration

Two surfaces beyond CI:

- **Pre-commit hook**, via the existing husky setup or a simple `.git/hooks/pre-commit` script, running the same `voice:check` against staged changes. Fast, catches drift before push.
- **VS Code integration** — deferred. The CLI is enough for v1. If voice drift becomes a frequent failure surface, a language server can be added later.

### 3.5 How the validator finds operator-facing strings

The hardest engineering decision in the build. Three options:

1. **Marker function.** Every operator-facing string is wrapped in a `t()` function (typed marker, no actual i18n behind it — the function is identity). The validator scans for `t("...")` calls and validates each. Pros: explicit, unambiguous, type-safe. Cons: every string in the codebase has to be wrapped; migration is real work.
2. **Static analysis.** The validator parses TSX files and identifies strings in JSX text, attribute values for known operator-facing attributes (button text, placeholder, ARIA labels), and string literals passed to known component props. Pros: zero migration. Cons: false positives (dev strings caught) and false negatives (operator strings missed).
3. **Hybrid.** Static analysis as the floor; marker function for strings that need explicit family-temperature context. Pros: practical. Cons: two surfaces to maintain.

**My recommendation: marker function (option 1).** The wrapping cost is one-time and produces a real grep-able audit trail for every operator-facing string. The migration is mechanical and can be done room by room.

### 3.6 The waiver path (decision #4, scoped)

Per `01 §2.5`, a string that fails validation but needs to ship can carry an explicit `// voice-waiver: <rule> — <reason>` comment. Logged to `deliverables/voice-waivers.log`, reviewed quarterly. The decision is whether that escape hatch exists at all, so here are both postures with their real costs.

**The cases a waiver would actually cover.** These are concrete, from the existing codebase, not hypothetical:

- **Third-party text rendered verbatim.** Supabase auth errors ("Invalid login credentials"), Stripe/payment failures, Posthog or Sentry diagnostic strings surfaced in Settings. We *wrap* most of these today (`normalizeAuthError` covers 10 branches), but a wrapper can miss a new upstream error, and the raw string fails the validator's structural rules through no fault of ours.
- **Legally fixed language.** Privacy/terms text, cookie or data-processing notices — sentences whose wording is constrained by what they legally assert, not by voice.
- **Platform vocabulary.** Strings naming external products on their own terms — "Connect your LinkedIn account," OAuth consent copy mandated by a provider's brand guidelines.
- **Verbatim operator quotes.** The Founding GTM kit and Briefing render things the operator or a buyer actually said. Quoted speech should not be voice-corrected.

**Posture A — no waivers, ever.** Every string passes or the build fails, no exceptions. *Cost:* the cases above must each be engineered around — exhaustive wrappers for third-party errors (and a hard failure when an unmapped one appears), a validator-exempt string class for legal text and quotes (which is itself a waiver, just structural instead of per-string). In practice "no waivers" becomes "waivers by category instead of by instance," with less audit visibility, or it becomes 2am pressure to weaken a validator rule globally because one string blocked a deploy — which is the worst outcome, since a global rule change to ship one string trades the whole discipline for a single edge case.

**Posture B — waivers allowed, founder-approved, logged, quarterly-reviewed (recommended).** The escape hatch exists, but adding one is a canon decision: the PR carries the waiver comment, the founder approves it like any banned-word change, the log accrues, and the quarterly review clears stale ones. *Cost:* a slow leak is possible if review discipline lapses — every waived string is voice debt. *Mitigation:* the validator counts waivers and fails CI if the count exceeds a ceiling (proposed: **10 active waivers product-wide**); hitting the ceiling forces the review rather than waiting for the quarter.

**Why B over A:** A doesn't eliminate exceptions, it just hides them in category exemptions or pressures the global rules. B keeps every exception visible, named, owned by you, and capped. The ceiling turns the slow-leak risk into a hard stop.

**My recommendation, restated with the scope visible:** Posture B with the 10-waiver ceiling.

### 3.7 Migration of existing strings

Two passes:

- **Mechanical migration:** every existing operator-facing string in `src/**` gets wrapped in `t()`. This is grep-and-replace work, room by room.
- **Voice migration:** every wrapped string runs through the validator, the failures get fixed. Strings that touch retired vocabulary (spine, earned, the gummy compounds) get rewritten in the same pass.

This is large but linear. Estimate: 1–2 weeks for both passes across the 22 rooms.

### 3.8 Spec-code sync

The lexicon `07` and the `banned-vocabulary.ts` file are two views of the same canon. When one changes, the other changes in the same PR. The validator's own behavior is the binding form; the lexicon is the readable form. A pre-commit check can confirm the two stay in sync (a script that compares the banned-list in `07` to the array in `banned-vocabulary.ts` and fails the commit if they diverge).

### 3.9 Effort

Validator + tests: ~1 week. CI integration: 1–2 days. Marker-function migration of existing rooms: ~1–2 weeks. Voice-fix pass: ~1 week. **Total: 3–5 weeks.** This work is independent of brand identity; it can run in parallel.

---

## Part IV — Iconography production, scoped

### 4.1 The delivery method decision

**Locked recommendation: a typed Preact component library, `<Icon name="signal" size={20} />` as the primary API.**

File layout under `src/icons/`:
- `Signal.tsx`, `Account.tsx`, `Deal.tsx` — one component per glyph, 46 total.
- `index.ts` — barrel export plus the `<Icon>` wrapper component.
- `types.ts` — the union type of all icon names, derived from the manifest.
- `Icon.tsx` — the wrapper that takes `name` and renders the appropriate component.

Rationale (consolidated from the chat answer above): Preact + Vite + strict TS already runs on small typed components; sprites are an optimization that doesn't matter at 46 icons; per-icon coloring through `<use>` and shadow DOM is harder than per-component CSS; type-safety on `name` is natural; tests work per-component; bundle cost is acceptable on a desktop product. Sprites would win at 500+ icons or no JS framework.

### 4.2 The component API

```tsx
<Icon name="signal" size={20} />           // default navy, blue tick on Signal
<Icon name="send" size={20} accent="orange" />  // orange tick on Send
<Icon name="account" size={16} className="text-ink-soft" />  // softer navy
```

The `name` prop is narrowed to the literal union of icon names (TypeScript catches typos). `size` is one of `16 | 20 | 24` (the three sizes from `09 §4.1`). `accent` is one of the role colors and defaults to whatever the icon's manifest entry specifies (signal → blue, send → orange, etc.). `className` passes through.

### 4.3 The accent system

Each icon component knows its own default accent (signal → blue, send → orange, status icons → their state color, the rest → none). The accent path inside the SVG uses `stroke="var(--icon-accent, currentColor)"`; the wrapper sets `--icon-accent` based on the manifest. This is the cleanest way to keep the rationed-tick discipline (`09 §1.2`) while letting the consumer override when context requires.

### 4.4 Drawing the 46 production glyphs (decision #6, scoped)

The mockup glyphs are sketches, not production. Each needs redrawing as a clean SVG: 24px viewBox, 2px keyline snapped to the grid, flat terminals, miter joins, accent paths tagged for the CSS custom-property hookup, optically corrected (a circle and a square at the same nominal size don't *look* the same size; production icon work is mostly this kind of correction). The decision is who draws them, and "bundle with brand" means different things depending on which brand path (§2.4) you pick — so here are the real options:

**Option 1 — I draw them (internal).** I can produce grid-true SVGs with correct construction mechanics and consistent geometry. What I'm weaker at is the optical-correction layer — the half-pixel judgment calls that separate a crisp set from a slightly-off one, the kind a human icon designer does by eye at 400% zoom. *Cost: $0. Time: ~1 week for all 46. Risk: the set is consistent but a notch less refined than a specialist's; fixable later glyph-by-glyph without breaking the API, since the component layer (§4.2) isolates consumers from the SVG internals.*

**Option 2 — A specialist icon contractor draws them from spec `09`.** Icon design is its own craft niche with its own freelancers; the spec + the mockup are an unusually complete brief. *Cost: $40–100 per glyph at quality, so **$2–5K for the set**. Time: 2–3 weeks. Risk: low — this is well-bounded commission work.*

**Option 3 — The brand designer draws them inside the brand engagement.** Only coherent under brand Path 2 or 3 (§2.4). Under the hybrid, this means the mark engagement grows from "mark + wordmark" to "mark + wordmark + 46-glyph set" — roughly +$3–8K and +2 weeks on the engagement. *Benefit: one hand draws the mark and the icons, so the family resemblance between the logomark and the glyph set is real rather than coordinated. Risk: identity designers are not always icon-system designers; vet for both.*

**How this composes with the brand paths:** under **brand Path 1 (internal)**, this decision collapses to Option 1 or 2. Under **Path 3 (hybrid, recommended)**, the clean play is: the designer is briefed with spec `09` and asked two things — confirm the icon construction style is compatible with the mark direction (week 2 checkpoint, per §2.4), and quote the 46-glyph set as an optional add-on. If their quote and icon portfolio are strong, Option 3; if not, Option 2 with the style already brand-confirmed. Either way the component infrastructure (§4.1–4.3) is built now against my placeholder glyphs, so the real set slots in without touching any room code.

**My recommendation, restated with the scope visible:** hybrid-dependent — ask the brand designer to confirm the style and quote the set; take Option 3 if the quote is good, Option 2 otherwise. Don't take Option 1 unless calendar pressure demands it; the icons are the most-repeated brand surface in the product.

### 4.5 The brand identity gate

The construction (24px grid, 2px keyline, flat terminals, miter joins, edge-rule signature, rationed tick) is a proprietary style. Brand identity might confirm it as drawn, or push back. Deploying 46 icons before the brand pass means likely redrawing them. **Iconography production waits on brand identity** at least for the style confirmation. The component API, the file structure, the build pipeline, the migration plan — all of that can be built now against placeholder glyphs and then the real glyphs slot in.

### 4.6 Migration of existing icons in rooms

Most rooms currently use generic library icons or unicode characters (per `03 §4.6` note). Migration replaces those with `<Icon name="..." />` calls during each room's component-library retrofit. Per-room work, mechanical.

### 4.7 Effort

Component infrastructure (Icon wrapper, types, build pipeline): ~1 week, can be done now against placeholder glyphs. Drawing 46 production glyphs: ~2–3 weeks, gated on brand identity. Migration of rooms: rolled into each room's retrofit. **Total: 3–4 weeks of work, the bulk gated on brand identity.**

---

## Part V — The deployment system, scoped

### 5.1 What it is

The deployment system is the disciplined bridge between specs/mockups and the running product. Today the bridge is *implicit* — a developer reads the spec, looks at the mockup, writes the code. This works for a small team but is the place doctrine drifts as the product grows. The deployment system makes the bridge explicit.

Five pieces:

### 5.2 Token publishing — CSS custom properties

The tokens (color roles, type ramp, spacing scale, radius, elevation, z-order — `03 §4.3`) move from per-mockup `:root` blocks into one canonical file: `src/styles/tokens.css`. Every operator-facing component imports from this file; no component declares its own colors or font sizes. The file is the runtime form of the token decisions in `03`. When `03 §4.3` changes (a new color role is added, a token is renamed), `tokens.css` changes in the same PR.

The mockups continue to inline their `:root` for self-containment, but their `:root` blocks are derived from `tokens.css` (a build script can verify the mockup tokens match the canonical file).

### 5.3 Mockup → component → production room pipeline

The pipeline has three stages:

- **Mockup.** The visual source of truth. Pure HTML/CSS, no framework, self-contained. Lives in `deliverables/mockups/`. Acts as the design's *contract*: this is how the surface should render.
- **Component.** The Preact + TypeScript implementation of the surface or building block, in `src/components/` (or per-room `src/<room>/components/`). Consumes `tokens.css`. Its styles match the mockup; its behavior is real. A component is *complete* when its render output matches the mockup against a set of canonical props.
- **Production room.** The room composes components into the full surface, wires in real data, handles routing and persistence. Lives in `src/<room>/`.

Each stage cites the previous: a component cites its mockup; a room cites its components and the surface pattern (`06`) it implements.

A new room build does these three stages in order — mockup → components → room — never out of order. When a spec changes, the change propagates downstream: spec → tokens → components → rooms. When a mockup is updated, the components built from it are reviewed for drift.

### 5.4 Spec changes → code changes

When a spec changes (a new icon is added, a token is renamed, a banned word is added, a layout archetype is extended), the change is one PR that touches:
- The spec doc.
- The code that implements the rule (tokens, validator, components, icons).
- The lexicon (`07`) if vocabulary is involved.
- The README (`design-system/README.md`) if the dependency map shifted.
- The changelog (Part VI below).

The PR has the founder-approved-canon-change posture per `01 §2.2`. A code change without a corresponding spec change, or vice versa, is a drift bug.

### 5.5 What gets generated vs hand-written

- **Hand-written:** the spec docs, the canonical SVG source files for icons, the validator rules, the Preact components.
- **Generated:** the icon name union type (from the file list), the sprite or barrel index (from the file list), the changelog summary (from PRs), possibly the tokens.css from a typed source-of-truth in TypeScript (debatable; we may just hand-write the CSS).

### 5.6 Effort

Token publishing setup: ~3 days. Pipeline documentation: ~2 days. Spec-code sync conventions: written, not built — folded into the README and reinforced via PR review. **Total infrastructure: ~1 week.** The on-going discipline is the larger cost, and it's permanent.

---

## Part VI — Versioning, scoped

### 6.1 The model

The design system at one version, not per-spec versions. Semver-shaped:

- **Major** (`x.0.0`) — breaking. The spine→gauge rename was a major. Removing a token, removing a sibling spec, renaming the layout archetypes. Major releases require coordinated room migration.
- **Minor** (`0.x.0`) — additive. Adding a new icon, a new component, a new sibling spec, a new state. No room is broken by a minor; rooms opt in.
- **Patch** (`0.0.x`) — non-functional. Typo fixes, clarifications, prose edits in specs.

Today the system is at `1.0.0` — the ten siblings and the README represent the first locked release. The next change is the version bump.

### 6.2 Where the version lives

Three places, all sync:
- `deliverables/design-system/VERSION` (a one-line file, plain text).
- `package.json` `antaeusDesignSystem` field (so build tooling can read it).
- The README's header.

A small script verifies all three match on every commit.

### 6.3 The changelog

`deliverables/design-system/CHANGELOG.md`. One entry per release, in reverse chronological order. Each entry lists the version, the date, the change summary, and the sibling specs touched. Drawn from PR titles by convention; can be hand-curated for major releases.

### 6.4 How rooms declare their target version

Each room's `index.html` or root component declares the design-system version it targets in a constant: `const DESIGN_SYSTEM_VERSION = "1.0.0"`. A room that hasn't been migrated to a newer major sits at its older version until migrated. The token CSS and the components can ship multiple major versions side by side during transition if needed (rare; usually a major migration happens all-at-once via flags).

### 6.5 Effort

Setup: <1 day. The discipline is permanent.

---

## Part VII — Rollout pattern, options

How the migrated rooms swap from the legacy face to the new design system. Three options.

### 7.1 Option A — Per-room migration (Phase-4-style)

Migrate one room at a time. Dashboard first (the Command Chamber, the first build), then radiate outward along the canon §6 compounding matrix. Each room is its own branch, its own PR, its own Posthog feature flag for cutover.

**Pros:** familiar (this is how Phase 4 of the prior architecture ran, per canon Part V); each migration is a contained unit of work; can pause and resume between rooms; flag-gated cutover gives reversibility.

**Cons:** during the migration window, old and new coexist; cross-room consistency is harder to guarantee until the migration completes; if the design system changes mid-migration, early-migrated rooms may need a follow-up pass.

**Suited to:** when the design system is stable but room migrations carry their own complexity (the case here).

### 7.2 Option B — Per-axis migration

Deploy the validator everywhere first. Then deploy the tokens everywhere. Then deploy the layout frame everywhere. Then the components. Each axis lands across all rooms before the next axis starts.

**Pros:** maximum consistency at each step; less old-and-new coexistence; the validator catches drift across all rooms immediately.

**Cons:** every axis touches every room, so each step is large; the system is in a partial state for longer; rooms see waves of churn from outside their own scope.

**Suited to:** when the axes are independent enough to deploy separately AND the rooms are stable enough to take repeated outside touches.

### 7.3 Option C — Feature-flag gradient

Every room exists in old-face and new-face form simultaneously, behind a Posthog flag, flipped per-user. The founder flips first, validates, then widens.

**Pros:** maximum reversibility; per-user staging; founder can validate everything in production before any operator sees it.

**Cons:** doubles the surface area until flags retire; old code and new code both need maintenance during the window; flag complexity compounds across 22 rooms.

**Suited to:** when reversibility matters more than maintenance overhead.

### 7.4 My recommendation

**Option A — per-room migration, Dashboard first, flag-gated.** Reasoning: the Antaeus codebase has the Phase 4 pattern already (canon Part V §1 lists 17 migrated rooms each on its own PR with a Posthog flag). The infrastructure exists, the team's muscle memory exists, the flag system works. Layering Option B on top would force the validator and tokens to deploy ahead of the per-room work; instead, the per-room migration *includes* the validator wrapping, the token consumption, the component substitution, the icon migration, and the surface-pattern match — all as one room PR. Each room ends fully migrated; no room is half-converted at any time.

**Founder decision: confirm A, or pick B / C with reasoning.**

---

## Part VIII — Sequence and dependencies

The dependency diagram, in plain prose:

```
Brand identity work starts ──────────────┐
                                          │
Lexicon enforcement build starts          │
  (independent — runs in parallel)        │
                                          │
                                          ▼
                            Brand identity confirms
                              the icon style
                                          │
                                          ▼
                          Iconography production starts
                            (component infra can start earlier
                             against placeholders)
                                          │
                                          ▼
                          Deployment system infrastructure
                            (tokens, pipeline, versioning)
                                          │
                                          ▼
                              Dashboard build starts
                                  (Option A: per-room, flag-gated)
                                          │
                                          ▼
                            Radiate to next rooms per
                                  canon §6 matrix
```

What can run in parallel:
- Brand identity work AND lexicon enforcement build (independent).
- Iconography component infrastructure (against placeholders) AND brand identity (the real glyph drawing waits on brand).
- Deployment system infrastructure can be built once brand identity is partly locked (the token decisions are the gate).

What gates what:
- Brand identity gates the *real* glyph drawing in iconography. It does NOT gate the component infrastructure for icons.
- Brand identity gates the final marketing visual system (which is part of itself).
- Lexicon enforcement gates safely writing Dashboard's strings without retroactive cleanup.
- Iconography component infrastructure gates rooms that need icons (most of them).
- Deployment system gates the room migration's mechanical safety.
- Versioning gates rollback safety.

### 8.1 Estimated total elapsed time

If brand identity is internal: ~6–8 weeks before Dashboard build starts. If brand identity is external: ~8–12 weeks. The variance is brand-identity duration; everything else fits inside that window.

---

## Part IX — Founder decisions: ANSWERED 2026-06-08

All seven decided by the founder on 2026-06-08. This Part is now the decision record; the building is cleared to start.

1. **Brand identity path → ALL INTERNAL for now.** No external designer at this stage. The full brand layer — logo/wordmark explorations, brand color confirmation, brand voice register, marketing visual system, usage guidelines — is founder + Claude work, run the same way the design-system siblings were (rounds of artifacts, founder reacts, iterate). The §2.4 Path 1 honest-risk note stands on the record: the mark may land fine-but-not-distinctive; if it does, a future external engagement on the mark alone remains open without disturbing anything else, because the deliverables (§2.5) keep the mark separable.
   - **Round 1 decided 2026-06-12: Direction A — "The Grounded A."** From the five directions in `deliverables/mockups/brand-identity-round-1-2026-06-08.html`, the founder picked A: a drafted capital A standing on a ground line that extends past its feet — flat terminals, mitered joins, the same construction as the icon set, crossbar sitting low like a gauge reading. This confirms the icon style, so production glyph drawing (decision #6 / execution step 4) is unblocked. Round 2 refines A: weights, proportions, the favicon at real size, the mark on the landing page and in the Wayfinder corner.
2. **Icon delivery method → CONFIRMED.** Typed Preact component library; `<Icon name="..." />` wrapper over per-glyph `.tsx` files in `src/icons/`, three sizes, manifest-driven accents (§4.1–4.3).
3. **Rollout pattern → OPTION A.** Per-room migration, Dashboard first, flag-gated, radiating outward along the canon §6 compounding matrix (§7.1, §7.4).
4. **Validator waivers → POSTURE B.** Waivers allowed; adding one is a founder-approved PR; logged to `deliverables/voice-waivers.log`; quarterly review; CI fails above a 10-active-waiver product-wide ceiling (§3.6).
5. **Marker-function migration → GREEN LIGHT.** The `t()` identity-marker wraps every operator-facing string; migration runs room-by-room (§3.5, §3.7).
6. **Production glyphs → INTERNAL.** Claude draws the 46 per spec `09` construction (§4.4 Option 1), with the recorded caveat that individual glyphs can be re-commissioned later without touching the API, since the component layer isolates consumers from the SVG internals.
7. **Brand voice register → YES.** The eighth `visitor` register ships as validator configuration inside the internal brand pass (§2.7).

**Calendar consequence of #1 + #6 (all-internal):** the external-designer critical path disappears. The brand identity pass compresses to ~1–2 weeks of internal rounds; the glyph set is ~1 week of internal drawing gated only on the brand pass confirming the icon style. The pre-Dashboard window drops from the 6–12 week estimate to roughly **3–5 weeks**, dominated by the lexicon enforcement build + migration (§3.9) running in parallel with the brand pass.

**The execution order, per the Part VIII dependency map, now concrete:**

1. **Deployment infrastructure first** (~1 week): `tokens.css` + versioning (VERSION / CHANGELOG / 1.0.0 baseline) + the pipeline conventions — small, unblocks everything, no open questions.
2. **Lexicon enforcement build** (validator + banned-vocabulary + blessed-labels + family-temperatures + CI gate), then the `t()` migration room-by-room — the long pole, starts immediately, independent of brand. **First radiation ring DONE 2026-06-12:** Dashboard (all components + readiness anchor/drawer) + Signal Console + Deal Workspace, ~234 strings declared and CI-gated, three banned-vocab rewordings ("earned", "verdict"-as-container, "unlock"), 0 waivers. Engine-side narrative builders (brief-narrative, scoring reasons, gateBlockers) migrate with their rooms' design-system passes. **Ring 2 DONE 2026-06-12:** Readiness engine (labels + gate blockers + dimension evidence/gaps, interpolations via the template-then-replace pattern) + all Quota Workback + all Outbound Studio components — ~160 more strings, cumulative ~390 declared, still 0 waivers. Next rings: Cold Call + LinkedIn + Call Planner, then ICP/Territory/Sourcing, then the rest.
3. **Brand identity pass, internal, in parallel** — logo/wordmark rounds, color confirmation, the visitor register, the marketing visual system; lands as sibling `10`. **Round 1 decided 2026-06-12 (Grounded A); round 2 artifact shipped 2026-06-12** (`deliverables/mockups/brand-identity-round-2-2026-06-12.html`): stroke-weight studies (W1–W3), crossbar + overhang proportions (P1–P3), the favicon ladder with the no-bar-at-16px simplification, the L1 serif / L2 caps lockup pair, and the two first in-situ placements (landing hero corner + Wayfinder home affordance). Awaiting founder picks; round 3 locks geometry into sibling 10 + ships favicon files + replaces the wordmark in RoomChrome and the landing page.
4. **Icon production** — component infrastructure against placeholders immediately; the 46 real glyphs drawn once the brand pass confirms the style. **Production pass DONE 2026-06-12:** the Grounded-A pick confirmed the construction, and a §4.4 quality pass landed in the iconography mockup (the master): the two sub-pixel exclamation dots (attention, at-risk) became true 2×2 square dots, the close + dismiss X forms got the diagonal optical-size correction (+1px each side), and all 46 components were regenerated with the placeholder caveat retired from the generated headers. The sketch set was already grid-true to spec 09; the pass fixed the genuine rendering defects rather than redrawing for its own sake — individual glyphs remain re-commissionable later without touching the API (§4.4 Option 1 caveat stands).
5. **localStorage substrate fix — ✅ DONE 2026-06-12.** Verification pass + fixes landed in one PR (see the audit's §8 fix record, `deliverables/audit/localstorage-inventory-2026-06-08.md`). Of the audit's five findings: two were real and are fixed (`gtmos_readiness_snapshot` gets its writer back via the Dashboard's new readiness-snapshot publisher; the two vestigial keys are dropped from the migration config), two were stale (`gtmos_activation_context` IS written by Onboarding's `seed.ts` via `trySet`; `gtmos_readiness_last_verdict` IS written by `readiness-history.ts`), and the demo-seed gap was already resolved by PR #213's snapshot warm-up plus the new publisher. **The Dashboard-correctness gate is closed.** Still open and optional: the ADR-005 Step-3 dual-writes on Deal Workspace and Quota Workback so the new Dashboard reads cloud-canonical from day one.
6. **Dashboard build** — gated on 1–5, per Option A.

---

## Closing

The design system is fully spec'd; the work between *spec written* and *Dashboard shipped* is what this document scopes. Six pieces: brand identity (the longest, on the critical path), lexicon enforcement (parallel, independent), iconography production (gated on brand), the deployment system (gated on token decisions), versioning (small, immediate), and the rollout pattern (founder pick from three options). The dependencies give a 6–12 week window before the Dashboard build legitimately starts, with most of the variance in the brand-identity duration.

This was the plan; as of 2026-06-08 it is the decision record. All seven founder decisions are answered in Part IX (all-internal brand, Preact icon library, Option A rollout, waivers with a ceiling, the `t()` migration, internal glyphs, the visitor register). The building starts in the Part IX execution order: deployment infrastructure, then the validator as the long pole, the internal brand pass in parallel, icons behind the brand style confirmation, the localStorage substrate fix (added 2026-06-12 from the background-task audit), and the Dashboard build gated behind all of it — now a ~3–5 week window instead of 6–12, because the external-designer critical path is gone.
