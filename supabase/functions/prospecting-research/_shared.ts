/**
 * Shared helpers for the Prospecting Desk research Edge Function.
 *
 * Self-contained module (no Deno globals, no imports) so it bundles
 * standalone for the Edge runtime AND can be imported by vitest for the
 * parsing / guard tests. Same pattern as
 * supabase/functions/outdoors-events-discovery/_shared.ts.
 *
 * Everything the seller sees is built here from the model's JSON, and
 * every guard that keeps the output honest lives here:
 *   - a company needs at least one https source that the web search
 *     actually returned (no source → dropped)
 *   - a buying signal needs its own verified source (no source → dropped)
 *   - undated signals are kept but marked undated
 *   - duplicate companies and companies already in the workspace are dropped
 *   - every visible sentence passes the voice gate, or falls back to empty
 */

// deno-lint-ignore-file no-explicit-any

// ─── Models + cost ─────────────────────────────────────────────────

export const MODELS = {
    sonnet_4_6: {
        api_id: "claude-sonnet-4-6",
        label: "Sonnet 4.6",
        input_per_million_usd: 3.0,
        output_per_million_usd: 15.0
    }
} as const;

export type ModelKey = keyof typeof MODELS;

export interface TokenUsage {
    readonly input_tokens: number;
    readonly output_tokens: number;
}

/** Anthropic web_search is billed per search ($10 / 1000) on top of tokens. */
export const WEB_SEARCH_COST_PER_USE_USD = 0.01;

export function computeCost(model: ModelKey, usage: TokenUsage): number {
    const p = MODELS[model];
    return (
        (usage.input_tokens / 1_000_000) * p.input_per_million_usd +
        (usage.output_tokens / 1_000_000) * p.output_per_million_usd
    );
}

export function roundCost(usd: number): number {
    return Math.round(usd * 10_000) / 10_000;
}

// ─── Weekly budget ─────────────────────────────────────────────────

/** Per-workspace weekly ceiling for paid research. */
export const WEEKLY_CEILING_USD = 3.0;
/** Warn at 80% of the ceiling. */
export const WARN_AT_USD = WEEKLY_CEILING_USD * 0.8;
/** Throttle (fewer searches, fewer results) at the ceiling. */
export const THROTTLE_AT_USD = WEEKLY_CEILING_USD;
/** Pause (no paid call at all) at 150% of the ceiling. */
export const PAUSE_AT_USD = WEEKLY_CEILING_USD * 1.5;

export type BudgetState = "ok" | "warn" | "throttled" | "paused";

export function budgetStateFor(spentUsd: number): BudgetState {
    if (spentUsd >= PAUSE_AT_USD) return "paused";
    if (spentUsd >= THROTTLE_AT_USD) return "throttled";
    if (spentUsd >= WARN_AT_USD) return "warn";
    return "ok";
}

// ─── Voice gate ────────────────────────────────────────────────────

/**
 * Deno-side copy of the banned list in src/lib/voice/voice-document.ts +
 * banned-vocabulary.ts (the Node tree can't be imported from the Edge
 * runtime). Matched as whole words / phrases, case-insensitive.
 */
export const BANNED_TERMS: ReadonlyArray<string> = [
    // corporate vocabulary
    "leverage", "leveraged", "leveraging", "leverages",
    "unlock", "unlocked", "unlocking", "unlocks",
    "revolutionize", "revolutionized", "revolutionizing", "revolutionary",
    "supercharge", "supercharged", "supercharging",
    "magic", "magical",
    "transformative", "transformational",
    "game-changing", "game-changer", "paradigm shift",
    "synergy", "synergies", "synergistic",
    "best-in-class", "world-class", "cutting-edge", "next-generation", "next-gen", "robust",
    "seamless", "seamlessly", "holistic", "innovative",
    "empower", "empowered", "empowering", "empowers", "empowerment",
    "ecosystem", "streamline", "streamlined", "streamlining", "mission-critical",
    "ai-powered", "powerful", "trusted by",
    // product jargon + retired ontology
    "wedge", "verdict", "the move", "decision-grade", "operating truth",
    "command intelligence", "field read", "operator move", "main risk",
    "earned", "earns", "spine", "dividend", "pays back"
];

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BANNED_RE = new RegExp(
    `(^|[^a-z0-9-])(${BANNED_TERMS.map(escapeRe).join("|")})(?=$|[^a-z0-9-])`,
    "i"
);

export const MAX_SENTENCE_CHARS = 320;

/** True when the text is non-empty, plain, and short enough to show. */
export function passesVoice(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > MAX_SENTENCE_CHARS) return false;
    if (BANNED_RE.test(trimmed)) return false;
    return true;
}

/** Return the trimmed text when it passes the voice gate, otherwise "". */
export function voiceOrEmpty(v: unknown): string {
    if (typeof v !== "string") return "";
    const t = v.replace(/\s+/g, " ").trim();
    return passesVoice(t) ? t : "";
}

// ─── Inputs ────────────────────────────────────────────────────────

export const MAX_DESCRIPTION_CHARS = 600;
export const MAX_CONTEXT_CHARS = 600;
export const MAX_EXCLUDE = 400;
export const MAX_RESEARCH_COMPANIES = 5;
export const MAX_FIND_RESULTS = 8;
export const MAX_SIGNALS_PER_COMPANY = 5;
export const MAX_SOURCES_PER_COMPANY = 4;

export function cleanText(v: unknown, max: number): string {
    if (typeof v !== "string") return "";
    return v.replace(/\s+/g, " ").trim().slice(0, max);
}

export function cleanNameList(v: unknown, max: number): string[] {
    if (!Array.isArray(v)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of v) {
        const name = cleanText(item, 120);
        if (!name) continue;
        const key = normalizeCompanyName(name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(name);
        if (out.length >= max) break;
    }
    return out;
}

// ─── Company names ─────────────────────────────────────────────────

const COMPANY_SUFFIXES = new Set([
    "inc", "incorporated", "llc", "ltd", "limited", "corp", "corporation",
    "co", "company", "plc", "gmbh", "ag", "sa", "nv", "bv", "pty", "lp",
    "llp", "holdings", "the"
]);

/**
 * Case-, punctuation- and legal-suffix-insensitive key, so
 * "Vanta, Inc." and "vanta" are the same company.
 */
export function normalizeCompanyName(name: string): string {
    const words = name
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    while (words.length > 1 && COMPANY_SUFFIXES.has(words[words.length - 1]!)) {
        words.pop();
    }
    while (words.length > 1 && words[0] === "the") words.shift();
    return words.join(" ");
}

// ─── URLs ──────────────────────────────────────────────────────────

/** Comparable form: lowercase host without www, path without trailing slash. */
export function normalizeUrl(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!host.includes(".")) return null;
    const path = u.pathname.replace(/\/+$/, "");
    return `${host}${path}`;
}

/** Build the lookup set of URLs the web search actually returned. */
export function buildAllowedUrlSet(urls: ReadonlyArray<string>): Set<string> {
    const out = new Set<string>();
    for (const u of urls) {
        const n = normalizeUrl(u);
        if (n) out.add(n);
    }
    return out;
}

/** Returns the clean https URL when it was returned by the search, else null. */
export function verifiedUrl(v: unknown, allowed: Set<string>): string | null {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    if (!/^https:\/\//i.test(trimmed)) return null;
    const n = normalizeUrl(trimmed);
    if (!n || !allowed.has(n)) return null;
    return trimmed;
}

export function normalizeDomain(v: unknown): string | null {
    if (typeof v !== "string") return null;
    let s = v.trim().toLowerCase();
    if (!s) return null;
    s = s.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0] ?? "";
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)) return null;
    return s;
}

export function normalizeDate(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const m = v.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!m) return null;
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return m[3] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[1]}-${m[2]}-01`;
}

export type Confidence = "high" | "medium" | "low";

function asConfidence(v: unknown): Confidence {
    return v === "high" || v === "medium" || v === "low" ? v : "low";
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

// ─── Output shapes ─────────────────────────────────────────────────

export interface BuyingSignal {
    readonly what: string;
    /** ISO date (YYYY-MM-DD) or null when the source gives no date. */
    readonly date: string | null;
    readonly dated: boolean;
    readonly source_url: string;
}

export interface WhoToTarget {
    readonly role: string;
    readonly why: string;
}

export interface FoundCompany {
    readonly name: string;
    readonly domain: string | null;
    readonly why_fit: string;
    readonly signal: BuyingSignal | null;
    readonly sources: ReadonlyArray<string>;
    readonly who_to_target: WhoToTarget | null;
    readonly opening_angle: string;
    readonly confidence: Confidence;
}

export interface DraftAnswers {
    readonly target_fit: string;
    readonly way_in: string;
    readonly outreach: string;
}

export interface ResearchedCompany {
    readonly name: string;
    readonly domain: string | null;
    readonly what_they_do: string;
    readonly signals: ReadonlyArray<BuyingSignal>;
    readonly fit_matches: ReadonlyArray<string>;
    readonly fit_unknowns: ReadonlyArray<string>;
    readonly who_to_target: WhoToTarget | null;
    readonly opening_angle: string;
    readonly draft_answers: DraftAnswers;
    readonly sources: ReadonlyArray<string>;
}

function parseSignal(raw: unknown, allowed: Set<string>): BuyingSignal | null {
    const o = asObject(raw);
    if (!o) return null;
    const what = voiceOrEmpty(o.what);
    if (!what) return null;
    const source = verifiedUrl(o.source_url, allowed);
    if (!source) return null;
    const date = normalizeDate(o.date);
    return { what, date, dated: date !== null, source_url: source };
}

function parseWho(raw: unknown): WhoToTarget | null {
    const o = asObject(raw);
    if (!o) return null;
    const role = voiceOrEmpty(o.role).slice(0, 120);
    if (!role) return null;
    return { role, why: voiceOrEmpty(o.why) };
}

function parseSources(
    raw: unknown,
    allowed: Set<string>,
    extra: ReadonlyArray<string>
): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (u: unknown): void => {
        const v = verifiedUrl(u, allowed);
        if (!v) return;
        const key = normalizeUrl(v)!;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(v);
    };
    if (Array.isArray(raw)) for (const u of raw) push(u);
    for (const u of extra) push(u);
    return out.slice(0, MAX_SOURCES_PER_COMPANY);
}

function cleanList(raw: unknown, max: number): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(voiceOrEmpty).filter((s) => s.length > 0).slice(0, max);
}

/**
 * Parse the `find` model output. Drops companies without a verified
 * source, without a plain fit sentence, duplicates, and excluded names.
 */
export function parseFoundCompanies(
    raw: unknown,
    allowed: Set<string>,
    exclude: ReadonlyArray<string>,
    limit: number = MAX_FIND_RESULTS
): FoundCompany[] {
    if (!Array.isArray(raw)) return [];
    const excluded = new Set(exclude.map(normalizeCompanyName).filter(Boolean));
    const seen = new Set<string>();
    const out: FoundCompany[] = [];
    for (const item of raw) {
        const o = asObject(item);
        if (!o) continue;
        const name = cleanText(o.name, 120);
        if (!name) continue;
        const key = normalizeCompanyName(name);
        if (!key || excluded.has(key) || seen.has(key)) continue;
        const whyFit = voiceOrEmpty(o.why_fit);
        if (!whyFit) continue;
        const signal = parseSignal(o.signal, allowed);
        const sources = parseSources(o.sources, allowed, signal ? [signal.source_url] : []);
        if (sources.length === 0) continue;
        seen.add(key);
        out.push({
            name,
            domain: normalizeDomain(o.domain),
            why_fit: whyFit,
            signal,
            sources,
            who_to_target: parseWho(o.who_to_target),
            opening_angle: voiceOrEmpty(o.opening_angle),
            confidence: asConfidence(o.confidence)
        });
        if (out.length >= limit) break;
    }
    return out;
}

export interface ParsedResearch {
    readonly companies: ResearchedCompany[];
    readonly not_found: string[];
}

/**
 * Parse the `research` model output. Only companies the seller named are
 * kept (matched by normalized name). A requested company with no verified
 * source lands in `not_found`.
 */
export function parseResearchedCompanies(
    raw: unknown,
    allowed: Set<string>,
    requested: ReadonlyArray<string>
): ParsedResearch {
    const wanted = new Map<string, string>();
    for (const name of requested) {
        const key = normalizeCompanyName(name);
        if (key) wanted.set(key, name);
    }
    const done = new Set<string>();
    const companies: ResearchedCompany[] = [];
    if (Array.isArray(raw)) {
        for (const item of raw) {
            const o = asObject(item);
            if (!o) continue;
            const key = normalizeCompanyName(cleanText(o.name, 120));
            if (!key || !wanted.has(key) || done.has(key)) continue;
            const signals: BuyingSignal[] = [];
            if (Array.isArray(o.signals)) {
                for (const s of o.signals) {
                    const parsed = parseSignal(s, allowed);
                    if (parsed) signals.push(parsed);
                    if (signals.length >= MAX_SIGNALS_PER_COMPANY) break;
                }
            }
            const sources = parseSources(o.sources, allowed, signals.map((s) => s.source_url));
            if (sources.length === 0) continue;
            const fit = asObject(o.fit) ?? {};
            const drafts = asObject(o.draft_answers) ?? {};
            done.add(key);
            companies.push({
                name: wanted.get(key)!,
                domain: normalizeDomain(o.domain),
                what_they_do: voiceOrEmpty(o.what_they_do),
                signals,
                fit_matches: cleanList(fit.matches, 4),
                fit_unknowns: cleanList(fit.unknowns, 4),
                who_to_target: parseWho(o.who_to_target),
                opening_angle: voiceOrEmpty(o.opening_angle),
                draft_answers: {
                    target_fit: voiceOrEmpty(drafts.target_fit),
                    way_in: voiceOrEmpty(drafts.way_in),
                    outreach: voiceOrEmpty(drafts.outreach)
                },
                sources
            });
        }
    }
    const not_found = [...wanted.entries()]
        .filter(([key]) => !done.has(key))
        .map(([, name]) => name);
    return { companies, not_found };
}

/**
 * Pull a JSON array out of model text that may wrap it in prose or a
 * ```json fence. Returns [] when no array parses.
 */
export function extractJsonArray(text: string): unknown {
    if (!text) return [];
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fence ? fence[1]! : text;
    const start = candidate.indexOf("[");
    const end = candidate.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) return [];
    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return [];
    }
}

// ─── Search result URLs ───────────────────────────────────────────

/**
 * URLs from `web_search_tool_result` blocks and from text-block
 * citations. These are the only URLs a returned company may cite.
 */
export function collectResultUrls(content: ReadonlyArray<any>): string[] {
    const urls: string[] = [];
    for (const b of content) {
        if (b?.type === "web_search_tool_result" && Array.isArray(b.content)) {
            for (const r of b.content) {
                if (typeof r?.url === "string") urls.push(r.url);
            }
        }
        if (b?.type === "text" && Array.isArray(b.citations)) {
            for (const c of b.citations) {
                if (typeof c?.url === "string") urls.push(c.url);
            }
        }
    }
    return urls;
}

// ─── Prompts ───────────────────────────────────────────────────────

const VOICE_RULES = `Write every sentence in plain words a sales manager would say out loud. No buzzwords, no hype, no promotional language. Do not say a company "will" buy or is "ready" to buy; say what happened and why it may matter.`;

export const FIND_SYSTEM_PROMPT = `You are a research assistant for a B2B seller. The seller describes the kind of companies they want to sell to. Use web search to find real companies that match, grounded in public evidence: news, funding announcements, job posts, executive changes, and company pages.

Rules:
- Use web search. Every company must be backed by at least one page you actually found in search results. Copy source URLs exactly as they appear in the search results. Never invent a company, a fact, a date, or a URL.
- A buying signal is a specific public event (a funding round, a new executive, a hiring push, an expansion, a product launch). Give its date if the source gives one, otherwise null. If you cannot find a sourced signal, set "signal" to null.
- Leave out companies the seller says they already have.
- If you are not confident a company matches, leave it out. Fewer, well-sourced companies are better than many weak ones.
- ${VOICE_RULES}

Return ONLY a JSON array, no prose around it. Each element:
{
  "name": "company name",
  "domain": "company.com",
  "why_fit": "one plain sentence tying the company to the seller's description",
  "signal": { "what": "one sentence: what happened", "date": "YYYY-MM-DD or null", "source_url": "https://..." } or null,
  "sources": ["https://... (1 to 4 pages you found)"],
  "who_to_target": { "role": "job title to contact first", "why": "one sentence" },
  "opening_angle": "one sentence the seller could open with",
  "confidence": "high | medium | low"
}`;

export const RESEARCH_SYSTEM_PROMPT = `You are a research assistant for a B2B seller. The seller names specific companies. For each one, use web search to write a short, sourced brief from public evidence: news, funding announcements, job posts, executive changes, and the company's own pages.

Rules:
- Use web search. Copy source URLs exactly as they appear in the search results. Never invent a fact, a date, or a URL.
- Signals are specific public events, most recent first, each with its own source URL. Give the date if the source gives one, otherwise null.
- Under "fit", list what matches the seller's description or ideal customer, and what you could not confirm.
- The draft answers are suggestions for the seller to check and edit, not facts. Keep each to one or two sentences.
- If you cannot find public sources for a company, return it with an empty "sources" array.
- ${VOICE_RULES}

Return ONLY a JSON array, no prose around it. Each element:
{
  "name": "the company name exactly as the seller typed it",
  "domain": "company.com",
  "what_they_do": "one plain sentence",
  "signals": [{ "what": "one sentence", "date": "YYYY-MM-DD or null", "source_url": "https://..." }],
  "fit": { "matches": ["short sentence"], "unknowns": ["short sentence"] },
  "who_to_target": { "role": "job title", "why": "one sentence" },
  "opening_angle": "one sentence",
  "draft_answers": {
    "target_fit": "suggested answer to: does this account match who we target?",
    "way_in": "suggested answer to: what is our reason or path into the account?",
    "outreach": "suggested answer to: how will we reach out?"
  },
  "sources": ["https://..."]
}`;

export interface SellerContext {
    readonly description: string;
    readonly icp: string;
    readonly focus: string;
}

function contextLines(ctx: SellerContext): string[] {
    const lines: string[] = [];
    if (ctx.description) lines.push(`Who the seller is after: ${ctx.description}`);
    if (ctx.icp) lines.push(`The seller's ideal customer profile: ${ctx.icp}`);
    if (ctx.focus) lines.push(`The territory group they are working: ${ctx.focus}`);
    return lines;
}

export function buildFindPrompt(
    ctx: SellerContext,
    exclude: ReadonlyArray<string>,
    limit: number
): string {
    const lines = contextLines(ctx);
    if (exclude.length > 0) {
        lines.push("");
        lines.push(`Companies the seller already has (leave these out): ${exclude.slice(0, 150).join("; ")}`);
    }
    lines.push("");
    lines.push(`Find up to ${limit} companies that match. Use web search and cite what you find.`);
    return lines.join("\n");
}

export function buildResearchPrompt(
    ctx: SellerContext,
    companies: ReadonlyArray<string>
): string {
    const lines = contextLines(ctx);
    lines.push("");
    lines.push(`Research these companies: ${companies.join("; ")}`);
    return lines.join("\n");
}

// ─── Automatic weekly re-checks of saved searches ──────────────────────
//
// The cron calls { action: "rerun_saved" } with the service-role key.
// Nothing spends unless BOTH switches are on:
//   1. the server switch: secret PROSPECTING_AUTO_RERUN = "on"
//      (unset while building, so no paid calls);
//   2. the workspace switch: workspace_profile.prospecting_auto_rerun_enabled
//      (Settings → "Re-check saved searches automatically", default off).
// Each re-check still goes through the weekly cost ceiling.

export const AUTO_RERUN_INTERVAL_DAYS = 7;
export const AUTO_RERUN_MAX_CARDS_PER_WORKSPACE = 3;
export const AUTO_RERUN_MAX_RESULTS = 5;

export function autoRerunServerEnabled(flag: string | undefined | null): boolean {
    return typeof flag === "string" && flag.trim().toLowerCase() === "on";
}

/** A saved search is due when it was never checked or was last checked ≥ 7 days ago. */
export function savedSearchIsDue(
    data: Record<string, unknown>,
    nowMs: number,
    intervalDays: number = AUTO_RERUN_INTERVAL_DAYS
): boolean {
    if (typeof data.query !== "string" || data.query.trim().length < 3) return false;
    const at = typeof data.lastCheckedAt === "string" ? Date.parse(data.lastCheckedAt) : NaN;
    if (!Number.isFinite(at)) return true;
    return nowMs - at >= intervalDays * 24 * 60 * 60 * 1000;
}

/**
 * The studio_artifacts `data` for a company the weekly re-check found.
 * Same shape the Prospecting Desk writes when a seller adds a search
 * result (state "captured", nothing answered), plus autoFound so the
 * room can say it came from the automatic re-check.
 */
export function foundCompanyToProspectData(
    c: FoundCompany,
    savedSearchId: string,
    nowIso: string
): Record<string, unknown> {
    const signals = c.signal
        ? [{ what: c.signal.what, date: c.signal.date, sourceUrl: c.signal.source_url, sourceName: null }]
        : [];
    return {
        kind: "sourcing.prospect",
        accountName: c.name,
        contactName: "",
        contactTitle: c.who_to_target?.role ?? "",
        sourceQueryId: savedSearchId,
        leverage: signals.length > 0 ? "market-signal" : "cold",
        stage: "captured",
        entryPoint: "",
        approach: "",
        notes: "",
        autoFound: true,
        webResearch: {
            kind: "find",
            researchedAt: nowIso,
            summary: c.why_fit,
            domain: c.domain,
            signals,
            sources: c.sources,
            whoToTarget: c.who_to_target,
            openingAngle: c.opening_angle,
            confidence: c.confidence,
            fitMatches: [],
            fitUnknowns: [],
            suggested: null,
            sample: false,
            auto: true
        }
    };
}
