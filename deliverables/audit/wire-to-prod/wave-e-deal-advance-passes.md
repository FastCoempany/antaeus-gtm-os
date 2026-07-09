# Wave E — Pilot Desk · Getting to Signed · Call in a Favor (2026-07-09)

Three deal-advance rooms wired to production. Flags default ON with
kill-switches `room_pilot_desk_v4_off` / `room_getting_to_signed_v4_off` /
`room_call_in_a_favor_v4_off`; `?v4=0/1` hatches. Face names renamed per
canon; served paths (/poc-framework/, /negotiation/, /advisor-deploy/)
stay until the full path-rename sweep.

## Pilot Desk — the guided pilot (canon §4.15)

Settled mockup: `pilot-desk-guided-2026-07-06.html`.
- The five movements shown ONE AT A TIME: set it up (the shipped spec
  draft with plain labels — what it has to show / who signs off / when
  you'll stop / the 7-14 window; Lock → the shipped saveDraft, quality +
  deal-sync unchanged) → bring in the people → keep it moving → read the
  adoption → the write-up the champion carries.
- **The additive pilot layer** (`v4/lib/pilot.ts`, `gtmos_pilot_desk_v1`
  per account): the CIRCLE (hands-on / champion / signs-off, tap-to-mark
  using-it, right-sized to the deal value), the WHO'S-MISSING prompts on
  the open amber field (IT + a day-to-day driver, add-inline or copy the
  ask-your-champion intro), CHECK-INS with gated steps (generated from
  circle state, step N locks until N-1), the SHARE KIT (9 items incl. the
  Mutual pilot plan, each a personalized clipboard template + sent mark),
  and the write-up. Adoption is the meter: using / enrolled + actions,
  band Ready / Almost / Too thin to hand over — never the outcome number.
- Boot-verified through all five movements headless; zero pageerrors.

## Getting to Signed — the face-off + ledger (canon §4.16b)

Settled mockup: `getting-to-signed-faceoff-2026-07-07.html`.
- **The additive fronts layer** (`v4/lib/fronts.ts`,
  `gtmos_getting_to_signed_v1` per deal): four fronts (Legal / Security /
  Finance / Business), each their-ask → your-line → status; the FACE-OFF
  leads with what's actually blocking (blocking > at-risk > first open —
  verified rotating live when a front settles); committee members with
  engagement reads (warm / quiet Nd / new, tap-to-touch); the papers-ready
  strip (SOC 2 · subs · pen-test · DPA toggles); the security COVERAGE MAP
  (total / covered-by-papers / saved-answers → the bar + "3 need a word
  from engineering"); the payment trade set + every-give-gets-something in
  the authored per-front playbooks; the PLAN-TO-SIGNED textarea + copy-to-
  champion; "we won't repeat this" → the shipped appendLearning.
- Deal linking + learnings reuse the shipped negotiation engine. RFP held
  for the Pro gate per canon — not built.
- Boot-verified: face-off typing, committee add + touch, papers toggles,
  coverage map (120 covered / 30 open / 27 saved), settle-rotation; zero
  pageerrors.

## Call in a Favor — the guided backchannel (canon §4.16)

Settled mockup: `call-in-a-favor-toprail-2026-07-06.html`.
- The TOP RAIL: stuck deals most-stuck-first (overdue next step > none >
  undated) with who-to-ask + what-for (the shipped recommend engine) and
  the coverage read ("N have no one who could put in a word — line
  someone up →" opens the add-to-your-corner form).
- The RELAY: you → your person → the buyer; deal/who/what pills; the
  why-stuck read (shipped dealPressure + moment.short); both notes from
  the shipped buildAsk (your message editable via customAsk, the
  forwardable note); the trust note; the READY CHECK (shipped scoring —
  "Ready to send" / "Narrow first") + the DON'T-OVER-ASK guard (the
  shipped per-tier cooldown → "a second ask in a short window — open with
  a thank-you"); send & log through the shipped logDeployment (syncs back
  onto the deal); the favors-out list closes every loop (outcome select).
- **§13 scrub at engine source:** the ten MOMENTS renamed to canon's ten
  plain situations (Open the door / Get an exec involved / Nudge a
  stalled pilot / Unstick procurement / Reset the comparison / Lost your
  champion / Save it from a budget freeze / Signal you're a serious bet /
  Get a customer to vouch / Warm up a renewal) and every "proof"/"carrier"
  in their user-facing strings reworded; the generated message's "Proof
  line:" → "Where it stands:"; the ready-check copy's "proof line" gone.
  Verified live: zero banned words on the rendered face.

## Wave C+D review fixes (same commit)

The fresh-reviewer pass on Waves C+D returned 1 HIGH + 2 MED + LOWs — all
actionable items fixed: (HIGH) Prospecting's Ready rail was unreachable —
answering all three questions now promotes to "ready" (and un-answering
demotes), the confirm panel stays open through promotion, and a failed
queue write no longer marks the account sent; (MED) Cold Call outcome
pills disabled until an account is named (no more junk log rows); (MED)
Signal Console's Compose handoff now threads the account's live
temperature so Outbound opens at the right stage; (MED) the remaining
banned words in cold-call thread titles/copy/coach scrubbed at source
("Earn permission" → "Get permission", the show-it's-real thread);
(LOW) SC's inbound-queue drain skips when cloud boot degraded to
local-only (no cloud duplicates); LinkedIn heat match case-insensitive +
the last rung hands off to Outbound instead of looping; Prospecting rails
capped at 30 rendered rows.

## Gates

typecheck clean · all room suites + voice gate green · banned-word scans
clean on all three faces (live-verified for CIAF) · GroundLine on all
three · fresh adversarial reviewer pass owed for Wave E (next batch).
