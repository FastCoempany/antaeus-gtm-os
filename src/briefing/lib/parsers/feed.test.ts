import { describe, expect, it } from "vitest";
import {
    filterPersonnel,
    isPersonnelTitle,
    parseAtom,
    parseRss
} from "./feed";

describe("parseRss", () => {
    const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TechCrunch</title>
    <link>https://techcrunch.com</link>
    <item>
      <title>Segment introduces 'Free for Devs' tier, lowering data CDP entry point</title>
      <link>https://techcrunch.com/2026/05/13/segment-free-for-devs</link>
      <guid isPermaLink="true">https://techcrunch.com/?p=42100</guid>
      <pubDate>Wed, 13 May 2026 14:00:00 +0000</pubDate>
      <description>Segment, owned by Twilio, announced a new free tier...</description>
    </item>
    <item>
      <title><![CDATA[Acme & Beta announce $50M Series B with M&amp;A intent]]></title>
      <link>https://techcrunch.com/2026/05/14/acme-beta-series-b</link>
      <guid>https://techcrunch.com/?p=42101</guid>
      <pubDate>Thu, 14 May 2026 09:30:00 +0000</pubDate>
      <description><![CDATA[Acme Industries and Beta Corp announced...]]></description>
    </item>
  </channel>
</rss>`;

    it("extracts every <item> with required fields", () => {
        const entries = parseRss(SAMPLE_RSS);
        expect(entries).toHaveLength(2);
    });

    it("decodes HTML entities in titles", () => {
        const entries = parseRss(SAMPLE_RSS);
        expect(entries[1]?.title).toBe(
            "Acme & Beta announce $50M Series B with M&A intent"
        );
    });

    it("strips CDATA wrappers", () => {
        const entries = parseRss(SAMPLE_RSS);
        expect(entries[1]?.title).not.toContain("CDATA");
    });

    it("normalizes pubDate into ISO-8601", () => {
        const entries = parseRss(SAMPLE_RSS);
        expect(entries[0]?.published_date).toBe("2026-05-13T14:00:00.000Z");
    });

    it("uses <guid> as the external_id when present", () => {
        const entries = parseRss(SAMPLE_RSS);
        expect(entries[0]?.external_id).toBe("https://techcrunch.com/?p=42100");
    });

    it("falls back to <link> when guid is absent", () => {
        const xml = `<rss><channel><item><title>T</title><link>https://example.com/x</link></item></channel></rss>`;
        const entries = parseRss(xml);
        expect(entries[0]?.external_id).toBe("https://example.com/x");
    });

    it("synthesizes external_id when both guid and link are absent", () => {
        const xml = `<rss><channel><item><title>Synth title</title><pubDate>Wed, 13 May 2026 14:00:00 +0000</pubDate></item></channel></rss>`;
        const entries = parseRss(xml);
        expect(entries[0]?.external_id).toMatch(/^synth_/);
    });

    it("skips items missing both title and link", () => {
        const xml = `<rss><channel><item><description>orphan</description></item></channel></rss>`;
        const entries = parseRss(xml);
        expect(entries).toHaveLength(0);
    });

    it("returns empty array for empty feed", () => {
        const xml = `<rss><channel><title>Empty</title></channel></rss>`;
        expect(parseRss(xml)).toEqual([]);
    });

    it("returns empty array for malformed input", () => {
        expect(parseRss("not xml at all")).toEqual([]);
    });
});

describe("parseAtom", () => {
    const SAMPLE_ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Release notes from anthropic-sdk-python</title>
  <link href="https://github.com/anthropics/anthropic-sdk-python/releases.atom" rel="self"/>
  <entry>
    <id>tag:github.com,2008:Repository/12345/v0.45.0</id>
    <title>v0.45.0</title>
    <link href="https://github.com/anthropics/anthropic-sdk-python/releases/tag/v0.45.0"/>
    <updated>2026-05-15T18:00:00Z</updated>
    <content type="html">&lt;p&gt;Adds extended thinking support.&lt;/p&gt;</content>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/12345/v0.44.1</id>
    <title>v0.44.1</title>
    <link href="https://github.com/anthropics/anthropic-sdk-python/releases/tag/v0.44.1"/>
    <updated>2026-05-09T12:30:00Z</updated>
    <summary>Bugfix release.</summary>
  </entry>
</feed>`;

    it("extracts every <entry> with required fields", () => {
        const entries = parseAtom(SAMPLE_ATOM);
        expect(entries).toHaveLength(2);
    });

    it("uses <id> as external_id when present", () => {
        const entries = parseAtom(SAMPLE_ATOM);
        expect(entries[0]?.external_id).toBe(
            "tag:github.com,2008:Repository/12345/v0.45.0"
        );
    });

    it("extracts <link href=...> as the link", () => {
        const entries = parseAtom(SAMPLE_ATOM);
        expect(entries[0]?.link).toBe(
            "https://github.com/anthropics/anthropic-sdk-python/releases/tag/v0.45.0"
        );
    });

    it("normalizes <updated> into ISO-8601", () => {
        const entries = parseAtom(SAMPLE_ATOM);
        expect(entries[0]?.published_date).toBe("2026-05-15T18:00:00.000Z");
    });

    it("falls back to <summary> when <content> is missing", () => {
        const entries = parseAtom(SAMPLE_ATOM);
        expect(entries[1]?.summary).toBe("Bugfix release.");
    });

    it("returns empty array for non-Atom input", () => {
        expect(parseAtom("not atom")).toEqual([]);
    });
});

describe("isPersonnelTitle", () => {
    it.each([
        ["Acme Corp Appoints Jane Smith as Chief Financial Officer", true],
        ["Beta Industries Names John Doe President", true],
        ["Sarah Chen joined as VP of Sales", true],
        ["Acme Industries hires new CTO Michael Park", true],
        ["CEO Steps Down After 10-Year Tenure", true],
        ["VP Engineering Departs for Stealth Startup", true],
        ["Promotes Director to Senior VP of Product", true],
        ["Elects new chairman to board", true],
        ["Resigns as Chief Marketing Officer", true],
        ["New CEO at Acme Inc.", true]
    ])("matches: %s", (title, expected) => {
        expect(isPersonnelTitle(title)).toBe(expected);
    });

    it.each([
        ["Acme Industries reports Q1 earnings", false],
        ["New product launch from Beta Corp", false],
        ["Acme + Beta announce merger", false],
        ["Funding round closes at $50M", false]
    ])("does NOT match: %s", (title, expected) => {
        expect(isPersonnelTitle(title)).toBe(expected);
    });
});

describe("filterPersonnel", () => {
    it("keeps only entries with personnel-shaped titles", () => {
        const entries = [
            { external_id: "1", title: "Acme appoints new CFO", link: null, published_date: null, summary: null },
            { external_id: "2", title: "Acme launches product", link: null, published_date: null, summary: null },
            { external_id: "3", title: "Sarah Chen named VP of Sales", link: null, published_date: null, summary: null }
        ];
        const filtered = filterPersonnel(entries);
        expect(filtered.map((e) => e.external_id)).toEqual(["1", "3"]);
    });

    it("returns empty array when nothing matches", () => {
        const entries = [
            { external_id: "1", title: "Quarterly earnings report", link: null, published_date: null, summary: null }
        ];
        expect(filterPersonnel(entries)).toEqual([]);
    });
});
