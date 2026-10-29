# Remaining Contextual / Generator-Level Language Review

## Why these are not literal find/replace items

The walkthrough audit found a small set of high-severity strings whose rendered sample text is assembled dynamically or whose wording changes according to deal state, workstream, or interaction context. These must be corrected at the generator/template/source level rather than by hardcoding the sample sentence from the preview.

Use `07_AI_PROMPT_AND_GENERATOR_REWRITE_SPEC.md` as the controlling standard.

## Source-level cases to resolve

### 1. Workspace-map hover / extraction variants

Rendered transcript variants can include presentation metadata around the Ground/Workspace-map handle. Fix the shared source in `src/lib/ground/` and regenerate the transcript. Do not patch transcript output.

### 2. Discovery Studio dynamic prompts

Search Discovery generators/templates for dynamic labels using:

- `motion`
- `pressure`
- `read`
- compressed imperative fragments

Translate each according to its actual object:

- sales process
- current priority / business constraint
- deal assessment / manager assessment
- explicit next question or action

Do not globally replace these words without context.

### 3. Getting to Signed dynamic workstream strings

Several rendered states combine a workstream name, state, and action into strings such as:

- `BUSINESS ... front ...`
- `YOUR LINE`
- dynamically changing `blocking / clearing / to do / at risk` rows

Fix the shared workstream renderer so all variants use:

- **workstream**, not `front`;
- **customer request**, not `their side` where additional clarity is needed;
- **your proposed position**, not `your line`;
- **current blocking issue**, not `face-off`;
- **signature plan**, not `plan-to-signed` or `run-to-signed`.

Preserve the underlying workstream enum/state values when they are persisted or relied upon internally.

### 4. Settings future/integration copy

Any future-state integration wording must distinguish:

- what exists now;
- what is planned;
- what the user must still do manually.

Do not phrase roadmap behavior as if it is current product behavior.

### 5. Dynamic deal-risk / Future Autopsy outputs

Do not write one literal replacement for each sample account. Fix the generator so every case renders the same information architecture:

1. observed facts;
2. risk level;
3. evidence driving the risk assessment;
4. forecast only when a forecast exists;
5. recommended corrective action;
6. criteria for closing the opportunity.

Do not produce `dies`, `dying`, `inevitable`, `exactly how it dies`, `urgency died`, `thread went stale`, or deterministic close-loss timing as factual statements.

### 6. Dynamic ranking explanations

The ranker may continue using internal numeric fields such as `heat` if changing the data model is unnecessary. User-facing reasons must translate those fields into explicit concepts such as **account priority** and expose relevant evidence when available.

Example:

Bad:
> Boeing has the highest heat in your watchlist right now.

Minimum acceptable:
> Boeing is currently the highest-priority account in your watchlist.

Better when inputs are available:
> Boeing ranks first because it has four recent account signals and a next step due in three days.

## Definition of done

These cases are complete only when:

- the source generator/template follows the new language doctrine;
- all possible states inherit the corrected wording;
- no sample-specific hardcoding was introduced;
- the regenerated preview transcript contains no Tier-1 deprecated language from these generators.
