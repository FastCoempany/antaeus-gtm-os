# Deep Research Setup

## What You Need

- Node.js 18+
- a Browserbase API key
- a Browserbase project ID
- an Anthropic API key

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
PORT=3001
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

## Common Failures

- `Failed to fetch`: the enrichment server is not running on port `3001`
- `Missing required environment variables`: one or more `.env` keys are missing
- empty results: test on a larger company first

## Important

Do not keep raw API keys in committed text files. Use `.env` for the server and rotate any key that has already been committed to the repo.
