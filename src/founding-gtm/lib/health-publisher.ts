import { effect } from "@preact/signals";
import type { AuthoredSection, FoundingGtmHealth } from "./types";
import { authoredSections } from "../state";
import { countReady } from "./sections";
import { trackEvent } from "@/lib/observability";

/**
 * Section-readiness publisher.
 *
 * Writes the live FoundingGtmHealth snapshot to localStorage on every
 * authoredSections change. The Phase 5.A readiness aggregator
 * (PR #47, src/dashboard/lib/readiness-aggregator.ts) already reads
 * this exact key — so the moment both PRs land, the readiness
 * `proof` dimension and the §4.17 "Hire-ready, repeatable" gate
 * automatically pick up the section-readiness count from this room.
 *
 * Cross-bundle communication is localStorage during the transitional
 * phase (same pattern as the dashboard snapshot aggregator).
 *
 * Idempotent — first-run skip prevents a redundant write on cold boot
 * before the cross-room readers have populated.
 */

export const FOUNDING_GTM_HEALTH_KEY = "gtmos_founding_gtm_health";

interface StorageLike {
    setItem(key: string, value: string): void;
}

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

/** Pure — turn the live sections into a publishable snapshot. */
export function buildHealthSnapshot(
    sections: ReadonlyArray<AuthoredSection>,
    nowIso: string = new Date().toISOString()
): FoundingGtmHealth {
    const counts = countReady(sections);
    return {
        sections_ready: counts.ready,
        sections_partial: counts.partial,
        captured_at: nowIso
    };
}

export interface HealthPublisherOptions {
    readonly storage?: StorageLike;
    /** Test injection — override the now() clock. */
    readonly now?: () => string;
    /** Test hook fired on every publish (after write). */
    readonly onPublish?: (snapshot: FoundingGtmHealth) => void;
}

/**
 * Wire the publish effect. Returns a stop() handle so tests can
 * tear it down.
 */
export function startHealthPublishing(
    options: HealthPublisherOptions = {}
): () => void {
    const storage = options.storage ?? safeStorage();
    const now = options.now ?? (() => new Date().toISOString());
    let isFirstRun = true;
    let lastWrittenJson = "";

    const dispose = effect(() => {
        const sections = authoredSections.value;
        if (isFirstRun) {
            isFirstRun = false;
            // Skip the first run — the cross-room reader hasn't
            // finished hydrating yet on cold boot, so the count
            // would always be 0/0.
            return;
        }

        const snapshot = buildHealthSnapshot(sections, now());
        const json = JSON.stringify(snapshot);

        // Idempotent — don't re-write if the section count is
        // unchanged (only `captured_at` would differ, which would
        // spam storage events without informing any consumer).
        const stableJson = JSON.stringify({
            sections_ready: snapshot.sections_ready,
            sections_partial: snapshot.sections_partial
        });
        if (stableJson === lastWrittenJson) return;
        lastWrittenJson = stableJson;

        if (storage) {
            try {
                storage.setItem(FOUNDING_GTM_HEALTH_KEY, json);
            } catch {
                // ignore quota / disabled storage
            }
        }

        trackEvent("founding_gtm_health_published", {
            sections_ready: snapshot.sections_ready,
            sections_partial: snapshot.sections_partial
        });
        if (options.onPublish) options.onPublish(snapshot);
    });

    return dispose;
}
