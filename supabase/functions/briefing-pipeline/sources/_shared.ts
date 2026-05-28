/**
 * Shared utilities for source fetchers (B.1b).
 *
 * Three concerns the source fetchers all share:
 *   1. HTTP GET with a sane User-Agent + timeout
 *   2. RSS / Atom parsing (regex-based; mirrors src/briefing/lib/
 *      parsers/feed.ts which is the canonical reference + vitest-tested)
 *   3. Personnel-title pre-filter (mirrors the same Node-side file)
 *
 * Why duplicated from the src/ tree: Deno Edge Functions can't import
 * from src/. The src/briefing/lib/parsers/ files are the canonical
 * source of truth; if regex behavior changes there (caught by vitest),
 * the change has to be mirrored here by hand. There is no runtime
 * sharing.
 */

// deno-lint-ignore-file no-explicit-any

// User-Agent must be ASCII (Fetch spec requires header values to be
// ByteString). An earlier draft used an em-dash separator — Deno's
// fetch rejected the request before it left the function, with a
// "headers of RequestInit (Argument 2) is not a valid ByteString"
// error. Hyphen is safe.
export const USER_AGENT =
    "Antaeus GTM OS / Briefing pipeline - antaeus@antaeus.app";
export const FETCH_TIMEOUT_MS = 10_000;

// ─── HTTP GET helper ───────────────────────────────────────────

export interface FetchResult {
    readonly ok: boolean;
    readonly status: number;
    readonly text: string;
    readonly error: string | null;
}

export async function httpGet(
    url: string,
    extraHeaders: Record<string, string> = {},
    timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<FetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": USER_AGENT,
                ...extraHeaders
            },
            signal: controller.signal
        });
        const text = await response.text();
        return {
            ok: response.ok,
            status: response.status,
            text,
            error: response.ok ? null : `HTTP ${response.status}`
        };
    } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        return {
            ok: false,
            status: 0,
            text: "",
            error: isAbort
                ? `timeout after ${timeoutMs}ms`
                : err instanceof Error
                ? err.message
                : String(err)
        };
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Feed parsers (mirrored from src/briefing/lib/parsers/feed.ts) ─

export interface FeedEntry {
    readonly external_id: string;
    readonly title: string;
    readonly link: string | null;
    readonly published_date: string | null;
    readonly summary: string | null;
}

const HTML_ENTITIES: Readonly<Record<string, string>> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " "
};

function decodeEntities(text: string): string {
    return text.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (m) => HTML_ENTITIES[m] ?? m);
}

function stripCdata(text: string): string {
    const m = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    return m && m[1] !== undefined ? m[1] : text;
}

function unwrap(raw: string | null): string | null {
    if (raw === null) return null;
    const trimmed = stripCdata(raw.trim());
    if (trimmed.length === 0) return null;
    return decodeEntities(trimmed);
}

function extractTag(haystack: string, tag: string): string | null {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
    const m = haystack.match(re);
    return m && m[1] !== undefined ? m[1] : null;
}

function extractAttr(haystack: string, tag: string, attr: string): string | null {
    const re = new RegExp(
        `<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*/?>`,
        "i"
    );
    const m = haystack.match(re);
    return m && m[1] !== undefined ? m[1] : null;
}

function normalizeDate(raw: string | null): string | null {
    if (raw === null) return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

export function parseRss(xml: string): ReadonlyArray<FeedEntry> {
    const itemRe = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
    const entries: FeedEntry[] = [];
    let match: RegExpExecArray | null;
    while ((match = itemRe.exec(xml)) !== null) {
        const body = match[1] ?? "";
        const title = unwrap(extractTag(body, "title"));
        const link = unwrap(extractTag(body, "link"));
        const guid = unwrap(extractTag(body, "guid"));
        const pubDate = extractTag(body, "pubDate");
        const description = unwrap(extractTag(body, "description"));
        if (title === null && link === null) continue;
        const safeTitle = title ?? "(untitled)";
        const externalId =
            guid ?? link ?? `synth_${safeTitle.slice(0, 60)}_${pubDate ?? ""}`;
        entries.push({
            external_id: externalId,
            title: safeTitle,
            link,
            published_date: normalizeDate(pubDate),
            summary: description
        });
    }
    return entries;
}

export function parseAtom(xml: string): ReadonlyArray<FeedEntry> {
    const entryRe = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi;
    const entries: FeedEntry[] = [];
    let match: RegExpExecArray | null;
    while ((match = entryRe.exec(xml)) !== null) {
        const body = match[1] ?? "";
        const title = unwrap(extractTag(body, "title"));
        const id = unwrap(extractTag(body, "id"));
        const linkHref = extractAttr(body, "link", "href");
        const updated = extractTag(body, "updated") ?? extractTag(body, "published");
        const summary =
            unwrap(extractTag(body, "summary")) ?? unwrap(extractTag(body, "content"));
        if (title === null && linkHref === null) continue;
        const safeTitle = title ?? "(untitled)";
        const externalId =
            id ?? linkHref ?? `synth_${safeTitle.slice(0, 60)}_${updated ?? ""}`;
        entries.push({
            external_id: externalId,
            title: safeTitle,
            link: linkHref,
            published_date: normalizeDate(updated),
            summary
        });
    }
    return entries;
}

// ─── Personnel pre-filter (mirrored from src/briefing/lib/parsers/feed.ts) ─

const TITLE_GROUP =
    "(?:chief|president|vp|vice\\s+president|head|director|svp|ceo|cfo|coo|cto|cmo|cro|cpo|cso|chairman)";

const PERSONNEL_PATTERNS: ReadonlyArray<RegExp> = [
    /\bappoint(s|ed|ing)\b/i,
    new RegExp(`\\bname[sd]?\\s+(?:\\S+\\s+){0,4}${TITLE_GROUP}\\b`, "i"),
    /\bjoin(s|ed)\s+(as|board)\b/i,
    new RegExp(`\\bhires?\\b.*?\\b${TITLE_GROUP}\\b`, "i"),
    /\bsteps?\s+down\b/i,
    /\bdepart(s|ing|ure)\b/i,
    /\bpromot(es?|ed|ion)\b/i,
    new RegExp(
        `\\belect(?:s|ed)?\\s+(?:\\S+\\s+){0,4}(?:to|chairman|board|${TITLE_GROUP})\\b`,
        "i"
    ),
    /\bresigns?\b/i,
    new RegExp(`\\bnew\\s+(?:\\S+\\s+){0,3}${TITLE_GROUP}\\b`, "i")
];

export function isPersonnelTitle(title: string): boolean {
    return PERSONNEL_PATTERNS.some((re) => re.test(title));
}

// ─── HTML → text + SHA-256 (mirrored from src/briefing/lib/parsers/html-strip.ts) ─

const ENTITIES: Readonly<Record<string, string>> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
    "&copy;": "(c)",
    "&reg;": "(R)",
    "&trade;": "(tm)",
    "&mdash;": "-",
    "&ndash;": "-",
    "&hellip;": "..."
};

export function stripHtmlToText(html: string): string {
    if (typeof html !== "string" || html.length === 0) return "";
    let text = html;
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
    text = text.replace(/<!--[\s\S]*?-->/g, " ");
    text = text.replace(/<[^>]+>/g, " ");
    text = text.replace(/&[a-zA-Z]+;|&#39;|&#\d+;/g, (m) => {
        if (m in ENTITIES) return ENTITIES[m] ?? " ";
        return " ";
    });
    text = text.replace(/\s+/g, " ");
    return text.trim();
}

export async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hashBuffer);
    let hex = "";
    for (const b of bytes) {
        hex += b.toString(16).padStart(2, "0");
    }
    return hex;
}

// ─── Signal Console → Briefing evidence (mirror of
//     src/briefing/lib/parsers/signal-console.ts) ──────────────────

export interface SignalConsoleSignal {
    readonly id: string;
    readonly headline: string | null;
    readonly source: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly fetched_at: string | null;
    readonly captured_at: string | null;
    readonly signal_type: string | null;
    readonly note: string | null;
    readonly confidence: number | null;
    readonly is_ai: boolean | null;
    readonly flagged: boolean | null;
    readonly account_name: string | null;
    readonly relationship_type: string | null;
}

export interface SignalRawItem {
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly data: Record<string, unknown>;
}

export function normalizeSignalSource(source: string | null | undefined): string {
    const raw = typeof source === "string" ? source.trim().toLowerCase() : "";
    const slug = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `sc:${slug.length > 0 ? slug : "unknown"}`;
}

export function mapSignalToRawItem(
    signal: SignalConsoleSignal
): SignalRawItem | null {
    if (signal.flagged === true) return null;
    const title = (signal.headline ?? "").trim();
    if (title.length === 0) return null;

    const account = (signal.account_name ?? "").trim();
    const bodyParts: string[] = [];
    if (account.length > 0) {
        bodyParts.push(`Account: ${account} (competitor in the operator's watchlist).`);
    }
    if (signal.signal_type && signal.signal_type.trim().length > 0) {
        bodyParts.push(`Signal type: ${signal.signal_type.trim()}.`);
    }
    if (signal.note && signal.note.trim().length > 0) {
        bodyParts.push(signal.note.trim());
    }
    const body = bodyParts.length > 0 ? bodyParts.join(" ") : null;

    const published =
        signal.published_date ?? signal.fetched_at ?? signal.captured_at ?? null;

    return {
        source_id: normalizeSignalSource(signal.source),
        external_id: `signal:${signal.id}`,
        title,
        body,
        url: signal.url && signal.url.trim().length > 0 ? signal.url.trim() : null,
        published_date: published,
        data: {
            signal_id: signal.id,
            account_name: account.length > 0 ? account : null,
            signal_type: signal.signal_type ?? null,
            editorial_source: signal.source ?? null,
            confidence: typeof signal.confidence === "number" ? signal.confidence : null,
            is_ai: signal.is_ai === true,
            relationship_type: signal.relationship_type ?? null,
            origin: "signal_console"
        }
    };
}

// ─── Owned-Content RSS helpers (mirror of src/briefing/lib/parsers/owned-content.ts) ─

export const FEED_PROBE_PATHS: ReadonlyArray<string> = [
    "/blog/feed",
    "/blog/feed.xml",
    "/blog/rss",
    "/blog/rss.xml",
    "/blog/atom.xml",
    "/feed",
    "/feed.xml",
    "/rss",
    "/rss.xml",
    "/atom.xml",
    "/resources/feed",
    "/podcast/feed",
    "/news/feed"
];

export interface DiscoveredFeedLink {
    readonly url: string;
    readonly kind: "rss" | "atom" | "unknown";
    readonly title: string | null;
}

const FEED_LINK_TAG_REGEX =
    /<link\s+[^>]*rel\s*=\s*["']alternate["'][^>]*>/gi;

export function extractFeedLinksFromHtml(
    html: string,
    baseUrl: string
): ReadonlyArray<DiscoveredFeedLink> {
    const out: DiscoveredFeedLink[] = [];
    const seen = new Set<string>();
    const matches = html.match(FEED_LINK_TAG_REGEX) ?? [];
    for (const tag of matches) {
        const typeMatch = tag.match(/type\s*=\s*["']([^"']+)["']/i);
        const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
        const titleMatch = tag.match(/title\s*=\s*["']([^"']+)["']/i);
        if (!hrefMatch || !typeMatch) continue;
        const t = typeMatch[1]?.toLowerCase() ?? "";
        let kind: "rss" | "atom" | "unknown" = "unknown";
        if (t.includes("rss")) kind = "rss";
        else if (t.includes("atom")) kind = "atom";
        else continue;
        const resolved = resolveOwnedUrl(hrefMatch[1] ?? "", baseUrl);
        if (!resolved || seen.has(resolved)) continue;
        seen.add(resolved);
        out.push({
            url: resolved,
            kind,
            title: titleMatch ? titleMatch[1] ?? null : null
        });
    }
    return out;
}

export function resolveOwnedUrl(href: string, baseUrl: string): string | null {
    const trimmed = href.trim();
    if (trimmed.length === 0) return null;
    try {
        return new URL(trimmed, baseUrl).toString();
    } catch {
        return null;
    }
}

export function normalizeDomain(domain: string): string | null {
    const trimmed = domain.trim().toLowerCase();
    if (trimmed.length === 0) return null;
    const noProtocol = trimmed.replace(/^https?:\/\//, "");
    const noTrailing = noProtocol.replace(/\/+$/, "");
    const noWww = noTrailing.replace(/^www\./, "");
    if (!/^[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/.test(noWww)) return null;
    return noWww;
}

export function buildProbeUrls(domain: string): ReadonlyArray<string> {
    const root = normalizeDomain(domain);
    if (!root) return [];
    return FEED_PROBE_PATHS.map((p) => `https://${root}${p}`);
}

export function buildHomepageUrl(domain: string): string | null {
    const root = normalizeDomain(domain);
    if (!root) return null;
    return `https://${root}/`;
}

export interface MinimalFeedEntry {
    readonly published_date: string | null;
}

export function passesFeedFreshness(
    entries: ReadonlyArray<MinimalFeedEntry>,
    opts: { minItems?: number; maxAgeDays?: number; now?: Date } = {}
): boolean {
    const minItems = opts.minItems ?? 1;
    const maxAgeDays = opts.maxAgeDays ?? 365;
    const now = opts.now ?? new Date();
    if (entries.length < minItems) return false;
    const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
    for (const e of entries) {
        if (!e.published_date) continue;
        const t = new Date(e.published_date).getTime();
        if (!Number.isFinite(t)) continue;
        if (t >= cutoff) return true;
    }
    return false;
}

export const MARKETING_FLUFF_PATTERNS: ReadonlyArray<RegExp> = [
    /^\s*\d+\s+(tips|ways|reasons|things|steps|hacks|secrets|lessons)/i,
    /^\s*(the\s+)?ultimate\s+guide\s+to/i,
    /^\s*(introducing|announcing)\s+our\s+new/i,
    /^\s*how\s+to\s+(boost|improve|increase|maximize|grow|scale|10x)\s+your/i,
    /^\s*\d+\s+best\s+(practices|tools|tips)/i,
    /\bbest\s+practices\b.*\b(checklist|guide|playbook)\b/i,
    /^\s*(top|best)\s+\d+\s+/i,
    /^\s*\[(webinar|ebook|whitepaper|guide)\]/i
];

export const MIN_BODY_LENGTH = 120;
export const PER_ENTITY_ITEM_CAP = 5;

export interface CleanInputItem {
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
}

export type CleanRejection =
    | "empty_title"
    | "empty_body"
    | "body_too_short"
    | "marketing_fluff"
    | "no_url";

export type CleanOutcome =
    | { readonly kind: "keep"; readonly item: CleanInputItem }
    | { readonly kind: "reject"; readonly reason: CleanRejection };

export function cleanFeedItem(item: CleanInputItem): CleanOutcome {
    const title = item.title.trim();
    if (title.length === 0) return { kind: "reject", reason: "empty_title" };
    if (!item.url || item.url.trim().length === 0) {
        return { kind: "reject", reason: "no_url" };
    }
    if (!item.body || item.body.trim().length === 0) {
        return { kind: "reject", reason: "empty_body" };
    }
    const bodyLen = item.body.trim().length;
    if (bodyLen < MIN_BODY_LENGTH) {
        return { kind: "reject", reason: "body_too_short" };
    }
    for (const pat of MARKETING_FLUFF_PATTERNS) {
        if (pat.test(title)) return { kind: "reject", reason: "marketing_fluff" };
    }
    return { kind: "keep", item: { ...item, title, body: item.body.trim() } };
}

export interface BatchCleanResult {
    readonly kept: ReadonlyArray<CleanInputItem>;
    readonly rejections: Readonly<Record<CleanRejection, number>>;
    readonly capped: number;
}

export function cleanFeedBatch(
    items: ReadonlyArray<CleanInputItem>,
    perEntityCap: number = PER_ENTITY_ITEM_CAP
): BatchCleanResult {
    const kept: CleanInputItem[] = [];
    const rejections: Record<CleanRejection, number> = {
        empty_title: 0,
        empty_body: 0,
        body_too_short: 0,
        marketing_fluff: 0,
        no_url: 0
    };
    let capped = 0;
    for (const it of items) {
        if (kept.length >= perEntityCap) {
            capped += 1;
            continue;
        }
        const outcome = cleanFeedItem(it);
        if (outcome.kind === "keep") {
            kept.push(outcome.item);
        } else {
            rejections[outcome.reason] += 1;
        }
    }
    return { kept, rejections, capped };
}

export interface CachedFeed {
    readonly url: string;
    readonly kind: "rss" | "atom" | "unknown";
    readonly last_validated_at: string;
    readonly last_fetched_at: string | null;
    readonly fetch_failures: number;
}

export interface DiscoveredFeedsCache {
    readonly discovered_feeds?: ReadonlyArray<CachedFeed>;
    readonly last_discovery_at?: string;
}

const REVALIDATE_AFTER_DAYS = 7;

export function cacheNeedsRefresh(
    cache: DiscoveredFeedsCache | null,
    now: Date = new Date()
): boolean {
    if (!cache || !cache.last_discovery_at) return true;
    const t = new Date(cache.last_discovery_at).getTime();
    if (!Number.isFinite(t)) return true;
    const ageDays = (now.getTime() - t) / (24 * 60 * 60 * 1000);
    return ageDays >= REVALIDATE_AFTER_DAYS;
}

export const MAX_CACHED_FEEDS_PER_ENTITY = 4;
