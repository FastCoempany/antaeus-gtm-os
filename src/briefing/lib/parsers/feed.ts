/**
 * RSS / Atom feed parsers — Node-side reference implementations.
 *
 * The Deno source fetchers (under supabase/functions/briefing-pipeline/
 * sources/) use the same regex extractors directly — there's no shared
 * runtime between Deno + Node, so the parser logic is duplicated.
 * This file is the canonical reference; the Deno copies must stay in
 * lockstep. Vitest exercises THIS file with sample XML payloads
 * captured from real TechCrunch / PR Newswire / GitHub feeds; if a
 * regression slips into the Node side it gets caught here, and the
 * Deno copy gets updated to match.
 *
 * Design choices:
 *   - Regex over a full XML parser. The feeds we hit (TC, PR Newswire,
 *     GitHub Atom) are well-formed and predictable; a brittle
 *     full-parser dependency would be worse than a focused regex.
 *   - One function per format (RSS 2.0 vs Atom 1.0). They share enough
 *     to merge but it would muddy the per-extractor semantics.
 *   - Forgive missing-but-optional fields (description, guid). Skip
 *     entries that lack the required ones (title, link).
 *   - Decode HTML entities in titles (publishers love &amp; in titles).
 *     CDATA wrapping is also stripped.
 */

export interface FeedEntry {
    readonly external_id: string;
    readonly title: string;
    readonly link: string | null;
    readonly published_date: string | null;
    readonly summary: string | null;
}

// ─── HTML entity + CDATA helpers ───────────────────────────────

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

// ─── Tag-content extractor ─────────────────────────────────────

/**
 * Returns the textual contents of the first matching tag, or null if
 * absent. Handles single-line + multi-line tag bodies. Stops at the
 * first matching close tag — does not handle nested same-named tags
 * (RSS feeds don't do this).
 */
function extractTag(haystack: string, tag: string): string | null {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
    const m = haystack.match(re);
    return m && m[1] !== undefined ? m[1] : null;
}

/**
 * Returns the value of an attribute on the first matching tag, e.g.
 * `<link href="..." />`. Returns null if the tag or attribute is
 * absent. Handles self-closing tags (Atom links typically are).
 */
function extractAttr(haystack: string, tag: string, attr: string): string | null {
    const re = new RegExp(
        `<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*/?>`,
        "i"
    );
    const m = haystack.match(re);
    return m && m[1] !== undefined ? m[1] : null;
}

// ─── ISO-8601 normalization ────────────────────────────────────

/**
 * Best-effort conversion of a feed's publishedDate into ISO-8601.
 * Falls back to the input string if Date can't parse it (still a
 * useful artifact for audit even when we can't reason about it
 * temporally).
 */
function normalizeDate(raw: string | null): string | null {
    if (raw === null) return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

// ─── RSS 2.0 parser (TechCrunch, PR Newswire) ──────────────────

/**
 * Parses an RSS 2.0 XML string into FeedEntry[]. Each <item> in the
 * feed becomes one entry. Items missing both <title> and <link> are
 * skipped (they're not usable downstream).
 *
 * external_id resolution priority:
 *   1. <guid> (canonical RSS unique id)
 *   2. <link> (most feeds use the article URL)
 *   3. Synthesized from title + pubDate (last resort; not stable
 *      across publishers but unique-enough for one fetch)
 */
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
            guid ??
            link ??
            `synth_${safeTitle.slice(0, 60)}_${pubDate ?? ""}`;

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

// ─── Atom 1.0 parser (GitHub Releases) ─────────────────────────

/**
 * Parses an Atom 1.0 XML string into FeedEntry[]. Each <entry> in the
 * feed becomes one entry. Atom uses <link href="..."/> rather than
 * RSS's <link>...</link>, and <updated> rather than <pubDate>.
 *
 * external_id resolution priority:
 *   1. <id> (canonical Atom unique id; GitHub uses tag URIs)
 *   2. <link href="...">
 *   3. Synthesized from title + updated
 */
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
            unwrap(extractTag(body, "summary")) ??
            unwrap(extractTag(body, "content"));

        if (title === null && linkHref === null) continue;
        const safeTitle = title ?? "(untitled)";
        const externalId =
            id ??
            linkHref ??
            `synth_${safeTitle.slice(0, 60)}_${updated ?? ""}`;

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

// ─── PR Newswire personnel pre-filter ──────────────────────────

/**
 * PR Newswire's general business RSS bundles personnel announcements
 * with everything else (M&A, product launches, financials). The
 * Intelligence Coverage Audit §2.3 marks personnel announcements as
 * "100% SNR" — once filtered. This pre-filter is the title-pattern
 * heuristic that picks personnel-relevant rows out of the firehose
 * before they reach the enrichment stage.
 *
 * The patterns are deliberately conservative. False negatives (a
 * personnel announcement we drop) cost less than false positives
 * (M&A-shaped title we wrongly route as a personnel signal).
 *
 * Reference: spec §2.3 lists patterns like "joined as", "appointed",
 * "named [Title]", "steps down", "departs", "promoted to".
 */
// Title nouns we recognize as exec roles. Centralized so the
// patterns below stay readable and a single rename covers them all.
const TITLE_GROUP =
    "(?:chief|president|vp|vice\\s+president|head|director|svp|ceo|cfo|coo|cto|cmo|cro|cpo|cso|chairman)";

// Verb patterns that signal a personnel announcement. The {0,4}-word
// gap between the verb and the title noun handles real-world
// phrasings like "Beta Industries Names John Doe President" and
// "Elects new chairman to board" where filler (the named individual,
// modifiers) sits in between.
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

export function filterPersonnel(
    entries: ReadonlyArray<FeedEntry>
): ReadonlyArray<FeedEntry> {
    return entries.filter((e) => isPersonnelTitle(e.title));
}
