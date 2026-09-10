# Planex AI Worker

Cloudflare Worker proxy that powers the **Planex AI** Ideate stage with Google Gemini.
It holds the API key, owns server-side sessions in D1, streams the assistant reply, and
returns a structured context patch plus proposal cards.

The static app on GitHub Pages calls this Worker; the browser never sees an API key.

## What it does

- `POST /session/start` — verifies **Cloudflare Turnstile**, creates an anonymous project
  session, returns a signed HMAC token.
- `POST /chat` — **SSE stream**: streams the prose reply (Gemini Flash) while a parallel
  Gemini Flash-Lite call returns the context patch and proposals.
- `GET /context` / `PUT /context` — read / user-edit the evolving brief.
- `POST /audit` — record applied proposals, edits, and reverts.
- `GET /health` — liveness.

## Prerequisites

- Node 18+ and a Cloudflare account.
- A **Gemini API key** from Google AI Studio.
- A **Turnstile site key + secret** (Cloudflare dashboard → Turnstile).

## Setup

```bash
cd worker
npm install

# 1. Create the D1 database and copy the printed database_id into wrangler.toml
npx wrangler d1 create planex-ai

# 2. Apply the schema
npx wrangler d1 execute planex-ai --remote --file=./migrations/0001_init.sql

# 3. Set secrets (never commit these)
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put SESSION_SIGNING_KEY   # any long random string

# 4. Deploy
npx wrangler deploy
```

Then set the app's `js/config.js`:

```js
window.PLANEX_CONFIG = {
  workerUrl: 'https://planex-ai.<your-subdomain>.workers.dev',
  turnstileSiteKey: '<your public site key>'
};
```

If `workerUrl` is left empty, the app uses its built-in offline assistant.

## Local development

```bash
npx wrangler d1 execute planex-ai --local --file=./migrations/0001_init.sql
npx wrangler dev
```

`wrangler dev` exposes a local URL; point `js/config.js` at it while testing. For Turnstile
in development, use Cloudflare's test keys:
`1x00000000000000000000AA` (always passes) and secret
`1x0000000000000000000000000000000AA`.

## Configuration (`wrangler.toml`)

| Var | Meaning |
|---|---|
| `ALLOWED_ORIGIN` | The app origin allowed by CORS, e.g. `https://neeraj1605.github.io` |
| `ALLOWED_ORIGINS_EXTRA` | Comma-separated extra origins (local dev) |
| `GEMINI_FLASH_MODEL` | Model for the streamed reply |
| `GEMINI_LITE_MODEL` | Model for structured extraction |
| `DAILY_TURN_CAP` | Global daily turn budget across all sessions |
| `SESSION_HOURLY_LIMIT` | Per-session hourly message cap |
| `MAX_ATTACHMENT_BYTES` | Total inline attachment budget per request |

> **Verify model IDs and free-tier limits** against `ai.google.dev` before launch; names and
> quotas change over time.

## Security model

- Turnstile is required at session start, so bots cannot mint sessions.
- Every `/chat`, `/context`, and `/audit` call requires a valid signed token.
- Per-session rate limit + global daily cap protect the free quota.
- CORS restricts browser origins; the signed token protects non-browser callers.
- Raw photo bytes are **not persisted** — only kind/mime/name/size metadata.
- Model output is schema-validated and sanitised before it can touch the brief.

## Tests

```bash
npm test        # merge patch, schema sanitisation, token sign/verify
```

## Layout

```
worker/
  wrangler.toml
  migrations/0001_init.sql
  src/
    index.js       router + SSE
    gemini.js      Flash streaming + Flash-Lite structured
    session.js     HMAC tokens
    turnstile.js   Turnstile verification
    quota.js       rate limits + daily cap
    db.js          D1 accessors
    schema.js      output validation/sanitisation
    merge.js       RFC 7386 merge patch
    prompts.js     persona, grounding, extraction instruction
    cors.js        CORS helpers
  test/
```
