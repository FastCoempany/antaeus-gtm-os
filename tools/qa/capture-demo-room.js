"use strict";

var path = require("path");
var bootstrap = require("./demo-room-bootstrap");

function readArg(flag, fallbackValue) {
    var index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return fallbackValue;
    return process.argv[index + 1];
}

function hasFlag(flag) {
    return process.argv.indexOf(flag) !== -1;
}

async function main() {
    var playwright;
    try {
        playwright = require("playwright");
    } catch (error) {
        throw new Error("Playwright is required for QA capture. Install dependencies in this repo before running this script.");
    }

    var roomPath = readArg("--path", "/app/dashboard/");
    var screenshotPath = readArg("--screenshot", "");
    var scenario = readArg("--scenario", "mm");
    var baseUrl = readArg("--base-url", "http://127.0.0.1:4173");
    var width = Number(readArg("--width", "1440")) || 1440;
    var height = Number(readArg("--height", "1800")) || 1800;
    var headed = hasFlag("--headed");
    var qaMode = hasFlag("--qa");

    var browser = await playwright.chromium.launch({
        headless: !headed,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
    });
    var page = await browser.newPage({ viewport: { width: width, height: height } });

    try {
        var result = await bootstrap.bootstrapDemoRoom(page, {
            baseUrl: baseUrl,
            roomPath: roomPath,
            scenario: scenario,
            qaMode: qaMode
        });

        if (screenshotPath) {
            await page.screenshot({
                path: path.resolve(screenshotPath),
                fullPage: true
            });
        }

        process.stdout.write("Seed URL: " + result.seedUrl + "\n");
        process.stdout.write("Final URL: " + result.finalUrl + "\n");
        if (screenshotPath) {
            process.stdout.write("Screenshot: " + path.resolve(screenshotPath) + "\n");
        }
    } finally {
        await browser.close();
    }
}

main().catch(function (error) {
    process.stderr.write(String(error && error.stack ? error.stack : error) + "\n");
    process.exit(1);
});
