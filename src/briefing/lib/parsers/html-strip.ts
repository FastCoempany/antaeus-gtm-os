/**
 * HTML → text stripping for the HTML-diff Briefing source (B.1c).
 *
 * The output of this function is fed into a SHA-256 hash. The hash
 * is what the diff source compares across runs. Two invariants
 * matter for the hash to be meaningful:
 *
 *   1. DETERMINISM — given the same HTML input, the function must
 *      always produce the same text output. Otherwise the hash
 *      changes spuriously and every snapshot looks like a diff.
 *
 *   2. NOISE REJECTION — content that changes independently of
 *      meaningful page edits (script tags carrying CSRF tokens,
 *      style blocks with cache-busted asset hashes, HTML comments
 *      with build timestamps, the random nonce attributes some
 *      frameworks add) must be stripped. Otherwise the hash
 *      changes on every fetch and the source emits false-positive
 *      diffs every week.
 *
 * Strategy:
 *   - Remove <script>...</script>, <style>...</style>, <noscript>...
 *     </noscript>, and <!-- comments -->. These vary independently
 *     of meaningful content.
 *   - Strip all remaining tags (`<[^>]+>`) — leaves the text.
 *   - Decode HTML entities.
 *   - Collapse whitespace runs to single spaces.
 *   - Trim.
 *
 * What this is NOT trying to do: produce pretty text for display.
 * The text content is stored alongside the hash so a future "what
 * changed" UI (B.6 audit envelopes) can diff prior vs current text
 * — but the stripping is optimized for hash stability, not
 * readability. If display-quality stripping becomes needed, that's
 * a separate function.
 */

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

    // Strip <script>, <style>, <noscript> blocks. The /gi + non-greedy
    // body match catches both self-closing and properly-closed
    // variants. ORDER MATTERS — strip these BEFORE the catch-all tag
    // stripper, otherwise the script body leaks into the output.
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

    // Strip HTML comments. Build timestamps, edge-cache markers, and
    // server-side debugging spew often live in comments and change
    // every fetch.
    text = text.replace(/<!--[\s\S]*?-->/g, " ");

    // Strip remaining tags. Replace with a space so words on tag
    // boundaries don't run together (e.g., "<p>A</p><p>B</p>" becomes
    // "A B" not "AB").
    text = text.replace(/<[^>]+>/g, " ");

    // Decode the most common HTML entities. Numeric entities (&#NNNN;)
    // are decoded to a space — good enough for hash stability; we're
    // not trying to render.
    text = text.replace(/&[a-zA-Z]+;|&#39;|&#\d+;/g, (m) => {
        if (m in ENTITIES) return ENTITIES[m] ?? " ";
        return " ";
    });

    // Collapse all whitespace runs to single spaces. Trims tabs,
    // newlines, multiple spaces. Critical for determinism — many
    // sites pretty-print HTML differently between fetches (CDN
    // minification toggles, etc.).
    text = text.replace(/\s+/g, " ");

    return text.trim();
}

/**
 * SHA-256 hex digest of a string. Works in both Node (via
 * webcrypto, available since Node 16) and Deno (native crypto.subtle).
 *
 * Why we don't import a hashing library: webcrypto is the
 * standardized cross-runtime path. Adding `crypto-js` or similar
 * would mean another esm.sh import for the Deno fetcher, with no
 * functional benefit over the built-in.
 */
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
