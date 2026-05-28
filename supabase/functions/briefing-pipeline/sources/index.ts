/**
 * Source registry (B.1c).
 *
 * The set of fetchers Stage 3.1 Ingest dispatches every pipeline
 * run. Each fetcher conforms to the SourceFetcher interface defined
 * in the orchestrator (../index.ts) — synchronous register, async
 * `fetch(ctx, now, sb?): Promise<FetchResult>`, side-effect-free
 * except for the stateful fetchers that use the optional sb arg to
 * read/write their own state tables (HTML diff is the only one
 * today).
 *
 * All six active:
 *   - hn_algolia            — HN search per workspace query terms
 *   - techcrunch_rss        — TC funding/M&A category feed (firehose-light)
 *   - pr_newswire_personnel — PR Newswire business RSS, personnel-filtered
 *   - wikipedia_pageviews   — daily pageviews per watchlist article
 *   - github_releases_atom  — release feed per watched repo
 *   - html_diff             — per-URL page snapshot + change detection
 *
 * Adding a source: write a file under this directory, import + export
 * its `Source` here. The orchestrator picks it up automatically.
 *
 * Removing a source: delete the file + remove the export. No other
 * wiring needed.
 */

export { hnAlgoliaSource } from "./hn-algolia.ts";
export { techcrunchRssSource } from "./techcrunch-rss.ts";
export { prNewswireSource } from "./pr-newswire-rss.ts";
export { wikipediaPageviewsSource } from "./wikipedia-pageviews.ts";
export { githubReleasesAtomSource } from "./github-releases-atom.ts";
export { htmlDiffSource } from "./html-diff.ts";
export { signalConsoleSource } from "./signal-console.ts";
export { ownedContentRssSource } from "./owned-content-rss.ts";
export { podcastGuestsSource } from "./podcast-guests.ts";
export { trustCenterSource } from "./trust-center.ts";

import { hnAlgoliaSource } from "./hn-algolia.ts";
import { techcrunchRssSource } from "./techcrunch-rss.ts";
import { prNewswireSource } from "./pr-newswire-rss.ts";
import { wikipediaPageviewsSource } from "./wikipedia-pageviews.ts";
import { githubReleasesAtomSource } from "./github-releases-atom.ts";
import { htmlDiffSource } from "./html-diff.ts";
import { signalConsoleSource } from "./signal-console.ts";
import { ownedContentRssSource } from "./owned-content-rss.ts";
import { podcastGuestsSource } from "./podcast-guests.ts";
import { trustCenterSource } from "./trust-center.ts";

export const ALL_SOURCES = [
    hnAlgoliaSource,
    techcrunchRssSource,
    prNewswireSource,
    wikipediaPageviewsSource,
    githubReleasesAtomSource,
    htmlDiffSource,
    signalConsoleSource,
    ownedContentRssSource,
    podcastGuestsSource,
    trustCenterSource
] as const;
