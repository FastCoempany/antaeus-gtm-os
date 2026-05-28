import { describe, it, expect } from "vitest";
import {
    MARKETING_FLUFF_PATTERNS,
    MIN_BODY_LENGTH,
    PER_ENTITY_ITEM_CAP,
    type CachedFeed,
    type CleanInputItem,
    type DiscoveredFeedsCache,
    buildHomepageUrl,
    buildProbeUrls,
    cacheNeedsRefresh,
    cleanFeedBatch,
    cleanFeedItem,
    extractFeedLinksFromHtml,
    normalizeDomain,
    passesFeedFreshness,
    resolveUrl
} from "./owned-content";

/**
 * B.4d sub-track — owned-content RSS cleaning + discovery.
 *
 * Pure logic only; the Deno fetcher mirrors these. The tests lock the
 * contract auto-discovery + ingest depend on.
 */

describe("normalizeDomain", () => {
    it("strips protocol, www, trailing slashes, casing", () => {
        expect(normalizeDomain("https://www.Deel.com/")).toBe("deel.com");
        expect(normalizeDomain("HTTP://RIPPLING.COM")).toBe("rippling.com");
        expect(normalizeDomain("  remote.com  ")).toBe("remote.com");
    });

    it("rejects empty / bare-word / malformed input", () => {
        expect(normalizeDomain("")).toBeNull();
        expect(normalizeDomain("localhost")).toBeNull();
        expect(normalizeDomain("not a domain")).toBeNull();
        expect(normalizeDomain("https://")).toBeNull();
    });

    it("accepts multi-level subdomains", () => {
        expect(normalizeDomain("blog.example.co.uk")).toBe("blog.example.co.uk");
    });
});

describe("buildProbeUrls / buildHomepageUrl", () => {
    it("builds homepage url with trailing slash", () => {
        expect(buildHomepageUrl("deel.com")).toBe("https://deel.com/");
    });

    it("builds probe urls covering blog-feed first then bare-root", () => {
        const urls = buildProbeUrls("deel.com");
        expect(urls[0]).toBe("https://deel.com/blog/feed");
        expect(urls).toContain("https://deel.com/feed.xml");
        expect(urls).toContain("https://deel.com/atom.xml");
        expect(urls.length).toBeGreaterThanOrEqual(10);
    });

    it("returns nothing for an invalid domain", () => {
        expect(buildProbeUrls("nope")).toEqual([]);
        expect(buildHomepageUrl("")).toBeNull();
    });
});

describe("resolveUrl", () => {
    it("resolves relative paths against the base", () => {
        expect(resolveUrl("/feed", "https://deel.com/")).toBe("https://deel.com/feed");
        expect(resolveUrl("feed.xml", "https://deel.com/blog/")).toBe(
            "https://deel.com/blog/feed.xml"
        );
    });

    it("passes through absolute urls", () => {
        expect(resolveUrl("https://elsewhere.com/feed", "https://deel.com/")).toBe(
            "https://elsewhere.com/feed"
        );
    });

    it("rejects empty / garbage input", () => {
        expect(resolveUrl("", "https://deel.com/")).toBeNull();
        expect(resolveUrl("not a url", "not a base")).toBeNull();
    });
});

describe("extractFeedLinksFromHtml", () => {
    it("picks up <link rel='alternate' type='application/rss+xml'>", () => {
        const html = `
            <head>
              <link rel="alternate" type="application/rss+xml" href="/blog/feed" title="Deel Blog">
              <link rel="alternate" type="application/atom+xml" href="https://deel.com/news/atom.xml" title="News">
              <link rel="stylesheet" href="/css/site.css">
            </head>`;
        const links = extractFeedLinksFromHtml(html, "https://deel.com/");
        expect(links).toHaveLength(2);
        expect(links[0]?.url).toBe("https://deel.com/blog/feed");
        expect(links[0]?.kind).toBe("rss");
        expect(links[0]?.title).toBe("Deel Blog");
        expect(links[1]?.kind).toBe("atom");
    });

    it("ignores non-feed alternates (JSON feed, hreflang)", () => {
        const html = `
            <link rel="alternate" type="application/json" href="/feed.json">
            <link rel="alternate" hreflang="en-us" href="/en/">
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">`;
        const links = extractFeedLinksFromHtml(html, "https://x.com/");
        expect(links).toHaveLength(1);
        expect(links[0]?.kind).toBe("rss");
    });

    it("dedupes by resolved URL", () => {
        const html = `
            <link rel="alternate" type="application/rss+xml" href="https://x.com/feed">
            <link rel="alternate" type="application/rss+xml" href="/feed">`;
        const links = extractFeedLinksFromHtml(html, "https://x.com/");
        expect(links).toHaveLength(1);
    });

    it("returns [] for HTML with no advertised feeds", () => {
        expect(extractFeedLinksFromHtml("<html><body>hi</body></html>", "https://x.com/"))
            .toEqual([]);
    });
});

describe("passesFeedFreshness", () => {
    const now = new Date("2026-05-28T00:00:00Z");

    it("accepts a feed with at least one recent item", () => {
        const entries = [{ published_date: "2026-05-20T00:00:00Z" }];
        expect(passesFeedFreshness(entries, { now })).toBe(true);
    });

    it("rejects an abandoned blog (no items in 365 days)", () => {
        const entries = [{ published_date: "2024-01-01T00:00:00Z" }];
        expect(passesFeedFreshness(entries, { now })).toBe(false);
    });

    it("rejects an empty feed", () => {
        expect(passesFeedFreshness([], { now })).toBe(false);
    });

    it("tolerates entries with no published_date (passes if any sibling is fresh)", () => {
        const entries = [
            { published_date: null },
            { published_date: "2026-05-20T00:00:00Z" }
        ];
        expect(passesFeedFreshness(entries, { now })).toBe(true);
    });
});

describe("cleanFeedItem", () => {
    function item(over: Partial<CleanInputItem> = {}): CleanInputItem {
        return {
            title: "Deel launches new contractor onboarding flow that simplifies global hiring",
            body: "Deel announced a redesigned contractor onboarding flow today, focused on reducing time-to-first-payment for international contractors. The new flow consolidates KYC, contract signing, and bank-account capture into a single guided sequence.",
            url: "https://deel.com/blog/contractor-onboarding-v2",
            published_date: "2026-05-25T12:00:00Z",
            ...over
        };
    }

    it("keeps a substantive item", () => {
        const r = cleanFeedItem(item());
        expect(r.kind).toBe("keep");
    });

    it("rejects empty title", () => {
        const r = cleanFeedItem(item({ title: "  " }));
        expect(r).toEqual({ kind: "reject", reason: "empty_title" });
    });

    it("rejects empty body", () => {
        const r = cleanFeedItem(item({ body: null }));
        expect(r).toEqual({ kind: "reject", reason: "empty_body" });
    });

    it("rejects body shorter than the minimum", () => {
        const r = cleanFeedItem(item({ body: "tiny snippet" }));
        expect(r).toEqual({ kind: "reject", reason: "body_too_short" });
    });

    it("rejects missing URL", () => {
        const r = cleanFeedItem(item({ url: null }));
        expect(r).toEqual({ kind: "reject", reason: "no_url" });
    });

    it("rejects classic marketing-fluff titles", () => {
        const fluffy = [
            "5 Tips for Better Onboarding",
            "The Ultimate Guide to Global Payroll",
            "Introducing Our New Contractor Platform",
            "How to Boost Your HR Compliance",
            "Top 10 Tools Every HR Leader Needs",
            "[Webinar] Building a Remote-First Culture"
        ];
        for (const title of fluffy) {
            const r = cleanFeedItem(item({ title }));
            expect(r).toEqual({ kind: "reject", reason: "marketing_fluff" });
        }
    });

    it("keeps a title that mentions a number but isn't fluff-shaped", () => {
        const r = cleanFeedItem(item({
            title: "Deel reaches 1 million workers across 150 countries — Series F at $20B"
        }));
        expect(r.kind).toBe("keep");
    });

    it("MIN_BODY_LENGTH is a meaningful threshold", () => {
        expect(MIN_BODY_LENGTH).toBeGreaterThanOrEqual(100);
    });

    it("MARKETING_FLUFF_PATTERNS has a reasonable count", () => {
        expect(MARKETING_FLUFF_PATTERNS.length).toBeGreaterThanOrEqual(6);
    });
});

describe("cleanFeedBatch", () => {
    function item(title: string, body: string = "x".repeat(MIN_BODY_LENGTH + 20)): CleanInputItem {
        return {
            title,
            body,
            url: `https://x.com/${title.toLowerCase().replace(/[^a-z]/g, "-")}`,
            published_date: "2026-05-25T12:00:00Z"
        };
    }

    it("keeps the most recent items up to the cap", () => {
        const items = Array.from({ length: 12 }, (_, i) => item(`real article ${i}`));
        const r = cleanFeedBatch(items);
        expect(r.kept).toHaveLength(PER_ENTITY_ITEM_CAP);
        expect(r.capped).toBe(12 - PER_ENTITY_ITEM_CAP);
    });

    it("attributes rejections by reason", () => {
        const items = [
            item("real article"),
            item("real article 2"),
            { ...item("real article 3"), title: "" },
            { ...item("real article 4"), body: null },
            { ...item("real article 5"), title: "5 tips for HR" }
        ];
        const r = cleanFeedBatch(items);
        expect(r.kept).toHaveLength(2);
        expect(r.rejections.empty_title).toBe(1);
        expect(r.rejections.empty_body).toBe(1);
        expect(r.rejections.marketing_fluff).toBe(1);
    });

    it("respects a custom cap", () => {
        const items = [item("a"), item("b"), item("c")];
        const r = cleanFeedBatch(items, 2);
        expect(r.kept).toHaveLength(2);
        expect(r.capped).toBe(1);
    });
});

describe("cacheNeedsRefresh", () => {
    const now = new Date("2026-05-28T00:00:00Z");
    function cache(over: Partial<DiscoveredFeedsCache> = {}): DiscoveredFeedsCache {
        const feed: CachedFeed = {
            url: "https://deel.com/feed.xml",
            kind: "rss",
            last_validated_at: "2026-05-25T00:00:00Z",
            last_fetched_at: "2026-05-27T00:00:00Z",
            fetch_failures: 0
        };
        return { discovered_feeds: [feed], last_discovery_at: "2026-05-25T00:00:00Z", ...over };
    }

    it("returns true when no cache exists", () => {
        expect(cacheNeedsRefresh(null, now)).toBe(true);
        expect(cacheNeedsRefresh({}, now)).toBe(true);
    });

    it("returns false within a week of last discovery", () => {
        expect(cacheNeedsRefresh(cache(), now)).toBe(false);
    });

    it("returns true after a week", () => {
        expect(cacheNeedsRefresh(cache({ last_discovery_at: "2026-05-15T00:00:00Z" }), now))
            .toBe(true);
    });

    it("returns true on a corrupt timestamp", () => {
        expect(cacheNeedsRefresh(cache({ last_discovery_at: "not a date" }), now)).toBe(true);
    });
});
