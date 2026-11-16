#!/usr/bin/env node
/**
 * Walks the onboarding (workspace setup) flow in a real browser and records
 * every string a new user is shown, in every state the walk can reach.
 *
 * Why it exists: the preview walkthrough (build-transcript.js) starts from a
 * seeded sample workspace, where onboarding is locked, so onboarding had no
 * rendered-text evidence. This tool walks all three versions that ship:
 *   default  /onboarding/?qa=1                 src/onboarding/seeding/
 *   ds       /onboarding/?qa=1&seeding=0       src/onboarding/ds/
 *   legacy   /onboarding/?qa=1&seeding=0&ds=0  src/onboarding/components/
 * (`qa=1` stops the "already set up on another device" redirect.)
 *
 * Run — dist/ must already hold a production build; this tool never builds:
 *   node tools/preview/walk-onboarding.js [--out <dir>]
 *   TRANSCRIPT_CHROMIUM=<path>  browser (default /opt/pw-browsers/chromium)
 *   WALK_PORT=<port>            port for serving dist/ read-only (default 4331)
 *
 * Every page load uses a new browser context: empty storage, no demo seed, no
 * preview cookie. Cloud calls are not mocked: where account research or the
 * cloud save cannot be reached, the walk records what the user is told.
 *
 * Output (never preview-transcript/ or artifacts/):
 *   onboarding-default.txt, onboarding-ds.txt, onboarding-legacy.txt — every
 *     string on screen in each state, in reading order, one per line:
 *     [onboarding | <step and state> | <kind>] <text>   (kinds: heading N,
 *     button, link, field, text, option, placeholder, title, aria-label, alt)
 *   coverage.json — per variant: states reached and the actions that led to
 *     each, states not reached with the reason, page and console errors
 * Exit code 1 if a page error occurred or a variant produced no text.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.WALK_PORT || 4331);
const BASE = `http://127.0.0.1:${PORT}`;
// The final-audit scratch folder; pass --out to write somewhere else.
const DEFAULT_OUT = "/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit/onboarding-walk";
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
// in it stays whole. `includeFaded` keeps text still at opacity 0 (a step
// caught in the first instant of fading in). (walk-public-pages.js carries
// the same function.)
function extractInPage(includeFaded) {
    const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "DT", "DD", "LABEL", "FIGCAPTION", "BLOCKQUOTE", "PRE", "SUMMARY", "LEGEND", "CAPTION"]);
    const CONTROLS = "button, input, textarea, select, [role=button], [role=tab]";
    const lines = [];
    const disabled = [];
    const links = {};
    const seen = new Set();
    // checkVisibility() also catches what Chromium hides without display:none,
    // such as the answer inside a closed <details>.
    const shown = (el, s = getComputedStyle(el)) => !(s.display === "none" || s.visibility === "hidden" || (!includeFaded && Number(s.opacity) === 0)) && (s.display === "contents" || !el.checkVisibility || el.checkVisibility());
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

// ── the walk harness: one variant, driven through a few small verbs ────
async function startWalk(browser, variant) {
    const rec = { lines: [], reached: [], notReached: [], links: {}, pageErrors: [], consoleErrors: [], failedRequests: [] };
    let ctx = null;
    let page = null;
    let actions = [];
    let notes = [];
    let previous = new Set();
    const grab = () => page.evaluate(() => window.__walkExtract());
    // Wait until the visible text stops changing (steps fade in over 0.5s).
    const settle = async () => {
        for (let last = null, i = 0; i < 16; i++) {
            const now = JSON.stringify((await grab()).lines);
            if (now === last) return now;
            last = now;
            await page.waitForTimeout(250);
        }
    };
    // A control by its exact words (or, for icon buttons, its aria-label).
    const control = (name) => {
        const q = JSON.stringify(name);
        return page.locator(`button:text-is(${q}), a:text-is(${q}), button:has(strong:text-is(${q})), button[aria-label=${q}]`).first();
    };
    const did = (what, promise) => promise.then(() => void actions.push(what));
    const keep = (state, got, note) => {
        for (const l of got.lines) rec.lines.push(`[onboarding | ${state} | ${l.kind}] ${l.text}`);
        Object.assign(rec.links, got.links);
        const keys = got.lines.map((l) => l.kind + "|" + l.text);
        const entry = { state, lines: keys.length, newSincePreviousState: keys.filter((k) => !previous.has(k)).length, actions };
        if ((got.disabled || []).length) entry.disabledControls = got.disabled;
        if (note || notes.length) entry.notes = notes.concat(note || []);
        rec.reached.push(entry);
        [previous, actions, notes] = [new Set(keys), [], []];
    };
    const w = {
        rec,
        // A new context for every load: empty storage, no demo seed, no cookie.
        async open() {
            if (ctx) await ctx.close();
            ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
            await ctx.addInitScript({ content: `window.__walkExtract = ${extractInPage.toString()};` });
            page = await ctx.newPage();
            page.on("pageerror", (e) => rec.pageErrors.push(e.message));
            page.on("console", (m) => m.type() === "error" && rec.consoleErrors.push(`${m.text().slice(0, 240)} @ ${m.location().url || "page"}`));
            page.on("requestfailed", (r) => rec.failedRequests.push(`${r.url()} — ${(r.failure() || {}).errorText || "failed"}`));
            page.on("response", (r) => r.status() >= 400 && rec.failedRequests.push(`${r.url()} — HTTP ${r.status()}`));
            await page.goto(BASE + variant.url);
            await page.waitForSelector("#app > *", { timeout: 15000 });
            actions.push(`open ${variant.url} in a fresh browser context`);
        },
        close: () => ctx && ctx.close(),
        snap: async (state) => keep(state, (await settle(), await grab())),
        miss: (state, reason) => rec.notReached.push({ state, reason }),
        has: (selector) => page.locator(selector).count().then((n) => n > 0),
        // A button with a looping nudge animation never holds still, which a
        // normal Playwright click waits on forever; a person can click it, so
        // once it is visible and enabled the click is forced.
        async click(name) {
            const c = control(name);
            await c.waitFor({ state: "visible", timeout: 5000 });
            if (await c.isDisabled()) throw new Error(`“${name}” is disabled, so it could not be clicked`);
            await did(`click “${name}”`, c.click({ timeout: 1500 }).catch(() => c.click({ force: true, timeout: 3000 })));
        },
        type: (selector, value, nth = 0) => did(`type “${value.replace(/\n/g, " / ")}”`, page.locator(selector).nth(nth).fill(value, { timeout: 5000 })),
        choose: (selector, label) => did(`choose “${label}”`, page.locator(selector).first().selectOption({ label }, { timeout: 5000 })),
        key: (k) => did(`press ${k}`, page.keyboard.press(k)),
        // "Try to continue with required input missing": a disabled button is
        // clicked anyway and what happened goes into the state's notes.
        async blocked(name) {
            const b = control(name);
            if (!(await b.isDisabled({ timeout: 5000 }))) return notes.push(`“${name}” was expected to be disabled here but is enabled; it was not clicked.`);
            const before = await settle();
            await b.click({ force: true, timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(300);
            notes.push(`“${name}” is disabled; clicking it ${(await settle()) === before ? "changes nothing and shows no message" : "changed the screen"}.`);
        },
        // A loading state can be put in the page and replaced before the
        // browser draws a frame (a call that fails at once), so a DOM observer
        // collects every line shown while `selector` exists.
        watch: (selector) =>
            page.evaluate((sel) => {
                const seen = (window.__walkSeen = { lines: [], keys: {}, frames: 0 });
                if (window.__walkObs) window.__walkObs.disconnect();
                window.__walkObs = new MutationObserver(() => {
                    if (!document.querySelector(sel)) return;
                    for (const l of window.__walkExtract(true).lines) {
                        const k = l.kind + "|" + l.text.replace(/\d+/g, "#");
                        if (!seen.keys[k]) seen.lines.push((seen.keys[k] = l));
                    }
                });
                window.__walkObs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
                const frame = () => {
                    if (document.querySelector(sel)) seen.frames++;
                    if (window.__walkSeen === seen) requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }, selector),
        async snapWatched(state, selector) {
            await page.waitForSelector(selector, { state: "detached", timeout: 180000 });
            await page.waitForTimeout(400);
            const seen = await page.evaluate(() => window.__walkSeen);
            if (!seen.lines.length) return w.miss(state, "the loading text never entered the page");
            keep(state, { lines: seen.lines }, seen.frames ? `Loading text was on screen for about ${seen.frames} animation frames.` : "Loading text was placed in the page and replaced before the browser drew a frame (the call it waits on failed at once), so a person does not see it in this run. Captured by a DOM observer.");
        }
    };
    return w;
}

// ── the walks: each row is [state to record, ...actions that lead to it] ──
const act = (verb, ...args) => (w) => w[verb](...args);
const open = act("open");
const click = (name) => act("click", name);
const type = (selector, value, nth) => act("type", selector, value, nth);
const blocked = (name) => act("blocked", name);
const writeIn = (answer) => (w) => w.type(".sd-other__i", answer).then(() => w.click("Use this →"));

// Ten deals (account, value, stage, champion, who signs, where it's stuck),
// written so each of the deals step's seven checks shows at least once.
const DEALS = [
    ["Boeing", "280000", "Proposal", "VP Talent Acquisition", "", "Security review"],
    ["Starbucks", "310000", "Negotiation", "Director of Recruiting", "CHRO", "No reply since the pricing call"],
    ["Chipotle", "190000", "Verbal yes", "Head of People Operations", "CFO", "Only talking to one person"],
    ["delta.com", "240000", "Discovery", "", "CFO", ""],
    ["Nordstrom", "150000", "Discovery", "VP Stores", "", ""],
    ["United Airlines", "220000", "Prospecting", "Talent lead", "COO", ""],
    ["Walmart", "120000", "Not sure yet", "", "", ""],
    ["Costco", "175000", "Discovery", "Recruiting manager", "CFO", ""],
    ["Marriott", "205000", "Discovery", "VP People", "CHRO", ""],
    ["FedEx", "260000", "Prospecting", "Head of Talent", "COO", ""]
];
const deals = (from, to) => async (w) => {
    for (const d of DEALS.slice(from, to)) {
        for (const [i, v] of [d[0], d[1], d[3], d[4], d[5]].entries()) await w.type(".sd-entry input", v, i);
        await w.choose(".sd-entry select", d[2]);
        await w.click("Add this deal →");
    }
};
// The research step: loading, then results or the failure notice and its retry.
async function research(w) {
    await w.watch(".sd-meter");
    await w.click("Research these accounts →");
    await w.snapWatched("4 Research — loading", ".sd-meter");
    if (!(await w.has(".sd-notice"))) {
        await w.snap("4 Research — results returned");
        for (const s of ["failed: research unavailable", "loading again after “Try again”", "after “Try again”"]) w.miss(`4 Research — ${s}`, "account research returned results in this run, so the failure notice and its “Try again” button were not shown");
        return;
    }
    await w.snap("4 Research — failed: research unavailable");
    await w.watch(".sd-meter");
    await w.click("Try again");
    await w.snapWatched("4 Research — loading again after “Try again”", ".sd-meter");
    await w.snap("4 Research — after “Try again”");
}

// default — the seeding flow (src/onboarding/seeding/).
const SEEDING = [
    // Load 1: the ICP step answered with vague, written-in answers.
    ["1 Doorway — at rest", open],
    ["2 ICP — question 1 of 3, at rest", click("Start →")],
    ["2 ICP — “Something else…” opened, nothing typed (validation)", click("Something else…"), blocked("Use this →")],
    ["2 ICP — result after three vague written-in answers", writeIn("Anyone"), click("Something else…"), writeIn("Any size"), click("Something else…"), writeIn("they need it")],
    // Load 2: specific answers, then the rest of the flow.
    ["2 ICP — question 2 of 3, at rest", open, click("Start →"), click("Revenue Operations")],
    ["2 ICP — question 3 of 3, at rest", click("200–800 people")],
    ["2 ICP — result after three specific answers", click("Just raised, scaling fast")],
    ["3 Accounts — at rest, nothing entered (validation)", click("Looks right →"), blocked("Research these accounts →")],
    ["3 Accounts — entries that are not companies (validation)", type(".sd-ta", "ceo@boeing.com, 12345, B, a note to myself about who to call next week, bad_domain..com")],
    ["3 Accounts — three company names entered (Boeing, Starbucks, Chipotle)", type(".sd-ta", "Boeing\nStarbucks\nChipotle"), blocked("Research these accounts →")],
    ["3 Accounts — five entered (adds delta.com and Nordstrom), enough to continue", type(".sd-ta", "Boeing\nStarbucks\nChipotle\ndelta.com\nNordstrom")],
    [null, research],
    ["5 Deals — at rest, no deal added (validation)", click("Continue setup →"), blocked("Add this deal →"), blocked("Add at least one open deal to continue")],
    ["5 Deals — one deal added (fewer than the ten suggested)", deals(0, 1)],
    ["6 Sales target — at rest, reached with one deal (validation)", click("I've added them all — even if it's under ten"), blocked("Finish setup →")],
    ["6 Sales target — target and deal size entered; the estimate says one deal falls short", type(".sd-qf__i", "2000000", 0), type(".sd-qf__i", "50000", 1)],
    ["5 Deals — four deals added", click("← Back"), deals(1, 4)],
    ["5 Deals — seven deals added", deals(4, 7)],
    ["5 Deals — ten deals added (the suggested number)", deals(7, 10)],
    ["6 Sales target — larger deal size entered; the estimate says ten deals are enough", click("Next: your sales target →"), type(".sd-qf__i", "280000", 1)],
    ["7 Landing — setup complete", click("Finish setup →")],
    ["1 Doorway — workspace map opened (G key)", open, act("key", "g")]
];

// ds and legacy — the seven-question flow (same steps and labels, two faces).
const FIELD = "#app input:not([type=checkbox]), #app textarea";
const CLASSIC = [
    ["1 Intro — at rest", open],
    ["2 Company — at rest", click("Begin")],
    ["2 Company — name entered, after Continue with the name empty moved on and Back returned", click("Continue"), click("Back"), type(FIELD, "Luca Industries")],
    ["3 Role — at rest, nothing picked (validation)", click("Continue"), blocked("Continue")],
    ["4 Category — at rest, nothing picked (validation)", click("Founder"), click("Continue"), blocked("Continue")],
    ["4 Category — product category picked, no industry yet (validation)", click("Sales Tech / Revenue Intelligence"), blocked("Continue")],
    ["4 Category — one industry picked", click("Retail / E-commerce")],
    ["4 Category — two industries picked", click("Travel / Hospitality")],
    ["5 ICP — at rest, nothing typed (validation)", click("Continue"), blocked("Continue")],
    ["5 ICP — vague answer typed", type(FIELD, "Everyone who needs it")],
    ["5 ICP — specific answer and pain typed", type(FIELD, "VPs of Talent Acquisition at 10,000+ employee retail and travel companies in North America that hire seasonal staff."), type(FIELD, "Seasonal hiring outruns the recruiting team every year.", 1)],
    ["6 First account — at rest", click("Continue")],
    ["6 First account — Boeing and a reason entered", type(FIELD, "Boeing"), type(FIELD, "Opened 400 seasonal maintenance roles this month.", 1)],
    ["7 Quota — at rest", click("Continue")],
    ["7 Quota — annual quota entered", type(FIELD, "1200000")],
    ["8 Complete — after finishing", click("Finish onboarding")]
];
// States the audit asks about that these two versions cannot show.
const CLASSIC_ABSENT = [
    ["Accounts — three company names (Boeing, Starbucks, Chipotle)", "this version asks for one company; Boeing was entered on its First account step"],
    ["Research step (loading, failure, retry)", "this version has no account-research step"],
    ["Deals step (one deal, fewer-than-recommended message)", "this version has no deals step"],
    ["7 Quota — “Fill in at least one field to finish.” and “Worth filling: …”", "not reachable by walking forward: the Role and ICP steps do not let you continue without an answer, and those answers remove both messages"],
    ["8 Complete — “Nothing was seeded” version", "shown only when the browser has no local storage; the walk always has it"]
];
// The shared controls around the step are each opened on a fresh load of step 1.
const VARIANTS = [
    { id: "default", url: "/onboarding/?qa=1", steps: SEEDING, absent: [] },
    { id: "ds", url: "/onboarding/?qa=1&seeding=0", steps: [...CLASSIC, ["1 Intro — page help opened (“?”)", open, click("?")], ["1 Intro — jump list opened (Ctrl+K)", open, act("key", "Control+k")]], absent: CLASSIC_ABSENT },
    { id: "legacy", url: "/onboarding/?qa=1&seeding=0&ds=0", steps: [...CLASSIC, ["1 Intro — jump list opened (“⌘K JUMP”)", open, click("Jump to a page (press cmd+K)")], ["1 Intro — “Open current analysis” opened", open, click("Open current analysis")], ["1 Intro — scheduled-actions settings opened (“⚙”)", open, click("Open settings")]], absent: CLASSIC_ABSENT }
];

// ── main ───────────────────────────────────────────────────────────────
async function main() {
    if (/^(preview-transcript|artifacts)(\/|$)/.test(path.relative(ROOT, OUT))) throw new Error("--out must not be inside preview-transcript/ or artifacts/.");
    if (!fs.existsSync(path.join(DIST, "onboarding", "index.html"))) throw new Error("dist/onboarding/ is missing — build first (this tool does not build).");
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serve();
    const exe = process.env.TRANSCRIPT_CHROMIUM || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");
    const browser = await chromium.launch(exe ? { executablePath: exe } : {});
    const report = { tool: "tools/preview/walk-onboarding.js", generatedAt: new Date().toISOString(), servedFrom: "dist/ (production build, served read-only)", viewport: { width: 1440, height: 900 }, variants: [] };
    let bad = false;
    for (const variant of VARIANTS) {
        const w = await startWalk(browser, variant);
        const r = w.rec;
        let stopped = null;
        try {
            for (const [state, ...acts] of variant.steps) {
                for (const a of acts) await a(w);
                if (state) await w.snap(state);
            }
        } catch (e) {
            stopped = e.message.split("\n")[0];
            const done = new Set(r.reached.map((x) => x.state));
            for (const [state] of variant.steps) if (state && !done.has(state)) w.miss(state, `the walk stopped before this state: ${stopped}`);
        }
        await w.close();
        for (const [state, reason] of variant.absent) w.miss(state, reason);
        const file = `onboarding-${variant.id}.txt`;
        fs.writeFileSync(path.join(OUT, file), r.lines.join("\n") + (r.lines.length ? "\n" : ""));
        report.variants.push({ id: variant.id, url: variant.url, file, lines: r.lines.length, statesReached: r.reached.length, walkStopped: stopped, reached: r.reached, notReached: r.notReached, pageErrors: [...new Set(r.pageErrors)], consoleErrors: [...new Set(r.consoleErrors)], failedRequests: [...new Set(r.failedRequests)], links: r.links });
        console.log(`${variant.id}: ${r.reached.length} states reached, ${r.notReached.length} not reached, ${r.lines.length} lines, ${new Set(r.pageErrors).size} page errors${stopped ? ` — STOPPED: ${stopped}` : ""}`);
        if (r.pageErrors.length || !r.lines.length) bad = true;
    }
    fs.writeFileSync(path.join(OUT, "coverage.json"), JSON.stringify(report, null, 2) + "\n");
    await browser.close();
    server.close();
    console.log(`Wrote ${OUT}`);
    if (bad) {
        console.error("A page error occurred or a variant produced no text; see coverage.json.");
        process.exitCode = 1;
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
