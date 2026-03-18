# Antaeus GTM OS - Deep Research Server

This service powers the `Deep Research` button in Signal Console. It runs Browserbase-backed live research, synthesizes seller-relevant signals with Claude, and returns JSON the app merges into the account card.

## What It Actually Researches

The current engine is lane-based, not generic homepage scraping:

- news / press / investor relations
- earnings / SEC / transcripts
- careers / hiring / org signals
- official site product + messaging changes
- regulatory / outage / risk signals

It returns Signal Console categories:

- `ai_transformation`
- `trigger_event`
- `pain_point`
- `internal_intel`
- `market_position`

## Default Model Setup

```env
MODEL_NAME=anthropic/claude-sonnet-4
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

## Local Quick Start

1. In `enrichment-server`, run `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in:
   - `BROWSERBASE_API_KEY`
   - `BROWSERBASE_PROJECT_ID`
   - `MODEL_API_KEY`
4. Start the server with `npm start`.
5. Test it with `node test-enrich.js "Salesforce"`.

## Required Environment Variables

```env
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
MODEL_API_KEY=...
MODEL_NAME=anthropic/claude-sonnet-4
ANTHROPIC_MODEL=claude-sonnet-4-20250514
HOST=0.0.0.0
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:8000,https://antaeus.app,https://www.antaeus.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=12
REQUIRE_SUPABASE_AUTH=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Local App Usage

When the app runs on `localhost`, Signal Console defaults to:

```text
http://localhost:3001/enrich
```

So the local flow is:

1. Run the Antaeus app locally.
2. Run this enrichment server locally.
3. Open Signal Console.
4. Expand an account.
5. Click `Deep Research`.

## Hosted Usage

For the live app, the frontend now resolves the enrichment endpoint like this:

1. `window.__ANTAEUS_ENRICHMENT_BASE_URL__` if present
2. `localStorage.gtmos_enrichment_base_url` if present
3. `http://localhost:3001` on localhost
4. `https://enrich.antaeus.app` everywhere else

That means the clean production path is:

1. Host this Node service on a container-friendly host.
2. Point `enrich.antaeus.app` at it.
3. Set:
   - `CORS_ALLOWED_ORIGINS=https://antaeus.app,https://www.antaeus.app`
   - `REQUIRE_SUPABASE_AUTH=true`
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your real app project

If you host it somewhere else, set the browser override once:

```js
localStorage.setItem('gtmos_enrichment_base_url', 'https://your-host.example.com');
```

## Hardening Included

The server now supports:

- CORS allow-listing
- per-client rate limiting
- optional Supabase session verification for hosted mode
- small JSON body limits

Hosted mode should use `REQUIRE_SUPABASE_AUTH=true` so only signed-in app users can call `/enrich`.

## Health Check

```bash
curl http://localhost:3001/health
```

It reports:

- Browserbase key/project presence
- model key presence
- whether Supabase auth is required
- whether auth env vars are ready
- allowed origins
- rate-limit config

## Container Deploy

A basic `Dockerfile` is included. Any normal Node/container host works.

Cloudflare note:

- Cloudflare Pages should continue serving the static app.
- The enrichment server should be hosted separately.
- If you want `https://enrich.antaeus.app`, create a proxied DNS record in Cloudflare that points at that external host.

## Important

- Do not keep raw API keys in committed text files.
- Use `.env` for the server.
- Rotate any key that has already been committed to the repo.
