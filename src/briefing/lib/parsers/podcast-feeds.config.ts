/**
 * Curated podcast feeds for the Podcast-Guest source (Family 2).
 *
 * Starter seed of widely-known B2B SaaS / GTM / HR-tech podcasts where
 * executives at the kinds of companies the operator watches tend to
 * show up as guests. The Deno fetcher iterates this list each run,
 * scans recent episodes for watched-entity mentions, and emits raw
 * items for matches.
 *
 * URLs are best-effort canonical RSS endpoints. Podcast hosts change
 * sometimes; broken feeds skip cleanly at fetch time (no items
 * returned, logged, run continues). The operator can swap URLs by
 * editing this file. A future PR moves this list to a workspace-
 * editable table (briefing_podcast_subscriptions).
 *
 * The Deno mirror at supabase/functions/briefing-pipeline/sources/
 * podcast-feeds.config.ts keeps a verbatim copy.
 */

export interface PodcastFeedConfig {
    readonly id: string;
    readonly name: string;
    readonly rss_url: string;
    readonly category: "saas" | "gtm" | "hr_tech" | "vc" | "deep_dive";
}

export const PODCAST_FEEDS: ReadonlyArray<PodcastFeedConfig> = [
    {
        id: "saastr",
        name: "SaaStr Podcast",
        rss_url: "https://saastr.libsyn.com/rss",
        category: "saas"
    },
    {
        id: "acquired",
        name: "Acquired",
        rss_url: "https://feeds.transistor.fm/acquired",
        category: "deep_dive"
    },
    {
        id: "lenny",
        name: "Lenny's Podcast",
        rss_url: "https://api.substack.com/feed/podcast/10845.rss",
        category: "saas"
    },
    {
        id: "all_in",
        name: "All-In Podcast",
        rss_url: "https://allinchamathjason.libsyn.com/rss",
        category: "vc"
    },
    {
        id: "twenty_vc",
        name: "The Twenty Minute VC",
        rss_url: "https://feeds.megaphone.fm/HS4291963813",
        category: "vc"
    },
    {
        id: "pavilion",
        name: "Pavilion Podcast",
        rss_url: "https://feeds.buzzsprout.com/1789508.rss",
        category: "gtm"
    },
    {
        id: "hr_brew",
        name: "HR Brew Daily",
        rss_url: "https://feeds.megaphone.fm/MBN5466093234",
        category: "hr_tech"
    },
    {
        id: "recruiting_future",
        name: "Recruiting Future",
        rss_url: "https://feeds.captivate.fm/recruiting-future/",
        category: "hr_tech"
    }
] as const;
