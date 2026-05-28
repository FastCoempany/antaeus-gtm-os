/**
 * Trust Center / sub-processor source — pure helpers (Family 3 of the
 * source expansion track).
 *
 * The stable, non-fragile replacement for "customer logo scraping" as
 * a buyer-overlap signal. Most B2B SaaS now publishes a Trust Center
 * or sub-processor disclosure page listing the third-party services
 * they rely on (Vanta, Stripe, OpenAI, Linear, etc.). Those pages are:
 *   - structured by legal intent — companies WANT them found,
 *   - stable text content (no JS-rendered logo collages),
 *   - hosted at a small set of conventional URLs.
 *
 * The signal isn't "this company uses Vanta." The signal is "four
 * watched companies all list Vanta on their Trust pages, and one
 * off-watchlist company in the same vertical does too." That overlap
 * is what feeds periphery + patterns + (eventually) contrarian
 * framing.
 *
 * This module is the pure logic — URL discovery hints, trust-page
 * validation heuristic, sub-processor matching, cleaning rules. The
 * Deno fetcher mirrors these and adds the network layer.
 */

import type { SubprocessorVendor } from "./trust-center-vendors.config";

// ─── Discovery ─────────────────────────────────────────────────

/**
 * Common Trust Center / sub-processor URL paths. Order matters: most
 * specific (sub-processor lists) before generic (trust / security).
 * The fetcher probes these in order against each entity's domain.
 */
export const TRUST_PROBE_PATHS: ReadonlyArray<string> = [
    "/sub-processors",
    "/subprocessors",
    "/legal/sub-processors",
    "/legal/subprocessors",
    "/security/sub-processors",
    "/trust/sub-processors",
    "/privacy/sub-processors",
    "/trust-center",
    "/trust",
    "/security",
    "/compliance"
];

/**
 * Substrings the homepage discovery pass looks for, in either the
 * `<a href>` URL or the anchor's visible text. Case-insensitive.
 * Catches links to hosted trust centers (trust.foo.com, foo.vanta.com,
 * safebase.io/foo) that the path probes wouldn't reach.
 */
export const TRUST_ANCHOR_KEYWORDS: ReadonlyArray<string> = [
    "trust-center",
    "trust center",
    "sub-processor",
    "subprocessor",
    "sub processor",
    "trust.",
    ".vanta.com",
    "safebase.io",
    "trustpage.io"
];

export interface DiscoveredTrustLink {
    readonly url: string;
    /** Whether the anchor pointed to a path-probe URL ("/trust") or a
     * homepage-link URL ("https://trust.foo.com"). Useful for diagnostics. */
    readonly source: "probe" | "anchor";
    /** The matched keyword that selected it (anchor case only). */
    readonly matched_keyword: string | null;
}

const ANCHOR_TAG_REGEX = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Find homepage anchors that look like links to a Trust Center / sub-
 * processor page. Returns absolute URLs, deduped. Robust to anchor
 * text that lives across multiple lines or contains nested tags
 * (we strip tags from the anchor text before matching).
 */
export function extractTrustLinksFromHtml(
    html: string,
    baseUrl: string
): ReadonlyArray<DiscoveredTrustLink> {
    const out: DiscoveredTrustLink[] = [];
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = ANCHOR_TAG_REGEX.exec(html)) !== null) {
        const href = m[1] ?? "";
        const innerHtml = m[2] ?? "";
        // Strip nested tags to empty (not space) so "<span>Sub</span>-processor"
        // collapses to "Sub-processor" rather than "Sub -processor" — the
        // hyphenated form is what the keyword list matches against.
        const text = innerHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        const haystack = `${href} ${text}`.toLowerCase();
        let matchedKeyword: string | null = null;
        for (const kw of TRUST_ANCHOR_KEYWORDS) {
            if (haystack.includes(kw)) {
                matchedKeyword = kw;
                break;
            }
        }
        if (!matchedKeyword) continue;
        const resolved = resolveTrustUrl(href, baseUrl);
        if (!resolved || seen.has(resolved)) continue;
        seen.add(resolved);
        out.push({ url: resolved, source: "anchor", matched_keyword: matchedKeyword });
    }
    return out;
}

/** Resolve a possibly-relative URL against the base; null if invalid. */
export function resolveTrustUrl(href: string, baseUrl: string): string | null {
    const trimmed = href.trim();
    if (trimmed.length === 0) return null;
    try {
        return new URL(trimmed, baseUrl).toString();
    } catch {
        return null;
    }
}

// ─── Trust-page validation ─────────────────────────────────────

/**
 * Heuristic: is this HTML likely a trust / sub-processor page?
 *
 * Used to validate discovered URLs before we trust the cache. False
 * positives produce noise; false negatives mean we miss the page. We
 * lean toward precision — require explicit "sub-processor" language
 * OR a critical mass of known-vendor mentions.
 */
export interface TrustPageHints {
    readonly hasSubprocessorLanguage: boolean;
    readonly vendorMatchCount: number;
}

const SUBPROCESSOR_PHRASE_REGEX = /\bsub-?\s*processors?\b/i;

export function evaluateTrustPage(
    html: string,
    vendors: ReadonlyArray<SubprocessorVendor>
): TrustPageHints {
    const text = htmlToPlainText(html);
    const hasSubprocessorLanguage = SUBPROCESSOR_PHRASE_REGEX.test(text);
    let vendorMatchCount = 0;
    for (const v of vendors) {
        const re = buildVendorRegex(v.name);
        if (re && re.test(text)) {
            vendorMatchCount += 1;
            continue;
        }
        for (const alias of v.aliases) {
            const aliasRe = buildVendorRegex(alias);
            if (aliasRe && aliasRe.test(text)) {
                vendorMatchCount += 1;
                break;
            }
        }
    }
    return { hasSubprocessorLanguage, vendorMatchCount };
}

/**
 * A page passes if it explicitly uses sub-processor language OR
 * mentions enough known vendors that it's almost certainly a trust
 * page even without the explicit phrase. The vendor floor is
 * deliberately not too low — a generic "we integrate with X / Y / Z"
 * marketing page would otherwise sneak through.
 */
export const MIN_VENDOR_MATCHES_WITHOUT_LANGUAGE = 4;

export function isLikelyTrustPage(hints: TrustPageHints): boolean {
    if (hints.hasSubprocessorLanguage) return true;
    return hints.vendorMatchCount >= MIN_VENDOR_MATCHES_WITHOUT_LANGUAGE;
}

// ─── Sub-processor matching ────────────────────────────────────

export interface SubprocessorMatch {
    readonly vendor_id: string;
    readonly vendor_name: string;
    readonly category: SubprocessorVendor["category"];
    readonly context: string;
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildVendorRegex(name: string): RegExp | null {
    const trimmed = name.trim();
    if (trimmed.length < 2) return null; // single-char vendor names are noise
    return new RegExp(`(?<!\\w)${escapeRegex(trimmed)}(?!\\w)`, "i");
}

const CONTEXT_RADIUS = 140;

/**
 * Strip a basic-HTML page to plain text. Conservative: collapses
 * whitespace, removes tags, decodes common entities. Not a full HTML
 * parser — we don't need one for the substring search use case.
 */
export function htmlToPlainText(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Find every known sub-processor mentioned in the page text. One match
 * per vendor (even if mentioned multiple times) — the operator only
 * needs to know "this company uses Vanta," not "Vanta appears 3 times
 * on the page." Aliases match the canonical id/name so downstream
 * dedupe is straightforward.
 */
export function matchSubprocessors(
    text: string,
    vendors: ReadonlyArray<SubprocessorVendor>
): ReadonlyArray<SubprocessorMatch> {
    const out: SubprocessorMatch[] = [];
    const seenIds = new Set<string>();
    for (const v of vendors) {
        if (seenIds.has(v.id)) continue;
        const candidates = [v.name, ...v.aliases];
        for (const c of candidates) {
            const re = buildVendorRegex(c);
            if (!re) continue;
            const m = re.exec(text);
            if (!m) continue;
            const idx = m.index;
            const start = Math.max(0, idx - CONTEXT_RADIUS);
            const end = Math.min(text.length, idx + m[0].length + CONTEXT_RADIUS);
            const context = text.slice(start, end).trim();
            out.push({
                vendor_id: v.id,
                vendor_name: v.name,
                category: v.category,
                context
            });
            seenIds.add(v.id);
            break;
        }
    }
    return out;
}

// ─── Item cleaning ─────────────────────────────────────────────

export const PER_ENTITY_VENDOR_CAP = 10;

export interface TrustInputItem {
    readonly entity_name: string;
    readonly entity_domain: string;
    readonly trust_page_url: string;
    readonly vendor: SubprocessorMatch;
}

export type TrustRejection = "empty_entity" | "empty_url" | "empty_vendor";

export type TrustCleanOutcome =
    | { readonly kind: "keep"; readonly item: TrustInputItem }
    | { readonly kind: "reject"; readonly reason: TrustRejection };

export function cleanTrustItem(item: TrustInputItem): TrustCleanOutcome {
    if (item.entity_name.trim().length === 0) {
        return { kind: "reject", reason: "empty_entity" };
    }
    if (item.trust_page_url.trim().length === 0) {
        return { kind: "reject", reason: "empty_url" };
    }
    if (item.vendor.vendor_name.trim().length === 0) {
        return { kind: "reject", reason: "empty_vendor" };
    }
    return { kind: "keep", item };
}

export interface TrustBatchResult {
    readonly kept: ReadonlyArray<TrustInputItem>;
    readonly rejections: Readonly<Record<TrustRejection, number>>;
    readonly capped: number;
}

/**
 * Apply cleaning + the per-entity cap. Callers pass items in match-
 * order; the cap keeps the first N to avoid drowning the briefing in
 * one Fortune-50's massive sub-processor disclosure.
 */
export function cleanTrustBatch(
    items: ReadonlyArray<TrustInputItem>,
    perEntityCap: number = PER_ENTITY_VENDOR_CAP
): TrustBatchResult {
    const kept: TrustInputItem[] = [];
    const rejections: Record<TrustRejection, number> = {
        empty_entity: 0,
        empty_url: 0,
        empty_vendor: 0
    };
    let capped = 0;
    for (const it of items) {
        if (kept.length >= perEntityCap) {
            capped += 1;
            continue;
        }
        const outcome = cleanTrustItem(it);
        if (outcome.kind === "keep") kept.push(outcome.item);
        else rejections[outcome.reason] += 1;
    }
    return { kept, rejections, capped };
}

/**
 * Compose the raw-item title from a kept match. Phrasing chosen to be
 * accurate without overclaiming — "lists X on their Trust Center" is
 * exactly what we observed; "uses X" or "buys from X" would
 * overinterpret.
 */
export function buildTrustTitle(item: TrustInputItem): string {
    return `${item.entity_name} lists ${item.vendor.vendor_name} on their Trust Center`;
}

// ─── Discovered-trust-url cache shape ──────────────────────────

const REVALIDATE_AFTER_DAYS = 7;

export interface TrustCenterCache {
    readonly trust_center_url?: string;
    readonly trust_center_last_validated_at?: string;
    readonly trust_center_last_fetched_at?: string | null;
}

export function trustCacheNeedsRefresh(
    cache: TrustCenterCache | null,
    now: Date = new Date()
): boolean {
    if (!cache || !cache.trust_center_last_validated_at) return true;
    const t = new Date(cache.trust_center_last_validated_at).getTime();
    if (!Number.isFinite(t)) return true;
    const ageDays = (now.getTime() - t) / (24 * 60 * 60 * 1000);
    return ageDays >= REVALIDATE_AFTER_DAYS;
}
