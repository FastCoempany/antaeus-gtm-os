"use strict";

function normalizeBaseUrl(baseUrl) {
    return String(baseUrl || "http://127.0.0.1:4173").replace(/\/+$/, "");
}

function normalizeRoomPath(roomPath) {
    var next = String(roomPath || "/app/dashboard/").trim();
    if (!next) next = "/app/dashboard/";
    if (!next.startsWith("/")) next = "/" + next;
    return next;
}

function withDemoParam(roomPath, qaMode) {
    var normalized = normalizeRoomPath(roomPath);
    var url = new URL(normalized, "http://antaeus.local");
    url.searchParams.set("demo", "1");
    if (qaMode) url.searchParams.set("qa", "1");
    return url.pathname + url.search + url.hash;
}

function buildSeedUrl(options) {
    options = options || {};
    var scenario = String(options.scenario || "mm").toLowerCase() === "ent" ? "ent" : "mm";
    var baseUrl = normalizeBaseUrl(options.baseUrl);
    var returnPath = withDemoParam(options.roomPath || "/app/dashboard/", !!options.qaMode);
    var seedUrl = new URL("/demo-seed.html", baseUrl);
    seedUrl.searchParams.set("demo", "1");
    seedUrl.searchParams.set("autoseed", scenario);
    seedUrl.searchParams.set("return", returnPath);
    return {
        scenario: scenario,
        baseUrl: baseUrl,
        returnPath: returnPath,
        seedUrl: seedUrl.toString()
    };
}

async function bootstrapDemoRoom(page, options) {
    var build = buildSeedUrl(options);
    await page.goto(build.seedUrl, { waitUntil: "domcontentloaded" });
    await page.waitForURL(function (value) {
        return value.toString().indexOf(build.returnPath) !== -1;
    }, { timeout: options && options.timeoutMs ? options.timeoutMs : 20000 });
    await page.waitForLoadState("networkidle");

    var finalUrl = page.url();
    if (finalUrl.indexOf("/app/onboarding/") !== -1 || finalUrl.indexOf("/login.html") !== -1) {
        throw new Error("Demo bootstrap failed: landed on gated route instead of requested room (" + finalUrl + ")");
    }

    return {
        scenario: build.scenario,
        seedUrl: build.seedUrl,
        returnPath: build.returnPath,
        finalUrl: finalUrl
    };
}

module.exports = {
    buildSeedUrl: buildSeedUrl,
    bootstrapDemoRoom: bootstrapDemoRoom
};
