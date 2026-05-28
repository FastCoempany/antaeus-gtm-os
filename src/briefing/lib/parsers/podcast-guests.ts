/**
 * Podcast guest appearances — pure helpers (Family 2 of the source
 * expansion track).
 *
 * The Briefing benefits from person-level material — when an
 * executive at a target company appears on someone else's podcast,
 * that's a 45-minute soundbite of their stated POV. Show notes
 * usually name the guest + their company, and podcast RSS feeds are
 * a stable, structured format every podcast platform publishes.
 *
 * What this source does: for a curated list of industry-relevant
 * podcasts, fetch each one's RSS feed, scan recent episodes for
 * mentions of any entity the operator watches. When a match hits,
 * emit a raw item attributing the episode to that watched entity.
 *
 * This module is the pure logic (entity matching, guest-name
 * heuristics, cleaning gate). The Deno fetcher mirrors these +
 * adds the network layer.
 */

// Podcast item bodies tend to be shorter than blog posts (show notes
// vary widely); 60 chars is enough to be substantive without the
// 120-char floor we use for owned-content blogs.
export const PODCAST_MIN_BODY_LENGTH = 60;

// Cap per podcast per run so one extremely active show doesn't drown
// out the others.
export const PER_PODCAST_ITEM_CAP = 3;

/**
 * The minimal watched-entity shape the matcher reads. The pipeline
 * already loads these from briefing_watchlist_entities +
 * signal_console_accounts; the matcher doesn't care where they came
 * from.
 */
export interface WatchedEntityRef {
    /** Display name (e.g. "Atlas HXM"). */
    readonly name: string;
    /** Optional alternate names ("Atlas", "Atlas Inc"). */
    readonly aliases: ReadonlyArray<string>;
}

export interface EpisodeContent {
    readonly title: string;
    readonly description: string | null;
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive word-boundary regex for one entity name.
 * The `(?<!\w)` / `(?!\w)` guards prevent "Deel" from matching
 * "ideal" or "Sheeleel" — without them substring matches would
 * generate false positives at scale.
 */
function buildEntityRegex(name: string): RegExp | null {
    const trimmed = name.trim();
    if (trimmed.length < 2) return null; // single-char entity names are noise
    return new RegExp(`(?<!\\w)${escapeRegex(trimmed)}(?!\\w)`, "i");
}

/**
 * Find every watched entity whose name OR alias appears in the
 * episode's title or description. Returns the display-name form so
 * downstream attribution stays canonical.
 */
export function matchEntitiesInEpisode(
    episode: EpisodeContent,
    entities: ReadonlyArray<WatchedEntityRef>
): ReadonlyArray<string> {
    const haystack = `${episode.title}\n${episode.description ?? ""}`;
    if (haystack.trim().length === 0) return [];
    const matches = new Set<string>();
    for (const ent of entities) {
        const candidates = [ent.name, ...ent.aliases];
        for (const c of candidates) {
            const re = buildEntityRegex(c);
            if (!re) continue;
            if (re.test(haystack)) {
                matches.add(ent.name);
                break; // one alias match is enough
            }
        }
    }
    return Array.from(matches);
}

/**
 * Heuristic guest-name extraction from an episode title. Recognizes
 * a small set of high-precision podcast title patterns; returns null
 * when the title doesn't match a known shape (better to attribute to
 * the company alone than fabricate a wrong name).
 *
 * Patterns covered (most-specific first):
 *   "Ep 42: Sarah Chen on the future of EOR"
 *   "Sarah Chen | The 20-Minute VC"
 *   "Interview with Sarah Chen"
 *   "Building EOR with Sarah Chen"
 *   "feat. Sarah Chen" / "ft. Sarah Chen"
 *
 * What it WON'T catch: bare titles like "The future of EOR" (no
 * guest named) or "How Sarah won EOR" (first name only). That's a
 * deliberate precision trade: better to return null than guess.
 */
export function extractGuestName(title: string): string | null {
    const t = title.trim();
    if (t.length === 0) return null;
    // Pattern: "with First Last" / "interview with First Last" / "feat./ft. First Last"
    const withMatch = t.match(/\b(?:with|feat\.?|ft\.?|featuring)\s+([A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,2})\b/);
    if (withMatch) return withMatch[1] ?? null;
    // Pattern: "Ep \d+: First Last" or "Ep. 42 - First Last"
    const epMatch = t.match(/\bEp(?:isode|\.)?\s*\d+\s*[:\-—]\s+([A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,2})\b/);
    if (epMatch) return epMatch[1] ?? null;
    // Pattern: "First Last | Show Name" or "First Last on Something"
    // (Trailing (?:\s|$) instead of \b — \b doesn't fire after a non-word
    // char like "|", which would otherwise reject the pipe-separator case.)
    const leadMatch = t.match(
        /^([A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)\s+(?:on|of|from|\|)(?:\s|$)/
    );
    if (leadMatch) return leadMatch[1] ?? null;
    return null;
}

// ─── Cleaning ──────────────────────────────────────────────────

/**
 * A subset of the owned-content fluff list. Podcast titles legitimately
 * use number-prefixed formats ("5 lessons", "10 questions") as the
 * substance of the conversation, so we don't reject those. We DO still
 * reject obvious promotional ones.
 */
export const PODCAST_FLUFF_PATTERNS: ReadonlyArray<RegExp> = [
    /^\s*\[(sponsor|ad|promoted)\]/i,
    /^\s*sponsored\s+by\b/i,
    /^\s*the\s+ultimate\s+guide\s+to/i,
    /^\s*how\s+to\s+(boost|maximize|10x)\s+your/i
];

export interface PodcastInputItem {
    readonly title: string;
    readonly description: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly matched_entities: ReadonlyArray<string>;
}

export type PodcastRejection =
    | "empty_title"
    | "empty_url"
    | "description_too_short"
    | "no_entity_match"
    | "fluff";

export type PodcastCleanOutcome =
    | { readonly kind: "keep"; readonly item: PodcastInputItem }
    | { readonly kind: "reject"; readonly reason: PodcastRejection };

export function cleanEpisodeItem(item: PodcastInputItem): PodcastCleanOutcome {
    const title = item.title.trim();
    if (title.length === 0) return { kind: "reject", reason: "empty_title" };
    if (!item.url || item.url.trim().length === 0) {
        return { kind: "reject", reason: "empty_url" };
    }
    if (item.matched_entities.length === 0) {
        return { kind: "reject", reason: "no_entity_match" };
    }
    const desc = (item.description ?? "").trim();
    if (desc.length < PODCAST_MIN_BODY_LENGTH) {
        return { kind: "reject", reason: "description_too_short" };
    }
    for (const pat of PODCAST_FLUFF_PATTERNS) {
        if (pat.test(title)) return { kind: "reject", reason: "fluff" };
    }
    return { kind: "keep", item: { ...item, title, description: desc } };
}

export interface PodcastBatchResult {
    readonly kept: ReadonlyArray<PodcastInputItem>;
    readonly rejections: Readonly<Record<PodcastRejection, number>>;
    readonly capped: number;
}

/**
 * Apply cleaning + the per-podcast cap. Callers pass items in
 * published-date desc order so the cap keeps the most recent matches.
 */
export function cleanEpisodeBatch(
    items: ReadonlyArray<PodcastInputItem>,
    perPodcastCap: number = PER_PODCAST_ITEM_CAP
): PodcastBatchResult {
    const kept: PodcastInputItem[] = [];
    const rejections: Record<PodcastRejection, number> = {
        empty_title: 0,
        empty_url: 0,
        description_too_short: 0,
        no_entity_match: 0,
        fluff: 0
    };
    let capped = 0;
    for (const it of items) {
        if (kept.length >= perPodcastCap) {
            capped += 1;
            continue;
        }
        const outcome = cleanEpisodeItem(it);
        if (outcome.kind === "keep") kept.push(outcome.item);
        else rejections[outcome.reason] += 1;
    }
    return { kept, rejections, capped };
}
