import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    rmSync,
    statSync
} from "fs";

/**
 * Vite configuration for Antaeus GTM OS.
 *
 * Phase 1 (foundation): no rooms migrated yet; Vite is installed and
 * configured, but the existing static app under /app/<room>/index.html
 * is untouched and continues to work via the current deploy pipeline
 * (tools/deploy/build-cloudflare-assets.js).
 *
 * Phase 3+: as each room migrates, its entry point is added to
 * rollupOptions.input below. The room's index.html remains in place
 * but switches its <script> tag to a module pointing at src/rooms/<room>/.
 *
 * See deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md
 * for the full architecture rationale and migration plan.
 */

/**
 * Rewrites Vite's HTML output path so pages declared under src/<dir>/index.html
 * emerge at dist/<dir>/index.html — dropping the src/ prefix that Vite
 * preserves by default.
 *
 * Why: Vite multi-page entries preserve source structure, so an input at
 * `src/migration/index.html` lands at `dist/src/migration/index.html`.
 * On a static host that serves `dist/` as the public root, that URL becomes
 * `/src/migration/` which is ugly and leaks the repo layout.
 *
 * This plugin runs after Vite finishes emitting, copies each HTML file out
 * from `dist/src/<dir>/index.html` to `dist/<dir>/index.html`, then deletes
 * the now-empty `dist/src/` tree. Assets under `dist/assets/` are untouched;
 * the HTML's <script> + <link> tags already reference absolute /assets/ paths.
 */
function flattenSrcPages(): Plugin {
    return {
        name: "antaeus-flatten-src-pages",
        apply: "build",
        closeBundle() {
            const distSrc = resolve(__dirname, "dist/src");
            if (!existsSync(distSrc)) return;

            walkHtml(distSrc, (srcPath) => {
                const relFromSrc = srcPath.slice(distSrc.length + 1);
                const destPath = resolve(__dirname, "dist", relFromSrc);
                mkdirSync(resolve(destPath, ".."), { recursive: true });
                copyFileSync(srcPath, destPath);
            });

            rmSync(distSrc, { recursive: true, force: true });
        }
    };
}

function walkHtml(dir: string, visit: (htmlPath: string) => void): void {
    for (const entry of readdirSync(dir)) {
        const full = resolve(dir, entry);
        if (statSync(full).isDirectory()) {
            walkHtml(full, visit);
        } else if (entry.endsWith(".html")) {
            visit(full);
        }
    }
}

export default defineConfig({
    plugins: [preact(), flattenSrcPages()],

    root: ".",

    resolve: {
        alias: {
            "@": resolve(__dirname, "src")
        }
    },

    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                // Migrated room entry points land here over the course of Phase 3+.
                // For Phase 1 foundation, we build a placeholder entry so `vite build`
                // succeeds and CI can exercise the pipeline.
                phase1: resolve(__dirname, "src/phase1-placeholder.ts"),

                // Phase 2.3 — data migration tool. Served at /data-migration/
                // in both dev (via the src/data-migration/index.html entry) and
                // prod (flattenSrcPages plugin rewrites dist/src/data-migration/
                // → dist/data-migration/ after build).
                "data-migration": resolve(__dirname, "src/data-migration/index.html"),

                // Phase 3 Wave 1 — Discovery Studio Preact rebuild. Served at
                // /discovery-studio/ via the same flattenSrcPages plugin.
                // Behind Posthog feature flag `room_discovery_v2`; legacy
                // `app/discovery-studio/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "discovery-studio": resolve(
                    __dirname,
                    "src/discovery-studio/index.html"
                ),

                // Phase 4 / Room 1 — Deal Workspace Preact rebuild. Served
                // at /deal-workspace/ via the same flattenSrcPages plugin.
                // Behind Posthog feature flag `room_deal_workspace_v2`;
                // legacy `app/deal-workspace/index.html` redirects here when
                // on.
                "deal-workspace": resolve(
                    __dirname,
                    "src/deal-workspace/index.html"
                ),

                // Phase 4 / Room 2 — Dashboard Preact rebuild. Served at
                // /dashboard/. Behind Posthog feature flag
                // `room_dashboard_v2`; legacy `app/dashboard/index.html`
                // redirects here when on (Wave 6 wires the redirect script).
                dashboard: resolve(__dirname, "src/dashboard/index.html")
            }
        }
    },

    server: {
        port: 4173,
        host: "127.0.0.1",
        strictPort: true
    },

    preview: {
        port: 4173,
        host: "127.0.0.1",
        strictPort: true
    }
});
