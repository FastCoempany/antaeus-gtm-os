import { validateObservation } from "@/lib/voice/voice-document";
import type {
    FilterExpression,
    ParseResult,
    Skill,
    SkillAction,
    SourceKey,
    SourceParam
} from "./types";

/**
 * Recipe parser — markdown with YAML frontmatter → typed Skill.
 *
 * Per ADR-010 (2026-05-31). The recipe shape:
 *
 *   ---
 *   id: triage-week-reads
 *   label: Triage the week's reads
 *   description: Open the Dashboard with focus on undismissed observations.
 *   keywords: [observations, dashboard, week]
 *   action:
 *     kind: route
 *     target: /dashboard/
 *   ---
 *
 *   # Triage the week's reads
 *
 *   The body is the help text the operator sees when they expand the
 *   recipe...
 *
 * The frontmatter parser is minimal — handles string scalars, string
 * arrays, and one level of nesting. That's enough for the v1 action
 * union (see types.ts).
 *
 * Voice rule (per ADR-010 §"Voice rule"): the description MUST pass
 * the Voice Document validator. Parser rejects on violation.
 */

const VALID_ACTION_KINDS = new Set([
    "route",
    "compose-context-and-route",
    "filter-and-route"
]);

const VALID_SOURCE_KEYS = new Set<SourceKey>([
    "hottest-signal-console-account",
    "top-pressure-open-deal",
    "latest-call-planner-agenda",
    "top-stalled-deals",
    "undismissed-observations"
]);

const VALID_FILTER_KINDS = new Set(["passthrough"]);

// ─── Frontmatter splitter ─────────────────────────────────────────────

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

function splitFrontmatter(
    src: string
): { frontmatter: string; body: string } | null {
    const m = FRONTMATTER_RE.exec(src);
    if (!m) return null;
    return { frontmatter: m[1] ?? "", body: (m[2] ?? "").trim() };
}

// ─── Minimal YAML subset ──────────────────────────────────────────────

type YamlValue =
    | string
    | ReadonlyArray<string>
    | { readonly [k: string]: YamlValue };

/**
 * Parse a minimal subset of YAML:
 *   - flat key/value (`key: value`)
 *   - inline string arrays (`key: [a, b, c]`)
 *   - one level of nesting via indentation (4 spaces or two indents)
 *
 * Anything richer (multi-line strings, deep nesting, anchors) throws.
 * Recipe authors stay within the supported subset; new shapes need an
 * ADR + parser extension.
 */
function parseYaml(src: string): Record<string, YamlValue> {
    const out: Record<string, YamlValue> = {};
    const lines = src.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
        const raw = lines[i] ?? "";
        const line = raw.replace(/#.*$/, "").trimEnd(); // strip comments
        if (line.trim().length === 0) {
            i += 1;
            continue;
        }
        // Top-level (no leading indent).
        if (!raw.startsWith(" ")) {
            const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
            if (!m) throw new Error(`Unparseable YAML line: ${raw}`);
            const key = m[1]!;
            const rest = (m[2] ?? "").trim();
            if (rest.length === 0) {
                // Nested object follows (collect indented lines).
                const nested: Record<string, string> = {};
                i += 1;
                while (i < lines.length) {
                    const nl = lines[i] ?? "";
                    if (!nl.startsWith("  ")) break;
                    const trimmed = nl.replace(/#.*$/, "").trim();
                    if (trimmed.length === 0) {
                        i += 1;
                        continue;
                    }
                    const nm = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(trimmed);
                    if (!nm) throw new Error(`Unparseable nested line: ${nl}`);
                    nested[nm[1]!] = parseInlineValue(nm[2] ?? "") as string;
                    i += 1;
                }
                out[key] = nested;
                continue;
            }
            out[key] = parseInlineValue(rest);
            i += 1;
        } else {
            // Stray indented line at top level — skip (handled by nested loop).
            i += 1;
        }
    }
    return out;
}

function parseInlineValue(s: string): YamlValue {
    const trimmed = s.trim();
    // Inline array: [a, b, "c"]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const inner = trimmed.slice(1, -1).trim();
        if (inner.length === 0) return [];
        return inner.split(",").map((p) => {
            const t = p.trim();
            return t.startsWith('"') && t.endsWith('"')
                ? t.slice(1, -1)
                : t.startsWith("'") && t.endsWith("'")
                  ? t.slice(1, -1)
                  : t;
        });
    }
    // Quoted string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

// ─── Action coercion ──────────────────────────────────────────────────

function asString(v: unknown, ctx: string): string {
    if (typeof v !== "string") throw new Error(`${ctx} must be a string`);
    return v;
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    if (v === undefined || v === null) return [];
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
        return v as ReadonlyArray<string>;
    }
    if (typeof v === "string") return [v];
    return [];
}

function coerceAction(actionField: unknown): SkillAction {
    if (!actionField || typeof actionField !== "object" || Array.isArray(actionField)) {
        throw new Error("`action` must be a nested object with at least a `kind`");
    }
    const obj = actionField as Record<string, unknown>;
    const kind = asString(obj.kind, "action.kind");
    if (!VALID_ACTION_KINDS.has(kind)) {
        throw new Error(
            `Unknown action.kind "${kind}". Valid: ${[...VALID_ACTION_KINDS].join(", ")}`
        );
    }
    const target = asString(obj.target, "action.target");
    if (!target.startsWith("/")) {
        throw new Error(`action.target must start with "/": ${target}`);
    }

    if (kind === "route") {
        return { kind: "route", target };
    }
    if (kind === "compose-context-and-route") {
        const sources = coerceSources(obj.sources);
        return { kind: "compose-context-and-route", target, sources };
    }
    if (kind === "filter-and-route") {
        const source = asString(obj.source, "action.source") as SourceKey;
        if (!VALID_SOURCE_KEYS.has(source)) {
            throw new Error(
                `Unknown source "${source}". Valid: ${[...VALID_SOURCE_KEYS].join(", ")}`
            );
        }
        const paramName = asString(obj.paramName, "action.paramName");
        const filter = coerceFilter(obj.filter);
        const limitRaw = obj.limit;
        const limit =
            typeof limitRaw === "string" && limitRaw.length > 0
                ? Number.parseInt(limitRaw, 10)
                : undefined;
        if (limit !== undefined && !Number.isFinite(limit)) {
            throw new Error(`action.limit must be a number, got "${limitRaw}"`);
        }
        return { kind: "filter-and-route", target, source, paramName, filter, limit };
    }
    // unreachable
    throw new Error(`unhandled action kind ${kind}`);
}

function coerceSources(raw: unknown): ReadonlyArray<SourceParam> {
    // For now, the minimal YAML parser doesn't support nested arrays
    // of objects. We support sources as a comma-separated inline
    // shorthand the parser reads off ONE line:
    //   sources: source=...|paramName=...;source=...|paramName=...
    // This is intentionally narrow — sufficient for the 5 starter
    // skills. Richer shapes need a real YAML parser.
    if (typeof raw !== "string") {
        throw new Error("action.sources must be a shorthand string (see parser docstring)");
    }
    if (raw.trim().length === 0) return [];
    const entries = raw.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    return entries.map((entry, idx): SourceParam => {
        const pairs = Object.fromEntries(
            entry.split("|").map((kv) => {
                const [k, v] = kv.split("=");
                return [(k ?? "").trim(), (v ?? "").trim()];
            })
        );
        const source = pairs["source"];
        const paramName = pairs["paramName"];
        if (!source || !paramName) {
            throw new Error(
                `action.sources[${idx}]: missing source or paramName in "${entry}"`
            );
        }
        if (!VALID_SOURCE_KEYS.has(source as SourceKey)) {
            throw new Error(
                `action.sources[${idx}]: unknown source "${source}"`
            );
        }
        const required = pairs["required"] === "true";
        return { source: source as SourceKey, paramName, required };
    });
}

function coerceFilter(raw: unknown): FilterExpression {
    if (raw === undefined || raw === null) return { kind: "passthrough" };
    if (typeof raw === "string") {
        if (raw === "passthrough") return { kind: "passthrough" };
        throw new Error(`Unknown filter "${raw}"`);
    }
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
        const kind = (raw as Record<string, unknown>).kind;
        if (typeof kind === "string" && VALID_FILTER_KINDS.has(kind)) {
            return { kind: "passthrough" };
        }
    }
    throw new Error("action.filter must be the string \"passthrough\" or an object with kind");
}

// ─── Top-level parse ──────────────────────────────────────────────────

export function parseSkill(src: string): ParseResult {
    try {
        const split = splitFrontmatter(src);
        if (!split) {
            return {
                ok: false,
                error: "Recipe must start with YAML frontmatter (`---` ... `---`)"
            };
        }
        const fm = parseYaml(split.frontmatter);
        const id = asString(fm.id, "id");
        const label = asString(fm.label, "label");
        const description = asString(fm.description, "description");

        // Voice gate — description MUST pass canon §11.
        const voice = validateObservation(description);
        if (!voice.valid) {
            const summary = voice.violations.map((v) => v.message).join("; ");
            return {
                ok: false,
                error: `Recipe description fails voice rules: ${summary}`
            };
        }

        const action = coerceAction(fm.action);
        const keywords = asStringArray(fm.keywords);

        const skill: Skill = {
            id,
            label,
            description,
            action,
            keywords,
            body: split.body
        };
        return { ok: true, skill };
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
