import { render } from "preact";
import { DataMigrationPage } from "./DataMigrationPage";
import { initObservability } from "@/lib/observability";

/**
 * Entry point for the data-migration Preact page.
 *
 * Served at /data-migration/ in both dev and prod. Mounts DataMigrationPage
 * into #app after Observability boot so reportError/trackEvent reach Sentry
 * + Posthog.
 */
initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Migration page could not mount: #app root element missing from index.html"
    );
}

render(<DataMigrationPage />, root);
