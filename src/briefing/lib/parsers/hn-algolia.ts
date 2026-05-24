/**
 * HN Algolia search response parser — Node-side reference implementation.
 *
 * The Algolia HN search API returns clean JSON; no parser per se, but
 * we still need defensive normalization. The `hits[]` array can have
 * inconsistent shapes (Ask HN vs story vs job; some posts missing
 * url; some missing author). The normalizer rejects entries that
 * lack the fields downstream actually consumes (objectID + title)
 * and fills the rest with sensible defaults.
 *
 * Endpoint shape:
 *   GET https://hn.algolia.com/api/v1/search_by_date
 *       ?query=<term>&tags=story&numericFilters=created_at_i><cutoff>
 *       &hitsPerPage=<n>
 *
 * Response shape (relevant subset):
 *   {
 *     hits: [{
 *       objectID, title, url, author, created_at, points,
 *       num_comments, story_text
 *     }, ...],
 *     nbHits, page, hitsPerPage
 *   }
 */

export interface HnAlgoliaHit {
    readonly objectID: string;
    readonly title: string;
    readonly url: string | null;
    readonly author: string | null;
    readonly created_at: string | null;
    readonly points: number | null;
    readonly num_comments: number | null;
    readonly story_text: string | null;
}

export interface HnAlgoliaResponse {
    readonly hits?: ReadonlyArray<Record<string, unknown>>;
    readonly nbHits?: number;
}

/**
 * Normalize the API response into a typed hits array. Defensive
 * against missing fields, wrong types, malformed entries. Drops any
 * entry without an objectID + title (those two are the minimum
 * downstream needs).
 */
export function parseHnAlgoliaResponse(
    body: HnAlgoliaResponse
): ReadonlyArray<HnAlgoliaHit> {
    if (!body || !Array.isArray(body.hits)) return [];
    const out: HnAlgoliaHit[] = [];
    for (const raw of body.hits) {
        if (!raw || typeof raw !== "object") continue;
        const objectID = asString(raw["objectID"]);
        const title = asString(raw["title"]);
        if (objectID === null || title === null) continue;
        out.push({
            objectID,
            title,
            url: asString(raw["url"]),
            author: asString(raw["author"]),
            created_at: asString(raw["created_at"]),
            points: asNumber(raw["points"]),
            num_comments: asNumber(raw["num_comments"]),
            story_text: asString(raw["story_text"])
        });
    }
    return out;
}

/**
 * Build the search URL. The `query` is required; `tags=story` filters
 * out comments + jobs + polls; `numericFilters=created_at_i>cutoff`
 * bounds the search to the last N days.
 */
export function hnAlgoliaUrl(query: string, sinceUnix: number, hitsPerPage = 25): string {
    const params = new URLSearchParams({
        query,
        tags: "story",
        numericFilters: `created_at_i>${sinceUnix}`,
        hitsPerPage: String(hitsPerPage)
    });
    return `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`;
}

function asString(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function asNumber(v: unknown): number | null {
    if (typeof v !== "number" || Number.isNaN(v)) return null;
    return v;
}
