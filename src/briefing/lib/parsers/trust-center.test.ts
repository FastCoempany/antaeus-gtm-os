import { describe, it, expect } from "vitest";
import {
    MIN_VENDOR_MATCHES_WITHOUT_LANGUAGE,
    PER_ENTITY_VENDOR_CAP,
    TRUST_ANCHOR_KEYWORDS,
    TRUST_PROBE_PATHS,
    type TrustInputItem,
    buildTrustTitle,
    cleanTrustBatch,
    cleanTrustItem,
    escapeRegex,
    evaluateTrustPage,
    extractTrustLinksFromHtml,
    htmlToPlainText,
    isLikelyTrustPage,
    matchSubprocessors,
    resolveTrustUrl,
    trustCacheNeedsRefresh
} from "./trust-center";
import { KNOWN_SUBPROCESSORS } from "./trust-center-vendors.config";

/**
 * Family 3 — Trust Center / sub-processor parser. The signal is
 * vendor-overlap across watched entities; the precision constraints
 * matter because the operator's trust in the surface decays fast if
 * we false-positive on every page that mentions "Slack" in passing.
 */

describe("escapeRegex", () => {
    it("escapes metacharacters so vendor names with punctuation match literally", () => {
        const re = new RegExp(escapeRegex("dbt Labs"));
        expect(re.test("dbt Labs")).toBe(true);
    });
});

describe("TRUST_PROBE_PATHS + TRUST_ANCHOR_KEYWORDS", () => {
    it("lists specific paths before generic ones", () => {
        const subprocessorIdx = TRUST_PROBE_PATHS.indexOf("/sub-processors");
        const trustIdx = TRUST_PROBE_PATHS.indexOf("/trust");
        expect(subprocessorIdx).toBeGreaterThanOrEqual(0);
        expect(trustIdx).toBeGreaterThan(subprocessorIdx);
    });

    it("anchor keywords cover hosted trust centers (Vanta + SafeBase)", () => {
        expect(TRUST_ANCHOR_KEYWORDS.some((k) => k.includes("vanta"))).toBe(true);
        expect(TRUST_ANCHOR_KEYWORDS.some((k) => k.includes("safebase"))).toBe(true);
    });
});

describe("extractTrustLinksFromHtml", () => {
    it("finds an anchor pointing to /trust-center", () => {
        const html = `<nav><a href="/trust-center">Trust Center</a></nav>`;
        const links = extractTrustLinksFromHtml(html, "https://deel.com/");
        expect(links).toHaveLength(1);
        expect(links[0]?.url).toBe("https://deel.com/trust-center");
        expect(links[0]?.source).toBe("anchor");
    });

    it("finds an anchor to a hosted Vanta trust center", () => {
        const html = `<a href="https://deel.vanta.com">Our security posture</a>`;
        const links = extractTrustLinksFromHtml(html, "https://deel.com/");
        expect(links).toHaveLength(1);
        expect(links[0]?.url).toContain("vanta.com");
    });

    it("matches on visible text containing sub-processor (not just href)", () => {
        const html = `<a href="/legal/page42">View our sub-processor list</a>`;
        const links = extractTrustLinksFromHtml(html, "https://x.com/");
        expect(links).toHaveLength(1);
    });

    it("strips nested tags from the anchor text before matching", () => {
        const html = `<a href="/foo"><span>Sub</span>-processor disclosures</a>`;
        const links = extractTrustLinksFromHtml(html, "https://x.com/");
        expect(links).toHaveLength(1);
    });

    it("dedupes the same resolved URL", () => {
        const html = `
            <a href="https://x.com/trust">Trust</a>
            <a href="/trust">Trust Center</a>`;
        const links = extractTrustLinksFromHtml(html, "https://x.com/");
        expect(links).toHaveLength(1);
    });

    it("ignores unrelated anchors", () => {
        const html = `<a href="/blog">Blog</a> <a href="/contact">Contact</a>`;
        const links = extractTrustLinksFromHtml(html, "https://x.com/");
        expect(links).toEqual([]);
    });
});

describe("resolveTrustUrl", () => {
    it("resolves relative against base", () => {
        expect(resolveTrustUrl("/trust", "https://x.com/")).toBe("https://x.com/trust");
    });

    it("passes absolute through", () => {
        expect(resolveTrustUrl("https://elsewhere.com/trust", "https://x.com/")).toBe(
            "https://elsewhere.com/trust"
        );
    });

    it("returns null on garbage", () => {
        expect(resolveTrustUrl("", "https://x.com/")).toBeNull();
        expect(resolveTrustUrl("not a url", "not a base")).toBeNull();
    });
});

describe("htmlToPlainText", () => {
    it("strips script + style + tags", () => {
        const html = `<html><script>alert(1)</script><style>.x{}</style><body><p>Hello</p></body></html>`;
        expect(htmlToPlainText(html).trim()).toBe("Hello");
    });

    it("decodes common entities + collapses whitespace", () => {
        const html = `<div>  Foo&nbsp;&amp;&nbsp;Bar </div>`;
        expect(htmlToPlainText(html)).toBe("Foo & Bar");
    });
});

describe("evaluateTrustPage / isLikelyTrustPage", () => {
    it("recognizes a page that uses the phrase 'sub-processors'", () => {
        const html = `<h1>Sub-Processors</h1><table><tr><td>Vanta</td></tr></table>`;
        const hints = evaluateTrustPage(html, KNOWN_SUBPROCESSORS);
        expect(hints.hasSubprocessorLanguage).toBe(true);
        expect(isLikelyTrustPage(hints)).toBe(true);
    });

    it("accepts a page with no language but enough vendor mentions", () => {
        // Even without "sub-processor" language, 4+ named vendors == trust page
        const html = `<p>We integrate with Vanta, Stripe, Slack, Notion, and Linear for our infrastructure.</p>`;
        const hints = evaluateTrustPage(html, KNOWN_SUBPROCESSORS);
        expect(hints.hasSubprocessorLanguage).toBe(false);
        expect(hints.vendorMatchCount).toBeGreaterThanOrEqual(MIN_VENDOR_MATCHES_WITHOUT_LANGUAGE);
        expect(isLikelyTrustPage(hints)).toBe(true);
    });

    it("rejects a page that mentions one vendor in passing", () => {
        const html = `<p>Our blog post about why we love Slack for team chat.</p>`;
        const hints = evaluateTrustPage(html, KNOWN_SUBPROCESSORS);
        expect(isLikelyTrustPage(hints)).toBe(false);
    });

    it("rejects a page with no vendor mentions + no language", () => {
        const html = `<p>About us — we build software for the modern enterprise.</p>`;
        expect(isLikelyTrustPage(evaluateTrustPage(html, KNOWN_SUBPROCESSORS))).toBe(false);
    });
});

describe("matchSubprocessors", () => {
    it("finds known vendors with word boundaries", () => {
        const text = "We use Vanta for compliance, Stripe for billing, and Notion for docs.";
        const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
        const names = matches.map((m) => m.vendor_name);
        expect(names).toContain("Vanta");
        expect(names).toContain("Stripe");
        expect(names).toContain("Notion");
    });

    it("doesn't fire on substring collisions", () => {
        // "Notion" must NOT match "intuition"; "Linear" must NOT match "linearly"
        const text = "Our intuition is that linearly scaling teams need help.";
        const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
        expect(matches.map((m) => m.vendor_name)).not.toContain("Notion");
        expect(matches.map((m) => m.vendor_name)).not.toContain("Linear");
    });

    it("matches aliases (Auth0 'Auth Zero', HuggingFace 'Hugging Face')", () => {
        const text = "We integrate with Auth Zero and HuggingFace for our auth + ML stack.";
        const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
        expect(matches.map((m) => m.vendor_id)).toContain("auth0");
        expect(matches.map((m) => m.vendor_id)).toContain("hugging_face");
    });

    it("dedupes per vendor (multiple mentions of same vendor → one match)", () => {
        const text = "Slack at the top. Slack again. And Slack a third time.";
        const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
        const slackCount = matches.filter((m) => m.vendor_id === "slack").length;
        expect(slackCount).toBe(1);
    });

    it("returns context around each match", () => {
        const text = "We rely on Vanta for our SOC 2 Type II audit.";
        const matches = matchSubprocessors(text, KNOWN_SUBPROCESSORS);
        const vanta = matches.find((m) => m.vendor_id === "vanta");
        expect(vanta?.context).toContain("SOC 2");
    });

    it("returns [] for text with no vendor mentions", () => {
        expect(matchSubprocessors("a paragraph about nothing in particular", KNOWN_SUBPROCESSORS))
            .toEqual([]);
    });
});

describe("cleanTrustItem + cleanTrustBatch", () => {
    function item(over: Partial<TrustInputItem> = {}): TrustInputItem {
        return {
            entity_name: "Atlas HXM",
            entity_domain: "atlashxm.com",
            trust_page_url: "https://atlashxm.com/trust",
            vendor: {
                vendor_id: "vanta",
                vendor_name: "Vanta",
                category: "compliance",
                context: "We use Vanta for SOC 2 monitoring."
            },
            ...over
        };
    }

    it("keeps a complete item", () => {
        expect(cleanTrustItem(item()).kind).toBe("keep");
    });

    it("rejects empty entity_name", () => {
        expect(cleanTrustItem(item({ entity_name: "  " })))
            .toEqual({ kind: "reject", reason: "empty_entity" });
    });

    it("rejects empty trust_page_url", () => {
        expect(cleanTrustItem(item({ trust_page_url: "" })))
            .toEqual({ kind: "reject", reason: "empty_url" });
    });

    it("rejects empty vendor name", () => {
        expect(cleanTrustItem(item({
            vendor: { vendor_id: "x", vendor_name: " ", category: "compliance", context: "" }
        }))).toEqual({ kind: "reject", reason: "empty_vendor" });
    });

    it("respects the per-entity cap", () => {
        const items = Array.from({ length: 14 }, (_, i) =>
            item({ vendor: { vendor_id: `v${i}`, vendor_name: `Vendor${i}`, category: "comms", context: "" } })
        );
        const r = cleanTrustBatch(items);
        expect(r.kept).toHaveLength(PER_ENTITY_VENDOR_CAP);
        expect(r.capped).toBe(14 - PER_ENTITY_VENDOR_CAP);
    });
});

describe("buildTrustTitle", () => {
    it("composes a natural attribution sentence", () => {
        const t = buildTrustTitle({
            entity_name: "Atlas HXM",
            entity_domain: "atlashxm.com",
            trust_page_url: "https://atlashxm.com/trust",
            vendor: {
                vendor_id: "vanta",
                vendor_name: "Vanta",
                category: "compliance",
                context: ""
            }
        });
        expect(t).toBe("Atlas HXM lists Vanta on their Trust Center");
    });
});

describe("trustCacheNeedsRefresh", () => {
    const now = new Date("2026-05-28T00:00:00Z");

    it("returns true when no cache exists", () => {
        expect(trustCacheNeedsRefresh(null, now)).toBe(true);
        expect(trustCacheNeedsRefresh({}, now)).toBe(true);
    });

    it("returns false within a week of last validation", () => {
        expect(trustCacheNeedsRefresh(
            { trust_center_url: "x", trust_center_last_validated_at: "2026-05-25T00:00:00Z" },
            now
        )).toBe(false);
    });

    it("returns true after a week", () => {
        expect(trustCacheNeedsRefresh(
            { trust_center_url: "x", trust_center_last_validated_at: "2026-05-15T00:00:00Z" },
            now
        )).toBe(true);
    });
});

describe("KNOWN_SUBPROCESSORS config", () => {
    it("has a non-trivial catalog", () => {
        expect(KNOWN_SUBPROCESSORS.length).toBeGreaterThanOrEqual(25);
    });

    it("every entry has id + name + category", () => {
        for (const v of KNOWN_SUBPROCESSORS) {
            expect(v.id).toMatch(/^[a-z][a-z0-9_]*$/);
            expect(v.name.length).toBeGreaterThan(1);
            expect(v.category.length).toBeGreaterThan(0);
        }
    });

    it("ids are unique", () => {
        const ids = KNOWN_SUBPROCESSORS.map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("does not include the cloud giants (they are noise — every company uses one)", () => {
        const names = KNOWN_SUBPROCESSORS.map((v) => v.name.toLowerCase());
        expect(names).not.toContain("aws");
        expect(names).not.toContain("amazon web services");
        expect(names).not.toContain("gcp");
        expect(names).not.toContain("google cloud");
        expect(names).not.toContain("azure");
    });
});
