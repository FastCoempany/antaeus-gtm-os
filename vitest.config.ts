import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { resolve } from "path";

/**
 * Vitest configuration for Antaeus GTM OS.
 *
 * Uses happy-dom for a lightweight browser-like environment (faster than jsdom
 * for our typical component + hook tests). Preact is supported via the same
 * plugin used by Vite's build.
 *
 * Test files live under src/ alongside the code they test, using the
 * .test.ts or .test.tsx suffix.
 */
export default defineConfig({
    plugins: [preact()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src")
        }
    },
    test: {
        environment: "happy-dom",
        globals: true,
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        setupFiles: ["src/test-setup.ts"]
    }
});
