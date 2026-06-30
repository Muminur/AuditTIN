# Audit Status Portal

A fast, private, bilingual (**বাংলা / English**) web terminal where a person
enters their **12-digit TIN** and learns in under a second whether they were
**selected for tax audit** (Assessment Year 2023–2024) on the NBR list — with
the handling zone and circle — **without making mass enumeration any easier than
the already-public list.**

> ⚠️ **Unofficial convenience tool.** Not affiliated with the National Board of
> Revenue. Always verify your status with NBR.
>
> 🧪 This deployment runs on a **clearly-labelled synthetic sample dataset**
> (~5,014 fabricated records) so the whole pipeline and UI work end-to-end. Drop
> the real NBR export into `/source` and rebuild to use it.

---

## Why it’s built this way

The dataset is tiny (~5k rows, < 500 KB), so the public path uses **no database**:

```
git push → Vercel build → prebuild: ingest.ts (CSV/PDF → normalize → validate → dedupe)
         → data/audit-2023-2024.json (TIN-keyed) + meta.json + stats.json  (bundled)

Edge  POST /api/lookup  →  Map.get(tin)   O(1), no DB, no cold start
Edge  GET  /api/stats   →  cached aggregates (counts only — never a TIN)
Edge  GET  /api/health  →  dataset version / count / build SHA
Node  /api/admin/*      →  auth + full search/export + audit log

Vercel KV (Upstash): rate limits + admin audit log. Functions pinned to sin1.
```

## Privacy & security guardrails (non-negotiable)

- **Exact 12-digit match only** — no partial/prefix/wildcard/autocomplete.
- **Lookup is a `POST`** — the TIN travels in the request body, never in a URL,
  query string, browser history, referrer, or access log.
- **The TIN is never logged** anywhere; every lookup is `no-store`.
- **No bulk endpoint.** Public statistics expose **counts only — never TINs**.
- **Rate limited** (Upstash sliding window; default 10/min, 100/day → `429`
  with `Retry-After`).
- **Admin is auth-gated** (Auth.js v5 allowlist) and **every access is logged**;
  TINs are **masked by default** (`44****7337`), unmasked only on an explicit,
  audited export.

## Tech stack

Next.js 15 (App Router, RSC) · React 19 · TypeScript 5 (`strict`) · Tailwind v4
(`@theme` tokens) · next-intl (bn/en) · Zod · Framer Motion · Recharts ·
Vercel KV + `@upstash/ratelimit` · Auth.js v5 · SheetJS (export) ·
Vitest + Playwright · Vercel Analytics + Speed Insights.

## Local development

```bash
npm install
cp .env.example .env.local      # fill in AUTH_SECRET, ADMIN_* etc.
npm run generate-sample          # (optional) regenerate the synthetic source CSV
npm run dev                      # http://localhost:3000  (prebuild ingests data)
```

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run ingest` | Regenerate `data/*.json` from `/source` |
| `npm run generate-sample` | Recreate the deterministic synthetic source CSV |
| `npm run build` | `prebuild` (ingest + SEO) → `next build` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests |

## Data pipeline

1. Put a source export in `/source` (CSV preferred; PDF fallback). Columns:
   `SL | TIN | Zone | Circle | Type | AY`.
2. `prebuild` runs `scripts/ingest.ts`: parse → normalize zones (fix PDF
   line-wraps + casing) → Zod-validate (reject + report) → dedupe by TIN →
   emit TIN-keyed JSON + `meta.json` (sha256, count) + `stats.json` (counts
   only) → then `scripts/gen-seo.ts` writes `public/robots.txt` +
   `public/sitemap.xml`.
3. **CI gate:** the build fails on zero valid rows, a reject rate above
   `MAX_REJECT_RATE` (default 2%), or — when `EXPECTED_COUNT` is set — row-count
   drift beyond `DRIFT_PCT`.

The generated `data/*.json` and `public/{robots.txt,sitemap.xml}` are
git-ignored and rebuilt deterministically on every build.

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_DATASET_LABEL` / `_DATE` | Footer dataset label + publish date |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for SEO / sitemap |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV (rate limits + audit log) |
| `RATE_LIMIT_PER_MINUTE` / `_PER_DAY` | Lookup rate-limit knobs |
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated admin emails |
| `ADMIN_PASSWORD` | Shared password for the demo admin gate |

Without KV configured the app falls back to an **in-memory** rate limiter
(per-instance, dev only) and an audit log that no-ops.

## Deploying to Vercel

1. Import the repo in Vercel (framework auto-detected as Next.js).
2. Add the **Vercel KV** integration → it injects `KV_*` automatically.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, `ADMIN_PASSWORD`, and the
   `NEXT_PUBLIC_*` vars in Project Settings.
4. Region is pinned to `sin1` (Singapore) via `vercel.json` for Bangladesh
   latency.
5. **Hardening (dashboard):** enable the **WAF** rate rule + Attack Challenge
   Mode on `/api/lookup`; Analytics + Speed Insights are already wired in code.
6. Deploy. Verify `GET /api/health`, then smoke a live lookup.

## Admin console

`/admin` (and `/bn/admin`) — sign in with an allowlisted email + the shared
password. Browse / filter / paginate selections (TINs masked), export
CSV/XLSX (opt-in unmask is recorded in the audit log), and review recent
access in the audit log.

## License / use

Provided for public convenience. Mirrors only data the NBR has already
published. Not a system of record.
