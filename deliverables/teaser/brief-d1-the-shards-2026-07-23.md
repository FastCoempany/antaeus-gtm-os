# Creative Brief · D1 — THE SHARDS
*Interface cinematography. A gallery of a machine's parts.*

**Runtime:** 60s · **Aspect:** 1920×1080 (cut-downs listed) · **Status:** brief — build-ready
**Register:** awe, restraint, object-confidence. The film never raises its voice.

---

## 1 · The stage

- **Space:** a dark exhibition hall, not a screen. Background `#0a1424`
  (near-black navy — deliberately NOT the product's bright field; this is the
  theater the product's parts are staged in). A very faint cool radial wash
  behind each exhibit (`rgba(37,99,235,.05)`, huge radius) so the dark never
  reads flat.
- **The light line:** a single 2px line of pale light (`#f6f8fc` at 30%
  opacity) runs through the whole film — the camera's rail. It is never named.
  In the final shot it becomes the ground line. Its glow tightens (opacity 30%
  → 70%) as each exhibit is approached, and relaxes after.
- **Depth:** three parallax planes. Foreground (the exhibit, scale 1.0),
  midground (supporting mono whispers, scale 0.8, 40% opacity), background
  (drifting dim content, scale 0.55, 14% opacity). Camera moves translate the
  planes at 1.0× / 0.6× / 0.3× for real depth.
- **Camera:** one continuous rightward dolly, ~40px/s at rest, easing to
  ~12px/s while an exhibit holds center. No cuts within Act structure — the
  five exhibits are stations on one move. (Production: each station is still
  shot as its own scene; the seam is hidden in the constant-velocity travel
  between stations over pure dark.)

## 2 · Type system

| Role | Face | Size | Color |
|---|---|---|---|
| Exhibit headline (the serif truth) | DM Serif Display | 64–84px | `#f6f8fc` |
| The ignited object (a name, a number) | DM Serif Display | 120–200px | `#f6f8fc` / `#e6701e` when ignited |
| Machine whisper | JetBrains Mono, 700, +0.16em, uppercase | 15–17px | `rgba(246,248,252,.42)` |
| Voice tags (YOU / THE MACHINE / THE BUYERS) | JetBrains Mono 700 | 13px | mono-dim; BUYERS in `#e6701e` |
| End card | brand lockup rules (spec 10) | — | — |

**Color law:** orange appears exactly twice in the film — the Boeing ignition
(Exhibit 1) and the Starbucks reply (Exhibit 2). Forest green appears exactly
once — the coverage bar filling (Exhibit 4). Everything else is pale ink on
dark. Rationed color IS the drama.

## 3 · Motion vocabulary

- **Ease:** the app's own settle — `cubic-bezier(.3,.9,.3,1)` — on every
  entrance; 500–700ms. Exits are faster (300ms) and fall slightly downward
  (things are heavy here).
- **Ignition:** a name/number lighting up = color arrives from the inside out
  (text-shadow bloom 0 → 24px → 8px over 600ms) + a 2% scale breath.
- **Ticking:** numeric changes flip per-digit (roll-up 240ms per digit),
  never crossfade.
- **The line-draw:** threads/paths draw with `stroke-dashoffset`, 900ms,
  settle ease.
- **Forbidden:** bounces, spins, blurs-as-transitions, particles, anything
  cute. Reduced-motion delivery: cuts replace travels; no other change.

## 4 · The script (final — every on-screen string)

The film has no VO track in v1; these strings ARE the narration.

1. `S1 whisper` — `TWENTY-NINE ACCOUNTS · WATCHED`
2. `S1 headline` — **The one move that matters. Picked. With the reason attached.**
3. `S1 mono` — `HEAT 62 · FRESH SIGNALS · NEXT STEP DUE IN 3 DAYS`
4. `S2 headline` — **It runs while you work.**
5. `S2 wire lines` (tagged, sliding):
   - `YOU` — You reached out to Boeing — counted.
   - `THE MACHINE` — Calendar — Thursday with United is confirmed.
   - `THE MACHINE` — Nordstrom still has no dated next step.
   - `THE BUYERS` (ignites) — **Starbucks replied — after 20 quiet days.**
6. `S2 counter` — `13 → 14` with mono under: `TODAY · LOGGED OR CAPTURED`
7. `S3 headline` — **One account. Its whole life. One thread.**
8. `S3 waypoints` (mono, along the drawn line) — `THE SIGNAL · THE MESSAGE ·
   THE CALL · THE DEAL · THE FAVOR`
9. `S3 sub` (small serif) — *Rebuilding the production workforce after the
   strike — thousands of factory hires.*
10. `S4 left column` — THEIR SIDE — **150 security questions before anything
    moves.**
11. `S4 right column` — YOUR LINE — **Your papers already answer 118.**
12. `S4 mono` — `SOC 2 TYPE II · PEN-TEST · SUBPROCESSORS · DPA`
13. `S5 headline` — **Everything compounds into what your first hire opens on
    day one.**
14. `S5 book page whispers` (settling fragments, mono) — `WHO HITS, WHO
    MISSES · THE OUTREACH THAT LANDED · WHY WE WIN`
15. `End card` — `ANTAEUS` · **The revenue system a first hire can run.** ·
    `antaeus.app`

## 5 · Shot board

| # | TC in–out | Station | What happens |
|---|---|---|---|
| 01 | 0:00–0:04 | Approach | Black. The light line fades in, running off both edges. Camera already moving. Whisper (line 1) drifts past on the midplane. |
| 02 | 0:04–0:12 | **Exhibit 1 · The Pick** | Dozens of dim account names drift on the background plane (real roster: Delta, FedEx, Marriott, Nike…). One — `BOEING` — ignites orange (color law), scales to 160px, holds center. Headline (2) settles beneath; mono (3) under that. |
| 03 | 0:12–0:14 | Travel | Exhibit 1 releases (falls dark), pure travel over dark. Line glow relaxes. |
| 04 | 0:14–0:24 | **Exhibit 2 · The Wire** | A vertical thread of tagged sentences (5a–c) slides upward past camera on the fore plane. Headline (4) holds on midplane. The Starbucks line (5d) arrives LAST and ignites — second orange. The counter (6) flips 13→14 top-right of the thread. |
| 05 | 0:24–0:26 | Travel | Dark. |
| 06 | 0:26–0:36 | **Exhibit 3 · The Thread** | `BOEING` again, pale this time (already known to us). The line-draw runs left→right through five waypoint nodes (8), each node blooming a 1-line mono label. Sub-serif (9) fades under the first node. Headline (7) above. |
| 07 | 0:36–0:38 | Travel | Dark. |
| 08 | 0:38–0:48 | **Exhibit 4 · The Face-off** | Two column masses slide in from opposite edges (10, 11) and STOP hard, facing. Between them a thin horizontal bar; 118 of 150 segments fill in forest green (the only green of the film), ~2.2s. Mono (12) beneath the bar. |
| 09 | 0:48–0:50 | Travel | Dark — but now fragments from ALL prior exhibits drift alongside the camera, loosened. |
| 10 | 0:50–0:57 | **Exhibit 5 · The Book** | The drifting fragments sediment downward into an open book resting on the light line. Page whispers (14) settle as they land. Headline (13). |
| 11 | 0:57–1:00 | **End** | The book fades; the line brightens to full; the Grounded-A settles onto it (its feet exactly on the line). End card (15). Hold 2s. |

## 6 · Sound (editor layer — the film must also work mute)

- Bed: a low, dry room tone + a slow sub pulse (~52 BPM) that the ignitions
  sync to. No melody until Exhibit 5, where a single sustained warm chord
  enters with the settling.
- Hits: ignitions get a soft felt-piano strike; the counter tick gets a
  mechanical click; the face-off column stop gets a deep thud; the bar-fill a
  rising shimmer that cuts dead at 118.
- End: silence for the last second before the card. Silence is the button.

## 7 · Cut-downs

Each exhibit is a self-contained 8–12s social shard (1:1 and 9:16 recompose:
exhibit centered, headline below). The Pick and the Face-off are the two
strongest singles.

## 8 · Production notes

- Built as one authored HTML/CSS/JS stage (`stage-shards.html`), scenes keyed
  by a `?scene=` param; filmed per-station on the proven Xvfb + x11grab rig at
  30fps; travel seams composited in ffmpeg with matched constant-velocity
  segments.
- All strings pass the voice gate before shooting (run the validator over the
  stage's script constants).
- Fonts self-hosted for the stage (no runtime Google Fonts dependency at
  shoot time).

## 9 · Acceptance checks

- One-frame test: any paused frame is recognizably Antaeus and §13-legible.
- Color law: exactly two orange moments, one green moment. Count them.
- No frame contains a rectangle that reads as "a window," "a card grid," or
  "a browser." No cursor anywhere.
- Mute test: full comprehension with sound off.
