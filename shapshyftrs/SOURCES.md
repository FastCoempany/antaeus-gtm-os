# Sources

What was read from which source, the file each transcribed token came from, and the real component each of the thirteen teasers is modeled on. Nothing was copied out of any source: values were transcribed by hand into `tokens/*.css`, anatomy and behavior were read and described, and every teaser is written from scratch in this repo. Paths are relative to each source's own root; NRDI files are cited by filename only; the cockpit is "an internal sales cockpit" and nothing else.

## A. What was read from which source

| Source | Files read (relative to that source's root) |
|---|---|
| GTM OS, antaeus.app | `src/styles/tokens.css`; `css/app.css`; `src/discovery-studio/v4/DiscoveryStudioV4.tsx`; `src/discovery-studio/v4/discovery-studio-v4.css`; `src/discovery-studio/state.ts`; `src/discovery-studio/lib/load-frameworks.ts`; `src/discovery-studio/discovery-studio.css`; `js/discovery-segment-runtime.js`; `src/signal-console/lib/heat.ts`; `src/signal-console/v4/lib/attention.ts`; `src/signal-console/v4/SignalConsoleV4.tsx`; `src/signal-console/v4/signal-console-v4.css`; `src/territory-architect/v4/TerritoryArchitectV4.tsx`; `src/territory-architect/v4/territory-architect-v4.css`; `src/territory-architect/lib/types.ts`; `src/territory-architect/state.ts`; `src/lib/ground/GroundLine.tsx`; `src/lib/ground/ground.css`; `src/lib/ground/motion.ts`; `src/lib/palette/registry.ts`; `deliverables/design-system/03-component-library-2026-06-07.md`; `deliverables/design-system/08-motion-2026-06-07.md`; `deliverables/design-system/10-brand-identity-2026-06-12.md`; `deliverables/plans/antaeus-visual-system-spec-2026-04-01.md`; `deliverables/plans/antaeus-visual-identity-lock-memo-2026-04-01.md` |
| AESDR, aesdr.com | `app/globals.css`; `app/layout.tsx`; `app/page.module.css`; `app/dashboard/page.tsx`; `app/syllabus/page.tsx`; `app/syllabus/syllabus.module.css`; `AGENTS.md`; `components/LandingSequence.module.css`; `components/landing-sequence/animator.ts`; `components/DeckStack.tsx`; `components/DeckStack.module.css`; `components/brand/Divider.tsx`; `components/brand/BrandAssets.tsx`; `components/ProgressSaver.tsx`; `content/lessons/html/lesson-01/aesdr_course01_v1.html` (representative of the 36 unit files); `design-canon-seed/07-figma-prep/figma-tokens.json`; `design-canon-seed/07-figma-prep/figma-assets/asset-iris-gradient.svg`; `design-canon/03-css-tokens/_gates.css`; `deliverables/prototypes/dashboard-b-shimmer-variants.html`; `tools/design-seed/surface-two-voices.html`; `utils/progress/types.ts`; `utils/content/catalog.ts`; four rendered references under `design-canon-seed/04-rendered-surfaces/` (viewed only) |
| an internal sales cockpit | `<vendored kit>/css/tokens.css`; `<vendored kit>/css/motion.css`; `<vendored kit>/css/components.css`; `config/design-tokens.css`; `src/app/layout.tsx`; `src/app/globals.css`; `src/app/groundwork/groundwork.module.css`; `src/app/groundwork/instrument.tsx`; `src/app/groundwork/page.tsx`; `src/app/room/room.module.css`; `src/app/room/room-client.tsx`; `src/app/<root surface>.module.css`; `src/app/dashboard.module.css`; `src/app/dashboard-client.tsx`; `src/app/sendbook/sendbook.module.css`; `src/app/playbook/playbook.module.css`; `src/app/activity/dock.module.css`; `src/components/presence/presence.module.css`; `src/components/presence/engine.tsx`; `src/components/scratch/scratchpad.module.css`; `src/components/app-wayfinder.tsx`; `src/components/field-glyph.tsx`; `src/components/hml-priority-panel.tsx`; `src/lib/book/scoring.ts`; `src/lib/prospect-scoring.ts`; `src/lib/groundwork/day.ts`; `src/lib/groundwork/proximity.ts`; `src/lib/room/stages-view.ts`; `docs/architecture/design-system.md`; `docs/architecture/brand-identity.md`. Two paths are aliased because their real names belong to a product: the vendored design kit's directory is written as `<vendored kit>`, and the stylesheet of the app's root surface is written as `src/app/<root surface>.module.css`. Every other path carrying a person, partner, employer, or product name was skipped on purpose, as were fixtures, seed data, and evidence files. |
| NRDI, DARKEST SHADES | `Darkest Shades Brand Guidelines.pdf`; `Darkest Shades FONT PAIRS.pdf`; `Darkest Shades FONT PAIRS Feb 3.pdf`; `Darkest Shades Graphic Elements.pdf`; `Darkest Shades Logotypes.pdf`; `Moodboard_Darkest Shades.pdf`; `Moodboard_Darkest Shades_2.pdf`; `Darkest Shades Brand Strategy.pdf`; `Darkest Shades Brand Strategy and Logo.pdf`; `Renders_Sunglasses_presentation.pdf`; `DARKEST SHADES BRAND STORY V1.pdf`; `DARKEST-SHADES Voice & Tone Guide.pdf`; `START-HERE.txt`; `README.md`; `manifest.json`; `DS-Eclipse-gold-gradient.svg` (colour stops only); `Model 01.pdf` … `Model 09.pdf`; `IMG_2691.jpeg`; `IMG_2692.jpeg`; `IMG_2692_2.jpeg`; `IMG_2693.jpeg`; `media.md`; `transcript.txt` (two copies) |
| NRDI, PUFF JUNCTION | `Puff Junction Brand Guide Compressed.pdf`; `R1.png`; `Grinder_1.png`; `Grinder_2.png`; `Grinder_3.png`; `thumb_Grinder_1_jpg.jpg`; `0001.png`; `0002.png`; `0003.png`; `0006.png`; `0008.png`; `12.png`; `16.png`; `18.png`; `21.png`; `image_2.png`; `Weed Grinder_V01.pdf`; `Weed Grinder_Top Lid_V02.pdf`; `Weed Grinder_Concrete Top_V01.pdf`; `Weed Grinder_Concrete Bottom_V01.pdf`; `Weed Grinder_Lid Threaded_V01.pdf`; `top cover twists.pdf`; `IMG_9870.jpeg`; `IMG_9245.jpeg`; `Puff-Junction-Dark.png`; `Puff-Junction-Slime.png`; lighter and pouch renders (surveyed, not used) |
| NRDI, DIGS | `Digs_styleguide_boast.pdf`; `AC-LST-001_Tech Pack_6-15-25.pdf`; `AC-LST-001_Tech Pack_9.23.24_2.pdf`; `fabric 3.png`; `image_21.png`; `IMG_4026.jpeg`; `IMG_4025.jpeg`; `IMG_4024.jpeg`; `Photo May 13 2025, 3 45 48 PM.jpg`; `Photo May 13 2025, 4 04 56 PM.jpg`; `Shirts.pdf`; `digs pant1 (1).pdf`; the brand strategy questionnaire PDF; `transcript.txt`; `README.md`; `_chat.txt` (construction and wash context only) |

Real brand faces that are not on Google Fonts, and the Google face standing in (all marked `derived` in `tokens/nrdi.css`):

| Brand | Real face | Stand-in loaded |
|---|---|---|
| DARKEST SHADES | Owners Wide (display, headlines, likely the wordmark) | Archivo, width 125, weights 500 (wordmark) and 700 (headlines) |
| DARKEST SHADES | Stolzl (body) | Manrope 400 and 600 |
| PUFF JUNCTION | Arnet Bold / Black / Super Italic (all loud type) | Archivo italic, width 120, weights 700 and 900 |
| PUFF JUNCTION | Work Sans Medium / Bold (body) | Work Sans 500 and 700 (the real face; it is on Google Fonts) |
| DIGS | the outlined wordmark artwork (no live face exists) | Alexandria 900, letter-spacing -0.05em |
| DIGS | Alexandria Regular (all text) | Alexandria 400 (the real face; it is on Google Fonts) |
| DIGS | The Old Falcons (the marker script tagline) | Permanent Marker 400 |

## B. The file each transcribed token came from

Every declaration in `tokens/*.css` carries one mark. The tables below list only the transcribed ones (`/* from source: … */`); pinned and derived values are marked in the files and summarized in `DESIGN.md`. A page number or "sampled" / "measured" inside a mark means the value was read off a rendered page or render rather than off a text layer, and can be off by a couple of points per channel.

#### GTM OS (`tokens/gtmos.css`)

| Token | Transcribed from |
|---|---|
| `--gtm-legacy-base` | `css/app.css` |
| `--gtm-legacy-shell` | `css/app.css` |
| `--gtm-legacy-2` | `css/app.css` |
| `--gtm-legacy-3` | `css/app.css` |
| `--gtm-legacy-4` | `css/app.css` |
| `--gtm-text` | `css/app.css` |
| `--gtm-text-2` | `css/app.css` |
| `--gtm-text-3` | `css/app.css` |
| `--gtm-text-muted` | `css/app.css` |
| `--gtm-cool` | `css/app.css` |
| `--gtm-cool-light` | `css/app.css` |
| `--gtm-cool-dark` | `css/app.css` |
| `--gtm-state-amber` | `css/app.css` |
| `--gtm-state-red` | `css/app.css` |
| `--gtm-state-green` | `css/app.css` |
| `--gtm-border` | `css/app.css` |
| `--gtm-hairline` | `css/app.css` |
| `--gtm-fill-faint` | `css/app.css` |
| `--gtm-fill-soft` | `css/app.css` |
| `--gtm-glass-rail` | `css/app.css` |
| `--gtm-glass-panel-source` | `css/app.css` |
| `--gtm-glass-blur` | `css/app.css` |
| `--gtm-glass-blur-strong` | `css/app.css` |
| `--gtm-highlight-strip` | `css/app.css` |
| `--gtm-highlight-top` | `css/app.css` |
| `--gtm-shadow-sm` | `css/app.css` |
| `--gtm-shadow-md` | `css/app.css` |
| `--gtm-shadow-lg` | `css/app.css` |
| `--gtm-shadow-card` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-radius-sm` | `css/app.css` |
| `--gtm-radius-md` | `css/app.css` |
| `--gtm-radius-lg` | `css/app.css` |
| `--gtm-radius-xl` | `css/app.css` |
| `--gtm-radius-full` | `css/app.css` |
| `--gtm-radius-pill` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-radius-card` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-radius-chip` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-radius-tile` | `src/territory-architect/v4/territory-architect-v4.css` |
| `--gtm-radius-account` | `src/signal-console/v4/signal-console-v4.css` |
| `--gtm-rule-w` | `deliverables/design-system/03-component-library-2026-06-07.md` |
| `--gtm-edge-w` | `deliverables/design-system/03-component-library-2026-06-07.md` |
| `--gtm-bar-h` | `css/app.css` |
| `--gtm-bar-track` | `css/app.css` |
| `--gtm-heat-bar-w` | `src/signal-console/v4/signal-console-v4.css` |
| `--gtm-heat-bar-h` | `src/signal-console/v4/signal-console-v4.css` |
| `--gtm-dot` | `src/signal-console/v4/signal-console-v4.css` |
| `--gtm-space-1` | `css/app.css` |
| `--gtm-space-2` | `css/app.css` |
| `--gtm-space-3` | `css/app.css` |
| `--gtm-space-4` | `css/app.css` |
| `--gtm-space-5` | `css/app.css` |
| `--gtm-space-6` | `css/app.css` |
| `--gtm-gap-chips` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-gap-tiles` | `src/territory-architect/v4/territory-architect-v4.css` |
| `--gtm-display-size` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-display-lh` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-display-track` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-title-size` | `src/styles/tokens.css` |
| `--gtm-body-size` | `src/styles/tokens.css` |
| `--gtm-body-lh` | `src/styles/tokens.css` |
| `--gtm-label-size` | `src/styles/tokens.css` |
| `--gtm-kicker-size` | `src/styles/tokens.css` |
| `--gtm-kicker-track` | `src/styles/tokens.css` |
| `--gtm-kicker-case` | `src/styles/tokens.css` |
| `--gtm-kicker-small` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-kicker-small-track` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-chip-size` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-response-size` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-numeral-size` | `src/signal-console/v4/signal-console-v4.css` |
| `--gtm-tile-label-size` | `src/territory-architect/v4/territory-architect-v4.css` |
| `--gtm-node-label-size` | `src/lib/ground/ground.css` |
| `--gtm-ordinal-size` | `src/discovery-studio/v4/discovery-studio-v4.css` |
| `--gtm-rail-segments` | `js/discovery-segment-runtime.js` |
| `--gtm-heat-decay-steps` | `src/signal-console/lib/heat.ts` |
| `--gtm-heat-max` | `src/signal-console/lib/heat.ts` |
| `--gtm-room-count` | `src/lib/ground/motion.ts` |
| `--gtm-room-stages` | `src/lib/ground/motion.ts` |
| `--gtm-ease-standard` | `src/styles/tokens.css` |
| `--gtm-ease-exit` | `src/styles/tokens.css` |
| `--gtm-ease-settle` | `src/lib/ground/ground.css` |
| `--gtm-dur-quick` | `src/styles/tokens.css` |
| `--gtm-dur-base` | `src/styles/tokens.css` |
| `--gtm-dur-considered` | `src/styles/tokens.css` |
| `--gtm-dur-rise` | `src/lib/ground/ground.css` |
| `--gtm-stagger` | `src/styles/tokens.css` |

#### AESDR (`tokens/aesdr.css`)

| Token | Transcribed from |
|---|---|
| `--aes-paper` | `app/globals.css` |
| `--aes-ink` | `app/globals.css` |
| `--aes-crimson` | `app/globals.css` |
| `--aes-muted` | `app/globals.css` |
| `--aes-light` | `app/globals.css` |
| `--aes-form-border` | `app/globals.css` |
| `--aes-card` | `components/DeckStack.module.css` |
| `--aes-gold` | `app/dashboard/page.tsx` |
| `--aes-gold-light` | `app/dashboard/page.tsx` |
| `--aes-gold-glow` | `app/dashboard/page.tsx` |
| `--aes-lesson-paper` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-lesson-ink` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-lesson-mid` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-lesson-lite` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-lesson-lite-2` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-light-2` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` (an alias of `--aes-lesson-lite-2`) |
| `--aes-lesson-line` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-lesson-line-2` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-amber` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-cobalt` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-coral` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-green` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-crimson-ring` | `app/globals.css` |
| `--aes-crimson-glow` | `app/dashboard/page.tsx` |
| `--aes-ink-ghost` | `components/LandingSequence.module.css` |
| `--aes-ink-dot` | `components/LandingSequence.module.css` |
| `--aes-paper-on-ink` | `app/dashboard/page.tsx` |
| `--aes-iris` | `app/globals.css` |
| `--aes-iris-lesson` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-iris-size` | `app/globals.css` |
| `--aes-iris-size-wide` | `components/LandingSequence.module.css` |
| `--aes-iris-shift` | `app/globals.css` |
| `--aes-iris-shift-end` | `app/globals.css` |
| `--aes-iris-dur-button` | `design-canon/03-css-tokens/_gates.css` |
| `--aes-iris-dur-progress` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-iris-dur-line` | `app/page.module.css` |
| `--aes-iris-dur-divider` | `components/brand/Divider.tsx` |
| `--aes-iris-timing` | `app/globals.css` |
| `--aes-iris-fallback` | `app/globals.css` |
| `--aes-iris-line-opacity` | `components/DeckStack.module.css` |
| `--aes-iris-ambient-opacity` | `components/LandingSequence.module.css` |
| `--aes-hairline` | `app/page.module.css` |
| `--aes-rule-iris-h` | `app/page.module.css` |
| `--aes-rule-ambient-h` | `components/LandingSequence.module.css` |
| `--aes-rule-accent` | `app/dashboard/page.tsx` |
| `--aes-rule-lesson` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-rule-stripe-h` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-border-hair` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-border-icon` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-border-card` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-bracket` | `components/LandingSequence.module.css` |
| `--aes-dotted-path` | `components/brand/Divider.tsx` |
| `--aes-dotted-path-w` | `components/brand/Divider.tsx` |
| `--aes-radius` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-radius-dot` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-radius-deck-shadow` | `components/DeckStack.module.css` |
| `--aes-shadow-card` | `components/DeckStack.module.css` |
| `--aes-shadow-index` | `app/syllabus/syllabus.module.css` |
| `--aes-dogear` | `components/DeckStack.module.css` |
| `--aes-dogear-hover` | `components/DeckStack.module.css` |
| `--aes-dogear-gradient` | `components/DeckStack.module.css` |
| `--aes-progress-w` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-progress-h` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-progress-track` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-node` | `app/dashboard/page.tsx` |
| `--aes-node-border` | `app/dashboard/page.tsx` |
| `--aes-node-future-border` | `app/dashboard/page.tsx` |
| `--aes-connector` | `app/dashboard/page.tsx` |
| `--aes-cursor-w` | `components/LandingSequence.module.css` |
| `--aes-cursor-h` | `components/LandingSequence.module.css` |
| `--aes-space-1` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-2` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-3` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-4` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-5` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-6` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-7` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-8` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-space-9` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-card-pad` | `components/DeckStack.module.css` |
| `--aes-row-gap` | `app/dashboard/page.tsx` |
| `--aes-display-size` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-display-lh` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-display-track` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-h2-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-h2-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-title-size` | `app/dashboard/page.tsx` |
| `--aes-title-lh` | `app/dashboard/page.tsx` |
| `--aes-title-track` | `app/dashboard/page.tsx` |
| `--aes-lede-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-lede-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-body-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-body-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-body-track` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-track` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-case` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-title-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-label-title-track` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-eyebrow-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-eyebrow-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-eyebrow-track` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-footnote-size` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-footnote-lh` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-footnote-track` | `design-canon-seed/07-figma-prep/figma-tokens.json` |
| `--aes-progress-label-size` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-progress-label-track` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-counter-size` | `components/DeckStack.module.css` |
| `--aes-counter-track` | `components/DeckStack.module.css` |
| `--aes-feedback-size` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-feedback-lh` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-stage-label-size` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-stage-label-track` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-typed-size` | `components/LandingSequence.module.css` |
| `--aes-typed-lh` | `components/LandingSequence.module.css` |
| `--aes-course-count` | `components/DeckStack.tsx` |
| `--aes-sim-stages` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-peel-dur` | `components/DeckStack.module.css` |
| `--aes-peel-ease` | `components/DeckStack.module.css` |
| `--aes-peel-fade` | `components/DeckStack.module.css` |
| `--aes-peel-perspective` | `components/DeckStack.module.css` |
| `--aes-peel-transform` | `components/DeckStack.tsx` |
| `--aes-fan-offset` | `components/DeckStack.tsx` |
| `--aes-fan-rotate` | `components/DeckStack.tsx` |
| `--aes-dogear-dur` | `components/DeckStack.module.css` |
| `--aes-screen-dur` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-screen-ease` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-screen-rise` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-progress-dur` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-progress-ease` | `content/lessons/html/lesson-01/aesdr_course01_v1.html` |
| `--aes-type-ms` | `components/landing-sequence/animator.ts` |
| `--aes-type-jitter-ms` | `components/landing-sequence/animator.ts` |
| `--aes-type-hold` | `components/landing-sequence/animator.ts` |
| `--aes-dissolve-dur` | `components/LandingSequence.module.css` |
| `--aes-dissolve-blur` | `components/LandingSequence.module.css` |
| `--aes-dissolve-scale` | `components/LandingSequence.module.css` |
| `--aes-cursor-blink` | `components/LandingSequence.module.css` |
| `--aes-node-dur` | `app/dashboard/page.tsx` |
| `--aes-line-dur` | `app/dashboard/page.tsx` |
| `--aes-toast-dur` | `components/ProgressSaver.tsx` |
| `--aes-loop-ease` | `components/DeckStack.module.css` |

#### an internal sales cockpit (`tokens/cockpit.css`)

| Token | Transcribed from |
|---|---|
| `--ckp-src-field` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-surface` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-sunk` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-ink` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-ink-700` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-ink` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-soft` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-faint` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-quiet` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-rule` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-hair-strong` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-hair` | `<vendored kit>/css/tokens.css` |
| `--ckp-a-ring` | `src/components/presence/presence.module.css` |
| `--ckp-a-node-border` | `src/app/room/room.module.css` |
| `--ckp-signal` | `<vendored kit>/css/tokens.css` |
| `--ckp-signal-half` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-signal-soft` | `<vendored kit>/css/tokens.css` |
| `--ckp-signal-halo` | `src/components/presence/presence.module.css` |
| `--ckp-ember` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-ember-deep` | `src/app/room/room.module.css` |
| `--ckp-ember-fill` | `src/app/room/room.module.css` |
| `--ckp-alarm` | `<vendored kit>/css/tokens.css` |
| `--ckp-alarm-glow` | `src/app/<root surface>.module.css` |
| `--ckp-alarm-deep` | `src/app/<root surface>.module.css` |
| `--ckp-src-orange` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-blue` | `<vendored kit>/css/tokens.css` |
| `--ckp-src-green` | `<vendored kit>/css/tokens.css` |
| `--ckp-tick-w` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-tick-h` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-tick-radius` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-tick-lead` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-gauge-w` | `<vendored kit>/css/components.css` |
| `--ckp-gauge-radius` | `<vendored kit>/css/components.css` |
| `--ckp-burn-h` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-burn-radius` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-meter-h` | `src/app/<root surface>.module.css` |
| `--ckp-zone-h` | `src/app/room/room.module.css` |
| `--ckp-node` | `src/app/room/room.module.css` |
| `--ckp-node-current` | `src/app/room/room.module.css` |
| `--ckp-node-current-border` | `src/app/room/room.module.css` |
| `--ckp-node-board` | `src/app/dashboard.module.css` |
| `--ckp-connector-w` | `src/app/dashboard.module.css` |
| `--ckp-halo-w` | `src/app/dashboard.module.css` |
| `--ckp-halo-offset` | `src/app/dashboard.module.css` |
| `--ckp-lamp` | `src/components/presence/presence.module.css` |
| `--ckp-lamp-halo` | `src/components/presence/presence.module.css` |
| `--ckp-track-stripe` | `src/app/room/room.module.css` |
| `--ckp-radius-control` | `<vendored kit>/css/tokens.css` |
| `--ckp-radius-card` | `<vendored kit>/css/tokens.css` |
| `--ckp-radius-frame` | `<vendored kit>/css/tokens.css` |
| `--ckp-radius-pill` | `<vendored kit>/css/tokens.css` |
| `--ckp-radius-chip` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-radius-stamp` | `src/app/room/room.module.css` |
| `--ckp-radius-fold` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-radius-lane` | `src/app/<root surface>.module.css` |
| `--ckp-space-1` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-2` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-3` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-4` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-5` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-6` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-7` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-8` | `<vendored kit>/css/tokens.css` |
| `--ckp-space-9` | `<vendored kit>/css/tokens.css` |
| `--ckp-wing-l` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-wing-r` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-lane-w` | `src/app/<root surface>.module.css` |
| `--ckp-chip-pad` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-chip-border` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-body-size` | `<vendored kit>/css/tokens.css` |
| `--ckp-body-lh` | `<vendored kit>/css/tokens.css` |
| `--ckp-label-size` | `<vendored kit>/css/tokens.css` |
| `--ckp-label-weight` | `<vendored kit>/css/tokens.css` |
| `--ckp-small-size` | `config/design-tokens.css` |
| `--ckp-small-lh` | `config/design-tokens.css` |
| `--ckp-reason-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-whisper-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-whisper-lh` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-kicker-size` | `<vendored kit>/css/tokens.css` |
| `--ckp-kicker-track` | `<vendored kit>/css/tokens.css` |
| `--ckp-kicker-case` | `<vendored kit>/css/tokens.css` |
| `--ckp-kicker-wing-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-kicker-wing-track` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-kicker-facts-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-kicker-facts-track` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-kicker-register-size` | `src/app/room/room.module.css` |
| `--ckp-kicker-register-track` | `src/app/room/room.module.css` |
| `--ckp-kicker-move-track` | `src/app/room/room.module.css` |
| `--ckp-chip-label-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-chip-label-track` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-digits-size` | `src/components/presence/presence.module.css` |
| `--ckp-digits-weight` | `src/components/presence/presence.module.css` |
| `--ckp-unit-size` | `src/components/presence/presence.module.css` |
| `--ckp-unit-track` | `src/components/presence/presence.module.css` |
| `--ckp-numeral-size` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-numeral-lh` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-digits-variant` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-score-max` | `src/lib/book/scoring.ts` |
| `--ckp-tier-mid-from` | `src/lib/book/scoring.ts` |
| `--ckp-tier-high-from` | `src/lib/book/scoring.ts` |
| `--ckp-confidence-mid` | `src/lib/book/scoring.ts` |
| `--ckp-confidence-low` | `src/lib/book/scoring.ts` |
| `--ckp-heat-levels` | `src/lib/groundwork/day.ts` |
| `--ckp-queue-cap` | `src/lib/groundwork/day.ts` |
| `--ckp-slot-cap` | `src/lib/groundwork/day.ts` |
| `--ckp-dur-quick` | `<vendored kit>/css/tokens.css` |
| `--ckp-dur-base` | `<vendored kit>/css/tokens.css` |
| `--ckp-dur-considered` | `<vendored kit>/css/tokens.css` |
| `--ckp-ease-standard` | `<vendored kit>/css/tokens.css` |
| `--ckp-ease-exit` | `<vendored kit>/css/tokens.css` |
| `--ckp-stagger` | `<vendored kit>/css/tokens.css` |
| `--ckp-burn-dur` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-throb` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-throb-opacity` | `src/app/groundwork/groundwork.module.css` |
| `--ckp-spring-dur` | `src/app/room/room.module.css` |
| `--ckp-spring-rise` | `src/app/room/room.module.css` |
| `--ckp-breathe` | `src/components/presence/presence.module.css` |
| `--ckp-ring-pulse` | `src/app/dashboard.module.css` |
| `--ckp-ring-scale` | `src/app/dashboard.module.css` |
| `--ckp-ring-opacity` | `src/app/dashboard.module.css` |
| `--ckp-meter-fill-dur` | `src/app/<root surface>.module.css` |
| `--ckp-loop-ease` | `<vendored kit>/css/tokens.css` |

#### NRDI (`tokens/nrdi.css`)

| Token | Transcribed from |
|---|---|
| `--nds-black` | `START-HERE.txt` |
| `--nds-white` | `START-HERE.txt` |
| `--nds-gold` | `START-HERE.txt` |
| `--nds-gold-gradient` | `DS-Eclipse-gold-gradient.svg` |
| `--nds-ground` | `Darkest Shades Brand Guidelines.pdf (p.35, sampled)` |
| `--nds-ground-phone` | `Darkest Shades Brand Guidelines.pdf (p.33, sampled)` |
| `--nds-studio` | `Darkest Shades Brand Guidelines.pdf (p.33, sampled)` |
| `--nds-paper` | `Darkest Shades Brand Guidelines.pdf (p.32, sampled)` |
| `--nds-plate` | `Renders_Sunglasses_presentation.pdf (sampled)` |
| `--nds-plate-shadow` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-greige` | `Darkest Shades Brand Guidelines.pdf (p.35, sampled)` |
| `--nds-graphite` | `Moodboard_Darkest Shades_2.pdf (p.9, sampled)` |
| `--nds-copper` | `Moodboard_Darkest Shades_2.pdf (p.9, sampled)` |
| `--nds-ink-on-dark` | `Darkest Shades Brand Guidelines.pdf (p.33, sampled)` |
| `--nds-acetate` | `Renders_Sunglasses_presentation.pdf (p.13, sampled)` |
| `--nds-acetate-lit` | `Renders_Sunglasses_presentation.pdf (p.13, sampled)` |
| `--nds-tortoise-blue` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-tortoise-blue-fleck` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-tortoise-red` | `Renders_Sunglasses_presentation.pdf (p.9, sampled)` |
| `--nds-tortoise-red-fleck` | `Renders_Sunglasses_presentation.pdf (p.9, sampled)` |
| `--nds-steel` | `Renders_Sunglasses_presentation.pdf (p.17, sampled)` |
| `--nds-lens-blackout` | `Renders_Sunglasses_presentation.pdf (p.17, sampled)` |
| `--nds-lens-blackout-2` | `Renders_Sunglasses_presentation.pdf (p.9, sampled)` |
| `--nds-lens-smoke` | `Renders_Sunglasses_presentation.pdf (p.25, sampled)` |
| `--nds-lens-mirror` | `Renders_Sunglasses_presentation.pdf (p.33, sampled)` |
| `--nds-lens-cyan` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-lens-amber` | `Renders_Sunglasses_presentation.pdf (p.13, sampled)` |
| `--nds-lens-pale` | `IMG_2691.jpeg (sampled)` |
| `--nds-sw1-frame` | `Renders_Sunglasses_presentation.pdf (p.35, sampled)` |
| `--nds-sw1-lens` | `Renders_Sunglasses_presentation.pdf (p.35, sampled)` |
| `--nds-sw2-frame` | `Renders_Sunglasses_presentation.pdf (p.25, sampled)` |
| `--nds-sw2-lens` | `Renders_Sunglasses_presentation.pdf (p.25, sampled)` |
| `--nds-sw3-frame` | `Renders_Sunglasses_presentation.pdf (p.33, sampled)` |
| `--nds-sw4-frame` | `Renders_Sunglasses_presentation.pdf (p.13, sampled)` |
| `--nds-sw4-lens` | `Renders_Sunglasses_presentation.pdf (p.13, sampled)` |
| `--nds-sw5-frame` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-sw5-lens` | `Renders_Sunglasses_presentation.pdf (p.5, sampled)` |
| `--nds-sw6-frame` | `Renders_Sunglasses_presentation.pdf (p.9, sampled)` |
| `--nds-sw6-lens` | `Renders_Sunglasses_presentation.pdf (p.9, sampled)` |
| `--nds-sw7-lens` | `Renders_Sunglasses_presentation.pdf (p.17, sampled)` |
| `--nds-sw8-frame` | `IMG_2691.jpeg (sampled)` |
| `--nds-sw8-lens` | `IMG_2691.jpeg (sampled)` |
| `--nds-sw9-lens` | `Renders_Sunglasses_presentation.pdf (p.17, sampled)` |
| `--nds-front-w` | `Model 08.pdf` |
| `--nds-lens-w` | `Model 08.pdf` |
| `--nds-lens-h` | `Model 08.pdf` |
| `--nds-bridge` | `Model 08.pdf` |
| `--nds-keyhole` | `Model 08.pdf` |
| `--nds-temple-l` | `Model 08.pdf` |
| `--nds-temple-d` | `Model 08.pdf` |
| `--nds-front-thick` | `Model 08.pdf` |
| `--nds-view-yaw` | `Renders_Sunglasses_presentation.pdf (measured)` |
| `--nds-view-pitch` | `Renders_Sunglasses_presentation.pdf (measured)` |
| `--nds-model-count` | `Renders_Sunglasses_presentation.pdf` |
| `--nds-key-from` | `Renders_Sunglasses_presentation.pdf` |
| `--nds-angle-cut` | `Darkest Shades Brand Guidelines.pdf (p.35, measured)` |
| `--nds-radius` | `Darkest Shades Brand Guidelines.pdf (p.35)` |
| `--nds-radius-pill` | `Darkest Shades Brand Guidelines.pdf (p.4)` |
| `--nds-outline-w` | `Darkest Shades Brand Guidelines.pdf (p.35, measured)` |
| `--nds-display-case` | `Darkest Shades Brand Guidelines.pdf (p.32)` |
| `--nds-wordmark-case` | `transcript.txt` |
| `--nds-spec-title` | `Darkest Shades FONT PAIRS Feb 3.pdf (p.2)` |
| `--nds-spec-body` | `Darkest Shades FONT PAIRS Feb 3.pdf (p.2)` |
| `--nds-spec-display` | `Darkest Shades FONT PAIRS Feb 3.pdf (p.4)` |
| `--nds-spec-label` | `Darkest Shades FONT PAIRS Feb 3.pdf (p.4)` |
| `--nds-wordmark-gap-ratio` | `Darkest Shades Brand Guidelines.pdf (p.45, measured)` |
| `--nds-wordmark-clear` | `Darkest Shades Brand Guidelines.pdf (p.31)` |
| `--npj-slime` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-dream` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-flamingo` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-pineapple` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-white` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-black` | `Puff Junction Brand Guide Compressed.pdf (p.12)` |
| `--npj-ink-on-dark` | `Puff Junction Brand Guide Compressed.pdf (p.13)` |
| `--npj-ink-on-light` | `Puff Junction Brand Guide Compressed.pdf (p.13)` |
| `--npj-src-concrete-top` | `Grinder_1.png (sampled)` |
| `--npj-src-concrete-front` | `Grinder_1.png (sampled)` |
| `--npj-src-concrete-shadow` | `Grinder_1.png (sampled)` |
| `--npj-src-brass-highlight` | `Grinder_1.png (sampled)` |
| `--npj-src-brass-mid` | `R1.png (sampled)` |
| `--npj-src-knurl-lit` | `Grinder_1.png (sampled)` |
| `--npj-src-knurl-shadow` | `Grinder_1.png (sampled)` |
| `--npj-src-checker` | `Grinder_1.png (sampled)` |
| `--npj-src-sweep` | `Grinder_1.png (sampled)` |
| `--npj-src-contact` | `Grinder_1.png (sampled)` |
| `--npj-block-w` | `Weed Grinder_Concrete Top_V01.pdf` |
| `--npj-block-half-h` | `Weed Grinder_Concrete Top_V01.pdf` |
| `--npj-block-corner` | `Weed Grinder_Concrete Top_V01.pdf` |
| `--npj-bore` | `Weed Grinder_Concrete Top_V01.pdf` |
| `--npj-cap-h` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-flange-d` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-drum-d` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-drum-h` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-chamfer` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-top-d` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-knurl-pitch-around` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-knurl-pitch-tall` | `Weed Grinder_Top Lid_V02.pdf` |
| `--npj-view-yaw` | `Grinder_1.png (measured)` |
| `--npj-view-pitch` | `Grinder_1.png (measured)` |
| `--npj-key-from` | `Grinder_1.png` |
| `--npj-button-outline` | `Puff Junction Brand Guide Compressed.pdf (p.20, measured)` |
| `--npj-button-shadow` | `Puff Junction Brand Guide Compressed.pdf (p.20, measured)` |
| `--npj-panel-radius` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-panel-keyline` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-icon-stroke-ratio` | `Puff Junction Brand Guide Compressed.pdf (p.19, measured)` |
| `--npj-halftone-pitch` | `Puff Junction Brand Guide Compressed.pdf (p.21, measured)` |
| `--npj-texture-rotate` | `Puff Junction Brand Guide Compressed.pdf (p.21, measured)` |
| `--npj-font-loud-style` | `Puff Junction Brand Guide Compressed.pdf (p.8)` |
| `--npj-font-text` | `Puff Junction Brand Guide Compressed.pdf (p.9)` |
| `--npj-weight-text` | `Puff Junction Brand Guide Compressed.pdf (p.9)` |
| `--npj-weight-text-strong` | `Puff Junction Brand Guide Compressed.pdf (p.9)` |
| `--npj-h1-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-h1-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-h3-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-h3-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-subtitle-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-subtitle-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-body-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-body-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-body-2-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-body-2-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-caption-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-caption-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-overline-size` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-overline-lh` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-heading-case` | `Puff Junction Brand Guide Compressed.pdf (p.10)` |
| `--npj-wordmark-case-1` | `Puff Junction Brand Guide Compressed.pdf (p.4)` |
| `--npj-wordmark-case-2` | `Puff Junction Brand Guide Compressed.pdf (p.4)` |
| `--npj-wordmark-aspect` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-wordmark-line2-ratio` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-wordmark-line2-width` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-wordmark-line2-right` | `Puff Junction Brand Guide Compressed.pdf (p.4, measured)` |
| `--npj-wordmark-clear` | `Puff Junction Brand Guide Compressed.pdf (p.6)` |
| `--ndg-black` | `Digs_styleguide_boast.pdf (p.23)` |
| `--ndg-blue` | `Digs_styleguide_boast.pdf (p.24)` |
| `--ndg-light-blue` | `Digs_styleguide_boast.pdf (p.25)` |
| `--ndg-white` | `Digs_styleguide_boast.pdf (p.10)` |
| `--ndg-garment-off-white` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.12, sampled)` |
| `--ndg-off-white` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.12, sampled)` |
| `--ndg-garment-sand-blue` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.12, sampled)` |
| `--ndg-garment-sage` | `IMG_4026.jpeg (sampled)` |
| `--ndg-embroidery` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.15, sampled)` |
| `--ndg-label-w` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13)` |
| `--ndg-label-h` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13)` |
| `--ndg-label-ink` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13)` |
| `--ndg-label-wordmark-w` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13)` |
| `--ndg-tag-aspect` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13, sampled)` |
| `--ndg-tag-hole` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13, sampled)` |
| `--ndg-tag-radius` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.13)` |
| `--ndg-neckband-h` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.10)` |
| `--ndg-cuff-h` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.10)` |
| `--ndg-embroidery-w` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.15)` |
| `--ndg-embroidery-h` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.15)` |
| `--ndg-body-weight` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.11)` |
| `--ndg-rib-weight` | `AC-LST-001_Tech Pack_6-15-25.pdf (p.11)` |
| `--ndg-font` | `Digs_styleguide_boast.pdf (p.18)` |
| `--ndg-weight` | `Digs_styleguide_boast.pdf (p.18)` |
| `--ndg-track` | `Digs_styleguide_boast.pdf (p.18)` |
| `--ndg-wordmark-case` | `Digs_styleguide_boast.pdf (p.6)` |
| `--ndg-wordmark-aspect` | `Digs_styleguide_boast.pdf (p.6, measured)` |
| `--ndg-wordmark-clear` | `Digs_styleguide_boast.pdf (p.7)` |
| `--ndg-script-scale` | `Digs_styleguide_boast.pdf (p.8, measured)` |
| `--ndg-script-rise` | `Digs_styleguide_boast.pdf (p.8, measured)` |

## C. The real component behind each teaser

Gallery order. Each entry names the real component and its files, describes its anatomy and its behavior, and ends with the one line that bounds the teaser. Where the brief's count or motion has no counterpart in the source (a seven-phase strip, nineteen nodes, a traveling pulse, an assembling tile field, an arc, a gauge, a map) it is said so; those are the brief's, marked pinned or derived in the token files, and the source supplies everything else.

### 1. fork-rail, GTM OS

**Real component:** the live-call spine and its buyer-response fork in the discovery room. Files: `src/discovery-studio/v4/DiscoveryStudioV4.tsx`, `src/discovery-studio/v4/discovery-studio-v4.css`, `src/discovery-studio/state.ts`, `src/discovery-studio/lib/load-frameworks.ts`, `js/discovery-segment-runtime.js`; the older vertical rail in `src/discovery-studio/components/SegmentRail.tsx` and `RecoverRail.tsx`.

**Anatomy.** A call is one framework of exactly ten segments in fixed order; each segment holds three talking points, each talking point three buyer-response branches, and each branch carries the line to say next plus up to two jump actions that can leave for another segment. The shipped surface draws the ten segments as a horizontal row of small pill chips (11px, 20px radius, a mono ordinal, 4px apart), one lit with an orange underline, worked ones turned forest green, essential ones flagged with a small amber dot. Below it one open moment shows the question in a 24px serif, a "listen for" line with a 2px blue left rule, and the fork itself: a wrapped row of response pills, the picked one ringed orange, which reveals an answer block with a 3px forest left rule and blue mono jump links. A recover rail lives in a drawer: red-ruled cards (3px red left rule) whose jump routes the seller back to a specific segment. Tone is carried by 3px left rules in five colors; red is carried by jump actions and recover cards.

**Behavior.** Picking a segment chip lights it and dims the one before; tapping a response pill picks it and opens the answer beneath; a jump link on an answer moves the lit chip to another segment (a fork leaving the rail); a recover card's jump brings the lit chip back (the loop onto the spine). Every transition is 120–320ms with a decelerating curve; nothing paces the call and nothing pulses along the row. Under the emergency mode the row collapses to the current segment and the recover rail is forced open.

**What the teaser takes and nothing else:** a ten-segment horizontal rail with pill nodes, forks that leave it, a red node on a branch, and a recovery arc that rejoins it; the traveling pulse, the lit path, and the loop timing are the brief's.

### 2. lesson-card, AESDR

**Real component:** the peelable deck card layered with the lesson player's progress track. Files: `components/DeckStack.tsx`, `components/DeckStack.module.css`, `content/lessons/html/lesson-01/aesdr_course01_v1.html`.

**Anatomy.** The deck card is a white landscape face (about 1.58:1) with a 1px light hairline border, 40px padding, no radius: a two-digit numeral top-left in Barlow Condensed 900 at 64px shimmering with the iris at 60% opacity, a mono duration label top-right, a Barlow Condensed 700 uppercase title, a body line, a 2px iris rule across the bottom edge at 50%, a mono peel hint bottom-right, and a dog-ear in the top-right corner (28px, a 225° gradient that reads as a lifted page corner). Behind it two offset shadow cards and up to three real cards fanned 4px and 0.6° per depth. The lesson player carries the progress in its topbar: a mono label beside an 80×2px track in `#E5E1DC` with an iris fill whose width steps once per screen.

**Behavior.** Click, Enter, Space or the right arrow peels the active card around its left edge (`rotateY(-155deg) rotateZ(-4deg) translateX(-8%)`, 650ms on `cubic-bezier(.7,0,.2,1)`, fading over 450ms) while the card beneath slides up into the slot; the dog-ear grows from 28 to 52px on hover over 300ms. In the lesson, Continue mounts the next screen with a 420ms fade-up of 16px and the progress fill widens over 800ms on `cubic-bezier(.4,0,.2,1)`.

**What the teaser takes and nothing else:** one paper card with a hairline border, a display headline, two body lines, a 2px iris progress bar that steps, a lifted corner, and the left-edge page turn on click or Enter.

### 3. frames, NRDI, DARKEST SHADES

**Real component:** the nine frame models and the studio render set. Files: `Renders_Sunglasses_presentation.pdf`, `Model 01.pdf` … `Model 09.pdf`, `IMG_2691.jpeg`, `Darkest Shades Brand Guidelines.pdf`.

**Anatomy.** Nine sunglass models exist as A3 drawings with millimetre dimensions and as renders on a flat light-grey sweep: three-quarter front at about 35° yaw and 10° above the lens plane, one large soft key from upper-front-left, a very soft wide contact shadow, no floor reflection, no rim light, long white specular streaks along the brow bar and temple edges. The hero silhouette is model 08, a navigator with a straight brow bar, squared-off D lenses, a keyhole bridge under a 20mm bar, thick tapered temples (front 154mm, lens 56×44mm, temple 153mm). Real finishes are gloss black acetate, blue tortoise, and red/black tortoise; real lens tints are blackout, smoke gradient, silver-mirror gradient, ice cyan, amber yellow, and a pale blue-grey. The guide's own pill chips are 1px black outlines with square-cornered outline buttons; nothing else in the brand is rounded or filled.

**Behavior.** Nothing in the source moves. The models are shown as a still set; the only implied motion is the studio light reading across a gloss front as a streak.

**What the teaser takes and nothing else:** one three-quarter silhouette in model 08's proportions, nine swatches standing for nine models (seven real frame-and-lens pairings, two derived), the studio key from upper-left, the brow-bar streak, and the outline-only chip vocabulary; the floor reflection, the light sweep, and the swatch cycling are the brief's.

### 4. heat-dial, an internal sales cockpit

**Real component:** the composite account score and its tier badge, mirrored by the three-tier priority meters. Files: `src/lib/book/scoring.ts`, `src/lib/prospect-scoring.ts`, `src/components/hml-priority-panel.tsx`, `src/app/<root surface>.module.css`, `src/app/groundwork/groundwork.module.css`, `src/app/groundwork/instrument.tsx`.

**Anatomy.** A 0–100 score with three fixed cut lines: low 0–44, medium 45–69, high 70–100. It renders as a small pill badge (12px/700, 6px radius) colored by tier, as a sortable column, and, in the priority panel, as three stacked 6px pill-track meters (one per tier) whose fills are red, amber and green. The tick vocabulary the room uses for heat is a 4×11px bar with a 1px radius: solid amber when something burns today, amber at 45% when it is dated inside the week, a 0.14-alpha hairline when it merely keeps. The masthead instrument beside it is an 8px burn bar on a 0.07-alpha track that drains as the working window empties, its count turning red and throbbing inside the last five minutes.

**Behavior.** The score is recomputed on every read; a demand read is scaled by a confidence factor of 1, 0.85 or 0.7 before it blends, so a high reading can settle back into the middle band. Meter fills animate over 320ms on `cubic-bezier(0.2,0,0,1)`; the burn bar's width moves over 0.4s; the late state throbs at `1s steps(2,end)`. Nothing is draggable.

**What the teaser takes and nothing else:** a three-band 0–100 scale with cut lines at 45 and 70, the tick strengths (solid, half, hairline), the amber-only "on" signal with red reserved for an alarm, and the 320ms/0.4s snap; the arc, the needle, the sweep-hold-settle loop, and the drag and arrow-key nudge are the brief's.

### 5. signal-strip, GTM OS

**Real component:** the per-account heat engine and the account chip that shows its score. Files: `src/signal-console/lib/heat.ts`, `src/signal-console/v4/lib/attention.ts`, `src/signal-console/v4/SignalConsoleV4.tsx`, `src/signal-console/v4/signal-console-v4.css`.

**Anatomy.** A score from 0 to 99, never stored, summed at render time from each signal's base weight times a six-step recency decay (1.0 within 14 days, then 0.9, 0.75, 0.55, 0.3, 0.1), with four bands above it. The chip that carries it is white with a 1px hairline, 12px radius, a 3px left rule in the band color, a 40×5px heat bar (pill track at 8% ink, an ember-to-red gradient fill sized to the score), the numeral in mono 11px 600 at 42% ink, and a 7px status dot. A shape strip above the field is a 12px pill bar of four flex segments in the band colors, re-proportioning over 0.3s on `cubic-bezier(0.22,0.61,0.36,1)`. The room has no waveform; its only data-viz is a single bar plus a sentence.

**Behavior.** An earlier signal's contribution falls as it ages without any new input, so the numeral and band of an untouched account move over time (18 on day ten, 16.2 on day twenty, 13.5 at day forty-five, and so on); flagging a signal drops it to zero immediately. The product does not animate the numeral itself.

**What the teaser takes and nothing else:** a row of phase chips lighting in order, one mono numeral, the ember-to-red heat bar, and the retroactive re-score in which an earlier chip changes after later ones light; the seventh chip, the waveform, and the ticking numeral are the brief's.

### 6. coach-exchange, AESDR

**Real component:** the cold-call simulator inside the lesson player, with the accountability gate and the two-voices layout for anatomy. Files: `content/lessons/html/lesson-01/aesdr_course01_v1.html`, `design-canon/03-css-tokens/_gates.css`, `tools/design-seed/surface-two-voices.html`, `deliverables/prototypes/dashboard-b-shimmer-variants.html`, `components/landing-sequence/animator.ts`.

**Anatomy.** A three-stage row of 28px dots joined by 1px lines, a black scenario panel, then three lines the learner could say as white cards with a 1px border. On a pick the chosen line locks and a one-sentence feedback line appears beneath it in mono 9px, prefixed by a green tick or a coral cross: that sentence is the coach. The prototype's dashboard kicker carries the iris as a 2px underline (`bottom: -2px`, 300% background, 4s slide); the shipped dashboard carries it as text shimmer on the reply's closing phrase. The landing page's typewriter is the only typed reveal in the product: serif italic, 32ms per character plus up to 18ms jitter, a 2px crimson cursor blinking at 0.8s, and a blur-dissolve (12px, scale 1.04, 600ms) when a line is replaced.

**Behavior.** A wrong pick throws a comic popup, closing it lets the learner pick again, and the second pick produces a different feedback sentence; a right pick reveals a next-stage button. Feedback appears instantly in the product; the typing and the dissolve belong to the landing sequence.

**What the teaser takes and nothing else:** a learner line and a one-sentence coach reply as two serif blocks, the 2px iris underline that sweeps, the typewriter timing for the reply, and the second-attempt cycle in which the learner line is replaced and the reply changes.

### 7. turntable, NRDI, PUFF JUNCTION

**Real component:** the concrete-and-brass grinder, from its drawings and renders. Files: `Weed Grinder_Concrete Top_V01.pdf`, `Weed Grinder_Concrete Bottom_V01.pdf`, `Weed Grinder_Top Lid_V02.pdf`, `Weed Grinder_V01.pdf`, `Grinder_1.png`, `Grinder_2.png`, `Grinder_3.png`, `R1.png`, `0002.png`, `Puff Junction Brand Guide Compressed.pdf`.

**Anatomy.** Two identical square concrete halves (85×85mm, each 20.9mm tall, R3 vertical corners, a hairline seam at mid-height) stacked under a brass cap: a Ø62.75mm flange sunk into a Ø63 bore with about 2mm of lip showing, a Ø55×10mm drum cut with a straight diamond knurl (2.11×2.48mm pitch, about 82 columns and 4 rows), a 2mm 45° chamfer ring, and a Ø50.83mm brushed flat top. The studio renders put it on a white sweep with one soft key above and slightly in front, a tight contact shadow and no reflection; the concrete reads as matte mid grey with a faint speckle, the brass as satin gold darkening toward the silhouette, the chamfer ring as the brightest line. The wordmark is two lines, `puff` lowercase in the heaviest italic over `JUNCTION` uppercase, small and tracked, right-aligned under it; Slime on black.

**Behavior.** Nothing in the source moves; the render set gives three-quarter, top-down, exploded and cutaway stills.

**What the teaser takes and nothing else:** the closed grinder in its drawn proportions, its concrete and brass materials under one key light, and the typeset wordmark small beneath in Slime; the turntable rotation, the floor glow and reflection, and the rim light are the brief's.

### 8. territory-map, an internal sales cockpit

**Real component:** the stage board's node track and the deal room's climb bar, with the proximity rings for zoning. Files: `src/app/dashboard.module.css`, `src/app/dashboard-client.tsx`, `src/app/room/room.module.css`, `src/lib/room/stages-view.ts`, `src/lib/groundwork/proximity.ts`, `src/app/<root surface>.module.css`.

**Anatomy.** The cockpit has no map. Its node-and-route structures are: a row of seven 32px round nodes with 2px connector half-lines that light only behind completed nodes and a 1.5px dotted halo ring 7px outside every node; a 5px climb zone with a diagonal-stripe track (6px on, 6px off at -60°), five-pixel nodes, a gradient gain advancing to the current node and a 4px colored cap at its end; and four concentric proximity bands (home metro, a day's drive, a short flight, far) computed as a queue tie-break and marked only for the innermost ring. The daily ledger's 2px rail with 10px dots is the room's street-and-intersection vocabulary.

**Behavior.** The active node glows and pulses an expanding ring (1.9s ease-out, scale 1 to 1.45, opacity 0.7 to 0); connectors light in sequence as nodes complete; a needs-action node turns red and pulses at 1.5s; the climb gain advances over the token durations.

**What the teaser takes and nothing else:** clusters as nodes with dotted halos, a route as connectors lighting in sequence behind a pulse, the ring pulse's run-out as the fade, and concentric zoning at the ink-ladder alphas; the city block grid, the lake edge and the river cut are the brief's.

### 9. territory-tiles, GTM OS

**Real component:** the territory room's axis rail and 300-account allocation bar. Files: `src/territory-architect/v4/TerritoryArchitectV4.tsx`, `src/territory-architect/v4/territory-architect-v4.css`, `src/territory-architect/lib/types.ts`, `src/territory-architect/state.ts`.

**Anatomy.** A six-column grid of tiles with an 8px gap (three columns under 860px): each tile white, 1px border at 9% ink, 10px radius, a glyph at 40% ink, a 12.5px name and a 10.5px description; hover darkens the border, the active tile gets an orange border with a 1px inset ring and its glyph turns orange. Beneath, a 26px allocation bar (7px radius, hairline) divided into flex segments, one per tier in the tier's hex with a white mono count, then an open segment for what remains of the 300-account ceiling. A two-column division grid follows, each card with a 3px top rule in its tier color. The library's Offset rule lets exactly one item per zone break rank with a heavier shadow and an orange edge.

**Behavior.** Switching the axis re-filters the divisions and rewrites the register sentence with a 120ms border-color change; adding, retiering or retagging an account snaps the allocation segments to their new proportions; crossing the ceiling flips the gauge to at-cap and disables adds. No tile drifts or assembles.

**What the teaser takes and nothing else:** a field of 10px-radius glass tiles, one forward tile lifted per the Offset rule with an orange edge and a stronger border, and the hover or focus lift; the scattered drift-in, the locking into a territory shape, and the z-depth are the brief's.

### 10. course-arc, AESDR

**Real component:** the dashboard's sequential course timeline. Files: `app/dashboard/page.tsx`, `deliverables/prototypes/dashboard-b-shimmer-variants.html`, `components/brand/Divider.tsx` (the dotted path), `utils/progress/types.ts` (the count).

**Anatomy.** Twelve rows in order down a 1px connecting line: each row a 16px circle node (completed: 2px crimson border and fill with a small cream tick; current: 2px ink border, transparent fill, `0 0 12px rgba(139,26,26,.2)` glow; future: 1px light border), a mono 9px label at 0.2em, the title in Playfair italic 700 at 22px in ink for the current row and muted for the rest, and a serif italic teaser sentence whose closing phrase shimmers with the iris. The row after the current one sits at 50% with an "up next" tag; rows further ahead are at 20% and blurred 2px. The `dotted-path` divider is the product's only curve: a shallow quadratic arc, 1.2px, dashed 2/6.

**Behavior.** When a lesson completes, that node fills crimson with its tick and its connector turns crimson over 0.5s, the ink ring and glow move to the next node over 0.3s, the following row un-blurs from 20% to 50%, and the header count changes; titles change only by page re-render.

**What the teaser takes and nothing else:** numbered markers on a path with a passed/current/future state vocabulary, the current node's ink ring and crimson glow, the 0.3s node and 0.5s line timings, and a Cormorant title beside the current marker; seven markers rather than twelve, the arc's curve, and the title crossfade are the brief's.

### 11. garment-tag, NRDI, DIGS

**Real component:** the long-sleeve thermal crew's woven neck label and hangtag placeholder, with the physical sample. Files: `AC-LST-001_Tech Pack_6-15-25.pdf`, `AC-LST-001_Tech Pack_9.23.24_2.pdf`, `IMG_4026.jpeg`, `Photo May 13 2025, 4 04 56 PM.jpg`, `IMG_4024.jpeg`, `Digs_styleguide_boast.pdf`.

**Anatomy.** A 215gsm cotton thermal (a fine honeycomb face) with a 1in fold-over 2×2 rib neckband topstitched with a row of triple coverstitching, a garment wash that reads lighter along every seam and edge, and a small navy satin-stitched wordmark centered below the back yoke. Inside the back neck, a sew-in woven label 3×2.25in (4:3 landscape), white ground with the black lowercase wordmark centered in its upper third at about 40% of the label width, two tiny centered lines beneath, the size word at the bottom, a lockstitch just inside its edges; the guide's second label reference is a grosgrain weave with fine horizontal ribs. The hangtag is a placeholder in every revision: a plain portrait card about 1:1.6 with one round hole near the top edge, square corners, attached by a plastic tack at the wearer's left shoulder-neck seam. Every ground in the brand is a flat single colour: black, blue `#0042e5`, light blue `#f0f5ff`, white.

**Behavior.** Nothing in the source moves; the only sequence defined is the polybag fold (sleeves in, bottom quarter up, fold in half).

**What the teaser takes and nothing else:** a folded thermal corner with its ribbed neckband and lighter seams, the 4:3 white woven label with the lowercase wordmark and two tiny lines, a 1:1.6 hangtag with a top hole on a tack, and the brand's flat card colours; the tag turn and the light pass are the brief's.

### 12. task-tiers, an internal sales cockpit

**Real component:** the daily outbound room's three-level heat ladder and its winged stage. Files: `src/lib/groundwork/day.ts`, `src/app/groundwork/page.tsx`, `src/app/groundwork/groundwork.module.css`, `src/app/room/room.module.css` (the spring registers, a second candidate).

**Anatomy.** A queue of waiting moves ranked by rule weight, then a composite account score, then proximity, with a three-level heat ladder: level 3 burns today (a perishable trigger or a move carried from yesterday), level 2 is dated inside the week, level 1 keeps until worked. On the surface the levels are not rows but a tick strength beside each name (4×11px: solid amber, amber at 45%, hairline) and the ink weight on the name, with the reason whispered beneath in 10.5px. The stage is one white surface with a 3px orange bottom edge laid out as three columns (180px, fluid, 200px): done stamps on the left, the one move large in the center, the waiting queue on the right, capped at six with the rest counted in a footer. Evidence chips are mono 10.5px at 0.1em with a 1px border at 22% and a 3px radius.

**Behavior.** The queue is re-derived on every read, never stored. A slot cap lets one rule hold at most two leading slots; its third and later hits sink below every other rule's hits, still ranked, never lost. Working the center move stamps it into the left wing and the next item rises to the center; take-back returns it to the right wing; an item left unworked yesterday returns promoted to the top level and marked carried. The level is otherwise fixed per rule: a rule's items always sit at one level, the carried flag is the only promotion, and nothing demotes an item when its trigger lapses; the only sink is the slot-cap overflow (two leading slots per rule, three for a seated move), which drops below the other rules' hits. The queue stylesheet declares no motion of its own beyond the masthead's throb; the 160ms landing from 4px above is the deal room's register spring (`src/app/room/room.module.css`), and the 120ms and 200ms durations are the kit's quick and base steps (`<vendored kit>/css/tokens.css`).

**What the teaser takes and nothing else:** three horizontal tiers standing for the three heat levels, five chips in the evidence-chip grammar with the tick strengths, one chip sinking from the top tier to the bottom by the slot-cap rule, the deal room's 160ms register spring for the landing, and the kit's 200ms base step for the rebalance; the tiers drawn as rows rather than tick strengths, and the spring borrowed from the neighbouring room, are the brief's translation.

### 13. constellation, GTM OS

**Real component:** the motion map at the foot of every room, with the room registry for the count. Files: `src/lib/ground/GroundLine.tsx`, `src/lib/ground/ground.css`, `src/lib/ground/motion.ts`, `src/lib/palette/registry.ts`.

**Anatomy.** A near-invisible ground line across the foot of the viewport (a 2.5px stroke at 40% that thickens on hover) with a small raised tab dead-center. Touched, a white panel rises from beneath the room (2.5px navy top border, `translateY(103%)` to 0 over 0.45s on `cubic-bezier(0.22,0.61,0.36,1)`) holding the whole product as a flow: twenty-two rooms in six stage columns from entry to handoff, each column with a hairline left border and a small mono stage label, each room a 7px-radius tile with a 12px label and a 10px description. The room you are in is a solid navy tile; the system's suggested next room is a dashed orange ring on a 5% orange ground. The product draws no lines between rooms, no halo, and no parallax; adjacency is the column order.

**Behavior.** Click the line or press G and the panel rises; a ranker computes one suggested room from observations, deal recovery rank and account heat and lights it; typing filters the tiles in place, dimming non-matches to 22%; Escape, the scrim or a pick sinks the panel and navigation carries continuity into the destination.

**What the teaser takes and nothing else:** a loose field of small room nodes arranged in a left-to-right flow of stages with one lit and one suggested, in glass depth; the nineteen count, the connecting light lines, the parallax drift and the wave pulse are the brief's.
