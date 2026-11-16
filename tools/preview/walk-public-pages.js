#!/usr/bin/env node
/**
 * Loads each public and sign-in page in a real browser and records every
 * string a visitor is shown: the page at rest, text that scripts put on the
 * page after load, and the messages that appear when a form is sent empty or
 * with a bad value.
 *
 * Why it exists: the preview walkthrough (build-transcript.js) covers the
 * product areas of the signed-in app only. These pages had no rendered-text
 * evidence: /start.html, /why-antaeus/, /login.html, /signup.html,
 * /forgot-password.html, /reset-password.html, /coming-soon.html,
 * /privacy.html, /terms.html, /preview, /demo-seed.html,
 * /should-we-hire-an-ae/ and /index.html (which only redirects).
 *
 * Run — dist/ must already hold a production build; this tool never builds:
 *   node tools/preview/walk-public-pages.js [--out <dir>]
 *   TRANSCRIPT_CHROMIUM=<path>  browser (default /opt/pw-browsers/chromium)
 *   WALK_PORT=<port>            port for serving dist/ read-only (default 4332)
 *
 * Every page load uses a new browser context (empty storage, no cookies).
 * Nothing is mocked: sign-in, sign-up and reset requests go wherever the page
 * sends them and the walk records what the visitor is told when they fail.
 * Only made-up values are typed ("not-an-email", "x"); the walk never sends a
 * well-formed email address, so it cannot create an account or trigger mail.
 * The invite and preview codes are checked by the production Worker, which a
 * static server does not run; their "wrong code" pages are opened directly.
 *
 * Output (never preview-transcript/ or artifacts/):
 *   public-pages.txt — every string on screen in each state, in reading order:
 *     [<page> | <state> | <kind>] <text>   (kinds: heading N, button, link,
 *     field, text, option, placeholder, title, aria-label, alt, redirect,
 *     browser message). "<state> — shown briefly before this" holds text that
 *     came and went on the way to that state (a button's "Signing in…").
 *   coverage.json — per page: states reached and the actions that led to each,
 *     states not reached with the reason, page and console errors
 * Exit code 1 if a page error occurred or a page produced no text.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.WALK_PORT || 4332);
const BASE = `http://127.0.0.1:${PORT}`;
// The final-audit scratch folder; pass --out to write somewhere else.
const DEFAULT_OUT = "/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit/public-walk";
const outFlag = process.argv.indexOf("--out");
const OUT = path.resolve(outFlag > -1 && process.argv[outFlag + 1] ? process.argv[outFlag + 1] : DEFAULT_OUT);

// ── a tiny static server over dist/ (same routing as build-transcript.js) ──
function serve() {
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
    const server = http.createServer((req, res) => {
        const p = decodeURIComponent(new URL(req.url, BASE).pathname);
        let f = path.join(DIST, p);
        if (p === "/preview" || p === "/preview/") f = path.join(DIST, "preview.html");
        else if (p.endsWith("/")) f = path.join(f, "index.html");
        else if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
        fs.readFile(f, (err, buf) => {
            res.writeHead(err ? 404 : 200, { "Content-Type": err ? "text/plain" : types[path.extname(f)] || "application/octet-stream" });
            res.end(err ? "not found" : buf);
        });
    });
    return new Promise((ok, fail) => server.once("error", fail).listen(PORT, "127.0.0.1", () => ok(server)));
}

// ── in-page extraction: every visible string, in reading order ─────────
// Adapted from build-transcript.js (same visibility rules and kinds, without
// the layout cues). Hover titles, aria-labels, placeholders, alt text and
// dropdown choices come out as lines of their own, and a sentence with links
// in it stays whole. (The same function as in walk-onboarding.js.)
function extractInPage(includeFaded) {
    const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "DT", "DD", "LABEL", "FIGCAPTION", "BLOCKQUOTE", "PRE", "SUMMARY", "LEGEND", "CAPTION"]);
    const CONTROLS = "button, input, textarea, select, [role=button], [role=tab]";
    const lines = [];
    const disabled = [];
    const links = {};
    const seen = new Set();
    const shown = (el, s = getComputedStyle(el)) => !(s.display === "none" || s.visibility === "hidden" || (!includeFaded && Number(s.opacity) === 0));
    const sized = (el, r = el.getBoundingClientRect()) => r.width > 0 && r.height > 0;
    const squash = (t) => String(t || "").replace(/\s+/g, " ").trim();
    const text = (el) => squash(el.innerText || el.textContent);
    const push = (kind, t) => {
        t = squash(t);
        if (!t || seen.has(kind + "|" + t)) return;
        seen.add(kind + "|" + t);
        lines.push({ kind, text: t });
    };
    // Text met on hover, through a screen reader, or in an empty field.
    const attrs = (el, own) => {
        const title = el.getAttribute("title");
        const aria = el.getAttribute("aria-label");
        if (title && title !== own) push("title", title);
        if (aria && aria !== own) push("aria-label", aria);
        push("placeholder", el.getAttribute("placeholder"));
        if (el.tagName === "IMG") push("alt", el.getAttribute("alt"));
    };
    const walk = (el) => {
        if (!(el instanceof HTMLElement) || !shown(el)) return;
        const tag = el.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;
        const role = el.getAttribute("role");
        const pressable = tag === "BUTTON" || role === "button" || role === "tab";
        const field = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
        const heading = /^H[1-6]$/.test(tag);
        if ((pressable || tag === "A" || field || heading) && !sized(el)) return;
        if (pressable || tag === "A") {
            const own = text(el) || el.getAttribute("aria-label") || el.getAttribute("title") || "";
            push(tag === "A" ? "link" : role === "tab" ? "tab" : "button", own);
            if (tag === "A" && own) links[own] = el.getAttribute("href") || "";
            if (el.disabled || el.getAttribute("aria-disabled") === "true") disabled.push(own);
            return attrs(el, own);
        }
        if (field) {
            if (el.type === "hidden") return;
            // The field's name: the label's words that come before the control
            // (all of them when the control comes first, as with a tick box).
            const lbl = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest("label");
            const kids = lbl ? Array.from(lbl.childNodes) : [];
            const say = (n) => (n.nodeType === 3 ? n.textContent : n instanceof HTMLElement && !n.contains(el) && n.tagName !== "DATALIST" && shown(n) ? n.innerText : "");
            const words = (list) => squash(list.map(say).join(" "));
            const named = words(kids.slice(0, Math.max(0, kids.findIndex((n) => n.contains(el))))) || words(kids);
            push("field", named || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || "(unlabelled field)");
            attrs(el, null);
            if (tag === "SELECT") for (const o of el.options) push("option", o.text);
            return;
        }
        attrs(el, null);
        if (heading) return push(`heading ${tag[1]}`, text(el));
        // Leaf-ish blocks: their text once. Otherwise the element's own words,
        // then everything inside it, in order.
        const hasBlockKids = Array.from(el.children).some((k) => ["block", "flex", "grid", "list-item", "table", "table-row"].includes(getComputedStyle(k).display));
        const leafish = BLOCK.has(tag) || !hasBlockKids;
        if (leafish && !el.querySelector(CONTROLS + ", a") && text(el)) {
            if (sized(el)) push("text", text(el));
            return;
        }
        const own = squash(Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" "));
        if (own && sized(el)) push("text", leafish && !el.querySelector(CONTROLS) ? text(el) : own);
        for (const k of el.children) walk(k);
    };
    walk(document.body);
    return { lines, disabled, links };
}

// Runs in every page before its own scripts: the extractor, plus a recorder of
// every line that is on screen at any moment after the page has loaded.
const INIT = `window.__walkExtract = ${extractInPage.toString()};
window.__walkSeen = { lines: [], keys: {} };
new MutationObserver(() => {
    if (document.readyState !== "complete" || !document.body) return;
    const seen = window.__walkSeen;
    for (const l of window.__walkExtract().lines) {
        const k = l.kind + "|" + l.text.replace(/\\d+/g, "#");
        if (!seen.keys[k]) seen.lines.push((seen.keys[k] = l));
    }
}).observe(document, { childList: true, subtree: true, characterData: true, attributes: true });`;

// ── the walk harness: one page, driven through a few small verbs ───────
function startWalk(browser, name) {
    const rec = { lines: [], reached: [], notReached: [], links: {}, pageErrors: [], consoleErrors: [], failedRequests: [] };
    let ctx = null;
    let page = null;
    let pending = 0;
    let actions = [];
    let notes = [];
    let extra = [];
    let previous = new Set();
    const key = (l) => l.kind + "|" + l.text;
    const grab = () => page.evaluate(() => window.__walkExtract());
    const did = (what, promise) => promise.then(() => void actions.push(what));
    // A control by its exact name, or by a CSS selector written as "css=…".
    const control = (what) => (what.startsWith("css=") ? page.locator(what.slice(4)) : page.getByRole("button", { name: what, exact: true }).or(page.getByRole("link", { name: what, exact: true }))).first();
    // Wait until the text has stopped changing and no request is in flight.
    const settle = async (max = 16000) => {
        for (let last = null, t0 = Date.now(); Date.now() - t0 < max; ) {
            const now = JSON.stringify((await grab()).lines);
            if (now === last && pending <= 0) return;
            last = now;
            await page.waitForTimeout(300);
        }
        notes.push(`After ${max / 1000}s the page was still changing or still waiting on a request; it was recorded as it stood.`);
    };
    const w = {
        rec,
        mode: "",
        // A new context for every load: empty storage, no cookies.
        async go(url) {
            if (ctx) await ctx.close();
            ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
            await ctx.addInitScript({ content: INIT });
            page = await ctx.newPage();
            pending = 0;
            const data = (r) => r.resourceType() === "fetch" || r.resourceType() === "xhr";
            page.on("pageerror", (e) => rec.pageErrors.push(e.message));
            page.on("console", (m) => m.type() === "error" && rec.consoleErrors.push(m.text().slice(0, 240)));
            page.on("request", (r) => data(r) && pending++);
            page.on("requestfinished", (r) => data(r) && pending--);
            page.on("requestfailed", (r) => (data(r) && pending--, rec.failedRequests.push(`${r.url().split("?")[0]} — ${(r.failure() || {}).errorText || "failed"}`)));
            page.on("response", (r) => r.status() >= 400 && rec.failedRequests.push(`${r.url().split("?")[0]} — HTTP ${r.status()}`));
            // A page that redirects at once interrupts its own load.
            await page.goto(BASE + url).catch(() => page.waitForLoadState("load"));
            // Scroll through once so scroll-triggered reveals run, then back to the top.
            await page.evaluate(async () => {
                for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
                    window.scrollTo(0, y);
                    await new Promise((r) => setTimeout(r, 100));
                }
                window.scrollTo(0, 0);
            }).catch(() => {});
            actions.push(`open ${url} in a fresh browser context`);
        },
        close: () => ctx && ctx.close(),
        miss: (state, reason) => rec.notReached.push({ state, reason }),
        click: (what) => did(`click “${what}”`, control(what).click({ timeout: 5000 })),
        fill: (selector, value) => did(`type “${value}” into ${selector}`, page.locator(selector).first().fill(value, { timeout: 5000 })),
        waitFor: (selector) => page.waitForSelector(selector, { timeout: 12000 }),
        run: (fn) => page.evaluate(fn),
        async clickAll(selector) {
            for (const el of await page.locator(selector).all()) await el.click({ timeout: 5000 });
            actions.push(`click every ${selector}`);
        },
        // A required field left empty gets the browser's own bubble, which is
        // not part of the page; its words are read from the field.
        async browserMessage(selector) {
            const said = await page.locator(selector).first().evaluate((el) => el.validationMessage);
            if (said) extra.push({ kind: "browser message", text: said });
            notes.push(said ? "The form was not sent; the message comes from the browser, not the page, and follows the browser's language." : "The browser showed no required-field message.");
        },
        // After a state that ends with the page leaving: note where it went.
        async follow() {
            const from = page.url();
            await page.waitForURL((u) => u.href !== from, { timeout: 8000 }).catch(() => {});
            const to = new URL(page.url());
            const last = rec.reached[rec.reached.length - 1];
            (last.notes = last.notes || []).push(to.href === from ? "The page did not move on within 8 seconds." : `The browser then moved to ${to.pathname}${to.search}.`);
        },
        async snap(state) {
            const mode = w.mode;
            w.mode = "";
            if (mode !== "now") await settle();
            const at = new URL(page.url());
            const got = mode === "redirect" ? { lines: [{ kind: "redirect", text: at.pathname + at.search }], disabled: [], links: {} } : await grab();
            got.lines.push(...extra);
            // Lines that came and went since the last recorded state. Dropped:
            // lines with no letters (counters) and the fragments of a typing
            // animation (the beginning of a longer line of the same kind).
            const seen = mode === "redirect" ? [] : await page.evaluate(() => [window.__walkSeen.lines, (window.__walkSeen = { lines: [], keys: {} })][0]);
            const now = new Set(got.lines.map(key));
            const whole = seen.concat(got.lines);
            const stem = (l) => l.text.replace(/\|$/, "");
            const brief = seen.filter((l) => /[A-Za-z]/.test(l.text) && !now.has(key(l)) && !previous.has(key(l)) && !whole.some((o) => o.kind === l.kind && o.text !== l.text && stem(o).startsWith(stem(l))));
            for (const l of brief) rec.lines.push(`[${name} | ${state} — shown briefly before this | ${l.kind}] ${l.text}`);
            for (const l of got.lines) rec.lines.push(`[${name} | ${state} | ${l.kind}] ${l.text}`);
            Object.assign(rec.links, got.links);
            const entry = { state, lines: got.lines.length, shownBrieflyBefore: brief.length, newSincePreviousState: got.lines.filter((l) => !previous.has(key(l))).length, actions };
            if (got.disabled.length) entry.disabledControls = got.disabled;
            if (notes.length) entry.notes = notes;
            rec.reached.push(entry);
            [previous, actions, notes, extra] = [now, [], [], []];
        }
    };
    return w;
}

// ── the pages: each row is [state to record, ...actions that lead to it] ──
const act = (verb, ...args) => (w) => w[verb](...args);
const go = (url) => act("go", url);
const click = (what) => act("click", what);
const fill = (selector, value) => act("fill", selector, value);
const waitFor = (selector) => act("waitFor", selector);
const NOW = (w) => void (w.mode = "now"); // record at once: the page is about to leave
const REDIRECT = (w) => void (w.mode = "redirect"); // record only where the page went
const follow = act("follow");
// The checkout button is pressed only while no checkout endpoint is set, so
// the click can never start a real checkout.
const checkout = async (w) => {
    if (await w.run(() => Boolean((window.AE_HIRE_COMMERCE || {}).checkoutEndpoint))) throw new Error("a checkout endpoint is configured, so the button was not pressed (it would start a real checkout session)");
    await w.click("css=[data-ae-checkout=hero]");
};

// [page, rows, states that cannot be reached here and why]
const PAGES = [
    ["/start.html", [
        ["at rest, after the ranking demo and the scroll reveals finish", go("/start.html")],
        ["after “↻ Watch it rank” replays the ranking demo", click("↻ Watch it rank")]
    ]],
    ["/why-antaeus/", [["at rest", go("/why-antaeus/")]]],
    ["/login.html", [
        ["at rest", go("/login.html")],
        ["form sent empty", click("Sign in →")],
        ["form sent with a bad value (email “not-an-email”, password “x”)", go("/login.html"), fill("#email", "not-an-email"), fill("#password", "x"), click("Sign in →")],
        ["arriving from checkout (?source=checkout)", go("/login.html?source=checkout")]
    ], [["signed in", "needs real credentials and a reachable sign-in service; the walk sends neither"]]],
    ["/signup.html", [
        ["at rest", go("/signup.html")],
        ["form sent empty", click("Create your workspace →")],
        ["form sent with a bad value (email “not-an-email”, password “short”)", fill("#email", "not-an-email"), fill("#password", "short"), click("Create your workspace →")],
        ["form sent with a malformed email and a long-enough password (the page sends the request)", fill("#password", "not-a-real-password"), click("Create your workspace →")],
        ["arriving from checkout (?source=checkout)", go("/signup.html?source=checkout")]
    ], [["confirmation screen (“One click and you're inside.”)", "appears only after a real account is created; the walk never sends a well-formed email"]]],
    ["/forgot-password.html", [
        ["at rest", go("/forgot-password.html")],
        ["form sent empty", click("Send reset link →")],
        ["form sent with a bad value (email “not-an-email”)", go("/forgot-password.html"), fill("#email", "not-an-email"), click("Send reset link →")]
    ], [["“Check your email if the account exists.” confirmation", "appears only when the reset service accepts a request; the walk never sends a well-formed email"]]],
    ["/reset-password.html", [
        ["on arrival, while the link is being checked (about five seconds)", go("/reset-password.html")],
        ["after the check: link expired or invalid", waitFor("#expiredState:not(.hide)")]
    ], [["new-password form and its messages (“Passwords do not match.”, “Password must be at least 8 characters.”, “Password updated.”)", "shown only when the page is opened from a valid reset link in an email"]]],
    ["/coming-soon.html", [
        ["at rest", go("/coming-soon.html")],
        ["“Enter” pressed with no code", click("Enter"), act("browserMessage", "#gate-input")],
        ["six digits typed and “Enter” pressed, before the page moves on", fill("#gate-input", "000000"), click("Enter"), act("waitFor", "#gate-landed.on"), NOW],
        [null, follow],
        ["after a wrong code (where the Worker sends the visitor: ?error=1)", go("/coming-soon.html?error=1")]
    ], [["a correct code", "codes are checked by the production Worker at /_gate/unlock, which a static server does not run"]]],
    ["/privacy.html", [["at rest", go("/privacy.html")]]],
    ["/terms.html", [["at rest", go("/terms.html")]]],
    ["/preview", [
        ["at rest", go("/preview")],
        ["“Open the workspace →” pressed with no code", click("Open the workspace →"), act("browserMessage", "input[name=code]")],
        ["after a wrong code (where the Worker sends the visitor: ?error=1)", go("/preview?error=1")],
        ["opened on a phone or tablet (?error=desktop)", go("/preview?error=desktop")]
    ], [["a correct code", "codes are checked by the production Worker at /_preview/unlock; build-transcript.js records the workspace it opens"]]],
    ["/demo-seed.html", [
        ["sample picker at rest (no autoseed)", go("/demo-seed.html")],
        ["after “Clear the sample from this browser”", click("Clear the sample from this browser")],
        ["after “Load it →” on sample one, before the Dashboard opens", click("css=.pick:nth-child(1) .go"), waitFor("#status.ok"), NOW],
        [null, follow],
        ["after “Load it →” on sample two, before the Dashboard opens", go("/demo-seed.html"), click("css=.pick:nth-child(2) .go"), waitFor("#status.ok"), NOW],
        [null, follow]
    ]],
    ["/should-we-hire-an-ae/", [
        ["at rest", go("/should-we-hire-an-ae/")],
        ["every FAQ answer opened", act("clickAll", "details > summary")],
        ["after pressing the first checkout button", checkout]
    ]],
    ["/index.html", [["opened with no saved session: where it sends the visitor", go("/index.html"), REDIRECT]]]
];

// ── main ───────────────────────────────────────────────────────────────
async function main() {
    if (/^(preview-transcript|artifacts)(\/|$)/.test(path.relative(ROOT, OUT))) throw new Error("--out must not be inside preview-transcript/ or artifacts/.");
    if (!fs.existsSync(path.join(DIST, "start.html"))) throw new Error("dist/ is missing — build first (this tool does not build).");
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serve();
    const exe = process.env.TRANSCRIPT_CHROMIUM || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");
    const browser = await chromium.launch(exe ? { executablePath: exe } : {});
    const report = { tool: "tools/preview/walk-public-pages.js", generatedAt: new Date().toISOString(), servedFrom: "dist/ (production build, served read-only)", viewport: { width: 1440, height: 900 }, pages: [] };
    const all = [];
    let bad = false;
    for (const [name, rows, absent = []] of PAGES) {
        const w = startWalk(browser, name);
        const r = w.rec;
        // A row that fails is recorded as not reached; the next row goes on.
        for (const [state, ...acts] of rows) {
            try {
                for (const a of acts) await a(w);
                if (state) await w.snap(state);
            } catch (e) {
                w.mode = "";
                w.miss(state || "following the page after the previous state", e.message.split("\n")[0]);
            }
        }
        await w.close();
        for (const [state, reason] of absent) w.miss(state, reason);
        all.push(...r.lines);
        report.pages.push({ page: name, lines: r.lines.length, statesReached: r.reached.length, reached: r.reached, notReached: r.notReached, pageErrors: [...new Set(r.pageErrors)], consoleErrors: [...new Set(r.consoleErrors)], failedRequests: [...new Set(r.failedRequests)], links: r.links });
        console.log(`${name}: ${r.reached.length} states reached, ${r.notReached.length} not reached, ${r.lines.length} lines, ${new Set(r.pageErrors).size} page errors`);
        if (r.pageErrors.length || !r.lines.length) bad = true;
    }
    fs.writeFileSync(path.join(OUT, "public-pages.txt"), all.join("\n") + (all.length ? "\n" : ""));
    fs.writeFileSync(path.join(OUT, "coverage.json"), JSON.stringify(report, null, 2) + "\n");
    await browser.close();
    server.close();
    console.log(`Wrote ${OUT}`);
    if (bad) {
        console.error("A page error occurred or a page produced no text; see coverage.json.");
        process.exitCode = 1;
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
