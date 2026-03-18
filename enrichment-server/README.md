# Antaeus GTM OS - Deep Research Server

This service powers the `Deep Research` button in Signal Console. It runs three Browserbase-backed research passes, uses an LLM to extract structured signals, and returns JSON that the app merges into the account card.

## What It Does

- researches Google News for recent account signals
- checks the company site and careers page
- searches for strategic intelligence like earnings, partnerships, acquisitions, and AI moves
- returns structured signals that match Signal Console's category model

## Default Setup

This repo is now configured Claude-first:

```env
MODEL_NAME=anthropic/claude-sonnet-4
```

You can still swap to Gemini or OpenAI by changing `MODEL_NAME` in `.env`.

## Quick Start

1. In `enrichment-server`, run `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in:
   - `BROWSERBASE_API_KEY`
   - `BROWSERBASE_PROJECT_ID`
   - `MODEL_API_KEY`
4. Start the server with `npm start`.
5. Test it with `node test-enrich.js "Datadog" "datadoghq.com"`.

## Required Environment Variables

```env
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
MODEL_API_KEY=...
MODEL_NAME=anthropic/claude-sonnet-4
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PORT=3001
```

## Use It With The App

1. Run the Antaeus app locally.
2. Run this enrichment server on `http://localhost:3001`.
3. Open Signal Console.
4. Expand an account.
5. Click `Deep Research`.

The page already posts to `POST /enrich` on `localhost:3001`.

## Health Check

Use:

```bash
curl http://localhost:3001/health
```

It reports whether Browserbase keys, project ID, and model key are present.

## Notes

- The enrichment server returns categories that match the current Signal Console UI:
  - `ai_transformation`
  - `trigger_event`
  - `pain_point`
  - `internal_intel`
  - `market_position`
- The current app still stores Signal Console account state in localStorage, so deep-research results are browser-local unless you later wire this module into Supabase persistence.
