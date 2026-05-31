import { resolveSource, type SourceResult } from "./sources";
import type { Skill, SkillAction } from "./types";

/**
 * Skill dispatcher — runs a parsed Skill.
 *
 * Per ADR-010 (2026-05-31). The dispatcher's only job is:
 *   1. Resolve every source the action declares
 *   2. Build the target URL with the resolved values as URL params
 *   3. Navigate to the URL
 *
 * No DOM mutation, no UI, no LLM. The result of running a skill IS
 * the room the operator lands in.
 *
 * Returns a DispatchResult so callers can react (analytics, error
 * toast, etc.). The dispatcher itself never throws.
 */

export type DispatchResult =
    | { readonly kind: "navigated"; readonly url: string }
    | { readonly kind: "missing-required-source"; readonly source: string }
    | { readonly kind: "no-data"; readonly message: string }
    | { readonly kind: "error"; readonly error: string };

interface DispatchOptions {
    /** Test seam — defaults to `window.location.assign`. */
    readonly navigate?: (url: string) => void;
    /** Test seam — defaults to localStorage via the source readers. */
    readonly storage?: { getItem(key: string): string | null } | null;
}

function defaultNavigate(url: string): void {
    if (typeof window !== "undefined" && window.location) {
        window.location.assign(url);
    }
}

function buildUrl(
    target: string,
    params: ReadonlyArray<readonly [string, string]>
): string {
    if (params.length === 0) return target;
    const search = new URLSearchParams();
    for (const [k, v] of params) {
        search.set(k, v);
    }
    const sep = target.includes("?") ? "&" : "?";
    return `${target}${sep}${search.toString()}`;
}

export async function dispatchSkill(
    skill: Skill,
    opts: DispatchOptions = {}
): Promise<DispatchResult> {
    const navigate = opts.navigate ?? defaultNavigate;
    try {
        const url = await buildUrlForAction(skill.action, opts);
        if (url.kind !== "ok") return url;
        navigate(url.value);
        return { kind: "navigated", url: url.value };
    } catch (err) {
        return {
            kind: "error",
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

type UrlResult =
    | { readonly kind: "ok"; readonly value: string }
    | DispatchResult;

async function buildUrlForAction(
    action: SkillAction,
    opts: DispatchOptions
): Promise<UrlResult> {
    if (action.kind === "route") {
        return { kind: "ok", value: action.target };
    }
    if (action.kind === "compose-context-and-route") {
        const params: Array<readonly [string, string]> = [];
        for (const src of action.sources) {
            const resolved = await resolveSource(src.source, {
                storage: opts.storage
            });
            const flat = flatten(resolved);
            if (flat === null) {
                if (src.required) {
                    return {
                        kind: "missing-required-source",
                        source: src.source
                    };
                }
                continue;
            }
            params.push([src.paramName, flat]);
        }
        return { kind: "ok", value: buildUrl(action.target, params) };
    }
    // filter-and-route
    const resolved = await resolveSource(action.source, {
        storage: opts.storage,
        limit: action.limit
    });
    if (resolved.kind === "none") {
        return {
            kind: "no-data",
            message: `Source "${action.source}" returned no data.`
        };
    }
    const values = resolved.kind === "list" ? resolved.values : [resolved.value];
    const capped = action.limit ? values.slice(0, action.limit) : values;
    const joined = capped.join(",");
    return {
        kind: "ok",
        value: buildUrl(action.target, [[action.paramName, joined]])
    };
}

function flatten(result: SourceResult): string | null {
    if (result.kind === "none") return null;
    if (result.kind === "value") return result.value;
    if (result.kind === "list") {
        return result.values.length > 0 ? result.values.join(",") : null;
    }
    return null;
}
