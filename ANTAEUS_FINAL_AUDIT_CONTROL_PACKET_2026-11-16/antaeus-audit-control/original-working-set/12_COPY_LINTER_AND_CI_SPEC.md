# Copy Linter and CI Regression Specification

## Goal

Prevent the deprecated Antaeus private dialect from re-entering user-facing surfaces after the rewrite.

## Proposed command

`npm run copy:audit`

The command should scan:
- static UI strings;
- shared component labels;
- deterministic text generators;
- AI prompt templates that govern user-visible output;
- preview transcript output.

## Tier 1 — fail CI unless allowlisted

Case-insensitive user-facing occurrences of:

- TOUCH THE GROUND
- THE GROUND
- whole motion
- Live Edge
- You are the system
- Inheritable with guardrails
- workspace is awake
- system's pick
- where it bites
- SHARP MATCHES
- THE CUTS
- THE CLIMB
- THE SUMMIT
- ALL FOUR FRONTS
- face-off
- air cover
- THE MACHINE

## Tier 2 — warn and require review

- motion
- heat
- hot / hottest
- cold / going cold
- sharp / sharpen
- bite
- carve
- awake / wake
- thread
- pressure
- pulling
- decay / decaying
- die / dies / dying
- floor
- thin
- front
- line
- relay
- dividend
- landing
- read (as a noun)
- heartbeat
- standing orders
- fire / fires (for monitoring)

These words can have legitimate meanings. The linter should produce file/line/context and require either rewrite or explicit allowlisting.

## Structural heuristics

Warn on:
- short em-dash constructions that read like headline + slogan;
- `X. Y.` two-beat aphoristic patterns in helper prose;
- headings beginning `Here's`, `This is where`, `The one thing`, `What the system`;
- system-generated claims containing `will`, `definitely`, `exactly`, `inevitable` without a forecast/assessment label;
- CTA labels with non-predictive verbs such as `Carve it`, `Run it`, `Make it real`, `Touch`, `Wake`.

## PR output

The audit should print:

- total user-facing strings scanned;
- Tier-1 failures;
- Tier-2 warnings;
- unreviewed new strings;
- allowlisted strings;
- changed saturation-risk count compared with main.

## Allowlist

Maintain a small reviewed allowlist with:
- exact string or regex;
- owner;
- justification;
- expiry/review date.

Do not allow blanket directories.

## PR checklist

COPY IMPACT
- [ ] No user-facing copy changed
- [ ] User-facing copy changed

If changed:
- [ ] Plain-language standard checked
- [ ] No new private ontology introduced
- [ ] Facts vs inference distinguished
- [ ] Analytical claims expose evidence
- [ ] CTA predicts the resulting action
- [ ] No unsupported causal claim introduced
- [ ] `npm run copy:audit` passes
