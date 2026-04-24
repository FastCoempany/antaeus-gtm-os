const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");

/**
 * Antaeus CF Workers Builds deploy script.
 *
 * Two-layer output under dist/:
 *   1. Vite builds the new-stack entries (Phase 2+) — emits dist/assets/ and
 *      dist/<entry>/index.html (e.g. dist/data-migration/index.html after the
 *      flattenSrcPages plugin runs).
 *   2. This script copies the legacy static app (app/, auth/, css/, js/, the
 *      top-level html pages) on top of Vite's output, WITHOUT wiping dist/
 *      first — so the two worlds coexist until every room has migrated
 *      (Phase 3–5).
 *
 * Order matters: vite runs FIRST (it handles its own dist cleanup via
 * `emptyOutDir: true` in vite.config.ts), then legacy files layer on top.
 * Path collisions are avoided because Vite emits to /assets/ and named
 * new-stack entry dirs, while legacy emits to /app/, /auth/, /css/, /js/.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.4
 */

const include = [
  "app",
  "auth",
  "css",
  "js",
  "login.html",
  "signup.html",
  "demo-seed.html"
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// 1. Build Vite entries first. `vite build` wipes dist/ itself (emptyOutDir:
//    true), so we don't need to pre-clean — and we MUST NOT pre-clean after
//    this point, or we'd lose Vite's output.
console.log("Running vite build…");
execSync("npx vite build", { stdio: "inherit" });

// 2. Copy legacy static files on top of Vite's output.
console.log("Layering legacy static assets onto dist/…");
for (const item of include) {
  copyRecursive(path.join(root, item), path.join(dist, item));
}

// 3. Root index.html = the legacy welcome redirect. If Vite ever emits a root
//    index.html for a new-stack entry, that collision would need to be
//    resolved explicitly — but no current entry does.
const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/app/welcome/" />
    <title>Antaeus GTM OS</title>
  </head>
  <body>
    <a href="/app/welcome/">Open Antaeus GTM OS</a>
  </body>
</html>
`;

fs.writeFileSync(path.join(dist, "index.html"), indexHtml);
console.log(`Built combined Vite + legacy assets into ${dist}`);
