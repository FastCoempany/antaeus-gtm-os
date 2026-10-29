# Source Methodology — Why the Preview Transcript Is the Language Corpus

## Source used

The language-remediation analysis is based on the generated Antaeus preview walkthrough produced from the repository's preview transcript tooling.

Repository sources:

- `tools/preview/build-transcript.js`
- `preview-transcript/`

The branch was created from commit:

`f6416124732b5a5ebe9c8eb722a8b8557a0768b2`

That commit's own description records the preview transcript as a complete room-by-room exploration of the enterprise demo.

The analysis copy used in the language work was a plain-text export named:

`antaeus-preview-walkthrough.txt`

The text export is a transport format only. It is not an implementation target.

## Why this source comes before source-code rewriting

The preview transcript captures the product as a visitor experiences it rather than as the codebase happens to organize it.

That matters because one visible string may originate from:

- a shared component;
- a room-local component;
- a constant or configuration object;
- a persisted state label;
- a deterministic text builder;
- an AI prompt/template;
- sample data;
- internal capability-map doctrine.

Starting in source code would force language decisions to be made piecemeal according to implementation boundaries. The transcript instead lets the product be analyzed as one language corpus first.

## What the corpus includes

The preview transcript tooling records:

1. the room at rest;
2. every visible word in reading order;
3. element type and presentation cues;
4. buttons, links, labels, fields, headings, and helper text;
5. interaction states revealed by controls;
6. hover text;
7. room capability maps and internal doctrine.

The remediation extraction produced:

- 5,627 rendered user-facing occurrences;
- 2,780 unique rendered user-facing strings.

The internal capability-map/doctrine sections were analyzed separately from rendered user-facing copy.

## Source-of-truth rule

Use this order:

1. **Rendered walkthrough corpus** — identifies the language problem and the user's actual experience.
2. **Approved rewrite/migration artifacts** — define what the language should become.
3. **Repository source** — identify the highest correct implementation point.
4. **Regenerated walkthrough** — verify the implementation in the same rendered format.

Do not let the existing implementation wording override an approved language decision merely because that wording appears in many files.

## Implementation rule

Never patch the generated transcript as the fix.

For each approved change:

1. search the repo for the string and its semantic concept;
2. identify whether it is shared, local, deterministic-generated, AI-generated, or persisted-state language;
3. change the highest correct source of truth;
4. regenerate the preview transcript;
5. verify every rendered occurrence.

If multiple transcript occurrences come from one shared component, change the component once.

If a sentence is dynamically produced, change the generator/template instead of hardcoding the sample sentence.

If a user-facing state is backed by a stable persisted enum, prefer changing the display label and explanatory text unless a data-model migration is independently justified.

## Final validation

After implementation, run the exact same nine-dimension saturation test on a newly generated walkthrough:

1. semantic compression;
2. private/branded ontology;
3. metaphorical abstraction;
4. declarative certainty;
5. aphoristic cadence;
6. high-context dependence;
7. paratactic compression;
8. personification/agency transfer;
9. elliptical/fragmentary syntax.

Current score: 93/100.

Acceptance ceiling: 20/100.
