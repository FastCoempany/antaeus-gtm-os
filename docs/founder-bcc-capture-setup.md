# BCC capture — founder setup (click by click)

**What this turns on:** every operator gets a personal address
(`log+<token>@<your capture domain>`). Mail they BCC to it gets matched to
the account they're watching and logged as an outbound touch — the
outreach tallies, "where you are with them," and the daily pace all count
it with no typing. The function stores the subject line, recipient, and
timestamp; never the message body.

**What's already built and shipped:** the `inbound-email` Supabase Edge
Function, the per-workspace address minting in Settings, and the Settings
section that shows the address the moment the domain below is live.

**What only you can do:** pick the mail domain, point its DNS at the
inbound provider, and set two secrets. About 30 minutes, once.

---

## 1 · Pick the capture domain

A subdomain of a domain you own, used for nothing else. Suggested:
`in.antaeus.app`.

## 2 · Create a Postmark account + inbound server (~10 min)

Postmark's inbound parsing is the simplest reliable option (Mailgun works
too; steps below are Postmark).

1. Sign up at postmarkapp.com (the free developer tier covers testing).
2. **Servers → Create server** → name it `antaeus-inbound`.
3. Open the server → **Settings → Inbound**.
4. Under **Inbound domain forwarding**, enter your capture domain:
   `in.antaeus.app`. Postmark shows you an **MX record** to add.

## 3 · DNS (~5 min, wherever antaeus.app's DNS lives — Cloudflare)

1. Cloudflare dashboard → antaeus.app → **DNS → Records → Add record**.
2. Type **MX** · Name `in` · Mail server `inbound.postmarkapp.com` ·
   Priority `10` · TTL auto → Save.
3. Wait for it to verify in Postmark's Inbound settings page (minutes).

## 4 · Deploy the function + secrets (~5 min, terminal)

```bash
# from the repo root, with the Supabase CLI linked as usual
supabase functions deploy inbound-email --no-verify-jwt

# a long random string only you and Postmark know:
supabase secrets set INBOUND_EMAIL_SECRET=<paste-a-long-random-string>
```

(`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are injected automatically
for deployed functions — nothing to set there.)

## 5 · Point Postmark at the function

In the same **Settings → Inbound** page, set the **Webhook URL** to:

```
https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/inbound-email?secret=<the-same-random-string>
```

Save. Use the page's **"Send test"** button — the function should answer
`200` with `{"ok":true,...}` in the webhook activity log.

## 6 · Tell the app the domain is live (~3 min)

Cloudflare dashboard → Workers & Pages → **autumn-water-148a** →
Settings → Variables (Builds) → add to **both Production and Preview**:

```
VITE_CAPTURE_EMAIL_DOMAIN = in.antaeus.app
```

Trigger a deploy (any push, or retry the last build). From then on,
Settings → "Counting your work automatically" → "Email — your BCC
address" shows each operator their real address with a copy button.

## 7 · Verify end to end (~2 min)

1. In the app: Settings → create your address → copy it.
2. Send yourself an email to any real address, with the capture address
   in **BCC**, from the email account you sell from, with a recipient at
   a company you're watching in Signal Console.
3. Open Outbound Studio: the send appears in the touch history for that
   account; the quota pace read counts it.

## Rotation / troubleshooting

- **Rotate the webhook secret:** `supabase secrets set
  INBOUND_EMAIL_SECRET=<new>` then update the Postmark webhook URL. The
  operator addresses don't change.
- **A send didn't appear:** Postmark's Activity page shows every inbound
  message and the webhook response — a `200` with `"skipped"` explains
  itself (no capture address on the mail / unknown token); a `401` means
  the secret in the webhook URL doesn't match.
- **Wrong account matched:** matching is by recipient domain against the
  watched account's domain (or name). Fix the account's domain in Signal
  Console and future sends match correctly.
