import { describe, expect, it } from "vitest";
import { sha256Hex, stripHtmlToText } from "./html-strip";

describe("stripHtmlToText", () => {
    it("returns empty string for empty input", () => {
        expect(stripHtmlToText("")).toBe("");
    });

    it("returns empty string for non-string input", () => {
        expect(stripHtmlToText(null as unknown as string)).toBe("");
        expect(stripHtmlToText(undefined as unknown as string)).toBe("");
    });

    it("strips simple tags", () => {
        expect(stripHtmlToText("<p>hello</p>")).toBe("hello");
        expect(stripHtmlToText("<h1>Title</h1>")).toBe("Title");
    });

    it("inserts a space between adjacent tags so words don't merge", () => {
        // "<p>A</p><p>B</p>" naively stripped is "AB"; we want "A B".
        expect(stripHtmlToText("<p>A</p><p>B</p>")).toBe("A B");
    });

    it("removes script blocks including their content", () => {
        const html = `<p>before</p><script>alert("hi");</script><p>after</p>`;
        expect(stripHtmlToText(html)).toBe("before after");
    });

    it("removes style blocks including their content", () => {
        const html = `<p>visible</p><style>.x { color: red; }</style><p>also visible</p>`;
        expect(stripHtmlToText(html)).toBe("visible also visible");
    });

    it("removes noscript blocks including their content", () => {
        const html = `<p>kept</p><noscript>enable js</noscript>`;
        expect(stripHtmlToText(html)).toBe("kept");
    });

    it("removes HTML comments", () => {
        const html = `<p>kept</p><!-- build: 12345 -->`;
        expect(stripHtmlToText(html)).toBe("kept");
    });

    it("removes multiline comments and scripts", () => {
        const html = `
<p>A</p>
<script>
function x() {
  return 42;
}
</script>
<!--
  multiline
  comment
-->
<p>B</p>`;
        expect(stripHtmlToText(html)).toBe("A B");
    });

    it("decodes common HTML entities", () => {
        expect(stripHtmlToText("AT&amp;T &lt; IBM")).toBe("AT&T < IBM");
        expect(stripHtmlToText("&quot;quoted&quot;")).toBe('"quoted"');
        expect(stripHtmlToText("&nbsp;spaced&nbsp;")).toBe("spaced");
    });

    it("collapses whitespace runs to single spaces", () => {
        expect(stripHtmlToText("<p>a     b\n\n\tc</p>")).toBe("a b c");
    });

    it("is deterministic — same input always produces same output", () => {
        const html = `<div class="x"><p>Hello, world.</p><script>void 0;</script></div>`;
        const a = stripHtmlToText(html);
        const b = stripHtmlToText(html);
        expect(a).toBe(b);
    });

    it("rejects noise: identical content with different whitespace produces same output", () => {
        const a = stripHtmlToText(`<p>hello world</p>`);
        const b = stripHtmlToText(`<p>\n  hello   world\n</p>`);
        expect(a).toBe(b);
    });

    it("rejects noise: identical content with comment-only diff produces same output", () => {
        const a = stripHtmlToText(`<p>hello</p>`);
        const b = stripHtmlToText(`<p>hello</p><!-- build 12345 -->`);
        expect(a).toBe(b);
    });

    it("rejects noise: identical content with script-token diff produces same output", () => {
        const a = stripHtmlToText(`<p>hi</p><script>var token="abc123";</script>`);
        const b = stripHtmlToText(`<p>hi</p><script>var token="xyz789";</script>`);
        expect(a).toBe(b);
    });

    it("DOES detect meaningful change: different visible text", () => {
        const a = stripHtmlToText(`<p>Price: $99</p>`);
        const b = stripHtmlToText(`<p>Price: $149</p>`);
        expect(a).not.toBe(b);
    });

    it("handles unknown entities by replacing with a space", () => {
        // &someunknown; isn't in our entity map; it becomes a space + collapses.
        const text = stripHtmlToText("a &someunknown; b");
        expect(text).toBe("a b");
    });

    it("handles numeric entities by replacing with a space", () => {
        // &#8217; is a typographic apostrophe; not in our map, falls through.
        const text = stripHtmlToText("don&#8217;t");
        expect(text).toBe("don t");
    });

    it("strips tags with attributes correctly", () => {
        const html = `<a href="https://example.com" class="link" target="_blank">click</a>`;
        expect(stripHtmlToText(html)).toBe("click");
    });

    it("handles self-closing tags", () => {
        expect(stripHtmlToText("a<br/>b<hr/>c")).toBe("a b c");
    });
});

describe("sha256Hex", () => {
    it("produces a 64-character hex digest", async () => {
        const hash = await sha256Hex("hello");
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic for identical input", async () => {
        const a = await sha256Hex("test");
        const b = await sha256Hex("test");
        expect(a).toBe(b);
    });

    it("differs for different input", async () => {
        const a = await sha256Hex("a");
        const b = await sha256Hex("b");
        expect(a).not.toBe(b);
    });

    it("matches the known SHA-256 of 'hello'", async () => {
        // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        const hash = await sha256Hex("hello");
        expect(hash).toBe(
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    });

    it("handles empty string", async () => {
        const hash = await sha256Hex("");
        // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        expect(hash).toBe(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    });

    it("handles unicode input", async () => {
        // UTF-8 of "héllo" is 6 bytes; SHA-256 produces a stable hex.
        const hash = await sha256Hex("héllo");
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
});
