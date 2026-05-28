-- ============================================================
-- 20260528100000 — Owned-Content RSS source (B.4d, sub-track)
--
-- The Briefing's substrate is starved without first-party content
-- feeds. This migration adds the data plumbing needed to discover +
-- ingest each watched entity's own RSS streams (blog, resources,
-- podcast, customer-stories, press) so the pipeline has fresh
-- person-level material to enrich + cluster + synthesize.
--
-- One additive change:
--   - briefing_watchlist_entities gets `domain text` (nullable). For
--     entities promoted from periphery we don't know the domain at
--     promotion time; we'll resolve it later. For manually-named or
--     imported entities the operator can supply it. Signal Console
--     accounts already carry a domain so that side needs no schema
--     change.
--
-- Cache shape for discovered feed URLs lives in the existing `data`
-- jsonb column (no schema change needed for the cache itself):
--   data.discovered_feeds = [
--     {
--       url: "https://example.com/feed.xml",
--       kind: "rss" | "atom",
--       last_validated_at: <iso>,
--       last_fetched_at: <iso>,
--       fetch_failures: <int>
--     },
--     ...
--   ]
--
-- Ref: deliverables/specs/briefing/01-build-phase-plan.md B.4d
-- Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
-- ============================================================

alter table public.briefing_watchlist_entities
    add column if not exists domain text;

create index if not exists briefing_watchlist_entities_domain_idx
    on public.briefing_watchlist_entities(workspace_id, domain)
    where domain is not null;

comment on column public.briefing_watchlist_entities.domain is
    'Optional canonical domain for the entity (e.g. "deel.com"). Used by the Owned-Content RSS source to discover the entity''s blog / resources / podcast feeds. Nullable because entities promoted from periphery don''t have a known domain at promotion time. B.4d.';
