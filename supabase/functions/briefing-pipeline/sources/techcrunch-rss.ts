/**
 * TechCrunch RSS fetcher (B.1b).
 *
 * Pulls the TechCrunch funding-tag feed (firehose `/feed` is 30+
 * posts/day — too noisy without per-workspace pre-filtering;
 * `/tag/funding/feed` runs ~5-15/day with high signal for B2B SaaS
 * funding rounds and M&A coverage). The full Intelligence Coverage
 * Audit §3.1 ranks this 13/15 (tier S).
 *
 * Why a single category feed and not multiple: B.1b ships one
 * canonical TC source. If a workspace needs the AI / enterprise /
 * venture sub-feeds, a follow-up PR can register them as siblings.
 * Starting narrow avoids the "wait, why are there ten TC sources"
 * problem.
 *
 * No workspace-specific filtering at fetch time — every workspace
 * gets the same feed. The Recipe Layer's Stage 3.2 Filter applies
 * the off-category rejection rules per workspace (per ICP).
 *
 * Reference: deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §3.1
 */

import { httpGet, parseRss } from "./_shared.ts";

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

const SOURCE_ID = "techcrunch_rss";
const FEED_URL = "https://techcrunch.com/tag/funding/feed/";

export const techcrunchRssSource = {
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
        const items = entries.map((entry) => ({
            source_id: SOURCE_ID,
            external_id: `tc_${entry.external_id}`,
            title: entry.title,
            body: entry.summary,
            url: entry.link,
            published_date: entry.published_date,
            data: {
                feed: "tag/funding",
                feed_external_id: entry.external_id
            }
        }));
        return { items, error: null };
    }
};
