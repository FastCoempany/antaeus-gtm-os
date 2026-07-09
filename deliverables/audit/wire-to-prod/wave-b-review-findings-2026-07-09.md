# Wave-B adversarial review — findings + resolutions (2026-07-09)

Fresh-reviewer pass over five surfaces: the Ground, Quota Workback v4, the
Climb drawer, ICP Studio v4, Territory Architect v4. 16 findings; every
HIGH/MED and all actionable LOWs fixed the same day.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | HIGH | Quota: inputs unreachable once a plan exists | "Change the number or assumptions" affordance in the pace/plan view — quota, typical deal, win %, meetings→opportunities %, deal length (days) |
| 2 | HIGH | Territory: approaches display-only while the field read prescribed adding one | Inline approach authoring (line + division select) in the ledger; renders whenever divisions exist |
| 3 | HIGH | Territory field-read strings were the canon §11 banned worked example, rendered raw | Rewritten in plain voice at engine source + declared through `t()`; band "Runnable" → "Operating"; tests re-pointed |
| 4 | MED | Ground: closed panel focusable/readable off-screen | `visibility: hidden` + `pointer-events: none` when down (delayed past the sink transition) |
| 5 | MED | Ground: the suggested room's href dropped continuity params | `withContinuity()` appends returnTo/returnLabel/fromMode + fromSurface=ground to the ranker's target URL |
| 6 | MED | ICP: no founder/first-seller control though role drives the focus + quality engine | Two-value role toggle above the builder |
| 7 | MED | Territory: no way to add or re-tag an account to a division | Drawer gains add-an-account (cap-aware) + move-to-division select; additive `retagAccount` in state |
| 8 | LOW | Double-Escape closed Ground + Climb drawer together | `stopPropagation` in the Ground's Escape branch (document listener fires before the drawer's window listener) |
| 9 | LOW | `currentRoomId` missed slash-less paths | Normalize to a trailing slash |
| 10 | LOW | Ground suggestion computed once per page load | Re-ranks on every open |
| 11 | LOW | Quota re-parsed 4 JSON logs per keystroke | `useMemo` once per mount |
| 12 | LOW | pace.ts missed camelCase `createdAt` on closed deals | Added to the fallback chain |
| 13 | LOW | "about 0 more messages & calls a day" boundary copy | Cost line suppressed when the rounded delta is 0 |
| 14 | LOW | ICP warn/risk tones conflated into one red ✕ | `warn` renders an amber `!` |
| 15 | LOW | "verdict" shipped as a Ground filter keyword | Swapped for "ready" |
| 16 | note | Default-ON + `_off` kill-switch vs the plan's opt-in wording | Deliberate — the founder picked "auto-flip live on pass" for the whole arc |

Reviewer's clean passes: all MOTION_ROOMS hrefs resolve to real routes;
quota `readActuals` envelope shapes verified against the actual writers;
`accountsByThesis` used only as counts; ClimbDrawer's readiness fields all
real; no div-by-zero / NaN / unclamped percents; empty states covered.
