-- ============================================================================
-- HR-Tech demo seed — Employer-of-Record (EOR) / global-employment category
--
-- Shapes a complete commercial-identity environment for the Briefing room
-- and Signal Console, in the category Rippling / Deel / Remote / Vensure
-- compete in. The demo operator is a fictional EOR platform ("Crossport");
-- the four real EOR players are flagged as competitors so the Briefing's
-- watchlist-driven fetchers (HN Algolia, Wikipedia, GitHub) pull real,
-- current intelligence about them.
--
-- WHAT THIS SEEDS (single source of truth, per ADR-007):
--   • workspace_profile  — what Crossport sells (product category, value prop)
--   • icps (2 rows)      — who Crossport sells to (industries + buyers)
--   • signal_console_accounts — Deel, Rippling, Remote, Vensure (competitors)
--                               + 3 prospects + 1 customer
--   • signals            — realistic, grounded-in-public-events intelligence
--                          on each competitor + buying-trigger signals on
--                          prospects
--
-- HOW THE BRIEFING USES IT:
--   The seed flags the four EOR players as competitors. Stage 3.0 hydration
--   derives the watchlist = competitor names + ICP industries. The
--   watchlist-driven source fetchers then query real current data about
--   Deel / Rippling / Remote / Vensure, and the enrich stage scores
--   relevance against Crossport's commercial profile. That is what makes
--   the briefing produce EOR-category-specific intelligence rather than a
--   generic firehose.
--
-- ── HOW TO RUN ──────────────────────────────────────────────────────────
--   1. Open the Supabase SQL Editor for the antaeus-gtm-os project.
--   2. Paste this whole file and Run.
--   3. It resolves your workspace automatically from the owner email below
--      and is idempotent — re-running replaces the demo rows cleanly.
--
--   The owner email is hardcoded to mrcoe7@gmail.com. If you want to seed a
--   different workspace, change the email in the SELECT at the top of the
--   DO block (one place, marked).
--
--   Deterministic UUIDs (aaaa…/bbbb…/cccc…/dddd…) make the seed idempotent:
--   the cleanup step deletes exactly these rows before re-inserting, so
--   nothing else in the workspace is touched. Deleting an account
--   cascade-deletes its signals (FK on delete cascade).
-- ============================================================================

do $$
declare
    ws_id   uuid;
    owner   uuid;

    -- Competitor accounts (real EOR players).
    acc_deel     uuid := 'aaaa0000-0000-4000-8000-000000000001';
    acc_rippling uuid := 'aaaa0000-0000-4000-8000-000000000002';
    acc_remote   uuid := 'aaaa0000-0000-4000-8000-000000000003';
    acc_vensure  uuid := 'aaaa0000-0000-4000-8000-000000000004';

    -- Prospect accounts (plausible mid-market buyers).
    acc_vanta    uuid := 'bbbb0000-0000-4000-8000-000000000001';
    acc_clay     uuid := 'bbbb0000-0000-4000-8000-000000000002';
    acc_linear   uuid := 'bbbb0000-0000-4000-8000-000000000003';

    -- Customer account.
    acc_hightouch uuid := 'cccc0000-0000-4000-8000-000000000001';

    -- ICP rows.
    icp_saas   uuid := 'dddd0000-0000-4000-8000-000000000001';
    icp_remote uuid := 'dddd0000-0000-4000-8000-000000000002';
begin
    -- ── Resolve the target workspace + owner ──────────────────────────────
    -- CHANGE THE EMAIL HERE to seed a different workspace.
    select w.id, w.owner_id
      into ws_id, owner
      from public.workspaces w
      join auth.users u on u.id = w.owner_id
     where u.email = 'mrcoe7@gmail.com'
     order by w.created_at asc
     limit 1;

    if ws_id is null then
        raise exception 'No workspace found for the owner email. Edit the SELECT email and re-run.';
    end if;

    raise notice 'Seeding HR-tech demo into workspace % (owner %)', ws_id, owner;

    -- ── Idempotent cleanup (signals cascade with their account) ───────────
    delete from public.signal_console_accounts
     where workspace_id = ws_id
       and id in (acc_deel, acc_rippling, acc_remote, acc_vensure,
                  acc_vanta, acc_clay, acc_linear, acc_hightouch);

    delete from public.icps
     where workspace_id = ws_id
       and id in (icp_saas, icp_remote);

    -- ──────────────────────────────────────────────────────────────────────
    -- 1. workspace_profile — what Crossport sells
    --    Upsert only the three commercial columns; never touch onboarding
    --    state (single source of truth, ADR-007).
    -- ──────────────────────────────────────────────────────────────────────
    insert into public.workspace_profile
        (workspace_id, product_category, what_we_sell, value_prop)
    values (
        ws_id,
        'Global employment & payroll platform (Employer of Record)',
        'Crossport is an Employer of Record (EOR) and global payroll platform. '
        'We let companies hire full-time employees and contractors in 150+ '
        'countries without setting up a local entity — we own the local entity, '
        'run compliant payroll, handle benefits, taxes, and termination risk, '
        'and give the operator one dashboard for their entire global team.',
        'Hire anyone, anywhere, in days instead of months — without the legal '
        'entity, the local lawyer, or the compliance gamble. Crossport carries '
        'the employment liability so the customer''s people team never has to '
        'become experts in 150 jurisdictions.'
    )
    on conflict (workspace_id) do update set
        product_category = excluded.product_category,
        what_we_sell     = excluded.what_we_sell,
        value_prop       = excluded.value_prop,
        updated_at       = now();

    -- ──────────────────────────────────────────────────────────────────────
    -- 2. ICPs — who Crossport sells to (drives watchlist industries + queries)
    -- ──────────────────────────────────────────────────────────────────────
    insert into public.icps
        (id, workspace_id, user_id, name, worked, is_active, summary,
         statement, industry, primary_buyer, company_size, geography,
         pain_point, trigger_event, proof_window)
    values
    (
        icp_saas, ws_id, owner,
        'Scaling B2B SaaS going international', true, true,
        'Venture-backed B2B SaaS, 50–500 employees, hiring across borders '
        'faster than they can stand up legal entities.',
        'Venture-backed B2B SaaS companies, 50–500 employees, that have found '
        'product-market fit at home and are now hiring engineering and '
        'go-to-market talent across borders faster than they can stand up '
        'legal entities.',
        'B2B SaaS',
        'Head of People / VP People Operations',
        '50–500 employees',
        'North America HQ, hiring into the EU and LATAM',
        'They have already hired 2–3 people abroad through risky contractor '
        'workarounds or a patchwork of local providers, and legal is now '
        'flagging worker misclassification and permanent-establishment exposure.',
        'Series B or C raise, first international executive hire, or a board '
        'mandate to expand into a new region.',
        'First compliant hire live within 5 business days.'
    ),
    (
        icp_remote, ws_id, owner,
        'Remote-first startup hiring globally from day one', true, true,
        'Remote-first startups, 10–150 employees, hiring the best person '
        'regardless of location.',
        'Remote-first startups that hire the best person regardless of '
        'location and need to onboard a senior engineer in Brazil or a '
        'designer in Portugal this month, not next quarter.',
        'Remote-first technology startups',
        'Founder / COO / Head of Talent',
        '10–150 employees',
        'Global / fully distributed',
        'The founder is personally managing contractor agreements in a '
        'spreadsheet; a key hire wants full-time employment with benefits and '
        'there is no compliant way to offer it.',
        'A must-hire candidate in a country where the company has no entity, '
        'or a contractor demanding conversion to full-time employee.',
        'Offer letter to compliant start date in under a week.'
    );

    -- ──────────────────────────────────────────────────────────────────────
    -- 3. Accounts — competitors, prospects, customer
    -- ──────────────────────────────────────────────────────────────────────
    insert into public.signal_console_accounts
        (id, workspace_id, user_id, account_key, account_name, domain,
         industry, sector, relationship_type, heat, last_enriched_at)
    values
    -- Competitors (the real EOR set).
    (acc_deel,     ws_id, owner, 'demo-deel',     'Deel',     'deel.com',
     'Global HR / Employer of Record', 'HR Tech', 'competitor', 92, now()),
    (acc_rippling, ws_id, owner, 'demo-rippling', 'Rippling', 'rippling.com',
     'Workforce management / EOR', 'HR Tech', 'competitor', 88, now()),
    (acc_remote,   ws_id, owner, 'demo-remote',   'Remote',   'remote.com',
     'Global HR / Employer of Record', 'HR Tech', 'competitor', 64, now()),
    (acc_vensure,  ws_id, owner, 'demo-vensure',  'Vensure Employer Solutions', 'vensure.com',
     'PEO / Employer of Record', 'HR Tech', 'competitor', 41, now()),
    -- Prospects (plausible mid-market buyers).
    (acc_vanta,    ws_id, owner, 'demo-vanta',    'Vanta',    'vanta.com',
     'B2B SaaS / Security Compliance', 'SaaS', 'prospect', 58, now()),
    (acc_clay,     ws_id, owner, 'demo-clay',     'Clay',     'clay.com',
     'B2B SaaS / GTM Software', 'SaaS', 'prospect', 44, now()),
    (acc_linear,   ws_id, owner, 'demo-linear',   'Linear',   'linear.app',
     'Developer Tools', 'SaaS', 'prospect', 47, now()),
    -- Customer.
    (acc_hightouch, ws_id, owner, 'demo-hightouch', 'Hightouch', 'hightouch.com',
     'B2B SaaS / Data Activation', 'SaaS', 'customer', 30, now());

    -- ──────────────────────────────────────────────────────────────────────
    -- 4. Signals — realistic, grounded-in-public-events intelligence
    --    Recency drives heat: recent → hot. published_date offsets from now().
    -- ──────────────────────────────────────────────────────────────────────

    -- Deel ------------------------------------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai)
    values
    (acc_deel, ws_id, 'legal',
     'Rippling sues Deel for corporate espionage, alleges a planted spy in its Dublin office',
     'TechCrunch', 'https://techcrunch.com/',
     now() - interval '52 days', 0.95, false),
    (acc_deel, ws_id, 'product',
     'Deel launches Deel IT for global device and app provisioning, widening past pure payroll',
     'Deel Blog', 'https://www.deel.com/blog/',
     now() - interval '24 days', 0.80, false),
    (acc_deel, ws_id, 'funding',
     'Deel hits $12.6B valuation in secondary share sale as revenue accelerates',
     'Bloomberg', 'https://www.bloomberg.com/',
     now() - interval '120 days', 0.90, false),
    (acc_deel, ws_id, 'growth',
     'Deel reports crossing $800M in annual recurring revenue',
     'Deel', 'https://www.deel.com/',
     now() - interval '95 days', 0.75, false),
    (acc_deel, ws_id, 'm&a',
     'Deel acquires compensation-data startup Assemble and onboarding tool Zavvy',
     'TechCrunch', 'https://techcrunch.com/',
     now() - interval '180 days', 0.85, false);

    -- Rippling --------------------------------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai)
    values
    (acc_rippling, ws_id, 'legal',
     'Rippling files trade-secret theft suit against Deel over an alleged employee informant',
     'Reuters', 'https://www.reuters.com/',
     now() - interval '50 days', 0.95, false),
    (acc_rippling, ws_id, 'product',
     'Rippling expands Employer of Record coverage past 50 countries',
     'Rippling Blog', 'https://www.rippling.com/blog/',
     now() - interval '28 days', 0.80, false),
    (acc_rippling, ws_id, 'funding',
     'Rippling raises $450M Series F at a $16.8B valuation',
     'The Information', 'https://www.theinformation.com/',
     now() - interval '88 days', 0.90, false),
    (acc_rippling, ws_id, 'product',
     'Rippling pushes deeper into IT and spend management to widen its platform moat',
     'Forbes', 'https://www.forbes.com/',
     now() - interval '60 days', 0.70, false);

    -- Remote ----------------------------------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai)
    values
    (acc_remote, ws_id, 'product',
     'Remote adds contractor management and tiered global payroll to defend mid-market',
     'Remote Blog', 'https://remote.com/blog',
     now() - interval '30 days', 0.75, false),
    (acc_remote, ws_id, 'hiring',
     'Remote launches a free Remote Talent job board to capture top-of-funnel demand',
     'HR Dive', 'https://www.hrdive.com/',
     now() - interval '64 days', 0.70, false),
    (acc_remote, ws_id, 'layoffs',
     'Remote restructures teams amid intensifying EOR pricing pressure',
     'Sifted', 'https://sifted.eu/',
     now() - interval '96 days', 0.60, false),
    (acc_remote, ws_id, 'funding',
     'Remote valued at $3B following a $300M Series C round',
     'TechCrunch', 'https://techcrunch.com/',
     now() - interval '240 days', 0.85, false);

    -- Vensure ---------------------------------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai)
    values
    (acc_vensure, ws_id, 'product',
     'Vensure expands its international EOR offering to compete with venture-backed entrants',
     'PEO Insider', 'https://www.napeo.org/',
     now() - interval '58 days', 0.55, false),
    (acc_vensure, ws_id, 'm&a',
     'Vensure Employer Solutions continues its PEO rollup with several acquisitions',
     'PE Hub', 'https://www.pehub.com/',
     now() - interval '125 days', 0.70, false),
    (acc_vensure, ws_id, 'growth',
     'Vensure surpasses $19B in annual payroll processed across its PEO network',
     'Vensure', 'https://www.vensure.com/',
     now() - interval '150 days', 0.60, false);

    -- Prospects (buying-trigger signals) ------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai)
    values
    (acc_vanta, ws_id, 'funding',
     'Vanta raises $150M Series C and announces a European expansion push',
     'TechCrunch', 'https://techcrunch.com/',
     now() - interval '18 days', 0.85, false),
    (acc_vanta, ws_id, 'hiring',
     'Vanta opens its first roles in London and Dublin to staff EMEA go-to-market',
     'LinkedIn', 'https://www.linkedin.com/',
     now() - interval '12 days', 0.70, false),
    (acc_clay, ws_id, 'hiring',
     'Clay scales its go-to-market team and lists its first roles outside the US',
     'LinkedIn', 'https://www.linkedin.com/',
     now() - interval '22 days', 0.65, false),
    (acc_linear, ws_id, 'growth',
     'Linear continues to grow its remote-first engineering team across Europe',
     'Linear', 'https://linear.app/',
     now() - interval '26 days', 0.65, false);

    -- Customer (relationship context) ---------------------------------------
    insert into public.signals
        (account_id, workspace_id, signal_type, headline, source, url,
         published_date, confidence, is_ai, note)
    values
    (acc_hightouch, ws_id, 'product',
     'Crossport now runs EOR and payroll for Hightouch''s 12 employees across the EU and LATAM',
     'Crossport', null,
     now() - interval '40 days', 0.90, false,
     'Closed-won customer. Reference candidate for the scaling-SaaS ICP.');

    raise notice 'HR-tech demo seed complete: 8 accounts (4 competitors, 3 prospects, 1 customer), 2 ICPs, 1 commercial profile, % signals.',
        (select count(*) from public.signals where workspace_id = ws_id
            and account_id in (acc_deel, acc_rippling, acc_remote, acc_vensure,
                               acc_vanta, acc_clay, acc_linear, acc_hightouch));
end $$;

-- ── Verify after running ────────────────────────────────────────────────
-- (Replace the email if you seeded a different workspace.)
--
--   with ws as (
--     select w.id from public.workspaces w
--     join auth.users u on u.id = w.owner_id
--     where u.email = 'mrcoe7@gmail.com'
--     order by w.created_at asc limit 1
--   )
--   select relationship_type, count(*)
--   from public.signal_console_accounts
--   where workspace_id = (select id from ws)
--   group by relationship_type order by relationship_type;
--
--   -- Competitors that drive the Briefing watchlist:
--   select account_name, heat from public.signal_console_accounts
--   where workspace_id = (select id from ws) and relationship_type = 'competitor'
--   order by heat desc;
-- ============================================================================
