import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

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
export default defineConfig({
    plugins: [preact()],

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
                // in dev (via src/migration/index.html) and under
                // dist/src/migration/ in prod. The Cloudflare build rewrites
                // the path to /data-migration/ as a top-level route — see
                // tools/deploy/build-cloudflare-assets.js when Phase 2.4 lands.
                migration: resolve(__dirname, "src/migration/index.html")
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
