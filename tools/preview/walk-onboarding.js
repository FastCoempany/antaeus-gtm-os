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
 *   TRANSCRIPT_CHROMIUM=<path>  browser to use (default /opt/pw-browsers/chromium)
 *   WALK_PORT=<port>            local port for serving dist/ read-only (default 4331)
 *   WALK_ONLY=default,ds        walk only these variants (coverage.json says partial)
 *
 * Every page load uses a new browser context: empty storage, no demo seed, no
 * preview cookie. Cloud calls are not mocked. Where account research or the
 * cloud save cannot be reached, the walk records what the user is told.
 *
 * Output (never preview-transcript/ or artifacts/):
 *   onboarding-default.txt, onboarding-ds.txt, onboarding-legacy.txt
 *       one line per string: [onboarding | <step and state> | <kind>] <text>
 *       kinds: heading N, button, link, field, text, option (a dropdown choice),
 *       placeholder, title (hover text), aria-label, alt
 *   coverage.json — per variant: states reached, states not reached with the
 *       reason, page errors, console errors, failed requests, link targets
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
const DEFAULT_OUT =
    "/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit/onboarding-walk";
const outFlag = process.argv.indexOf("--out");
const OUT = path.resolve(outFlag > -1 && process.argv[outFlag + 1] ? process.argv[outFlag + 1] : DEFAULT_OUT);

const VARIANTS = [
    { id: "default", url: "/onboarding/?qa=1", walk: walkSeeding },
    { id: "ds", url: "/onboarding/?qa=1&seeding=0", walk: walkClassic },
    { id: "legacy", url: "/onboarding/?qa=1&seeding=0&ds=0", walk: walkClassic }
];

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
// dropdown choices come out as lines of their own. `includeFaded` keeps text
// that is still at opacity 0 (a step caught in the first instant of fading in).
function extractInPage(includeFaded) {
    const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "DT", "DD", "LABEL", "FIGCAPTION", "BLOCKQUOTE", "PRE", "SUMMARY", "LEGEND", "CAPTION"]);
    const lines = [];
    const disabled = [];
    const links = {};
    const seen = new Set();
    const shown = (el) => {
        const s = getComputedStyle(el);
        return !(s.display === "none" || s.visibility === "hidden" || (!includeFaded && Number(s.opacity) === 0));
    };
    const sized = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const text = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    const push = (kind, t) => {
        t = String(t || "").replace(/\s+/g, " ").trim();
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
        if (el.getAttribute("placeholder")) push("placeholder", el.getAttribute("placeholder"));
        if (el.tagName === "IMG" && el.getAttribute("alt")) push("alt", el.getAttribute("alt"));
    };
    const walk = (el) => {
        if (!(el instanceof HTMLElement) || !shown(el)) return;
        const tag = el.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;
        const role = el.getAttribute("role");
        const heading = /^H[1-6]$/.test(tag);
        if ((tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || heading) && !sized(el)) return;
        if (tag === "BUTTON" || role === "button" || role === "tab") {
            const own = text(el) || el.getAttribute("aria-label") || el.getAttribute("title") || "";
            push(role === "tab" ? "tab" : "button", own);
            if (el.disabled || el.getAttribute("aria-disabled") === "true") disabled.push(own);
            attrs(el, own);
            return;
        }
        if (tag === "A") {
            const own = text(el) || el.getAttribute("aria-label") || el.getAttribute("title") || "";
            push("link", own);
            if (own) links[own] = el.getAttribute("href") || "";
            attrs(el, own);
            return;
        }
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
            const lbl = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest("label");
            push("field", (lbl && text(lbl)) || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || "(unlabelled field)");
            attrs(el, null);
            if (tag === "SELECT") for (const o of el.options) push("option", o.text);
            return;
        }
        attrs(el, null);
        if (heading) {
            push(`heading ${tag[1]}`, text(el));
            return;
        }
        // Leaf-ish blocks: their text once; otherwise the element's own words,
        // then everything inside it, in order.
        const hasBlockKids = Array.from(el.children).some((k) => {
            const d = getComputedStyle(k).display;
            return d === "block" || d === "flex" || d === "grid" || d === "list-item" || d === "table" || d === "table-row";
        });
        const interactive = el.querySelector("button, a, input, textarea, select, [role=button], [role=tab]");
        if ((BLOCK.has(tag) || !hasBlockKids) && !interactive && text(el)) {
            if (sized(el)) push("text", text(el));
            return;
        }
        const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .join(" ");
        if (own && sized(el)) push("text", own);
        for (const k of el.children) walk(k);
    };
    walk(document.body);
    return { lines, disabled, links };
}

// ── the walk harness: one variant, written in a few small verbs ────────
async function startWalk(browser, variant) {
    const rec = { lines: [], reached: [], notReached: [], links: {}, pageErrors: [], consoleErrors: [], failedRequests: [] };
    let ctx = null;
    let page = null;
    let note = "";
    const grab = () => page.evaluate(() => window.__walkExtract());
    // Wait until the visible text stops changing (steps fade in over 0.5s).
    const settle = async () => {
        let last = null;
        for (let i = 0; i < 16; i++) {
            const now = JSON.stringify((await grab()).lines);
            if (now === last) return now;
            last = now;
            await page.waitForTimeout(250);
        }
        return last;
    };
    const control = (name) => {
        const q = JSON.stringify(name);
        return page.locator(`button:text-is(${q}), a:text-is(${q}), button:has(strong:text-is(${q}))`).first();
    };
    const keep = (state, got, extra) => {
        const clean = state.replace(/\|/g, "/").replace(/\s+/g, " ");
        for (const l of got.lines) rec.lines.push(`[onboarding | ${clean} | ${l.kind.replace(/\]/g, ")")}] ${l.text}`);
        Object.assign(rec.links, got.links);
        const entry = { state: clean, lines: got.lines.length };
        if (got.disabled && got.disabled.length) entry.disabledControls = got.disabled;
        if (extra || note) entry.note = [note, extra].filter(Boolean).join(" ");
        note = "";
        rec.reached.push(entry);
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
            page.on("console", (m) => m.type() === "error" && rec.consoleErrors.push(m.text().slice(0, 240)));
            page.on("requestfailed", (r) => rec.failedRequests.push(`${r.url()} — ${(r.failure() || {}).errorText || "failed"}`));
            page.on("response", (r) => r.status() >= 400 && rec.failedRequests.push(`${r.url()} — HTTP ${r.status()}`));
            await page.goto(BASE + variant.url);
            await page.waitForSelector("#app > *", { timeout: 15000 });
        },
        async close() {
            if (ctx) await ctx.close();
        },
        async snap(state, extra) {
            await settle();
            keep(state, await grab(), extra);
        },
        has: (selector) => page.locator(selector).count().then((n) => n > 0),
        // A button with a looping nudge animation never holds still, which a
        // normal Playwright click waits on forever; a person can click it, so
        // once it is visible and enabled the click is forced.
        async click(name) {
            const c = control(name);
            await c.waitFor({ state: "visible", timeout: 5000 });
            if (await c.isDisabled()) throw new Error(`“${name}” is disabled, so it could not be clicked`);
            await c.click({ timeout: 1500 }).catch(() => c.click({ force: true, timeout: 3000 }));
        },
        type: (selector, value, nth = 0) => page.locator(selector).nth(nth).fill(value, { timeout: 5000 }),
        choose: (selector, label) => page.locator(selector).first().selectOption({ label }, { timeout: 5000 }),
        check: (selector) => page.locator(selector).first().check({ timeout: 5000 }),
        key: (k) => page.keyboard.press(k).then(() => page.waitForTimeout(500)),
        miss: (state, reason) => rec.notReached.push({ state, reason }),
        // "Try to continue with required input missing": a disabled button is
        // clicked anyway and the outcome goes into the next state's note.
        async blocked(name) {
            const b = control(name);
            if (!(await b.isDisabled({ timeout: 5000 }))) {
                note += `“${name}” was expected to be disabled here but is enabled. `;
                return;
            }
            const before = await settle();
            await b.click({ force: true, timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(300);
            const same = (await settle()) === before;
            note += `“${name}” is disabled; clicking it ${same ? "changes nothing and shows no message" : "changed the screen"}. `;
        },
        // A loading state can be put in the page and replaced before the
        // browser draws a frame (a call that fails at once), so a DOM observer
        // collects every line shown while `selector` exists.
        watch: (selector) =>
            page.evaluate((sel) => {
                const seen = (window.__walkSeen = { lines: [], keys: {}, frames: 0 });
                if (window.__walkObs) window.__walkObs.disconnect();
                const look = () => {
                    if (!document.querySelector(sel)) return;
                    for (const l of window.__walkExtract(true).lines) {
                        const k = l.kind + "|" + l.text.replace(/\d+/g, "#");
                        if (!seen.keys[k]) seen.lines.push((seen.keys[k] = l));
                    }
                };
                window.__walkObs = new MutationObserver(look);
                window.__walkObs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
                const frame = () => {
                    if (document.querySelector(sel)) seen.frames++;
                    if (window.__walkSeen === seen) requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }, selector),
        async snapWatched(state, selector, why) {
            await page.waitForSelector(selector, { state: "detached", timeout: 180000 });
            await page.waitForTimeout(400);
            const seen = await page.evaluate(() => window.__walkSeen);
            if (!seen.lines.length) return w.miss(state, "the loading text never entered the page");
            keep(state, { lines: seen.lines }, seen.frames ? `On screen for about ${seen.frames} animation frames.` : `Placed in the page and replaced before the browser drew a frame, so a person does not see it in this run: ${why}`);
        }
    };
    return w;
}

// ── default: the seeding flow (src/onboarding/seeding/) ─────────────────
// Ten deals, written so each of the step's seven checks shows at least once.
const DEALS = [
    ["Boeing", "280000", "Proposal", "VP Talent Acquisition", "", "Security review"],
    ["Starbucks", "310000", "Negotiation", "Director of Recruiting", "CHRO", "No reply since the pricing call"],
    ["Chipotle", "190000", "Verbal yes", "Head of People Operations", "CFO", "Only talking to one person"],
    ["delta.com", "240000", "Discovery", "", "CFO", ""],
    ["Nordstrom", "150000", "Discovery", "VP Stores", "", ""],
    ["United Airlines", "220000", "Prospecting", "Talent lead", "COO", ""],
    ["Target", "120000", "Not sure yet", "", "", ""],
    ["Costco", "175000", "Discovery", "Recruiting manager", "CFO", ""],
    ["Marriott", "205000", "Discovery", "VP People", "CHRO", ""],
    ["FedEx", "260000", "Prospecting", "Head of Talent", "COO", ""]
];
async function addDeal(w, d, stopBeforeAdding) {
    for (const [i, v] of [d[0], d[1], null, d[3], d[4], d[5]].entries()) if (v !== null) await w.type(".sd-entry input", v, i > 2 ? i - 1 : i);
    await w.choose(".sd-entry select", d[2]);
    if (!stopBeforeAdding) await w.click("Add this deal →");
}

async function walkSeeding(w) {
    // Run 1 — the ICP step answered with vague, written-in answers.
    await w.open();
    await w.snap("1 Doorway — at rest");
    await w.key("g");
    await w.snap("1 Doorway — workspace map opened (G)");
    await w.key("Escape");
    await w.click("Start →");
    await w.snap("2 ICP — question 1 of 3, at rest");
    await w.click("Something else…");
    await w.blocked("Use this →");
    await w.snap("2 ICP — “Something else…” opened, nothing typed (validation)");
    for (const [i, vague] of ["Anyone", "Any size", "they need it"].entries()) {
        if (i) await w.click("Something else…");
        await w.type(".sd-other__i", vague);
        await w.click("Use this →");
    }
    await w.snap("2 ICP — result after three vague written-in answers (“Anyone”, “Any size”, “they need it”)", "The step accepts each vague answer as typed and shows no challenge or follow-up question.");

    // Run 2 — specific answers, then the rest of the flow.
    await w.open();
    await w.click("Start →");
    await w.click("Revenue Operations");
    await w.snap("2 ICP — question 2 of 3, at rest");
    await w.click("200–800 people");
    await w.snap("2 ICP — question 3 of 3, at rest");
    await w.click("Just raised, scaling fast");
    await w.snap("2 ICP — result after three specific answers");
    await w.click("Looks right →");
    await w.blocked("Research these accounts →");
    await w.snap("3 Accounts — at rest, nothing entered (validation)");
    await w.type(".sd-ta", "ceo@boeing.com, 12345, B, a note to myself about who to call next week, bad_domain..com");
    await w.snap("3 Accounts — entries that are not companies (validation)");
    await w.type(".sd-ta", "Boeing\nStarbucks\nChipotle");
    await w.blocked("Research these accounts →");
    await w.snap("3 Accounts — three company names entered (Boeing, Starbucks, Chipotle)");
    await w.type(".sd-ta", "Boeing\nStarbucks\nChipotle\ndelta.com\nNordstrom");
    await w.snap("3 Accounts — five entered (adds delta.com and Nordstrom), enough to continue");

    const offline = "the research call fails immediately here, so the result replaces it at once.";
    await w.watch(".sd-meter");
    await w.click("Research these accounts →");
    await w.snapWatched("4 Research — loading", ".sd-meter", offline);
    if (await w.has(".sd-notice")) {
        await w.snap("4 Research — failed: research unavailable");
        await w.watch(".sd-meter");
        await w.click("Try again");
        await w.snapWatched("4 Research — loading again after “Try again”", ".sd-meter", offline);
        await w.snap("4 Research — after “Try again”");
    } else {
        await w.snap("4 Research — results returned");
        for (const s of ["4 Research — failed: research unavailable", "4 Research — loading again after “Try again”", "4 Research — after “Try again”"]) w.miss(s, "account research returned results in this run, so the failure notice and its “Try again” button were not shown");
    }
    await w.click("Continue setup →");

    await w.blocked("Add this deal →");
    await w.blocked("Add at least one open deal to continue");
    await w.snap("5 Deals — at rest, no deal added (validation)");
    await addDeal(w, DEALS[0], true);
    await w.snap("5 Deals — form filled for the first deal, before adding it");
    await w.click("Add this deal →");
    await w.snap("5 Deals — one deal added (fewer than the ten suggested)");
    await w.click("I've added them all — even if it's under ten");

    await w.blocked("Finish setup →");
    await w.snap("6 Target — at rest, reached with one deal (validation)");
    await w.type(".sd-qf__i", "2000000", 0);
    await w.type(".sd-qf__i", "50000", 1);
    await w.snap("6 Target — target and deal size entered; the estimate says one deal falls short");
    await w.click("← Back");
    for (const d of DEALS.slice(1, 4)) await addDeal(w, d);
    await w.snap("5 Deals — four deals added");
    for (const d of DEALS.slice(4, 7)) await addDeal(w, d);
    await w.snap("5 Deals — seven deals added");
    for (const d of DEALS.slice(7)) await addDeal(w, d);
    await w.snap("5 Deals — ten deals added (the suggested number)");
    await w.click("Next: your sales target →");
    await w.type(".sd-qf__i", "280000", 1);
    await w.snap("6 Target — larger deal size entered; the estimate says ten deals are enough");
    await w.click("Finish setup →");
    await w.snap("7 Landing — setup complete", "The cloud copy of the setup is attempted in the background; when it fails nothing is shown.");
}

// ── ds and legacy: the seven-question flow (same steps, two faces) ──────
async function walkClassic(w) {
    const field = "#app input:not([type=checkbox]), #app textarea";
    await w.open();
    await w.snap("1 Intro — at rest");
    await w.click("Begin");
    await w.snap("2 Company — at rest");
    await w.click("Continue");
    await w.click("Back");
    await w.type(field, "Luca Industries");
    await w.snap("2 Company — name entered", "Continue with the name left empty moved on to the next step: nothing on this step is required.");
    await w.click("Continue");
    await w.blocked("Continue");
    await w.snap("3 Role — at rest, nothing picked (validation)");
    await w.click("Founder");
    await w.snap("3 Role — Founder picked");
    await w.click("Continue");
    await w.blocked("Continue");
    await w.snap("4 Category — at rest, nothing picked (validation)");
    await w.click("Sales Tech / Revenue Intelligence");
    await w.blocked("Continue");
    await w.snap("4 Category — product category picked, no industry yet (validation)");
    await w.click("Retail / E-commerce");
    await w.snap("4 Category — one industry picked");
    await w.click("Travel / Hospitality");
    await w.snap("4 Category — two industries picked");
    await w.check("#app input[type=checkbox]");
    await w.snap("4 Category — industry-agnostic ticked (industry list hidden)");
    await w.click("Continue");
    await w.blocked("Continue");
    await w.snap("5 ICP — at rest, nothing typed (validation)");
    await w.type(field, "Everyone who needs it");
    await w.snap("5 ICP — vague answer typed (“Everyone who needs it”)", "The step shows no response to a vague answer; Continue is enabled as soon as anything is typed.");
    await w.type(field, "VPs of Talent Acquisition at 10,000+ employee retail and travel companies in North America that hire seasonal staff.");
    await w.type(field, "Seasonal hiring outruns the recruiting team every year.", 1);
    await w.snap("5 ICP — specific answer and pain typed", "The step shows no response to a specific answer either.");
    await w.click("Continue");
    await w.snap("6 First account — at rest");
    await w.type(field, "Boeing");
    await w.type(field, "Opened 400 seasonal maintenance roles this month.", 1);
    await w.snap("6 First account — Boeing and a reason entered", "This version takes one company, so Starbucks and Chipotle were not entered.");
    await w.click("Continue");
    await w.snap("7 Quota — at rest");
    await w.type(field, "1200000");
    await w.snap("7 Quota — annual quota entered");
    await w.click("Finish onboarding");
    await w.snap("8 Complete — after finishing", "The cloud copy of the answers is attempted in the background; when it fails nothing is shown.");
    w.miss("Research step (loading, failure, retry)", "this version of onboarding has no account-research step");
    w.miss("Deals step (one deal, fewer-than-recommended message)", "this version of onboarding has no deals step");
    w.miss("7 Quota — nothing-entered messages (“Fill in at least one field to finish.”, “Worth filling: …”)", "not reachable by walking forward: the Role and ICP steps do not let you continue without an answer, and those answers remove both messages");
    w.miss("8 Complete — “Nothing was seeded” version", "shown only when the browser has no local storage; the walk always has it");
}

// ── main ───────────────────────────────────────────────────────────────
async function main() {
    if (/^(preview-transcript|artifacts)(\/|$)/.test(path.relative(ROOT, OUT))) throw new Error("--out must not be inside preview-transcript/ or artifacts/.");
    if (!fs.existsSync(path.join(DIST, "onboarding", "index.html"))) throw new Error("dist/onboarding/ is missing — build first (this tool does not build).");
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serve();
    const exe = process.env.TRANSCRIPT_CHROMIUM || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");
    const browser = await chromium.launch(exe ? { executablePath: exe } : {});
    const report = { tool: "tools/preview/walk-onboarding.js", generatedAt: new Date().toISOString(), servedFrom: "dist/ (production build, served read-only)", viewport: { width: 1440, height: 900 }, variants: [] };
    const only = (process.env.WALK_ONLY || "").split(",").filter(Boolean);
    if (only.length) report.partial = true;
    let bad = false;
    for (const variant of VARIANTS.filter((v) => !only.length || only.includes(v.id))) {
        const w = await startWalk(browser, variant);
        let stopped = "";
        try {
            await variant.walk(w);
        } catch (e) {
            stopped = e.message.split("\n")[0];
            w.miss("everything after “" + ((w.rec.reached[w.rec.reached.length - 1] || {}).state || "the first load") + "”", `the walk stopped: ${stopped}`);
        }
        await w.close();
        const r = w.rec;
        const file = `onboarding-${variant.id}.txt`;
        fs.writeFileSync(path.join(OUT, file), r.lines.join("\n") + (r.lines.length ? "\n" : ""));
        report.variants.push({ id: variant.id, url: variant.url, file, lines: r.lines.length, statesReached: r.reached.length, walkStopped: stopped || null, reached: r.reached, notReached: r.notReached, pageErrors: [...new Set(r.pageErrors)], consoleErrors: [...new Set(r.consoleErrors)], failedRequests: [...new Set(r.failedRequests)], links: r.links });
        console.log(`${variant.id}: ${r.reached.length} states, ${r.lines.length} lines, ${r.notReached.length} not reached, ${new Set(r.pageErrors).size} page errors${stopped ? ` — STOPPED: ${stopped}` : ""}`);
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
