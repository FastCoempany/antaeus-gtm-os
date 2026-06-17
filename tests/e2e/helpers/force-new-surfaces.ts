import type { BrowserContext, Page } from "@playwright/test";

/**
 * Force the NEW design-system surfaces for a test, even under the
 * force-legacy e2e build (VITE_E2E_FORCE_LEGACY). The new-surface seam
 * walks navigate room-to-room by click, so a `?ds=1` URL param can't
 * follow them across navigations. Instead this sets a localStorage flag
 * via an init script that runs before every page load; `isFeatureEnabled`
 * honors `gtmos_e2e_force_new` and resolves every room's gate to the new
 * surface. Call it on the BrowserContext (or page) before navigating.
 *
 * Inert in production — the key is never set there.
 */
export async function forceNewSurfaces(
    target: BrowserContext | Page
): Promise<void> {
    await target.addInitScript(() => {
        try {
            window.sessionStorage.setItem("gtmos_e2e_force_new", "1");
        } catch {
            // localStorage unavailable — the gate falls through.
        }
    });
}
