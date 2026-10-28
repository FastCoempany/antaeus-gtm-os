#!/usr/bin/env node
/**
 * Builds the AI-readable walkthrough of the preview lane (the enterprise
 * demo seed): every room, every word on screen, where each word sits and
 * what it's for. Output: preview-transcript/ (static HTML, one page per
 * room + an index), served by the Worker at /preview/transcript/<CODE>/.
 *
 * Re-run after any change to a room's face or the demo seed:
 *   npm run build:cloudflare        # fresh dist/
 *   node tools/preview/build-transcript.js
 *   (commit preview-transcript/)
 *
 * It serves dist/ itself on a local port, drives a real browser through
 * the app the way an invitee would, and for each room records:
 *   1. the room at rest — every visible word in reading order, tagged with
 *      what it is (heading, button, link, field, text) and how it is
 *      presented (size, emphasis, primary action, disabled, where on
 *      the screen);
 *   2. what appears when each safe control is opened (tabs, toggles,
 *      drawers, "show more") — clicks that would change the sample data
 *      (log, save, send, delete…) are skipped;
 *   3. hover text (title attributes);
 *   4. the room's capability map — its purpose, what every part does,
 *      what flows in and out, what it must never become.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(ROOT, "preview-transcript");
const MAPS = path.join(ROOT, "deliverables/room-capability-maps");
const DS_MAP = path.join(
    ROOT,
    "deliverables/design-principle-strict-bible/08-room-guardian-specs/antaeus-discovery-studio-capability-map-2026-07-07.html"
);
const PORT = 4311;
const BASE = `http://127.0.0.1:${PORT}`;

// The rooms in motion order (src/lib/ground/motion.ts), onboarding left
// out of the walk — it is locked in the preview and described instead.
const STAGES = [
    "Enter",
    "Strategy",
    "Find & watch",
    "Work the account",
    "Advance the deal",
    "Diagnose · hand off"
];
const ROOMS = [
    ["welcome", "Welcome", "/welcome/", 0, "welcome"],
    ["dashboard", "Dashboard", "/dashboard/", 0, "dashboard"],
    ["readiness", "Readiness Score", "/dashboard/?readiness=1", 0, "readiness-score"],
    ["icp-studio", "ICP Studio", "/icp-studio/", 1, "icp-studio"],
    ["territory-architect", "Territory Architect", "/territory-architect/", 1, "territory-architect"],
    ["prospecting-desk", "Prospecting Desk", "/prospecting-desk/", 1, "prospecting-desk"],
    ["signal-console", "Signal Console", "/signal-console/", 2, "signal-console"],
    ["briefing", "Briefing", "/briefing/", 2, "briefing"],
    ["outdoors-events", "Outdoors Events", "/outdoors-events/", 2, "outdoors-events"],
    ["outbound-studio", "Outbound Studio", "/outbound-studio/", 3, "outbound-studio"],
    ["cold-call-studio", "Cold Call Studio", "/cold-call-studio/", 3, "cold-call-studio"],
    ["linkedin-playbook", "LinkedIn Playbook", "/linkedin-playbook/", 3, "linkedin-playbook"],
    ["discovery-studio", "Discovery Studio", "/discovery-studio/", 3, "discovery-studio"],
    ["deal-workspace", "Deal Workspace", "/deal-workspace/", 4, "deal-workspace"],
    ["pilot-desk", "Pilot Desk", "/pilot-desk/", 4, "pilot-desk"],
    ["getting-to-signed", "Getting to Signed", "/getting-to-signed/", 4, "getting-to-signed"],
    ["call-in-a-favor", "Call in a Favor", "/call-in-a-favor/", 4, "call-in-a-favor"],
    ["future-autopsy", "Future Autopsy", "/future-autopsy/", 5, "future-autopsy"],
    ["quota-workback", "Quota Workback", "/quota-workback/", 5, "quota-workback"],
    ["founding-gtm", "Founding GTM", "/founding-gtm/", 5, "founding-gtm"],
    ["settings", "Settings", "/settings/", 5, "settings"]
];

// Clicks that would change the sample workspace or leave the room.
const UNSAFE = /\b(delete|remove|clear|reset|erase|log|save|send|sign out|submit|confirm|accept|dismiss|decline|mark|add|create|import|restore|download|export|copy|run|load|attend|watch|count it|turn off|lock|book|schedule|enrich|push|archive|pass|skip|yes|no)\b/i;

const esc = (s) =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

// ── a tiny static server over dist/ ────────────────────────────────────
function serve() {
    const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".json": "application/json",
        ".woff2": "font/woff2"
    };
    return http
        .createServer((req, res) => {
            let p = decodeURIComponent(new URL(req.url, BASE).pathname);
            let f = path.join(DIST, p);
            if (p === "/preview" || p === "/preview/") f = path.join(DIST, "preview.html");
            else if (p.endsWith("/")) f = path.join(f, "index.html");
            else if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
            fs.readFile(f, (err, buf) => {
                if (err) {
                    res.writeHead(404);
                    res.end("not found");
                    return;
                }
                res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
                res.end(buf);
            });
        })
        .listen(PORT, "127.0.0.1");
}

// ── in-page extraction: every visible word, in reading order ───────────
function extractInPage() {
    const vw = window.innerWidth;
    const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "DT", "DD", "LABEL", "FIGCAPTION", "BLOCKQUOTE", "PRE", "SUMMARY", "LEGEND", "CAPTION"]);
    const out = [];
    const seen = new Set();

    // Containers can be zero-height (a fixed rail inside an empty box, a
    // display:contents wrapper) while their children show — so only style
    // hides a subtree; size is checked on the element that carries words.
    const shown = (el) => {
        const s = getComputedStyle(el);
        return !(s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0);
    };
    const sized = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const visible = (el) => shown(el) && sized(el);
    const zone = (el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const h = cx < vw * 0.33 ? "left" : cx > vw * 0.67 ? "right" : "center";
        const y = r.top + window.scrollY;
        const v = y < 700 ? "top of page" : y < 1600 ? "middle of page" : "lower page";
        return `${v}, ${h}`;
    };
    const rgb = (c) => (c.match(/\d+(\.\d+)?/g) || []).map(Number);
    const hue = (c) => {
        const [r, g, b, a] = rgb(c);
        if (a === 0 || r === undefined) return null;
        if (r > 200 && g > 90 && g < 150 && b < 80) return "orange";
        if (b > 180 && r < 80) return "blue";
        if (g > 70 && r < 60 && b < 90 && g > r + 25) return "green";
        if (r > 200 && g < 90 && b < 90) return "red";
        if (r > 170 && g > 110 && g < 170 && b < 60) return "amber";
        return null;
    };
    const cues = (el) => {
        const s = getComputedStyle(el);
        const c = [];
        const size = parseFloat(s.fontSize);
        const fam = s.fontFamily.toLowerCase();
        if (size >= 40) c.push("very large");
        else if (size >= 26) c.push("large");
        else if (size <= 11) c.push("small");
        if (fam.includes("serif") && !fam.includes("sans")) c.push("serif");
        if (fam.includes("mono")) c.push("mono");
        if (s.textTransform === "uppercase") c.push("caps");
        if (Number(s.fontWeight) >= 700) c.push("bold");
        const ink = hue(s.color);
        if (ink) c.push(`${ink} text`);
        const bg = hue(s.backgroundColor);
        if (bg) c.push(`${bg} fill`);
        const lr = parseFloat(s.borderLeftWidth);
        if (lr >= 2) {
            const lc = hue(s.borderLeftColor);
            if (lc) c.push(`${lc} left rule`);
        }
        return c;
    };
    const text = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    const push = (kind, el, t, extra) => {
        if (!t) return;
        const key = kind + "|" + t;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ kind, text: t, cues: cues(el), zone: zone(el), extra: extra || "" });
    };

    const walk = (el) => {
        if (!(el instanceof HTMLElement) || !shown(el)) return;
        const tag = el.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "NOSCRIPT") return;
        const title = el.getAttribute("title");
        const aria = el.getAttribute("aria-label");
        if ((tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || /^H[1-6]$/.test(tag)) && !sized(el)) return;
        if (tag === "BUTTON" || el.getAttribute("role") === "button" || el.getAttribute("role") === "tab") {
            const parts = [];
            if (el.disabled || el.getAttribute("aria-disabled") === "true") parts.push("disabled");
            if (el.getAttribute("aria-selected") === "true" || el.getAttribute("aria-pressed") === "true") parts.push("selected");
            if (title) parts.push(`hover: “${title}”`);
            push(el.getAttribute("role") === "tab" ? "tab" : "button", el, text(el) || aria || title, parts.join("; "));
            return;
        }
        if (tag === "A") {
            const href = el.getAttribute("href") || "";
            let dest = "";
            try {
                const u = new URL(href, location.href);
                dest = u.origin === location.origin ? `goes to ${u.pathname}` : `opens ${u.hostname}`;
            } catch (e) {}
            push("link", el, text(el) || aria || title, [dest, title ? `hover: “${title}”` : ""].filter(Boolean).join("; "));
            return;
        }
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
            const lbl = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest("label");
            const name = (lbl && text(lbl)) || aria || el.getAttribute("placeholder") || el.name || "";
            let val = "";
            if (tag === "SELECT") {
                val = `options: ${Array.from(el.options).map((o) => o.text.trim()).join(" | ")}; chosen: ${el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : ""}`;
            } else if (el.type === "checkbox" || el.type === "radio") {
                val = el.checked ? "checked" : "unchecked";
            } else {
                val = el.value ? `filled with “${el.value}”` : el.getAttribute("placeholder") ? `empty, placeholder “${el.getAttribute("placeholder")}”` : "empty";
            }
            push("field", el, name || "(unlabelled field)", val);
            return;
        }
        if (/^H[1-6]$/.test(tag)) {
            push(`heading ${tag[1]}`, el, text(el), title ? `hover: “${title}”` : "");
            return;
        }
        // Leaf-ish blocks: emit their own text once, then descend only into
        // interactive children so buttons inside a paragraph still show.
        const hasBlockKids = Array.from(el.children).some((k) => {
            const d = getComputedStyle(k).display;
            return d === "block" || d === "flex" || d === "grid" || d === "list-item" || d === "table" || d === "table-row";
        });
        const interactive = el.querySelector("button, a, input, textarea, select, [role=button], [role=tab]");
        if ((BLOCK.has(tag) || !hasBlockKids) && !interactive && text(el)) {
            if (sized(el)) push("text", el, text(el), title ? `hover: “${title}”` : "");
            return;
        }
        // Mixed: the element's own words (text sitting directly in it),
        // then everything inside it, in order.
        const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .join(" ");
        if (own && sized(el)) push("text", el, own, title ? `hover: “${title}”` : "");
        else if (title && !text(el) && sized(el)) push("hover-only", el, `“${title}”`);
        for (const k of el.children) walk(k);
    };
    walk(document.body);
    return out;
}

function candidatesInPage(UNSAFE_SRC) {
    const UNSAFE = new RegExp(UNSAFE_SRC, "i");
    const els = Array.from(
        document.querySelectorAll(
            "button, [role=tab], [role=button], summary, [aria-expanded]"
        )
    ).filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
        if (el.closest(".gnd, .ledge")) return false;
        if (el.getAttribute("aria-selected") === "true") return false;
        if (el.closest("a[href]")) return false;
        const t = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
        if (!t || t.length > 80) return false;
        if (UNSAFE.test(t)) return false;
        return true;
    });
    return els.slice(0, 40).map((el, i) => {
        el.setAttribute("data-tx-cand", String(i));
        return (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
    });
}

// ── rendering ──────────────────────────────────────────────────────────
const STYLE = `<style>
body{font-family:Georgia,serif;max-width:900px;margin:40px auto;padding:0 20px;color:#0e1f40;line-height:1.55}
h1,h2,h3{font-family:Georgia,serif}code,.k{font-family:monospace;font-size:.85em;color:#44506b}
.line{margin:2px 0}.kind{font-family:monospace;font-size:.78em;color:#8a93a8;text-transform:uppercase}
.cue{font-family:monospace;font-size:.75em;color:#8a93a8}nav a{margin-right:10px}
.map{border-top:2px solid #0e1f40;margin-top:28px;padding-top:8px}
table{border-collapse:collapse;font-size:.9em}td,th{border-bottom:1px solid #dde;padding:4px 8px;text-align:left;vertical-align:top}
</style>`;

function page(title, body) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>${STYLE}</head><body>${body}</body></html>\n`;
}

function renderLines(lines) {
    return lines
        .map((l) => {
            const meta = [l.cues.join(", "), l.zone, l.extra].filter(Boolean).join(" · ");
            return `<div class="line"><span class="kind">[${esc(l.kind)}]</span> ${esc(l.text)} <span class="cue">— ${esc(meta)}</span></div>`;
        })
        .join("\n");
}

function mapBody(file) {
    if (!fs.existsSync(file)) return "<p>(No capability map on file for this room.)</p>";
    let h = fs.readFileSync(file, "utf8");
    h = h.replace(/[\s\S]*<body[^>]*>/i, "").replace(/<\/body>[\s\S]*/i, "");
    h = h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
    return h;
}

function nav(i) {
    const prev = i > 0 ? `<a href="../${ROOMS[i - 1][0]}/">← ${esc(ROOMS[i - 1][1])}</a>` : `<a href="../">← Index</a>`;
    const next = i < ROOMS.length - 1 ? `<a href="../${ROOMS[i + 1][0]}/">${esc(ROOMS[i + 1][1])} →</a>` : `<a href="../">Back to the index →</a>`;
    return `<nav><a href="../">Index</a> ${prev} ${next}</nav>`;
}

// ── main ───────────────────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(path.join(DIST, "preview.html"))) {
        throw new Error("dist/ is missing or stale — run `npm run build:cloudflare` first.");
    }
    const server = serve();
    const browser = await chromium.launch(
        process.env.TRANSCRIPT_CHROMIUM ? { executablePath: process.env.TRANSCRIPT_CHROMIUM } : {}
    );
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    // 1. The gate, exactly as an invitee first sees it (no cookie yet).
    const gateCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const gp = await gateCtx.newPage();
    await gp.goto(`${BASE}/preview`);
    await gp.waitForTimeout(800);
    const gate = await gp.evaluate(extractInPage);
    await gateCtx.close();

    // 2. Unlock (the Worker sets this flag cookie on a correct code) and
    //    load the enterprise book.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: "antaeus_mode", value: "preview", domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`${BASE}/demo-seed.html?autoseed=ent&return=${encodeURIComponent("/dashboard/?demo=1")}`);
    await p.waitForURL("**/dashboard/**", { timeout: 20000 });
    await p.waitForTimeout(1500);

    // 3. The Ground (the pull-up room map), with the locked onboarding tile.
    await p.keyboard.press("g");
    await p.waitForTimeout(700);
    const ground = await p.evaluate(() => {
        const panel = document.querySelector(".gnd-panel");
        return panel ? panel.innerText.replace(/\n{2,}/g, "\n").trim() : "";
    });
    const lockedWhy = await p.evaluate(() => {
        const el = document.querySelector(".gnd-lock-why");
        return el ? el.textContent.trim() : "";
    });
    await p.keyboard.press("Escape");

    const index = [];
    for (let i = 0; i < ROOMS.length; i++) {
        const [id, label, href, stage, mapId] = ROOMS[i];
        if (process.env.TRANSCRIPT_ONLY && process.env.TRANSCRIPT_ONLY !== id) continue;
        process.stdout.write(`${label}… `);
        const url = `${BASE}${href}${href.includes("?") ? "&" : "?"}demo=1`;
        await p.goto(url);
        await p.waitForTimeout(2200);
        const rest = await p.evaluate(extractInPage);
        const restSet = new Set(rest.map((l) => l.kind + "|" + l.text));

        // Open each safe control in turn and keep only what's new.
        const reveals = [];
        const cands = await p.evaluate(candidatesInPage, UNSAFE.source);
        if (process.env.TRANSCRIPT_DEBUG) console.log(`\n  candidates: ${cands.join(" | ")}`);
        for (let c = 0; c < cands.length; c++) {
            try {
                await p.goto(url);
                await p.waitForTimeout(1200);
                const again = await p.evaluate(candidatesInPage, UNSAFE.source);
                const at = again.indexOf(cands[c]);
                if (at < 0) continue;
                const before = p.url();
                await p.click(`[data-tx-cand="${at}"]`, { timeout: 2000 });
                await p.waitForTimeout(700);
                if (p.url() !== before) {
                    reveals.push({ control: cands[c], lines: [], note: `takes you to ${new URL(p.url()).pathname}` });
                    continue;
                }
                const after = await p.evaluate(extractInPage);
                const fresh = after.filter((l) => !restSet.has(l.kind + "|" + l.text));
                if (fresh.length) reveals.push({ control: cands[c], lines: fresh });
            } catch (e) {
                // a control that can't be clicked is skipped
                if (process.env.TRANSCRIPT_DEBUG) console.log(`  skip “${cands[c]}”: ${e.message.split("\n")[0]}`);
            }
        }

        const mapFile = mapId === "discovery-studio" ? DS_MAP : path.join(MAPS, `${mapId}-capability-map-2026-07-07.html`);
        const body = [
            nav(i),
            `<h1>${esc(label)}</h1>`,
            `<p class="k">Stage: ${esc(STAGES[stage])} · room ${i + 1} of ${ROOMS.length} · address in the app: ${esc(href)}</p>`,
            `<h2>1. The room at rest</h2>`,
            `<p>Every visible word in reading order, top to bottom. Each line says what it is (heading, button, link, field, text), how it is shown (size, typeface, colour, emphasis) and where it sits on a 1440-pixel-wide desktop screen. Orange marks the one main action on a surface; blue is information from the system; green and forest green mean healthy or lasting; amber is caution; red is real risk.</p>`,
            renderLines(rest),
            `<h2>2. What opens when you use the controls</h2>`,
            reveals.length
                ? reveals
                      .map(
                          (r) =>
                              `<h3>Clicking “${esc(r.control)}”</h3>` +
                              (r.note ? `<p>${esc(r.note)}</p>` : renderLines(r.lines))
                      )
                      .join("\n")
                : `<p>No extra panels open from this room's controls (or they only change sample data, which this walkthrough leaves alone).</p>`,
            `<div class="map"><h2>3. What this room is for and how it works</h2><p>The room's capability map: its purpose, every part and what it does, what flows in from and out to other rooms, and what it must never become.</p>${mapBody(mapFile)}</div>`,
            nav(i)
        ].join("\n");
        fs.mkdirSync(path.join(OUT, id), { recursive: true });
        fs.writeFileSync(path.join(OUT, id, "index.html"), page(`${label} — Antaeus walkthrough`, body));
        index.push({ id, label, stage, words: rest.length, reveals: reveals.length });
    }

    // 4. The index: the gate, the map of rooms, onboarding, how to read.
    const onbMap = mapBody(path.join(MAPS, "onboarding-capability-map-2026-07-07.html"));
    const idx = [
        `<h1>Antaeus — the full walkthrough of the preview</h1>`,
        `<p>This is a written copy of everything a visitor sees in the Antaeus preview: the sample workspace of Elena Vasquez, an enterprise account executive at Luca Industries (a fictional $100MM AI talent platform) selling to real household-name companies. The accounts, deals and history are sample data; every room, read and suggestion is the real product working on that data.</p>`,
        `<p>Antaeus is a sales operating system for founders and the first serious sales hire. It turns the work a founder is doing on revenue into a clear picture of what is actually happening, so the first hire can pick it up and run it without having anything re-explained.</p>`,
        `<h2>How to read this</h2><ol>`,
        `<li>Start with the gate below — the first screen a visitor sees.</li>`,
        `<li>Then go room by room in the order listed. The order follows the sales motion itself, from setting up who you sell to, through finding and working accounts, to advancing deals and handing the motion to a hire.</li>`,
        `<li>Each room page has three parts: every word on screen with how and where it is shown; what opens when you use its controls; and the room's purpose, parts and connections.</li>`,
        `<li>Each page links to the previous and next room, so you can read the whole app start to finish.</li></ol>`,
        `<p>The live app is at <code>/preview</code> on the same site, desktop browsers only.</p>`,
        `<h2>The gate — the first screen</h2>`,
        `<p>A visitor opens the preview link and sees this. Typing the code they were sent opens the sample workspace and lands them on the Dashboard. Phones and tablets get a "desktop only" message instead.</p>`,
        renderLines(gate),
        `<h2>The rooms, in order</h2>`,
        STAGES.map(
            (s, si) =>
                `<h3>${esc(s)}</h3><ol>` +
                index
                    .filter((r) => r.stage === si)
                    .map((r) => `<li><a href="${r.id}/">${esc(r.label)}</a></li>`)
                    .join("") +
                `</ol>`
        ).join("\n"),
        `<p><a href="${index[0].id}/">Start with ${esc(index[0].label)} →</a></p>`,
        `<h2>Moving between rooms — the Ground</h2>`,
        `<p>There is no menu bar. At the foot of every room sits a thin line with a small tab (the Antaeus mark). Clicking it, or pressing G, raises a map of every room laid out as the sales motion, with the current room highlighted and the system's suggested next room outlined in orange. This is what it says:</p>`,
        `<pre>${esc(ground)}</pre>`,
        `<h2>Onboarding — shown but locked in the preview</h2>`,
        `<p>Onboarding appears greyed out on the room map. Hovering it shows this:</p><blockquote>${esc(lockedWhy)}</blockquote>`,
        `<p>What onboarding is and does in the full product:</p><div class="map">${onbMap}</div>`
    ].join("\n");
    fs.writeFileSync(path.join(OUT, "index.html"), page("Antaeus — preview walkthrough", idx));

    await browser.close();
    server.close();
    console.log(`\nWrote ${index.length} rooms to preview-transcript/.`);
    if (errors.length) console.log("Page errors seen:", errors.slice(0, 5));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
