/**
 * Skills layer — typed contract (Phase C of the orchestration layer).
 *
 * Per ADR-010 (2026-05-31). Skills are deterministic markdown recipes
 * that compose existing room engines via cross-room continuity params.
 * They surface as Cmd+K palette entries alongside rooms. No LLM at
 * runtime (ADR-008 §"Rejected list").
 *
 * The Skill record below is the parsed shape — what the parser
 * produces from the .md + frontmatter and what the dispatcher consumes.
 * Skill recipe files live at src/skills/recipes/*.md; this module
 * never touches the file system (Vite's ?raw import + the parser
 * handle that).
 */

/**
 * Action union. The recipe's frontmatter declares one of these as its
 * `action` field; the dispatcher branches on the tag to execute.
 * Three actions are exhaustive for v1 — adding a fourth is an ADR.
 */
export type SkillAction =
    | RouteAction
    | ComposeContextAndRouteAction
    | FilterAndRouteAction;

/**
 * Navigate to a static URL. Rarely the right action — rooms already
 * cover this. Included for completeness so a recipe can declare
 * "open the Dashboard" without inventing a context.
 */
export interface RouteAction {
    readonly kind: "route";
    readonly target: string;
}

/**
 * Read state from one or more sources, build a target URL with
 * continuity params, navigate. The most common action.
 *
 * `sources` declares what the dispatcher needs to read before
 * routing. Each source is a typed reader the dispatcher knows how to
 * resolve (e.g., "hottest signal-console account", "latest call
 * planner agenda"). The dispatcher injects the resolved value as a
 * URL param on the target.
 */
export interface ComposeContextAndRouteAction {
    readonly kind: "compose-context-and-route";
    readonly target: string;
    /** Sources to resolve before routing; results map to URL params. */
    readonly sources: ReadonlyArray<SourceParam>;
}

/**
 * Apply a filter expression to a source collection, pass the filtered
 * id list to the target room via a URL param. Used when the target
 * room supports a `?filter=` inbound (e.g., Deal Workspace's
 * intervention board).
 */
export interface FilterAndRouteAction {
    readonly kind: "filter-and-route";
    readonly target: string;
    readonly source: SourceKey;
    readonly filter: FilterExpression;
    /** URL param name to receive the filtered id list. */
    readonly paramName: string;
    /** Cap the number of ids passed; protects URL length. */
    readonly limit?: number;
}

/**
 * Sources the dispatcher knows how to resolve. Each source has a fixed
 * shape (what data it returns); the dispatcher's source resolver maps
 * SourceKey → typed reader.
 *
 * Adding a source is a code change (new reader in lib/sources.ts) +
 * a new SourceKey here. Recipes can't invent sources at parse time.
 */
export type SourceKey =
    | "hottest-signal-console-account"
    | "top-pressure-open-deal"
    | "latest-call-planner-agenda"
    | "top-stalled-deals"
    | "undismissed-observations";

export interface SourceParam {
    /** Source to resolve. */
    readonly source: SourceKey;
    /** Name to give the resolved value when injecting into the URL. */
    readonly paramName: string;
    /** When true, the dispatcher skips routing if the source returns null. */
    readonly required?: boolean;
}

/**
 * Filter expressions are also a closed set. v1 has just one: pass
 * through all ids from the source (used when the source itself
 * encodes the filter, e.g., `top-stalled-deals` already does the
 * ranking).
 */
export type FilterExpression = { readonly kind: "passthrough" };

/**
 * The parsed shape of a skill. The parser's output; the dispatcher's
 * input. Recipe files MUST produce one of these or fail to parse.
 */
export interface Skill {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly action: SkillAction;
    /** Optional alt-text keywords surfaced to the Cmd+K filter. */
    readonly keywords: ReadonlyArray<string>;
    /** Full markdown body — surfaced in a future help panel. */
    readonly body: string;
}

/**
 * Result of parsing a recipe file. Always returns a discriminated
 * union so callers handle the failure case explicitly.
 */
export type ParseResult =
    | { readonly ok: true; readonly skill: Skill }
    | { readonly ok: false; readonly error: string };
