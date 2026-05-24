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
    extraHeaders: Record<string, string> = {}
): Promise<FetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
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
                ? `timeout after ${FETCH_TIMEOUT_MS}ms`
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
