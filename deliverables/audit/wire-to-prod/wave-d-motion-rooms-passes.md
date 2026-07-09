# Wave D — Outbound Studio · Cold Call Studio · LinkedIn Playbook (2026-07-09)

Three motion rooms wired to production in one wave. Flags default ON with
kill-switches `room_outbound_studio_v4_off` / `room_cold_call_v4_off` /
`room_linkedin_playbook_v4_off`; `?v4=0/1` hatches on each.

## Outbound Studio — "where you are with them" (canon §4.8)

Settled mockup: `outbound-studio-CHOSEN-complete-2026-07-04.html`.
- The 5-stage conversation spine IS the shipped temperature rack in plain
  words (First time reaching out / Following up / They replied / Back and
  forth / About to close). The who-line + a collapsible rack editor carry
  account (Signal Console datalist) / person / seat / trigger / their
  question. The message is the shipped generator's output verbatim.
- Actions: Copy (chained clipboard, graceful fallback), Mark it sent
  (logTouchFromRack), Give value only (the no-ask toggle), Save this one
  (saveAngleFromRack, duplicate-aware). Rail: why-now, per-stage coaching
  tip, how-to-send (channel/attach/ask from the engine's chips), and the
  per-account sent log with outcome selects (drives Signal Console's
  temperature ladder).
- **Bug fixed at state source:** `currentSendLine` passed `account.name`
  as the `signalHeadline`, so messages opened "Saw Ramp." The loader now
  carries the account's real freshest signal headline (additive
  `topSignal` on AccountOption) and the state passes that instead; the
  generator's trigger-meaning fallback covers accounts with no signal.
- Runtime verify: stage switch regenerates; value-only drops the ask row;
  mark-sent appends to the log; zero pageerrors.

## Cold Call Studio — the game plan (canon §4.9)

Settled mockup: `cold-call-studio-gameplan-2026-07-06.html`.
- Prep-then-capture, never a during-call console: pre-flight bar (who —
  heat-ranked account select + HOT chip · your reason to call, live from
  Signal Console with an honest no-signal state · your one goal), then
  the 5-step plan (the engine's threads, prep folded into pre-flight),
  each step = the personalized say-line + the stock pushback branches +
  operator-added pushbacks (new `custom-pushbacks.ts`, localStorage
  `gtmos_cold_call_custom_pushbacks_v1`, add/remove, defensive parser).
- After-the-call capture: the forest booked-a-meeting button (logCall →
  creates a real deal in `gtmos_deal_workspaces` — verified: 1 deal row
  written headless), still-alive / no-this-time pill groups, notes, the
  running read (calls · % reached a meeting · last outcomes).
- **§13 sweep landed:** the legacy "Proof thread"'s rendered say-line
  carried a literal `[proof point]` token — rewritten at source in
  threads.ts ("Teams dealing with [pressure] usually hit the same
  pattern…"). The thread id `proof` stays as a code key. Step name on the
  face: "Show them it's worked before."
- In-place editing of the STOCK lines is deferred (add-your-own covers
  the personalization need without forking the engine's thread data).

## LinkedIn Playbook — the one move (canon §4.10)

Settled mockup: `linkedin-playbook-one-move-2026-07-06.html`.
- One account at a time: the hottest (Signal Console) or an explicit pick
  from the warming queue. The 5-cue ladder renders as a rung spine with
  plain labels (Find their post → Leave a comment → Send the request →
  Give something useful → Ask for 15 min); per-account progress derives
  from the action log's cueLabel (legacy names aliased so old rows still
  count). Position reads per rung; the cue's console line + the motion
  engine's why-now + cueScript's ready-to-paste line; Mark it done logs
  through the shipped logCue and advances the rung.
- Warming queue with per-account rung dots + next move; templates drawer
  (the 4 method sheets); week stats from the shipped ChannelStats.
- **§13 sweep landed at source:** cue names "Give proof before asking" →
  "Give something useful before asking" and "Ask only when earned" →
  "Ask only when it's warranted" (canon §4.10's own wording); the ask
  template heading likewise. Tests re-pointed.

## Gates

typecheck clean · 336 tests green across the three rooms + voice gate ·
banned-word scan: only code-side keys (thread id `proof`, legacy alias
map for old stored rows) · all three boot-verified headless with seeded
data, zero pageerrors · GroundLine on all three.

## Open items

- Fresh adversarial reviewer pass owed (batched with Wave C/E review).
