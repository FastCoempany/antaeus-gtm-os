# Deep Research Setup

## What You Need

- Node.js 18+
- a Browserbase API key
- a Browserbase project ID
- an Anthropic API key
- your Supabase project URL + anon key if you want hosted auth enforcement

## 1. Get Browserbase Credentials

From Browserbase settings, copy:

- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

## 2. Use Claude

This repo is now set up for Claude by default. The `.env` values should look like this:

```env
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=proj_...
MODEL_API_KEY=sk-ant-api03-...
MODEL_NAME=anthropic/claude-sonnet-4
ANTHROPIC_MODEL=claude-sonnet-4-20250514
HOST=0.0.0.0
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:8000,https://antaeus.app,https://www.antaeus.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=12
REQUIRE_SUPABASE_AUTH=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
```

## 3. Install And Start

In PowerShell:

```powershell
cd c:\AppDev\v1AntaeusApp\Appv2_290126\enrichment-server
npm install
Copy-Item .env.example .env
notepad .env
```

Paste your real Browserbase and Anthropic keys into `.env`, save it, then run:

```powershell
npm start
```

## 4. Confirm It Started

Open:

```text
http://localhost:3001/health
```

You want:

- `browserbase: true`
- `projectId: true`
- `modelKey: true`
- `missing: []`

## 5. Test It

In a second PowerShell window:

```powershell
cd c:\AppDev\v1AntaeusApp\Appv2_290126\enrichment-server
node test-enrich.js "Salesforce" "salesforce.com"
```

If it works, you should see a heat score plus structured signals.

## 6. Use It In The App

Run the app locally, open Signal Console, expand an account, and click `Deep Research`.

## 7. Move From Localhost To Live

For the live app, the frontend now defaults to:

```text
https://enrich.antaeus.app
```

The clean production move is:

1. Host this `enrichment-server` on a normal Node/container host.
2. In Cloudflare DNS, create a proxied record for `enrich.antaeus.app` pointing at that host.
3. In the hosted service env, set:

```env
CORS_ALLOWED_ORIGINS=https://antaeus.app,https://www.antaeus.app
REQUIRE_SUPABASE_AUTH=true
SUPABASE_URL=https://wjdqmgxwulqxxxnyuzyl.supabase.co
SUPABASE_ANON_KEY=your_same_publishable_anon_key
```

That makes the live app call the hosted enrichment service instead of `localhost`, and the server will only accept requests from signed-in Supabase users.

If you host the service on a different domain, set a browser override once:

```js
localStorage.setItem('gtmos_enrichment_base_url', 'https://your-host.example.com');
```

## Common Failures

- `Failed to fetch`: the enrichment server is not running on port `3001`
- `service unreachable at https://enrich.antaeus.app`: the live app is pointing at the hosted default, but DNS/hosting is not ready yet
- `Missing required environment variables`: one or more `.env` keys are missing
- `Invalid Supabase session`: hosted auth is enabled and the request did not include a valid signed-in user token
- empty results: test on a larger company first

## Important

Do not keep raw API keys in committed text files. Use `.env` for the server and rotate any key that has already been committed to the repo.
