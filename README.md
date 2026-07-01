# Audit Status Portal

A fast, private, **bilingual (বাংলা / English)** web terminal where a person
enters their **12-digit TIN** and learns in under a second whether they were
**selected for tax audit** (Assessment Year 2023–2024) on the NBR list — with
the handling zone and circle — **without making mass enumeration any easier than
the already-public list.**

> ⚠️ **Unofficial convenience tool.** Not affiliated with the National Board of
> Revenue (NBR). Always verify your status with NBR.
>
> 🧪 This deployment runs on a **clearly-labelled synthetic sample dataset**
> (~5,014 fabricated records). The real NBR list is **not** redistributed in
> this repo. Drop the real export into `/source` and rebuild to use it.

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
  - [Windows — one-line install](#windows--one-line-install)
  - [macOS / Linux](#macos--linux)
- [Prerequisites](#prerequisites)
- [Commands](#commands)
- [How it works (architecture)](#how-it-works-architecture)
- [Privacy & security guardrails](#privacy--security-guardrails)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data pipeline](#data-pipeline)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Admin console](#admin-console)
- [Testing](#testing)
- [Deploying to Vercel](#deploying-to-vercel)
- [Troubleshooting](#troubleshooting)
- [License / use](#license--use)

---

## Features

- **12-digit TIN lookup** — exact match only, result rendered inline as an
  official "stamp" (amber = selected, jade = not selected).
- **Signature UI** — a 12-cell segmented TIN input (paste, arrow keys,
  backspace, numeric keypad) with a scan-sweep animation on submit.
- **Bilingual, first-class** — every string flows through next-intl; toggle
  between English (`/`) and বাংলা (`/bn`) on any page.
- **Public statistics** — zone bar chart, top circles, submission-type
  breakdown. **Counts only — never any TIN.**
- **Official console** — auth-gated browse/filter/paginate, CSV/XLSX export
  (TINs masked by default; opt-in unmask is audited), 90-day KV audit log.
- **Privacy by construction** — POST-only lookup, no TIN in URLs/logs/history,
  no bulk endpoint, per-connection rate limiting.
- **Ships green** — 39 unit tests (Vitest) + 13 end-to-end tests (Playwright),
  strict TypeScript, AA contrast, full keyboard operation, reduced-motion aware.

## Quick start

### Windows — one-line install

Open **PowerShell** and run:

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Muminur/AuditTIN/claude/beautiful-planck-i1wv3z/scripts/install.ps1 | iex"
```

This checks Git + Node, clones the repo, runs `npm install`, and creates
`.env.local` with a freshly-generated `AUTH_SECRET`. When it finishes:

```powershell
cd AuditTIN
npm run dev
```

Already cloned the repo? Run the installer locally instead:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

> The repo is private, so `git clone` may prompt you to sign in to GitHub the
> first time. If the one-liner is blocked by execution policy, the
> `-ExecutionPolicy Bypass` flag above already handles it for that single run.

### macOS / Linux

```bash
git clone -b claude/beautiful-planck-i1wv3z https://github.com/Muminur/AuditTIN.git
cd AuditTIN
npm install
cp .env.example .env.local          # then fill in AUTH_SECRET, ADMIN_* …
npm run dev                         # http://localhost:3000
```

Generate an `AUTH_SECRET` with `npx auth secret` (or `openssl rand -base64 32`).

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | **22+** | `winget install OpenJS.NodeJS.LTS` / `nvm install 22` |
| **npm** | 10+ | Ships with Node |
| **Git** | any | For cloning |

The project uses `.npmrc` (`legacy-peer-deps=true`) so installs are
reproducible everywhere — no extra flags needed.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server (runs `prebuild` → ingest + SEO first) |
| `npm run build` | Production build (`prebuild` → `next build`) |
| `npm run start` | Serve the production build |
| `npm run ingest` | Regenerate `data/*.json` from `/source` |
| `npm run generate-sample` | Recreate the deterministic synthetic source CSV |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run format` | Prettier write |

## How it works (architecture)

The dataset is tiny (~5k rows, < 500 KB), so the public path uses **no database**:

```
git push → Vercel build → prebuild: ingest.ts (CSV/PDF → normalize → validate → dedupe)
         → data/audit-2023-2024.json (TIN-keyed) + meta.json + stats.json  (bundled)
         → gen-seo.ts → public/robots.txt + public/sitemap.xml

Edge  POST /api/lookup  →  Map.get(tin)   O(1), no DB, no cold start
Edge  GET  /api/stats   →  cached aggregates (counts only — never a TIN)
Edge  GET  /api/health  →  dataset version / count / build SHA
Node  /api/admin/*      →  auth + full search/export + audit log

Vercel KV (Upstash): rate limits + admin audit log. Functions pinned to sin1.
```

**Upgrade path:** swap the bundled JSON for Vercel Postgres/Neon behind the same
API contract if writes, history, or >100k rows are ever needed — the frontend
is unchanged.

## Privacy & security guardrails

These are **non-negotiable**; no feature may weaken them.

- **Exact 12-digit match only** — no partial/prefix/wildcard/autocomplete.
- **Lookup is a `POST`** — the TIN travels in the request body, never in a URL,
  query string, browser history, referrer, or access log. (`GET /api/lookup`
  returns `405`.)
- **The TIN is never logged** anywhere; every lookup is `no-store`.
- **No bulk endpoint.** Public statistics expose **counts only — never TINs**.
- **Rate limited** — Upstash sliding window (default 10/min, 100/day) →
  `429` with `Retry-After`. Falls back to an in-memory limiter without KV.
- **Admin is auth-gated** (Auth.js v5 allowlist) and **every access is logged**;
  TINs are **masked by default** (`44****7337`), unmasked only on an explicit,
  audited export.
- **Persistent disclaimer** on every page; strict CSP + security headers via
  `vercel.json`.

## Tech stack

Next.js 15 (App Router, RSC) · React 19 · TypeScript 5 (`strict`) · Tailwind v4
(`@theme` tokens) · next-intl (bn/en) · Zod · Framer Motion · Recharts ·
Vercel KV + `@upstash/ratelimit` · Auth.js v5 · SheetJS (export) ·
Vitest + Playwright · Vercel Analytics + Speed Insights.

**Fonts:** Space Grotesk (display) · Inter (body) · IBM Plex Mono (TIN/data) ·
Hind Siliguri (Bangla).

## Project structure

```
AuditTIN/
├─ scripts/
│  ├─ generate-sample.ts   # deterministic synthetic source CSV
│  ├─ ingest.ts            # source → normalized/validated data/*.json  (prebuild)
│  ├─ gen-seo.ts           # public/robots.txt + sitemap.xml            (prebuild)
│  └─ install.ps1          # Windows one-line installer
├─ source/
│  └─ audit-sample.csv     # committed synthetic source (SL|TIN|Zone|Circle|Type|AY)
├─ data/                   # generated at build (git-ignored): dataset + meta + stats
├─ public/                 # generated robots.txt + sitemap.xml (git-ignored)
├─ src/
│  ├─ middleware.ts        # next-intl locale routing
│  ├─ i18n/                # routing, request config, en/bn message catalogs
│  ├─ styles/globals.css   # Tailwind v4 @theme "Midnight Ledger" tokens
│  ├─ lib/                 # types, validation (Zod), data, meta, ratelimit,
│  │                       # auth, admin, audit-log, normalize, fonts, utils
│  ├─ components/          # tin-input, result-stamp, lookup-terminal, stats-charts,
│  │                       # header/footer, lang-toggle, admin/*
│  ├─ app/
│  │  ├─ [locale]/         # home, statistics, about, faq, privacy, admin/*
│  │  └─ api/              # lookup, stats, health, auth, admin/{search,export}
│  └─ tests/               # unit (Vitest) + e2e (Playwright)
├─ vercel.json             # region sin1, CSP + security headers
├─ .env.example            # all env vars documented
└─ PLANNING.md · TASKS.md · CLAUDE.md
```

## Data pipeline

1. Put a source export in `/source` (CSV preferred; PDF fallback). Columns:
   `SL | TIN | Zone | Circle | Type | AY`.
2. `prebuild` runs `scripts/ingest.ts`:
   parse → **normalize zones** (fix PDF line-wraps like `"16, Dhaka"` →
   `"Taxes Zone-16, Dhaka"`, unify casing) + submission types + circles →
   **Zod-validate** each row (reject + report) → **dedupe by TIN** →
   emit TIN-keyed JSON + `meta.json` (sha256, count) + `stats.json`
   (counts only). Then `scripts/gen-seo.ts` writes `robots.txt` + `sitemap.xml`.
3. **CI gate:** the build fails on zero valid rows, a reject rate above
   `MAX_REJECT_RATE` (default 2%), or — when `EXPECTED_COUNT` is set —
   row-count drift beyond `DRIFT_PCT`.

Generated `data/*.json` and `public/{robots.txt,sitemap.xml}` are git-ignored
and rebuilt deterministically on every build.

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_DATASET_LABEL` / `_DATE` | Footer dataset label + publish date |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for SEO / sitemap |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV (rate limits + audit log) |
| `RATE_LIMIT_PER_MINUTE` / `_PER_DAY` | Lookup rate-limit knobs (default 10 / 100) |
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated admin emails |
| `ADMIN_PASSWORD` | Shared password for the demo admin gate |

Without KV configured, the app falls back to an **in-memory** rate limiter
(per-instance, dev only) and the audit log no-ops.

## API reference

| Method & path | Runtime | Auth | Notes |
|---|---|---|---|
| `POST /api/lookup` | edge | — | Body `{ "tin": "123456789012" }`; `no-store`; rate-limited; never logs the TIN |
| `GET /api/lookup` | edge | — | `405` — the TIN must never travel in a URL |
| `GET /api/stats` | edge | — | Cached aggregates; counts only |
| `GET /api/health` | edge | — | `{ ok, count, sha256, buildSha, … }` |
| `POST /api/admin/search` | node | ✅ | Filter/sort/paginate; TINs masked on the wire |
| `GET /api/admin/export` | node | ✅ | `?format=csv\|xlsx&unmask=true\|false`; unmask is audited |
| `GET/POST /api/auth/*` | node | — | Auth.js handlers |

Example lookup:

```bash
curl -X POST http://localhost:3000/api/lookup \
  -H "Content-Type: application/json" \
  -d '{"tin":"123456789012"}'
```

## Admin console

`/admin` (and `/bn/admin`) — sign in with an allowlisted email + the shared
password. Browse / filter / paginate selections (TINs masked), export CSV/XLSX
(opt-in unmask is recorded in the audit log), and review recent access.

Configure `AUTH_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, and `ADMIN_PASSWORD` in your
env before using it.

## Testing

```bash
npm run test     # 39 Vitest unit tests: validation, normalize, admin filter, utils
npm run e2e      # 13 Playwright tests: lookup happy path, invalid TIN,
                 #   no-TIN-in-URL, rate limit, a11y smoke, keyboard, lang toggle
```

The e2e config builds and serves the app automatically (reusing a running
server if one is on the port). In sandboxes that pre-install a fixed Chromium,
point Playwright at it:

```bash
PW_CHROMIUM_PATH=/path/to/chrome npm run e2e
```

## Deploying to Vercel

The repo is fully Vercel-ready (`vercel.json`, `.npmrc`, standard Next.js build).

1. **vercel.com → Add New → Project → Import `Muminur/AuditTIN`** (framework
   auto-detects as Next.js).
2. Add the **Vercel KV** integration → it injects `KV_*` automatically.
3. Set env vars: `AUTH_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, `ADMIN_PASSWORD`, and
   the `NEXT_PUBLIC_*` vars.
4. Region is pinned to `sin1` (Singapore) via `vercel.json` for Bangladesh
   latency. Analytics + Speed Insights are already wired in code.
5. **Hardening (dashboard):** enable the **WAF** rate rule + Attack Challenge
   Mode on `/api/lookup`.
6. Deploy → verify `GET /api/health`, then smoke a live lookup. Every push to
   the connected branch auto-deploys.

Prefer the CLI? `npm i -g vercel && vercel --prod` (needs `vercel login` or a
`VERCEL_TOKEN`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` peer-dep error | Ensure `.npmrc` (`legacy-peer-deps=true`) is present; it ships in the repo |
| PowerShell "running scripts is disabled" | Use the `-ExecutionPolicy Bypass` flag shown above |
| Admin sign-in always fails | Set `AUTH_SECRET`, add your email to `ADMIN_EMAIL_ALLOWLIST`, set `ADMIN_PASSWORD` |
| Rate-limit `429` during local testing | Restart the dev server to clear the in-memory bucket, or raise `RATE_LIMIT_PER_MINUTE` |
| `robots.txt` / `sitemap.xml` missing | They are generated by `prebuild`; run `npm run build` (or `npm run ingest`… then `npm run dev`) |
| Wrong site URL in `sitemap.xml` | Set `NEXT_PUBLIC_SITE_URL`; on Vercel it uses `VERCEL_PROJECT_PRODUCTION_URL` |

## License / use

Provided for public convenience. Mirrors only data the NBR has already
published. **Not a system of record.** The bundled dataset is synthetic and
matches no real taxpayer.
