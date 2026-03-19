import "dotenv/config";
import express from "express";
import cors from "cors";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

const app = express();
app.set("trust proxy", 1);

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3001);
const DEFAULT_STAGEHAND_MODEL = "anthropic/claude-sonnet-4";
const STAGEHAND_MODEL = normalizeStagehandModelName(
  process.env.MODEL_NAME || DEFAULT_STAGEHAND_MODEL,
);
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const REQUIRE_SUPABASE_AUTH = String(process.env.REQUIRE_SUPABASE_AUTH || "").toLowerCase() === "true";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 12);
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://antaeus.app",
  "https://www.antaeus.app",
];
const SIGNAL_CATEGORIES = [
  "ai_transformation",
  "trigger_event",
  "pain_point",
  "internal_intel",
  "market_position",
];
const SEARCH_RESULT_LIMIT = 6;
const EVIDENCE_VISIT_LIMIT = 3;
const EVIDENCE_TEXT_LIMIT = 5000;
const COMMON_COMPANY_WORDS = new Set([
  "inc",
  "corp",
  "corporation",
  "company",
  "co",
  "ltd",
  "llc",
  "group",
  "systems",
  "technologies",
  "technology",
  "holdings",
  "the",
]);
const requestBuckets = new Map();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "32kb" }));

const SignalItemSchema = z.object({
  category: z.enum(SIGNAL_CATEGORIES),
  headline: z.string(),
  detail: z.string(),
  why_it_matters: z.string(),
  source: z.string(),
  date: z.string(),
  url: z.string(),
  confidence: z.number().min(0).max(1),
});

const SignalSchema = z.object({
  signals: z.array(SignalItemSchema),
});

const CompanyInfoSchema = z.object({
  industry: z.string(),
  sector: z.string(),
  revenue: z.string(),
  employees: z.string(),
  hq: z.string(),
  description: z.string(),
});

function getMissingEnvKeys() {
  return [
    "BROWSERBASE_API_KEY",
    "BROWSERBASE_PROJECT_ID",
    "MODEL_API_KEY",
  ].filter((key) => !process.env[key]);
}

function assertServerConfig() {
  const missing = getMissingEnvKeys();
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function getMissingAuthEnvKeys() {
  return ["SUPABASE_URL", "SUPABASE_ANON_KEY"].filter((key) => !process.env[key]);
}

function parseAllowedOrigins() {
  const configured = String(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = parseAllowedOrigins();
  return allowed.includes(origin);
}

function pruneRequestBuckets(now) {
  for (const [key, bucket] of requestBuckets.entries()) {
    if (!bucket || bucket.resetAt <= now) requestBuckets.delete(key);
  }
}

function takeRateLimitToken(key) {
  const now = Date.now();
  pruneRequestBuckets(now);

  const safeKey = key || "anonymous";
  const bucket = requestBuckets.get(safeKey);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(safeKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  requestBuckets.set(safeKey, bucket);
  return { allowed: true, remaining: Math.max(0, RATE_LIMIT_MAX - bucket.count), resetAt: bucket.resetAt };
}

async function authenticateRequest(req) {
  if (!REQUIRE_SUPABASE_AUTH) return { user: null, error: null };

  const missing = getMissingAuthEnvKeys();
  if (missing.length) {
    return {
      user: null,
      error: { status: 500, message: `Missing auth environment variables: ${missing.join(", ")}` },
    };
  }

  const authHeader = String(req.get("authorization") || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return { user: null, error: { status: 401, message: "Missing bearer token" } };
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${match[1]}`,
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    return { user: null, error: { status: 401, message: "Invalid Supabase session" } };
  }

  return { user: await response.json(), error: null };
}

function normalizeStagehandModelName(modelName) {
  if (!modelName) return DEFAULT_STAGEHAND_MODEL;

  const trimmed = String(modelName).trim();
  const aliases = {
    "claude-3-7-sonnet-latest": "anthropic/claude-sonnet-4",
    "claude-3-5-sonnet-latest": "anthropic/claude-3-5-sonnet-latest",
    "gpt-4o": "openai/gpt-4o",
  };

  return aliases[trimmed] || trimmed;
}

function normalizeText(value, max = 400) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function monthString(value) {
  const text = normalizeText(value, 80);
  if (!text) return "Unknown";
  const match = text.match(/\b(20\d{2})[-/](\d{1,2})/);
  if (!match) return "Unknown";
  return `${match[1]}-${String(match[2]).padStart(2, "0")}`;
}

function extractJsonObject(text) {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in Anthropic response");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function decodeSearchHref(rawHref, origin) {
  if (!rawHref) return "";

  try {
    const asUrl = new URL(rawHref, origin);
    if (asUrl.hostname.includes("google.") && asUrl.pathname === "/url") {
      return asUrl.searchParams.get("q") || "";
    }
    if (asUrl.hostname.includes("google.") && rawHref.startsWith("/url?")) {
      return asUrl.searchParams.get("q") || "";
    }
    return asUrl.href;
  } catch {
    return "";
  }
}

function companyTokens(companyName) {
  return String(companyName || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !COMMON_COMPANY_WORDS.has(token));
}

function candidateMentionsCompany(candidate, companyName, domain) {
  const haystack = [
    candidate?.title,
    candidate?.snippet,
    candidate?.url,
    candidate?.host,
  ]
    .join(" ")
    .toLowerCase();

  if (domain && haystack.includes(String(domain).toLowerCase())) return true;

  const tokens = companyTokens(companyName);
  if (!tokens.length) return true;

  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits >= Math.min(2, tokens.length) || (tokens.length === 1 && hits === 1);
}

function buildCompanyContext(context) {
  const parts = [`Company: ${context.name}.`];
  if (context.ticker) parts.push(`Ticker: ${context.ticker}.`);
  if (context.industry) parts.push(`Known industry: ${context.industry}.`);
  if (context.sector) parts.push(`Known sector: ${context.sector}.`);
  if (context.domain) parts.push(`Official domain hint: ${context.domain}.`);
  return parts.join(" ");
}

function normalizeCompanyInfo(info, context) {
  return {
    industry: info?.industry || context.industry || "Unknown",
    sector: info?.sector || context.sector || context.industry || "Unknown",
    revenue: info?.revenue || "Unknown",
    employees: info?.employees || "Unknown",
    hq: info?.hq || "Unknown",
    description: info?.description || "Unknown",
  };
}

function dedupeSignals(signals) {
  const seen = new Set();
  const unique = [];

  for (const signal of signals) {
    const key = normalizeText(signal.headline, 160)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 48);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(signal);
  }

  return unique.sort((a, b) => b.confidence - a.confidence);
}

function mapSignalsToConsole(signals) {
  const now = new Date().toISOString();
  const currentMonth = now.slice(0, 7);

  return signals.slice(0, 10).map((signal, index) => ({
    id: `enr_${Date.now()}_${index}`,
    cat: signal.category,
    headline: signal.headline,
    detail: signal.detail,
    why_it_matters: signal.why_it_matters,
    why: signal.why_it_matters,
    source_name: signal.source,
    source_type: signal.source_type || signal.lane || "research",
    lane: signal.lane || "unknown",
    published_date: signal.date && signal.date !== "Unknown" ? signal.date : currentMonth,
    confidence: signal.confidence,
    url: signal.url,
    is_ai: false,
    status: "unverified",
    fetched_at: now,
  }));
}

function computeHeat(signals) {
  let heat = Math.min(signals.length * 10, 45);

  signals.forEach((signal) => {
    if (signal.cat === "ai_transformation") heat += 9;
    if (signal.cat === "trigger_event") heat += 7;
    if (signal.cat === "pain_point") heat += 6;
    if (signal.cat === "internal_intel") heat += 5;
    if (signal.cat === "market_position") heat += 4;
    heat += signal.confidence * 4;
  });

  return Math.min(100, Math.round(heat));
}

async function createStagehand() {
  assertServerConfig();

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserbaseSessionCreateParams: {
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      browserSettings: {
        blockAds: true,
        viewport: { width: 1366, height: 900 },
      },
    },
    model: {
      modelName: STAGEHAND_MODEL,
      apiKey: process.env.MODEL_API_KEY,
    },
  });

  await stagehand.init();
  return stagehand;
}

async function withStagehand(label, handler) {
  const stagehand = await createStagehand();
  try {
    const page = stagehand.context.pages()[0];
    return await handler({ stagehand, page, label });
  } finally {
    await stagehand.close();
  }
}

async function safeGoto(page, url) {
  await page.goto(url, {
    timeout: 25000,
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2500);
}

async function collectSearchCandidates(page, query, options = {}) {
  const news = !!options.news;
  const engines = news
    ? [
        {
          name: "google-news",
          url: `https://www.google.com/search?hl=en&gl=us&tbm=nws&tbs=qdr:y&q=${encodeURIComponent(query)}`,
        },
        {
          name: "bing-news",
          url: `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`,
        },
      ]
    : [
        {
          name: "google-web",
          url: `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(query)}`,
        },
        {
          name: "bing-web",
          url: `https://www.bing.com/search?setlang=en-us&q=${encodeURIComponent(query)}`,
        },
      ];

  for (const engine of engines) {
    try {
      await safeGoto(page, engine.url);
      const results = await page.evaluate(
        ({ limit }) => {
          const normalize = (value, max = 400) =>
            String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
          const decodeHref = (rawHref) => {
            if (!rawHref) return "";
            try {
              const asUrl = new URL(rawHref, location.origin);
              if (asUrl.hostname.includes("google.") && asUrl.pathname === "/url") {
                return asUrl.searchParams.get("q") || "";
              }
              if (asUrl.hostname.includes("google.") && rawHref.startsWith("/url?")) {
                return asUrl.searchParams.get("q") || "";
              }
              return asUrl.href;
            } catch {
              return "";
            }
          };

          const items = [];
          const seen = new Set();
          const anchors = Array.from(document.querySelectorAll("a[href]"));

          for (const anchor of anchors) {
            const url = decodeHref(anchor.getAttribute("href"));
            if (!/^https?:\/\//i.test(url)) continue;

            let host = "";
            try {
              host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
            } catch {
              continue;
            }

            if (!host) continue;
            if (
              host.includes("google.") ||
              host.includes("gstatic.com") ||
              host.includes("bing.com") ||
              host.includes("microsoft.com") ||
              host.includes("youtube.com")
            ) {
              continue;
            }

            const title = normalize(anchor.innerText || anchor.textContent, 220);
            const container = anchor.closest("article, div");
            const snippet = normalize(container ? container.innerText : "", 700);
            const key = url.split("#")[0];

            if ((title + snippet).length < 60 || seen.has(key)) continue;
            seen.add(key);
            items.push({ url, host, title, snippet });
            if (items.length >= limit) break;
          }

          return items;
        },
        { limit: SEARCH_RESULT_LIMIT },
      );

      if (results.length) {
        return results.map((result) => ({
          ...result,
          query,
          engine: engine.name,
          news_mode: news,
        }));
      }
    } catch (error) {
      console.error(`  [search] ${engine.name} failed for "${query}": ${error.message}`);
    }
  }

  return [];
}

function buildDirectCandidates(context, lane) {
  if (!context.domain) return [];

  const host = context.domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const directPaths = {
    official_site: ["/news", "/newsroom", "/press", "/blog", "/products", "/solutions"],
    careers_org: ["/careers", "/jobs", "/company/careers"],
    news_press_ir: ["/investors", "/investor-relations", "/press", "/newsroom"],
  };

  return (directPaths[lane.id] || []).map((path) => ({
    url: `https://${host}${path}`,
    host,
    title: `${host}${path}`,
    snippet: "Direct official site probe",
    query: `direct:${path}`,
    engine: "direct",
    news_mode: false,
    direct: true,
  }));
}

function scoreCandidate(candidate, lane, context) {
  const haystack = `${candidate.title} ${candidate.snippet} ${candidate.url}`.toLowerCase();
  const host = candidate.host || domainFromUrl(candidate.url);
  let score = 0;

  if (candidateMentionsCompany(candidate, context.name, context.domain)) score += 6;
  else score -= 4;

  if (context.domain && host.includes(context.domain.replace(/^www\./, "").toLowerCase())) score += 4;
  if (candidate.news_mode && lane.id === "news_press_ir") score += 3;
  if (candidate.direct) score += 2;

  const hostBoosts = {
    news_press_ir: ["reuters.com", "businesswire.com", "prnewswire.com", "globenewswire.com"],
    earnings_sec: ["sec.gov", "seekingalpha.com", "fool.com", "finance.yahoo.com"],
    careers_org: ["greenhouse.io", "lever.co", "ashbyhq.com", "job-boards.greenhouse.io"],
    risk_regulatory: ["justice.gov", "sec.gov", "ftc.gov", "consumerfinance.gov", "reuters.com"],
  };

  for (const preferredHost of hostBoosts[lane.id] || []) {
    if (host.includes(preferredHost)) score += 5;
  }

  const laneKeywords = {
    news_press_ir: ["press", "newsroom", "investor", "announcement", "launch", "partnership"],
    earnings_sec: ["earnings", "10-k", "10-q", "annual report", "transcript", "investor"],
    careers_org: ["careers", "jobs", "hiring", "talent", "recruiting"],
    official_site: ["product", "platform", "blog", "press", "news", "solutions"],
    risk_regulatory: ["lawsuit", "outage", "breach", "investigation", "fine", "consent order", "recall"],
  };

  for (const keyword of laneKeywords[lane.id] || []) {
    if (haystack.includes(keyword)) score += 1.5;
  }

  return score;
}

function rankCandidates(candidates, lane, context) {
  const deduped = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const key = (candidate.url || "").split("#")[0];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...candidate,
      score: scoreCandidate(candidate, lane, context),
    });
  }

  return deduped.sort((a, b) => b.score - a.score).slice(0, SEARCH_RESULT_LIMIT);
}

async function capturePageEvidence(page, candidate) {
  if (!candidate?.url || /\.pdf($|\?)/i.test(candidate.url)) return null;

  try {
    await safeGoto(page, candidate.url);
    const evidence = await page.evaluate(
      ({ maxText }) => {
        const normalize = (value, max = 400) =>
          String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
        const meta = (selectors) => {
          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
              const content = el.getAttribute("content") || el.getAttribute("datetime") || el.textContent;
              if (content) return normalize(content, 220);
            }
          }
          return "";
        };

        const title = normalize(document.title, 220);
        const description = meta([
          'meta[name="description"]',
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
        ]);
        const published = meta([
          'meta[property="article:published_time"]',
          'meta[name="article:published_time"]',
          'meta[name="parsely-pub-date"]',
          'meta[name="publish-date"]',
          'time[datetime]',
          "time",
        ]);
        const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
          .map((node) => normalize(node.textContent, 140))
          .filter(Boolean)
          .slice(0, 10);
        const blocks = Array.from(document.querySelectorAll("article p, main p, p, li"))
          .map((node) => normalize(node.textContent, 320))
          .filter((text) => text.length >= 60)
          .slice(0, 24);

        return {
          url: location.href,
          host: location.hostname.replace(/^www\./, "").toLowerCase(),
          pageTitle: title,
          description,
          published,
          headings,
          text: blocks.join("\n").slice(0, maxText),
        };
      },
      { maxText: EVIDENCE_TEXT_LIMIT },
    );

    return {
      url: evidence.url || candidate.url,
      host: evidence.host || candidate.host,
      search_title: candidate.title,
      search_snippet: candidate.snippet,
      page_title: evidence.pageTitle,
      description: evidence.description,
      published: evidence.published,
      headings: evidence.headings,
      text: evidence.text,
      engine: candidate.engine,
      query: candidate.query,
      direct: !!candidate.direct,
    };
  } catch (error) {
    console.error(`  [page] Failed to capture ${candidate.url}: ${error.message}`);
    return null;
  }
}

function snippetOnlyEvidence(candidates) {
  return candidates.slice(0, 4).map((candidate) => ({
    url: candidate.url,
    host: candidate.host,
    search_title: candidate.title,
    search_snippet: candidate.snippet,
    page_title: candidate.title,
    description: candidate.snippet,
    published: "",
    headings: [],
    text: candidate.snippet,
    engine: candidate.engine,
    query: candidate.query,
    direct: !!candidate.direct,
    snippet_only: true,
  }));
}

function buildEvidencePacket(evidenceItems) {
  return evidenceItems
    .map((item, index) => {
      const headingLines = (item.headings || []).map((heading) => `- ${heading}`).join("\n");
      return [
        `Evidence ${index + 1}`,
        `URL: ${item.url}`,
        `Host: ${item.host || "Unknown"}`,
        `Search title: ${item.search_title || "Unknown"}`,
        `Search snippet: ${item.search_snippet || "Unknown"}`,
        `Page title: ${item.page_title || "Unknown"}`,
        `Published: ${item.published || "Unknown"}`,
        headingLines ? `Headings:\n${headingLines}` : "Headings: None",
        `Content excerpt:\n${item.text || item.description || "Unknown"}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

async function callAnthropicObject({ system, prompt, maxTokens = 1400 }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.MODEL_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature: 0,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic ${response.status}: ${text.slice(0, 400)}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return extractJsonObject(text);
}

async function synthesizeSignalsFromEvidence(lane, context, evidenceItems) {
  if (!evidenceItems.length) return [];

  const evidencePacket = buildEvidencePacket(evidenceItems);
  const system = [
    "You extract account intelligence for Antaeus Signal Console.",
    "Use only the supplied evidence.",
    "Never invent facts, dates, or URLs.",
    "Return strict JSON with a top-level signals array.",
    `Allowed categories: ${SIGNAL_CATEGORIES.join(", ")}.`,
  ].join(" ");

  const prompt = `${buildCompanyContext(context)}

Lane: ${lane.label}
Lane focus: ${lane.extractionFocus}

Return strict JSON in this exact shape:
{
  "signals": [
    {
      "category": "ai_transformation | trigger_event | pain_point | internal_intel | market_position",
      "headline": "short signal headline",
      "detail": "1-2 sentence explanation with specifics from the evidence",
      "why_it_matters": "why this matters for a B2B seller",
      "source": "short source label",
      "date": "YYYY-MM or Unknown",
      "url": "https://exact-source-url",
      "confidence": 0.0
    }
  ]
}

Rules:
- Produce 0 to ${lane.maxSignals} signals only.
- Only include signals with concrete evidence about ${context.name}.
- Prefer signals from the last 12 months.
- Use the exact evidence URL for each signal.
- Confidence should reflect source strength and specificity.

Evidence:
${evidencePacket}`;

  try {
    const parsed = SignalSchema.parse(await callAnthropicObject({ system, prompt }));
    return parsed.signals.map((signal) => ({
      ...signal,
      date: monthString(signal.date),
      lane: lane.id,
      source_type: lane.id,
    }));
  } catch (error) {
    console.error(`  [${lane.id}] Claude synthesis failed: ${error.message}`);
    return [];
  }
}

async function synthesizeCompanyInfo(context, evidenceItems) {
  if (!evidenceItems.length) return normalizeCompanyInfo(null, context);

  const prompt = `${buildCompanyContext(context)}

Use the evidence below to extract a lightweight company profile.
Return strict JSON with this exact shape:
{
  "industry": "string or Unknown",
  "sector": "string or Unknown",
  "revenue": "string or Unknown",
  "employees": "string or Unknown",
  "hq": "string or Unknown",
  "description": "string or Unknown"
}

Rules:
- Use only evidence provided.
- If the evidence does not clearly support a value, return Unknown.
- Approximate values are fine when clearly indicated.

Evidence:
${buildEvidencePacket(evidenceItems)}`;

  try {
    return CompanyInfoSchema.parse(await callAnthropicObject({
      system: "Extract factual company profile data from evidence only. Return strict JSON.",
      prompt,
      maxTokens: 900,
    }));
  } catch (error) {
    console.error(`  [profile] Claude profile synthesis failed: ${error.message}`);
    return normalizeCompanyInfo(null, context);
  }
}

function buildLaneConfigs(context) {
  const tickerHint = context.ticker ? `${context.ticker} ` : "";
  const domainHint = context.domain ? ` site:${context.domain}` : "";

  return [
    {
      id: "news_press_ir",
      label: "News / Press / IR",
      maxSignals: 4,
      extractionFocus:
        "Press releases, newsroom items, investor-relations announcements, launches, partnerships, acquisitions, and public strategic statements.",
      queries: [
        { query: `"${context.name}" (press release OR newsroom OR investor relations OR announcement) 2025 2026`, news: true },
        { query: `"${context.name}" (press release OR newsroom OR investor relations OR announcement) 2025 2026`, news: false },
      ],
    },
    {
      id: "earnings_sec",
      label: "Earnings / SEC / Transcripts",
      maxSignals: 3,
      extractionFocus:
        "Budget priorities, efficiency programs, AI investment, CX or ops transformation, cost pressure, risk disclosures, and executive commentary.",
      queries: [
        { query: `${tickerHint}"${context.name}" (earnings call transcript OR annual report OR shareholder letter) 2025 2026`, news: false },
        { query: `${tickerHint}"${context.name}" (10-K OR 10-Q OR SEC filing OR investor presentation)${domainHint}`, news: false },
      ],
    },
    {
      id: "careers_org",
      label: "Careers / Hiring / Org Signals",
      maxSignals: 3,
      extractionFocus:
        "Hiring surges, new teams, named leaders, AI or ops hiring, CX org buildout, and org changes that imply new initiatives.",
      queries: [
        { query: context.domain ? `site:${context.domain} (careers OR jobs OR hiring)` : `"${context.name}" (careers OR jobs OR hiring)`, news: false },
        { query: `"${context.name}" (AI hiring OR operations hiring OR customer support hiring OR customer experience hiring) 2025 2026`, news: false },
      ],
    },
    {
      id: "official_site",
      label: "Official Site / Product / Messaging",
      maxSignals: 3,
      extractionFocus:
        "Official product launches, solution messaging shifts, AI or automation positioning, transformation language, and company-stated priorities.",
      queries: [
        { query: context.domain ? `site:${context.domain} (news OR press OR blog OR platform OR product launch OR AI)` : `"${context.name}" (product launch OR blog OR platform OR AI)`, news: false },
      ],
    },
    {
      id: "risk_regulatory",
      label: "Regulatory / Outage / Risk",
      maxSignals: 3,
      extractionFocus:
        "Outages, breaches, legal pressure, investigations, fines, compliance burdens, recalls, or public incidents that create buyer urgency.",
      queries: [
        { query: `"${context.name}" (outage OR breach OR lawsuit OR investigation OR fine OR consent order OR recall OR regulatory) 2025 2026`, news: true },
        { query: `"${context.name}" (outage OR breach OR lawsuit OR investigation OR fine OR consent order OR recall OR regulatory) 2025 2026`, news: false },
      ],
    },
  ];
}

async function runSignalLane(context, lane) {
  console.log(`  [${lane.id}] Starting lane...`);

  return withStagehand(lane.id, async ({ page }) => {
    const rawCandidates = [];

    for (const queryDef of lane.queries) {
      const results = await collectSearchCandidates(page, queryDef.query, { news: queryDef.news });
      rawCandidates.push(...results);
    }

    rawCandidates.push(...buildDirectCandidates(context, lane));

    const ranked = rankCandidates(rawCandidates, lane, context);
    const evidenceItems = [];

    for (const candidate of ranked.slice(0, EVIDENCE_VISIT_LIMIT)) {
      const evidence = await capturePageEvidence(page, candidate);
      if (evidence) evidenceItems.push(evidence);
    }

    const fallbackEvidence = snippetOnlyEvidence(ranked);
    const synthesisEvidence = evidenceItems.length ? [...evidenceItems, ...fallbackEvidence] : fallbackEvidence;
    const signals = await synthesizeSignalsFromEvidence(lane, context, synthesisEvidence);

    console.log(`  [${lane.id}] ${signals.length} signals from ${synthesisEvidence.length} evidence items`);

    return {
      id: lane.id,
      label: lane.label,
      queryCount: lane.queries.length,
      candidateCount: ranked.length,
      evidenceCount: synthesisEvidence.length,
      signalCount: signals.length,
      signals,
    };
  });
}

async function runProfileLane(context) {
  return withStagehand("profile", async ({ page }) => {
    const queries = [
      {
        query: `"${context.name}" company revenue employees headquarters industry ${context.domain || ""}`.trim(),
        news: false,
      },
      {
        query: `"${context.name}" company overview investor relations ${context.ticker || ""}`.trim(),
        news: false,
      },
    ];

    const rawCandidates = [];
    for (const queryDef of queries) {
      rawCandidates.push(...(await collectSearchCandidates(page, queryDef.query, { news: false })));
    }

    const ranked = rankCandidates(rawCandidates, { id: "profile", label: "Company Profile" }, context);
    const evidence = snippetOnlyEvidence(ranked);
    const info = await synthesizeCompanyInfo(context, evidence);

    return {
      info,
      queryCount: queries.length,
      candidateCount: ranked.length,
      evidenceCount: evidence.length,
    };
  });
}

app.post("/enrich", async (req, res) => {
  const context = {
    name: normalizeText(req.body?.name, 160),
    domain: normalizeText(req.body?.domain, 160).replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    industry: normalizeText(req.body?.industry, 120),
    sector: normalizeText(req.body?.sector, 120),
    ticker: normalizeText(req.body?.ticker, 40),
  };

  if (!context.name) {
    return res.status(400).json({ error: "name is required" });
  }

  const authResult = await authenticateRequest(req);
  if (authResult.error) {
    return res.status(authResult.error.status).json({ error: authResult.error.message });
  }

  const clientKey =
    (authResult.user && authResult.user.id) ||
    req.get("cf-connecting-ip") ||
    req.ip ||
    "anonymous";
  const rateLimit = takeRateLimitToken(clientKey);
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  res.setHeader("X-RateLimit-Reset", String(rateLimit.resetAt));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: "Rate limit exceeded for enrichment requests" });
  }

  console.log(`\n=== Enriching: ${context.name} (${context.domain || "no domain"}) ===`);
  const start = Date.now();

  try {
    assertServerConfig();

    const laneConfigs = buildLaneConfigs(context);
    const [profileLane, ...signalLaneResults] = await Promise.all([
      runProfileLane(context),
      ...laneConfigs.map((lane) =>
        runSignalLane(context, lane).catch((error) => ({
          id: lane.id,
          label: lane.label,
          queryCount: lane.queries.length,
          candidateCount: 0,
          evidenceCount: 0,
          signalCount: 0,
          signals: [],
          error: error.message,
        })),
      ),
    ]);

    const mergedSignals = dedupeSignals(signalLaneResults.flatMap((lane) => lane.signals || []));
    const mappedSignals = mapSignalsToConsole(mergedSignals);
    const heat = computeHeat(mappedSignals);
    const elapsed = `${((Date.now() - start) / 1000).toFixed(1)}s`;

    console.log(`=== Done: ${mappedSignals.length} signals, heat ${heat}, ${elapsed} ===\n`);

    return res.json({
      name: context.name,
      domain: context.domain || null,
      info: normalizeCompanyInfo(profileLane.info, context),
      signals: mappedSignals,
      heat,
      enrichedAt: new Date().toISOString(),
      elapsed,
      debug: {
        profile: {
          candidateCount: profileLane.candidateCount,
          evidenceCount: profileLane.evidenceCount,
        },
        lanes: signalLaneResults.map((lane) => ({
          id: lane.id,
          label: lane.label,
          queryCount: lane.queryCount,
          candidateCount: lane.candidateCount,
          evidenceCount: lane.evidenceCount,
          signalCount: lane.signalCount,
          error: lane.error || null,
        })),
      },
    });
  } catch (error) {
    console.error(`=== ERROR: ${error.message} ===`);
    return res.status(500).json({ error: error.message || "Enrichment failed" });
  }
});

app.get("/", (_req, res) => {
  res.json({
    service: "Antaeus Enrichment Server",
    status: "ok",
    endpoints: {
      health: "/health",
      enrich: "POST /enrich",
    },
  });
});

app.get("/health", (_req, res) => {
  const missing = getMissingEnvKeys();
  const authMissing = getMissingAuthEnvKeys();
  res.json({
    status: "ok",
    host: HOST,
    port: PORT,
    stagehandModel: STAGEHAND_MODEL,
    anthropicModel: ANTHROPIC_MODEL,
    browserbase: !!process.env.BROWSERBASE_API_KEY,
    projectId: !!process.env.BROWSERBASE_PROJECT_ID,
    modelKey: !!process.env.MODEL_API_KEY,
    requireSupabaseAuth: REQUIRE_SUPABASE_AUTH,
    authEnvReady: authMissing.length === 0,
    authMissing,
    rateLimit: { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX },
    allowedOrigins: parseAllowedOrigins(),
    missing,
  });
});

app.listen(PORT, HOST, () => {
  const missing = getMissingEnvKeys();
  const browserbaseReady = !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID;
  const authMissing = getMissingAuthEnvKeys();

  console.log(`
+-------------------------------------------------------+
|  Antaeus Enrichment Server                            |
|  http://localhost:${String(PORT).padEnd(34)}|
|  Stagehand: ${STAGEHAND_MODEL.padEnd(39)}|
|  Claude: ${ANTHROPIC_MODEL.padEnd(42)}|
|  Browserbase: ${(browserbaseReady ? "Connected" : "Missing config").padEnd(31)}|
|  Supabase auth: ${(REQUIRE_SUPABASE_AUTH ? (authMissing.length ? "Config missing" : "Required") : "Optional").padEnd(28)}|
+-------------------------------------------------------+
`);

  if (missing.length) {
    console.log(`Missing env vars: ${missing.join(", ")}`);
  }
  if (REQUIRE_SUPABASE_AUTH && authMissing.length) {
    console.log(`Missing auth env vars: ${authMissing.join(", ")}`);
  }
});
