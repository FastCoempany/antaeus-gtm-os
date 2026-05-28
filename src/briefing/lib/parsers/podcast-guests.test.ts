import { describe, it, expect } from "vitest";
import {
    PER_PODCAST_ITEM_CAP,
    PODCAST_FLUFF_PATTERNS,
    PODCAST_MIN_BODY_LENGTH,
    type PodcastInputItem,
    type WatchedEntityRef,
    cleanEpisodeBatch,
    cleanEpisodeItem,
    escapeRegex,
    extractGuestName,
    matchEntitiesInEpisode
} from "./podcast-guests";
import { PODCAST_FEEDS } from "./podcast-feeds.config";

/**
 * Podcast-Guest source — pure logic tests. The matcher is the
 * highest-stakes piece: false positives drown the operator in noise,
 * false negatives mean missed signal. Anchor it with cases that
 * cover the standard substring-collision traps + the realistic
 * podcast-title shapes.
 */

const watched: ReadonlyArray<WatchedEntityRef> = [
    { name: "Deel", aliases: ["Deel Inc"] },
    { name: "Rippling", aliases: [] },
    { name: "Atlas HXM", aliases: ["Atlas"] },
    { name: "Vensure Employer Solutions", aliases: ["Vensure"] }
];

describe("escapeRegex", () => {
    it("escapes regex metacharacters so entity names with punctuation match literally", () => {
        const re = new RegExp(escapeRegex("A.B+C"));
        expect(re.test("A.B+C")).toBe(true);
        expect(re.test("AXBXC")).toBe(false);
    });
});

describe("matchEntitiesInEpisode", () => {
    it("matches a watched entity in the title", () => {
        const r = matchEntitiesInEpisode(
            { title: "Building Deel: a conversation with Alex Bouaziz", description: "" },
            watched
        );
        expect(r).toEqual(["Deel"]);
    });

    it("matches a watched entity in the description", () => {
        const r = matchEntitiesInEpisode(
            {
                title: "The future of global hiring",
                description: "This week we sit down with the CRO at Atlas HXM to talk EOR."
            },
            watched
        );
        expect(r).toContain("Atlas HXM");
    });

    it("returns multiple matches when several entities appear", () => {
        const r = matchEntitiesInEpisode(
            {
                title: "Deel vs Rippling — the EOR wars",
                description: "Both teams move fast."
            },
            watched
        );
        expect(r).toContain("Deel");
        expect(r).toContain("Rippling");
    });

    it("doesn't fire on substring collisions", () => {
        // "Deel" must not match "ideal", "Deelected", "Bandelroom"
        const r = matchEntitiesInEpisode(
            { title: "The ideal Bandelroom is multidimensional", description: "" },
            watched
        );
        expect(r).toEqual([]);
    });

    it("matches an alias when the canonical name isn't present", () => {
        const r = matchEntitiesInEpisode(
            { title: "Vensure's PEO empire, explained", description: "" },
            watched
        );
        expect(r).toContain("Vensure Employer Solutions"); // resolves to display name
    });

    it("returns [] when nothing matches", () => {
        const r = matchEntitiesInEpisode(
            { title: "Building a Series A pitch deck", description: "Tips from the trenches." },
            watched
        );
        expect(r).toEqual([]);
    });

    it("returns [] for an empty title + description", () => {
        const r = matchEntitiesInEpisode({ title: "  ", description: null }, watched);
        expect(r).toEqual([]);
    });

    it("ignores single-character entity names (defensive)", () => {
        const r = matchEntitiesInEpisode(
            { title: "X marks the spot", description: "X strategy." },
            [{ name: "X", aliases: [] }]
        );
        expect(r).toEqual([]);
    });
});

describe("extractGuestName", () => {
    it("pulls a guest from 'with First Last'", () => {
        expect(extractGuestName("Building EOR with Sarah Chen")).toBe("Sarah Chen");
    });

    it("pulls a guest from 'feat. First Last'", () => {
        expect(extractGuestName("How EOR works feat. Marcus Reed")).toBe("Marcus Reed");
    });

    it("pulls a guest from 'Ep 42: First Last'", () => {
        expect(extractGuestName("Ep 42: Priya Vasquez on the future of payroll")).toBe(
            "Priya Vasquez"
        );
    });

    it("pulls a guest from 'First Last | Show'", () => {
        expect(extractGuestName("Sarah Chen | The 20-Minute VC")).toBe("Sarah Chen");
    });

    it("returns null when no clear guest pattern matches", () => {
        expect(extractGuestName("The future of EOR — what comes next")).toBeNull();
        expect(extractGuestName("Why we left Workday")).toBeNull();
    });

    it("returns null for names with lowercase particles (de la, van, von) — deliberate punt", () => {
        // The heuristic refuses to guess on these rather than fabricate
        // a wrong name. Enrich + the matched_entities attribution still
        // tell the operator which company the episode is about.
        expect(extractGuestName("with Maria de la Cruz")).toBeNull();
    });

    it("returns null for empty input", () => {
        expect(extractGuestName("")).toBeNull();
        expect(extractGuestName("   ")).toBeNull();
    });
});

describe("cleanEpisodeItem", () => {
    function item(over: Partial<PodcastInputItem> = {}): PodcastInputItem {
        return {
            title: "Building EOR with Sarah Chen, CRO Atlas HXM",
            description:
                "Sarah Chen sits down with us to discuss how Atlas built its EOR product, the moves the team made in 2025, and what the next year of category competition looks like.",
            url: "https://podcast.example/ep/42",
            published_date: "2026-05-25T12:00:00Z",
            matched_entities: ["Atlas HXM"],
            ...over
        };
    }

    it("keeps a substantive episode with a real entity match", () => {
        expect(cleanEpisodeItem(item()).kind).toBe("keep");
    });

    it("rejects empty title", () => {
        expect(cleanEpisodeItem(item({ title: "  " }))).toEqual({
            kind: "reject",
            reason: "empty_title"
        });
    });

    it("rejects missing URL", () => {
        expect(cleanEpisodeItem(item({ url: null }))).toEqual({
            kind: "reject",
            reason: "empty_url"
        });
    });

    it("rejects when description is too short", () => {
        expect(cleanEpisodeItem(item({ description: "tiny" }))).toEqual({
            kind: "reject",
            reason: "description_too_short"
        });
    });

    it("rejects when no watched entity matched (sanity gate)", () => {
        expect(cleanEpisodeItem(item({ matched_entities: [] }))).toEqual({
            kind: "reject",
            reason: "no_entity_match"
        });
    });

    it("rejects obvious sponsor / promotional titles", () => {
        const fluffy = ["[Sponsor] How we 10x'd revenue", "Sponsored by Acme: better hiring"];
        for (const title of fluffy) {
            expect(cleanEpisodeItem(item({ title })).kind).toBe("reject");
        }
    });

    it("KEEPS number-prefixed titles (podcasts legitimately use '5 lessons' format)", () => {
        expect(
            cleanEpisodeItem(item({ title: "5 lessons from scaling Atlas to $100M ARR" })).kind
        ).toBe("keep");
    });

    it("PODCAST_MIN_BODY_LENGTH is a meaningful threshold but lower than owned-content", () => {
        expect(PODCAST_MIN_BODY_LENGTH).toBeGreaterThanOrEqual(40);
        expect(PODCAST_MIN_BODY_LENGTH).toBeLessThan(120);
    });

    it("PODCAST_FLUFF_PATTERNS exists and has at least a couple entries", () => {
        expect(PODCAST_FLUFF_PATTERNS.length).toBeGreaterThanOrEqual(3);
    });
});

describe("cleanEpisodeBatch", () => {
    function item(title: string, matched: string[] = ["Atlas HXM"]): PodcastInputItem {
        return {
            title,
            description: "x".repeat(PODCAST_MIN_BODY_LENGTH + 30),
            url: `https://podcast.example/${title.toLowerCase().replace(/[^a-z]/g, "-")}`,
            published_date: "2026-05-25T12:00:00Z",
            matched_entities: matched
        };
    }

    it("keeps the most recent items up to the cap", () => {
        const items = Array.from({ length: 8 }, (_, i) => item(`Ep ${i}: real conversation`));
        const r = cleanEpisodeBatch(items);
        expect(r.kept).toHaveLength(PER_PODCAST_ITEM_CAP);
        expect(r.capped).toBe(8 - PER_PODCAST_ITEM_CAP);
    });

    it("attributes rejections per reason", () => {
        const items: PodcastInputItem[] = [
            item("Real conversation 1"),
            item("Real conversation 2", []), // no match
            { ...item("Real conversation 3"), title: "" },
            { ...item("Real conversation 4"), url: null },
            { ...item("Real conversation 5"), description: "tiny" }
        ];
        const r = cleanEpisodeBatch(items);
        expect(r.kept).toHaveLength(1);
        expect(r.rejections.no_entity_match).toBe(1);
        expect(r.rejections.empty_title).toBe(1);
        expect(r.rejections.empty_url).toBe(1);
        expect(r.rejections.description_too_short).toBe(1);
    });

    it("respects a custom per-podcast cap", () => {
        const items = [item("a"), item("b"), item("c"), item("d")];
        const r = cleanEpisodeBatch(items, 2);
        expect(r.kept).toHaveLength(2);
        expect(r.capped).toBe(2);
    });
});

describe("PODCAST_FEEDS config", () => {
    it("has a non-trivial seed list", () => {
        expect(PODCAST_FEEDS.length).toBeGreaterThanOrEqual(5);
    });

    it("every entry has id + name + rss_url + category", () => {
        for (const feed of PODCAST_FEEDS) {
            expect(feed.id).toMatch(/^[a-z_]+$/);
            expect(feed.name.length).toBeGreaterThan(0);
            expect(feed.rss_url).toMatch(/^https?:\/\//);
            expect(["saas", "gtm", "hr_tech", "vc", "deep_dive"]).toContain(feed.category);
        }
    });

    it("ids are unique", () => {
        const ids = PODCAST_FEEDS.map((f) => f.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
