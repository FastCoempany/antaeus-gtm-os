/**
 * Source registry (B.1b).
 *
 * The set of fetchers Stage 3.1 Ingest dispatches every pipeline
 * run. Each fetcher conforms to the SourceFetcher interface defined
 * in the orchestrator (../index.ts) — synchronous register, async
 * `fetch(ctx, now): Promise<RawItem[]>`, side-effect-free.
 *
 * Five live in B.1b. The sixth (HTML diff, the page-snapshot source)
 * ships in a B.1c follow-up — it needs a schema decision about where
 * to store prior snapshots (new table? Wayback Machine as external
 * store?) that's out of B.1b's scope.
 *
 * Active sources:
 *   - hn_algolia            — HN search per workspace query terms
 *   - techcrunch_rss        — TC funding/M&A category feed (firehose-light)
 *   - pr_newswire_personnel — PR Newswire business RSS, personnel-filtered
 *   - wikipedia_pageviews   — daily pageviews per watchlist article
 *   - github_releases_atom  — release feed per watched repo
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

import { hnAlgoliaSource } from "./hn-algolia.ts";
import { techcrunchRssSource } from "./techcrunch-rss.ts";
import { prNewswireSource } from "./pr-newswire-rss.ts";
import { wikipediaPageviewsSource } from "./wikipedia-pageviews.ts";
import { githubReleasesAtomSource } from "./github-releases-atom.ts";

export const ALL_SOURCES = [
    hnAlgoliaSource,
    techcrunchRssSource,
    prNewswireSource,
    wikipediaPageviewsSource,
    githubReleasesAtomSource
] as const;
