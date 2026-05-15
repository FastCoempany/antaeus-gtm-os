"use strict";

/**
 * Capture screenshots of every canon room.
 *
 * Per the post-beta backlog: "Phase 6's visual review was AI-graded
 * text-based. A founder render-pass against actual screenshots would
 * be the highest-fidelity final gate. Tooling exists in
 * `tools/qa/capture-demo-room.js`; running it for all 21 rooms across
 * primary states is automatable."
 *
 * This script wraps capture-demo-room.js and runs it once per canon
 * room, dumping all screenshots into a single output directory. CI
 * uploads the directory as a workflow artifact so the founder (or
 * reviewer) can download the full set in one zip.
 *
 * Usage:
 *
 *   node tools/qa/capture-all-rooms.js \
 *     --output ./screenshots \
 *     --base-url http://127.0.0.1:4173 \
 *     --scenario mm
 *
 * Defaults to the mm (mid-market) scenario at the standard demo
 * server URL. Outputs `<room-slug>.png` per room.
 */

var path = require("path");
var fs = require("fs");
var bootstrap = require("./demo-room-bootstrap");

function readArg(flag, fallbackValue) {
    var index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return fallbackValue;
    return process.argv[index + 1];
}

function hasFlag(flag) {
    return process.argv.indexOf(flag) !== -1;
}

// Every canon room that ships as a route. Readiness Score is
// intentionally excluded — it's an overlay drawer mounted on the
// Dashboard topbar, not a standalone route (canon §4.17).
var ROOMS = [
    { slug: "welcome",             path: "/welcome/" },
    { slug: "onboarding",          path: "/onboarding/" },
    { slug: "dashboard",           path: "/dashboard/" },
    { slug: "icp-studio",          path: "/icp-studio/" },
    { slug: "territory-architect", path: "/territory-architect/" },
    { slug: "sourcing-workbench",  path: "/sourcing-workbench/" },
    { slug: "signal-console",      path: "/signal-console/" },
    { slug: "outbound-studio",     path: "/outbound-studio/" },
    { slug: "cold-call-studio",    path: "/cold-call-studio/" },
    { slug: "linkedin-playbook",   path: "/linkedin-playbook/" },
    { slug: "call-planner",        path: "/call-planner/" },
    { slug: "discovery-studio",    path: "/discovery-studio/" },
    { slug: "deal-workspace",      path: "/deal-workspace/" },
    { slug: "future-autopsy",      path: "/future-autopsy/" },
    { slug: "poc-framework",       path: "/poc-framework/" },
    { slug: "advisor-deploy",      path: "/advisor-deploy/" },
    { slug: "negotiation",         path: "/negotiation/" },
    { slug: "founding-gtm",        path: "/founding-gtm/" },
    { slug: "quota-workback",      path: "/quota-workback/" },
    { slug: "settings",            path: "/settings/" }
];

async function captureOne(playwright, options) {
    var browser = await playwright.chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
    });
    var page = await browser.newPage({
        viewport: { width: options.width, height: options.height }
    });
    try {
        await bootstrap.bootstrapDemoRoom(page, {
            baseUrl: options.baseUrl,
            roomPath: options.roomPath,
            scenario: options.scenario,
            qaMode: true
        });
        await page.screenshot({
            path: options.screenshotPath,
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

async function main() {
    var playwright;
    try {
        playwright = require("playwright");
    } catch (error) {
        throw new Error(
            "Playwright is required. Install dependencies before running this script."
        );
    }

    var outputDir = path.resolve(readArg("--output", "./screenshots"));
    var baseUrl = readArg("--base-url", "http://127.0.0.1:4173");
    var scenario = readArg("--scenario", "mm");
    var width = Number(readArg("--width", "1440")) || 1440;
    var height = Number(readArg("--height", "1800")) || 1800;
    var only = readArg("--only", ""); // comma-separated slugs

    fs.mkdirSync(outputDir, { recursive: true });

    var rooms = ROOMS;
    if (only) {
        var allowed = only.split(",").map(function (s) { return s.trim(); });
        rooms = ROOMS.filter(function (r) { return allowed.indexOf(r.slug) !== -1; });
    }

    process.stdout.write(
        "Capturing " + rooms.length + " room(s) at " + baseUrl + " (scenario=" + scenario + ")\n"
    );
    process.stdout.write("Output: " + outputDir + "\n\n");

    var results = [];
    var startedAt = Date.now();

    for (var i = 0; i < rooms.length; i += 1) {
        var room = rooms[i];
        var screenshotPath = path.join(outputDir, room.slug + ".png");
        var roomStart = Date.now();
        try {
            await captureOne(playwright, {
                baseUrl: baseUrl,
                roomPath: room.path,
                scenario: scenario,
                width: width,
                height: height,
                screenshotPath: screenshotPath
            });
            var dur = ((Date.now() - roomStart) / 1000).toFixed(1);
            process.stdout.write("  ✓ " + room.slug + " (" + dur + "s)\n");
            results.push({ slug: room.slug, status: "ok", durationSec: Number(dur) });
        } catch (err) {
            var msg = err && err.message ? err.message : String(err);
            process.stderr.write("  ✗ " + room.slug + " — " + msg + "\n");
            results.push({ slug: room.slug, status: "failed", error: msg });
        }
    }

    var totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    var ok = results.filter(function (r) { return r.status === "ok"; }).length;
    var failed = results.length - ok;

    process.stdout.write(
        "\nDone in " + totalSec + "s. " + ok + " ok, " + failed + " failed.\n"
    );

    // Write a manifest so CI / reviewers can see what ran without
    // opening every file.
    var manifestPath = path.join(outputDir, "manifest.json");
    fs.writeFileSync(
        manifestPath,
        JSON.stringify(
            {
                capturedAt: new Date().toISOString(),
                baseUrl: baseUrl,
                scenario: scenario,
                width: width,
                height: height,
                totalSec: Number(totalSec),
                rooms: results
            },
            null,
            2
        )
    );
    process.stdout.write("Manifest: " + manifestPath + "\n");

    if (failed > 0) process.exit(1);
}

main().catch(function (error) {
    process.stderr.write(
        String(error && error.stack ? error.stack : error) + "\n"
    );
    process.exit(1);
});
