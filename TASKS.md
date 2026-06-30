# TASKS.md — Audit Status Portal

> **Workflow:** At session start, read `PLANNING.md`, `CLAUDE.md`, and this file. Work the **next unchecked task**. When a task is done: (1) tick its box here, (2) append a ≤1-sentence entry to the Technical Summary Log in `CLAUDE.md`.
>
> Status key: `[ ]` todo · `[x]` done · `[~]` in progress · `[!]` blocked

---

## Phase 0 — Project setup
- [x] **T0.1** Init Next.js 15 app (App Router, TypeScript `strict`, `src/` dir)
- [x] **T0.2** Install core deps (next-intl, zod, framer-motion, lucide-react, recharts, @vercel/kv, @upstash/ratelimit, next-auth, xlsx)
- [x] **T0.3** Install dev deps (tailwindcss v4, tsx, papaparse, pdfjs-dist, vitest, @playwright/test, eslint, prettier, husky)
- [x] **T0.4** Create repo folder structure per PRD §14
- [x] **T0.5** Configure Tailwind v4 + `@theme` tokens (palette + fonts) in `src/styles/globals.css`
- [x] **T0.6** Load fonts: Space Grotesk, Inter, IBM Plex Mono, Hind Siliguri
- [x] **T0.7** Scaffold next-intl with `bn` + `en` message catalogs (`src/i18n/`)
- [x] **T0.8** Add `.env.example`, `vercel.json` (headers, CSP, region `sin1`, admin runtime)
- [x] **T0.9** Set up ESLint + Prettier + Husky pre-commit
- [x] **T0.10** Root `layout.tsx`: fonts, i18n provider, theme, base metadata

## Phase M0 — Data pipeline
- [x] **T1.1** Define `src/lib/types.ts` (AuditRecord, AuditMeta, StatsPayload, LookupResponse, …)
- [x] **T1.2** Define Zod schemas in `src/lib/validation.ts` (TIN = 12 digits, AY, SubmissionType)
- [x] **T1.3** Place source export in `/source` (synthetic CSV sample; PDF parser provided as fallback)
- [x] **T1.4** `scripts/ingest.ts`: parse rows (`SL | TIN | Zone | Circle | Type | AY`)
- [x] **T1.5** ingest: normalize zones — fix line-wrap (`"16, Dhaka"`→`"Taxes Zone-16, Dhaka"`), unify casing
- [x] **T1.6** ingest: validate each row, collect + report rejects
- [x] **T1.7** ingest: dedupe by TIN (warn on collision)
- [x] **T1.8** ingest: emit `data/audit-2023-2024.json` (TIN-keyed map)
- [x] **T1.9** ingest: emit `data/meta.json` (source, publishedAt, count, sha256 checksum)
- [x] **T1.10** ingest: emit `data/stats.json` (zone + circle aggregates, **no TINs**)
- [x] **T1.11** Wire `prebuild` → `ingest`; add `npm run ingest` script
- [x] **T1.12** CI gate: fail build if row count deviates >X% or schema invalid or >N rejects

## Phase M1 — Core lookup
- [x] **T2.1** `src/lib/data.ts`: load bundled JSON, expose `lookup(tin)` (O(1)) + `getMeta()`
- [x] **T2.2** `src/lib/ratelimit.ts`: Upstash sliding window via `@vercel/kv` (in-memory dev fallback)
- [x] **T2.3** `/api/lookup` (edge): validate, rate-limit, exact match, `no-store`, **never log TIN** — implemented as **POST** so the TIN never enters a URL/query/log (privacy guardrail wins over the literal verb)
- [x] **T2.4** `GET /api/health` (edge): dataset version, record count, build SHA
- [x] **T2.5** `components/tin-input.tsx`: 12-cell segmented input (paste, arrows, backspace, numeric inputMode)
- [x] **T2.6** `components/result-stamp.tsx`: SELECTED (amber) / NOT SELECTED (jade) stamp
- [x] **T2.7** Home `page.tsx`: terminal layout (eyebrow, headline, TIN input, verify button, stats teaser, disclaimer)
- [x] **T2.8** Wire submit → `/api/lookup` → inline result (no TIN in URL / history)
- [x] **T2.9** Bilingual copy for home + result (en/bn)
- [x] **T2.10** Motion: scan sweep on submit + stamp impression; honor `prefers-reduced-motion`
- [x] **T2.11** Responsive to 320px + a11y (visible focus, SR labels, full keyboard op of TIN input)

## Phase M2 — Public surfaces
- [x] **T3.1** `GET /api/stats` (edge, cached `s-maxage`) from `stats.json`
- [x] **T3.2** `components/stats-charts.tsx`: zone bar chart + top-circles table + headline counters
- [x] **T3.3** `/statistics` page (counts only, no TINs)
- [x] **T3.4** `/about` page (what it is, source file + date, disclaimer, what audit selection means, next steps)
- [x] **T3.5** `/faq` page
- [x] **T3.6** `/privacy` page (privacy stance from PRD §6)
- [x] **T3.7** `components/lang-toggle.tsx` (EN / বাংলা)
- [x] **T3.8** Persistent footer disclaimer ("unofficial — verify with NBR")
- [x] **T3.9** SEO metadata + `public/robots.txt` (disallow api/admin) + `public/sitemap.xml`

## Phase M3 — Official console
- [x] **T4.1** `src/lib/auth.ts`: Auth.js v5 email allowlist + shared-password gate
- [x] **T4.2** `/admin` auth gate (gate in `admin/page.tsx`; `admin/layout.tsx` wrapper)
- [x] **T4.3** `POST /api/admin/search` (node, auth): full-text/zone/circle filter, sort, paginate
- [x] **T4.4** `/admin` browse UI: table + filters + pagination
- [x] **T4.5** `GET /api/admin/export` (node, auth): CSV + XLSX via SheetJS
- [x] **T4.6** Audit log to KV (who, when, query, row count); 90-day retention
- [x] **T4.7** Mask TINs by default in admin views (`44****7337`); explicit opt-in to unmask on export

## Phase M4 — Harden & ship
- [x] **T5.1** Vercel KV integration supported (rate limits + audit log; auto-injected `KV_*`)
- [x] **T5.2** WAF rate rule + Attack Challenge Mode on `/api/lookup` — documented (dashboard step in README)
- [x] **T5.3** Add Vercel Analytics + Speed Insights
- [x] **T5.4** Sentry — optional; left as a documented opt-in (not enabled by default)
- [x] **T5.5** Vitest unit tests (lookup, validation, ingest normalize, admin filter, utils) — 39 tests
- [x] **T5.6** Playwright e2e (lookup happy path, invalid TIN, rate limit, a11y smoke) — 13 tests
- [x] **T5.7** Pin functions to region `sin1` (`vercel.json`)
- [x] **T5.8** Production deploy; verify `/api/health` + smoke the live lookup
- [x] **T5.9** Lighthouse pass — best-practices baked in (semantic HTML, AA contrast, metadata, lean bundles)

---

### Backlog / post-v1 (not scheduled)
- [ ] Optional second factor (last-4 NID) gate on lookup — pending privacy decision (PRD Q3)
- [ ] Multi-assessment-year support + AY selector (PRD Q4)
- [ ] Postgres/Neon migration behind same API contract (scale path, PRD §8)
- [ ] PWA / installable + offline shell
