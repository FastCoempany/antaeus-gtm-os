# Creative Brief · D3 — THE DAY
*One working day, read entirely off the instruments. The operator is never seen.*

**Runtime:** 80s · **Aspect:** 1920×1080 · **Status:** brief — build-ready
**Register:** warm, human, quietly suspenseful. The most scoreable of the four
— this is the one that feels like a film about a person, though no person
appears.

---

## 1 · The stage

- **Space:** the bright field — but the field itself tracks the clock. This
  is D3's signature: the background temperature follows the day.
  - `6:04 AM` — cool pre-dawn: `#eef2fa` with a blue cast
  - `9:00 AM` — full bright: `#f6f8fc` (the product's true field)
  - `4:00 PM` — a faint warm slant: `+rgba(230,112,30,.03)` wash from the left
  - `9:00 PM` — dimming: field falls toward `#dfe5f0`
  - `11:47 PM` — near-navy dusk: `#141f38`, type flips to pale
  The shift is continuous and slow — nobody should catch it moving, everyone
  should feel the hour.
- **The clock:** top-right corner, mono, 20px, always present after the first
  beat. It is the film's metronome and its honesty device: it JUMPS the way a
  real day jumps (6:04 → 7:31 → 9:12…), clustering in the morning, going long
  in the afternoon. Each jump rolls per-digit.
- **The dot:** the Live Edge's breathing dot (7px, forest, 3.2s breath) sits
  low-left from frame one to the final frame. It is the only element that
  never leaves. The film opens on it and closes on it.
- **Camera:** locked. Beats replace camera moves; the day is steady even when
  the work isn't.

## 2 · Type system

| Role | Face | Size | Color |
|---|---|---|---|
| The hour's event (serif) | DM Serif Display | 58–72px | ink (pale after dusk) |
| Voice tags | JetBrains Mono 700 | 13px | `YOU` ink-dim · `THE MACHINE` `#2563eb` · `THE BUYERS` `#e6701e` |
| The clock | JetBrains Mono 700 | 20px | ink-dim (pale at night) |
| Counts / numbers | DM Serif Display | 110px | ink |
| Machine sublines | JetBrains Mono, +0.14em | 14px | 40% ink |

**Color law:** the tags carry the only standing color. One full-orange moment
(10:48). One full-red moment (3:40). Forest appears twice: the breathing dot
(always) and the final settle.

## 3 · Motion vocabulary

- **Arrival:** every event enters like a wire line — a 12px rise + fade-in
  (400ms settle ease) with its tag stamping 80ms after the text lands.
- **Aging:** when the next beat arrives, the previous event doesn't exit — it
  SHRINKS upward into a compressed "earlier today" stack (top-left, mono,
  40% opacity), the accumulator made visible. By 11:47 the stack holds the
  whole day.
- **The tick:** count digits roll; the clock digits roll; nothing crossfades.
- **The 3:40 mute:** on the red beat, the background wash pauses its drift,
  the dot holds mid-breath for one cycle. The system doesn't blink often —
  when it does, you feel it.
- **The settle (11:47):** the "earlier today" stack loosens line by line and
  sediments downward into the open book. Slowest motion in the film (~4s).

## 4 · The script (final)

1. `6:04 AM` — *(the dot begins breathing)* mono: `THE WORKSPACE IS AWAKE`
2. `7:31 AM` — serif: **Here's the one move that matters today.** subline:
   `OUTBOUND TO BOEING · THE REASON ATTACHED`
3. `9:12 AM` — the count rolls `4 → 5 → 6`; serif: **Captured. Counted.
   Nobody logged anything.** tag: `YOU`
4. `10:48 AM` — THE moment (full orange field pulse behind the type):
   **Starbucks replied — after 20 quiet days.** tag: `THE BUYERS`
5. `1:15 PM` — tag `THE MACHINE`: **Calendar — Thursday with United is
   confirmed.** subline: `NOTHING FOR YOU TO DO — IT'S ON THE BOOKS`
6. `3:40 PM` — red, unadorned: **Nordstrom has no dated next step. 21 days
   quiet.** subline, after a beat: `THE SYSTEM SAYS THE HARD THING TOO`
7. `6:22 PM` — the face-off fragment: **Their 150 questions. Your 118
   answers.** the bar filling, forest.
8. `9:30 PM` — quiet beat, small serif: *Nothing since 6:22. That's fine.
   The day is counted.* (the accumulator's honesty — the film admits the
   lull instead of faking one more event)
9. `11:47 PM` — the settle. serif over the book: **Every day ends in the
   book your first hire opens on day one.**
10. Final frame — the dot, still breathing, alone in the dusk. mono:
    `6:04 AM TOMORROW`
11. End card: `ANTAEUS` · **It runs while you work.** · `antaeus.app`

## 5 · Shot board

| # | TC in–out | Clock | What happens |
|---|---|---|---|
| 01 | 0:00–0:06 | 6:04 | Pre-dawn field. The dot fades in low-left and takes its first breath. Mono line (1). The clock appears with its first roll. |
| 02 | 0:06–0:14 | 7:31 | Beat 2 arrives (rise-in). Holds 6s — the longest morning hold; this is the product's core promise given the day's first light. |
| 03 | 0:14–0:22 | 9:12 | Beat 2 ages into the stack. The big count rolls 4→5→6 center-frame; beat 3 text under it. |
| 04 | 0:22–0:31 | 10:48 | THE ignition: field pulses warm, type lands big, orange tag. Longest single hold (7s). The stack and dot keep their places — the world doesn't stop, it brightens. |
| 05 | 0:31–0:38 | 1:15 | Blue-tag machine beat (5). Afternoon warmth beginning in the field. |
| 06 | 0:38–0:47 | 3:40 | The red beat (6). Background drift pauses; dot holds one breath. Subline lands late. This is the trust-building shot — severity as care. |
| 07 | 0:47–0:55 | 6:22 | The face-off fragment (7); forest bar fills. Field warm-slanted now. |
| 08 | 0:55–1:01 | 9:30 | The lull beat (8), small type in a dimming field. The bravest shot in the film: paying for honesty with runtime. |
| 09 | 1:01–1:10 | 11:47 | Dusk-navy. The day's stack loosens and settles into the open book (9). |
| 10 | 1:10–1:15 | — | The book fades. The dot alone, breathing. Mono (10). |
| 11 | 1:15–1:20 | — | End card (11). Hold. |

## 6 · Sound

The music-forward direction. One piece scores the whole film — sparse piano
that gains instruments with the day (a low string at 10:48, a pulse at 6:22)
and strips back to solo piano at dusk. Sound-design accents under it: the
dot's first breath (soft intake), digit rolls (mechanical ticks), the 10:48
hit (warm swell), the 3:40 mute (everything drops except piano for 2s), the
settle (paper). The final `6:04 AM TOMORROW` gets the intake sound again —
the loop closed.

## 7 · Cut-downs

Every clock beat is a native 6–9s vertical story (9:16 recomposes cleanly:
clock top, event center, dot bottom). The 10:48 ignition and the 3:40 red
beat are the two singles; run them as a pair ("it celebrates you / it levels
with you").

## 8 · Production notes

- Stage `stage-day.html`; the field temperature is one CSS custom property
  animated across scenes; each clock beat is a scene keyed by `?beat=`.
- The "earlier today" stack is real state carried across beats within the
  stage (not composited) so its growth is exact.
- The lull beat (shot 08) must never be cut for time. It is the doctrine on
  film. If runtime pressure comes, shorten holds 02 and 05 instead.

## 9 · Acceptance checks

- Clock honesty: jumps cluster in the morning and stretch in the afternoon;
  no even spacing anywhere.
- The dot breathes in every frame of the film (except the end card).
- Exactly one orange moment, one red moment; forest only on the dot + settle.
- One-frame, mute, and voice-gate tests as standard.
