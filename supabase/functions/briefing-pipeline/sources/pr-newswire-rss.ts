/**
 * PR Newswire personnel-announcement fetcher (B.1b).
 *
 * The Intelligence Coverage Audit §2.3 names PR Newswire personnel
 * announcements as "100% SNR" for Director+/C-suite/VP exec moves.
 * The audit lists two ways to access them:
 *   - Dedicated Personnel Announcements page (HTML parse, fragile)
 *   - General business RSS, filtered for personnel-shaped titles
 *
 * B.1b takes the second path. It's more robust (RSS is structurally
 * stable; the dedicated page changes layout periodically) at the
 * cost of pulling the broader business feed and discarding non-
 * personnel rows. The pre-filter (`isPersonnelTitle` from _shared)
 * matches conservatively — false negatives cost less than false
 * positives (which would route M&A or product-launch headlines as
 * exec moves).
 *
 * Reference: deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §2.3 + §3.1
 */

import { httpGet, isPersonnelTitle, parseRss } from "./_shared.ts";

interface RawItem {
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly data: Record<string, unknown>;
}

interface FetchResult {
    readonly items: ReadonlyArray<RawItem>;
    readonly error: string | null;
}

const SOURCE_ID = "pr_newswire_personnel";
const FEED_URL = "https://www.prnewswire.com/rss/news-releases-list.rss";

export const prNewswireSource = {
    id: SOURCE_ID,
    fetch: async (): Promise<FetchResult> => {
        const result = await httpGet(FEED_URL, {
            Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
        });
        if (!result.ok) {
            return {
                items: [],
                error: result.error ?? `HTTP ${result.status}`
            };
        }
        const entries = parseRss(result.text);
        const personnel = entries.filter((entry) => isPersonnelTitle(entry.title));
        const items = personnel.map((entry) => ({
            source_id: SOURCE_ID,
            external_id: `prn_${entry.external_id}`,
            title: entry.title,
            body: entry.summary,
            url: entry.link,
            published_date: entry.published_date,
            data: {
                feed: "general-business",
                pre_filter: "personnel",
                feed_external_id: entry.external_id
            }
        }));
        return { items, error: null };
    }
};
