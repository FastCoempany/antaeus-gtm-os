# Codex Handoff — Antaeus Product Page Copy Rewrite

## Objective

Apply the approved copy rewrite to `antaeusproductpage (3).html` without redesigning the page or changing product behavior.

## Inputs

1. `COPY_STANDARD.md` — authoritative writing rules.
2. `COPY_INVENTORY_AND_REWRITE_MAP.json` — exact source lines, original logical copy units, approved replacements, and standalone leaf-string replacements.
3. `COPY_AUDIT_AND_REWRITE.md` — human-readable audit and before/after review.
4. `antaeusproductpage (3).html` — source page.

## Implementation rules

- Apply the approved replacement text in the JSON.
- Treat `replacement` as authoritative for every logical unit whose `action` is `rewrite`.
- Leave every logical unit whose `action` is `keep` unchanged unless a required markup adjustment is necessary to preserve the approved replacement around it.
- Apply `standalone_leaf_replacements` anywhere the exact visible leaf string occurs and is not already replaced by a parent logical-unit edit.
- Preserve HTML structure, CSS classes, IDs, hrefs, data attributes, JavaScript hooks, accessibility attributes, animations, responsive behavior, and visual hierarchy unless text length makes a minimal layout fix necessary.
- Preserve factual product claims. Do not invent capabilities, integrations, benchmarks, customers, outcomes, or evidence.
- Do not rewrite copy beyond the approved map merely to make it sound better. Flag conflicts instead.
- Preserve named product features unless the map explicitly changes them.
- Reconstruct inline `<b>`, `<em>`, `<u>`, `<span>`, or link emphasis only where it still makes semantic sense in the approved replacement. Do not preserve emphasis on obsolete metaphor simply because the old DOM emphasized it.
- Fix the malformed source phrase `how a deal gets to signed` as part of the mapped Handoff paragraph replacement.

## Required output

1. Modified HTML.
2. Unified diff.
3. A machine-readable report with one row per applied map entry: unit id, source line, status, original, replacement.
4. A short list of any map entries that could not be applied exactly and why.
5. Render the page at desktop and mobile widths and check for overflow, clipped text, broken line wrapping, layout shifts, or controls whose new text no longer fits.

## Do not do yet

- Do not redesign sections.
- Do not change feature behavior.
- Do not add new claims.
- Do not reintroduce the removed private dialect in newly written glue copy.
- Do not silently shorten approved copy to make layout easier; report the layout issue first.

## Validation

After implementation, search the rendered copy and source for these high-risk terms in non-proper-name contexts: `motion`, `room`, `rooms`, `move`, `moved`, `shape`, `line`, `hot`, `warm`, `cold`, `slip`, `dies`, `autopsy`, `in your head`, `you are the system`, `inheritable`, `awake`.

Any remaining instance must be either:

- part of an approved proper feature name;
- literal in context; or
- explicitly documented in the implementation report as an intentional exception.

Stop after implementation and validation. Do not perform another autonomous copy rewrite pass.
