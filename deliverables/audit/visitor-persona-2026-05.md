# Visitor persona — Phase 5 of the 2026-05 navigation-intelligence roadmap

**Locked:** 2026-05-18 (founder, Phase 5.1).

The Phase 2 audits ran against **Sarah Chen** — an already-authenticated Series A CRO operating inside the product. The Phase 5 static public face needs a different unit of measurement because the visitor isn't Sarah; the visitor is someone deciding whether to become Sarah.

This doc names that person and the three calibrated cold-landing scenarios every static-page change is tested against.

---

## Who the visitor is

**Marcus Reed** — founder-CEO of a Series A B2B startup. Built the first $2M ARR himself; now writing checks for the first real sales hire. He lands on `/start.html` because someone in his investor network sent him the link with one line of context: *"This is the operating system for what you're doing manually right now."* He has 90 seconds to decide whether to give it more time.

### Specifics

- **Stage:** Series A, $4M ARR, 18 months from raise
- **Role:** Founder-CEO, currently running revenue himself + one BDR
- **Current state:** Operating from memory + spreadsheets + a CRM nobody else logs into. He knows which deals are real because he's been on every call.
- **The forcing function:** Just signed his first AE — start date in 6 weeks. The AE will inherit nothing transferable as the workspace currently stands.
- **What he's afraid of:** The new hire will replicate his motion based on what they imagine he does, not what he actually does. By month 3 he'll be back to running revenue himself because the hire "isn't ramping."
- **What he's hoping for:** A system that captures his motion as he runs it, so the hire inherits a working machine instead of a memory dump.
- **What he's bringing:** Skepticism. He's evaluated 6 "sales tools" this year, all of which were either a prettier CRM or an AI gimmick. He'll click away from "powered by AI" copy faster than from a 404.

### What he is NOT

- He is **not** a buyer for a CRM replacement. He has a CRM.
- He is **not** evaluating sales enablement content libraries.
- He is **not** looking for an AI copilot that suggests next steps based on email content.
- He is **not** comparing to Salesforce, HubSpot, or Outreach. Those are categories he already owns.

The landing has to read like none of those.

---

## The three calibrated cold-landing walks

Every static-page change is tested against these three walks. They are the equivalent of Sarah's three calibrated walks for the in-product rubric.

### Walk A — First 30 seconds (cold)

Marcus arrives on `/start.html` from the investor link. He has not read anything else about Antaeus. The page has 30 seconds before he closes the tab.

**Test:** does the page answer, in this order, without him scrolling past the first fold?
1. What is this? (one sentence, operator-voice)
2. Who is this for? (recognizable role + situation)
3. What do I do next? (one dominant move)

**Failure modes:**
- Category jargon ("AI-powered revenue intelligence platform") — Marcus closes the tab.
- Hero claim he can't connect to his own situation ("Drive 3x pipeline growth") — Marcus closes the tab.
- Two competing CTAs ("Start free trial" + "Book a demo" + "Watch the video") — Marcus closes the tab.

### Walk B — The 90-second scan

Marcus reads the hero, then scans down. He's looking for proof that this isn't another CRM-shaped thing. The three anchor cards have to land three distinct signals he can carry into his next conversation about the tool.

**Test:** can Marcus, 90 seconds in, describe Antaeus to his co-founder in one sentence that doesn't include any of the words ("CRM", "AI copilot", "sales enablement")?

**Failure modes:**
- Anchor cards repeat each other in different words.
- Cards describe features ("Real-time signal detection") instead of operator outcomes ("The system surfaces what's under pressure right now").
- Cards rely on jargon Marcus hasn't been introduced to ("ICP", "PoC framework", "Readiness Score").

### Walk C — The signup decision

Marcus is mostly convinced. He scrolls back to the top. He needs to decide: signup now, or save for later. The CTA cluster has to make signup feel like the lowest-friction move.

**Test:** the primary CTA tells Marcus what happens when he clicks it. The secondary path (sign-in) doesn't compete visually with signup. There's no third CTA.

**Failure modes:**
- "Get started" / "Learn more" / "Watch demo" — three equal-weight CTAs.
- "Create workspace" lands him on a form with 8 fields — Marcus bounces.
- "Create workspace" lands him on a page that asks for a credit card before he sees the product — Marcus bounces.

---

## The visitor-face rubric (extension of the navigation rubric)

Phase 2's navigation rubric tests rooms with three tests (hand-reach / inevitability / seam). Phase 5 inherits those + adds two visitor-specific tests:

### Test 4 — The category test

The visitor must be able to place Antaeus in their mental category map within the first paragraph. Antaeus is **not** "another sales tool" — it's "the operating system the founder's motion becomes before a hire inherits it." That distinction has to land in plain language, not jargon.

### Test 5 — The trust test

Visitor-facing copy carries trust signals (or it doesn't). Trust signals: plain language, specific situations, no hype, no superlatives, no "AI-powered" filler, no testimonial dependencies. **Failure signals:** stock-photo placeholders, generic outcome claims ("grow faster"), unattributed quotes, "trusted by" logo strips without context.

---

## Per-PR cadence for Phase 5

Phase 5 is split into **4 PRs in rigid sequence** (per founder lock 2026-05-18):

- **5.1 Landing** — `start.html` re-skin against canon Part II §1 (bright) + this persona + walks A/B/C
- **5.2 Auth** — full bright re-skin of `login.html` / `signup.html` / `forgot-password.html` / `reset-password.html` / `auth/callback/index.html`; Sarah-Chen persona (the returning user)
- **5.3 Privacy** — `privacy.html` + `terms.html` re-skin; trust-test focus
- **5.4 Category framing** — new public-facing positioning page (`/why-antaeus/` or `/what-is-this/`); the surface a visitor lands on when they want more than the landing page provides but aren't ready to sign up

Each PR carries its own Playwright walk. Phase 5.4 closes the gate: once it ships, the pre-beta gate (`coming-soon.html` + Cloudflare Worker) is the only thing standing between the public and the product.

---

## Supersession

This persona does not replace Sarah Chen. Sarah is the operator-inside-the-product unit of measurement; Marcus is the operator-deciding-to-become-Sarah unit of measurement. Both personas survive in their respective scopes:

- **In-product rubric** (`navigation-rubric-2026-05.md`) → Sarah Chen
- **Visitor-face rubric** (this doc) → Marcus Reed
- **Auth pages** (Phase 5.2) → Sarah Chen, returning. Auth is the boundary where the visitor persona ends and the operator persona begins.
