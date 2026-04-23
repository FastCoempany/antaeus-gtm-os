import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Test runner configuration.
 *
 * Scope for Phase 1.2: smoke tests only — verify that rooms load without
 * runtime errors. Per-room functional tests land in Phase 3+ as each room
 * migrates to Preact.
 *
 * The existing ad-hoc capture script at tools/qa/capture-demo-room.js
 * remains useful for interactive debugging and is not replaced by this
 * configuration.
 *
 * See deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6 Phase 1.2.
 */
export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "github" : "list",

    use: {
        baseURL: "http://127.0.0.1:4173",
        trace: "on-first-retry",
        screenshot: "only-on-failure"
    },

    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Puppeteer's Chrome is allowed through this environment's firewall;
                // Playwright's own chromium download is not. See README-LIKE comment
                // in tools/qa/capture-demo-room.js for the same pattern.
                launchOptions: {
                    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
                }
            }
        }
    ],

    webServer: {
        command: "python3 -m http.server 4173 --bind 127.0.0.1",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    }
});
