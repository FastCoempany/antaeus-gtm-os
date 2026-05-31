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
                dashboard: resolve(__dirname, "src/dashboard/index.html"),

                // Phase 4 / Room 3 — Signal Console Preact rebuild. Served
                // at /signal-console/. Behind Posthog feature flag
                // `room_signal_console_v2`; legacy
                // `app/signal-console/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "signal-console": resolve(
                    __dirname,
                    "src/signal-console/index.html"
                ),

                // Phase 4 / Room 4 — Future Autopsy Preact rebuild. Served
                // at /future-autopsy/. Behind Posthog feature flag
                // `room_future_autopsy_v2`; legacy
                // `app/future-autopsy/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "future-autopsy": resolve(
                    __dirname,
                    "src/future-autopsy/index.html"
                ),

                // Phase 4 / Room 5 — PoC Framework Preact rebuild. Served
                // at /poc-framework/. Behind Posthog feature flag
                // `room_poc_framework_v2`; legacy
                // `app/poc-framework/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "poc-framework": resolve(
                    __dirname,
                    "src/poc-framework/index.html"
                ),

                // Phase 4 / Room 6 — Outbound Studio Preact rebuild.
                // Served at /outbound-studio/. Behind Posthog feature flag
                // `room_outbound_studio_v2`; legacy
                // `app/outbound-studio/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "outbound-studio": resolve(
                    __dirname,
                    "src/outbound-studio/index.html"
                ),

                // Phase 4 / Room 7 — Cold Call Studio Preact rebuild.
                // Served at /cold-call-studio/. Behind Posthog feature flag
                // `room_cold_call_v2`; legacy
                // `app/cold-call-studio/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "cold-call-studio": resolve(
                    __dirname,
                    "src/cold-call-studio/index.html"
                ),

                // Phase 4 / Room 8 — LinkedIn Playbook Preact rebuild.
                // Served at /linkedin-playbook/. Behind Posthog feature flag
                // `room_linkedin_playbook_v2`; legacy
                // `app/linkedin-playbook/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "linkedin-playbook": resolve(
                    __dirname,
                    "src/linkedin-playbook/index.html"
                ),

                // Phase 4 / Room 9 — Call Planner Preact rebuild. Served at
                // /call-planner/. Behind Posthog feature flag
                // `room_call_planner_v2`; legacy
                // `app/discovery-agenda/index.html` (note: legacy path
                // differs from the canonical room name per canon §4.11)
                // redirects here when on (Wave 6 wires the redirect script).
                "call-planner": resolve(
                    __dirname,
                    "src/call-planner/index.html"
                ),

                // Phase 4 / Room 10 — Advisor Deploy Preact rebuild.
                // Served at /advisor-deploy/. Behind Posthog feature flag
                // `room_advisor_deploy_v2`; legacy
                // `app/advisor-deploy/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "advisor-deploy": resolve(
                    __dirname,
                    "src/advisor-deploy/index.html"
                ),

                // Phase 4 / Room 11 — ICP Studio Preact rebuild.
                // Served at /icp-studio/. Behind Posthog feature flag
                // `room_icp_studio_v2`; legacy
                // `app/icp-studio/index.html` redirects here when on
                // (Wave 6 wires the redirect script).
                "icp-studio": resolve(
                    __dirname,
                    "src/icp-studio/index.html"
                ),

                // Phase 4 / Room 12 — Territory Architect Preact rebuild.
                // Served at /territory-architect/. Behind Posthog flag
                // `room_territory_architect_v2`; legacy
                // `app/territory-architect/index.html` redirects here.
                "territory-architect": resolve(
                    __dirname,
                    "src/territory-architect/index.html"
                ),

                // Phase 4 / Room 13 — Sourcing Workbench Preact rebuild.
                // Served at /sourcing-workbench/. Behind Posthog feature
                // flag `room_sourcing_workbench_v2`; legacy
                // `app/sourcing-workbench/index.html` redirects here when
                // on.
                "sourcing-workbench": resolve(
                    __dirname,
                    "src/sourcing-workbench/index.html"
                ),

                // Phase 4 / Room 14 — Quota Workback Preact rebuild.
                // Served at /quota-workback/. Behind Posthog feature flag
                // `room_quota_workback_v2`; legacy
                // `app/quota-workback/index.html` redirects here when on.
                "quota-workback": resolve(
                    __dirname,
                    "src/quota-workback/index.html"
                ),

                // Phase 4 / Room 15 — Settings Preact rebuild. Served at
                // /settings/. Behind Posthog feature flag
                // `room_settings_v2`; legacy `app/settings/index.html`
                // redirects here when on.
                settings: resolve(__dirname, "src/settings/index.html"),

                // Phase 4 / Room 16 — Welcome Preact rebuild. Served at
                // /welcome/. Behind Posthog feature flag
                // `room_welcome_v2`; legacy `app/welcome/index.html`
                // redirects here when on.
                welcome: resolve(__dirname, "src/welcome/index.html"),

                // Phase 4 / Room 17 — Onboarding Preact rebuild (greenfield;
                // not a port). Served at /onboarding/. Behind Posthog
                // feature flag `room_onboarding_v2`; legacy
                // `app/onboarding/index.html` redirects here when on.
                onboarding: resolve(__dirname, "src/onboarding/index.html"),

                // Phase 5.B — Founding GTM rebuild (greenfield; not a
                // port — the legacy room was an aggregator, the rebuild
                // is authored opinion + cross-room synthesis per canon
                // §4.19). Served at /founding-gtm/. Behind Posthog
                // feature flag `room_founding_gtm_v2`; legacy
                // `app/founding-gtm/index.html` redirects here when on.
                "founding-gtm": resolve(__dirname, "src/founding-gtm/index.html"),

                // Founding GTM share-link mechanic (canon §4.19) —
                // anonymous read-mode entry point served at
                // /founding-gtm-share/. The route reads the token from
                // its URL search param, resolves the snapshot via the
                // SECURITY DEFINER resolve_founding_gtm_share RPC, and
                // renders the seven sections frozen at link-creation
                // time. No auth, no writable controls.
                "founding-gtm-share": resolve(
                    __dirname,
                    "src/founding-gtm-share/index.html"
                ),

                // Phase 3 of ADR-003 — Negotiation rebuild (greenfield
                // from canon §4.16b placeholder). Served at /negotiation/.
                // Behind Posthog flag `room_negotiation_v2`. Carries
                // forward procurement + finance scripts seeded from the
                // legacy `antaeus_studio_cfo_v2` localStorage shape
                // retired in the architecture-reset.
                negotiation: resolve(__dirname, "src/negotiation/index.html"),

                // Briefing B.0b — intelligence surface scaffold per canon
                // §4.21 + ADR-006. Served at /briefing/. Behind Posthog
                // feature flag `room_briefing_v2`; no legacy room to
                // redirect from (the existing /signal-console/ stays in
                // place as the data substrate per ADR-006 path C — the
                // Briefing reads from it, not the other way around).
                // B.0b ships the structural shell only; B.1+ wires the
                // Recipe Layer pipeline that produces Patterns.
                briefing: resolve(__dirname, "src/briefing/index.html")
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
