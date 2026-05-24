/**
 * GitHub Releases Atom fetcher (B.1b).
 *
 * Each watched repo (per workspace) gets its `/releases.atom` feed
 * polled. The Atom format is cheaper to poll than the GitHub JSON
 * API (no auth needed, no rate-limit cost against the 5000/hr PAT
 * budget), and it gives release title + body + URL + timestamp —
 * everything the enrichment stage needs to reason about product
 * velocity.
 *
 * Repo list comes from a HydratedContext-derived list. In B.1b the
 * context is uninitialized so the list is empty and this fetcher
 * no-ops. The mapping from "company watchlist" → "repos to poll" is
 * a known gap: today's contract doesn't carry a repo list per company.
 * The fetcher's repo source is a `context.outbound`-style accessor
 * that doesn't exist yet; for now it reads from any HydratedContext
 * extension that surfaces `github_repos: string[]`.
 *
 * Once a workspace can declare repos to track (B.2+ adapter work),
 * this fetcher activates without any code change.
 *
 * Reference: deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §3.2 (Tier A, 15/15)
 */

// deno-lint-ignore-file no-explicit-any

import { httpGet, parseAtom } from "./_shared.ts";

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

interface RepoFetchResult {
    readonly items: ReadonlyArray<RawItem>;
    readonly error: string | null;
}

interface HydratedContext {
    /** Reserved extension slot for repo lists; not yet populated by adapters. */
    readonly github_repos?: ReadonlyArray<string>;
}

const SOURCE_ID = "github_releases_atom";
const MAX_REPOS = 20;

export const githubReleasesAtomSource = {
    id: SOURCE_ID,
    fetch: async (ctx: HydratedContext): Promise<FetchResult> => {
        const repos = buildRepoList(ctx);
        if (repos.length === 0) {
            return { items: [], error: null };
        }

        const perRepo = await Promise.allSettled(
            repos.map(async (repo) => fetchRepo(repo))
        );

        const out: RawItem[] = [];
        const errors: string[] = [];
        for (const result of perRepo) {
            if (result.status === "rejected") {
                errors.push(
                    result.reason instanceof Error
                        ? result.reason.message
                        : String(result.reason)
                );
                continue;
            }
            if (result.value.error !== null) {
                errors.push(result.value.error);
            }
            out.push(...result.value.items);
        }
        const error =
            out.length === 0 && errors.length > 0
                ? errors.slice(0, 3).join("; ")
                : null;
        return { items: out, error };
    }
};

function buildRepoList(ctx: HydratedContext): ReadonlyArray<string> {
    const raw = ctx.github_repos;
    if (!Array.isArray(raw)) return [];
    const cleaned = raw
        .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
        .map((r) => r.trim())
        // Repo path must look like "owner/name" — defend against
        // malformed entries leaking out of HydratedContext.
        .filter((r) => /^[\w.-]+\/[\w.-]+$/.test(r));
    return Array.from(new Set(cleaned)).slice(0, MAX_REPOS);
}

async function fetchRepo(repo: string): Promise<RepoFetchResult> {
    const url = `https://github.com/${repo}/releases.atom`;
    const result = await httpGet(url, {
        Accept: "application/atom+xml, application/xml;q=0.9, */*;q=0.8"
    });
    if (!result.ok) {
        // 404 = repo missing or no releases; not a runtime error.
        if (result.status === 404) {
            return { items: [], error: null };
        }
        return {
            items: [],
            error: `repo=${repo}: ${result.error ?? `HTTP ${result.status}`}`
        };
    }
    const entries = parseAtom(result.text);
    const items = entries.map((entry) => ({
        source_id: SOURCE_ID,
        external_id: `gh_${repo}_${entry.external_id}`,
        title: `${repo} - ${entry.title}`,
        body: entry.summary,
        url: entry.link,
        published_date: entry.published_date,
        data: {
            repo,
            release_external_id: entry.external_id
        }
    }));
    return { items, error: null };
}
