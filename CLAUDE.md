# CLAUDE.md — Audit Status Portal

Operating instructions for Claude Code working on this repository. Read this fully before doing anything.

---

## 0. Session protocol — DO THIS FIRST, EVERY TIME

**At the start of every working session, before writing any code:**
1. Read **`PLANNING.md`** (the plan, architecture, decisions).
2. Read **`TASKS.md`** (the task list and what's done).
3. Read **this file (`CLAUDE.md`)** (instructions, guardrails, history).

**When working a task:**
1. Pick the **next unchecked task** in `TASKS.md` (respect phase order; honor blockers).
2. Implement it to the Definition of Done (PLANNING §9).
3. **Mark it done:** change its `- [ ]` to `- [x]` in `TASKS.md`.
4. **Log it:** append **one sentence (max)** to the Technical Summary Log at the bottom of this file, describing what was done.

Do not skip steps 3–4. One task → one tick → one sentence.

---

## 1. What this is
A bilingual (বাংলা/English) web portal that lets a person enter their **12-digit TIN** and instantly learn whether they were **selected for tax audit** (AY 2023-2024) per the NBR list `AUDIT_SELECTION_V3` (~5,014 individuals). It also serves public aggregate statistics (no TINs) and an authenticated official console. Full spec: `PRD_Audit_Status_Portal.md`.

This is an **unofficial convenience tool**; NBR is the authoritative source. Every page reflects that. The bundled data in this repo is a **synthetic, clearly-labelled sample** — the real list is not redistributed here.

## 2. Architecture rules
- **Public path uses no database.** Dataset (~5k rows) is ingested at build time into a **TIN-keyed JSON** bundled into the app; lookups are O(1) `Map.get`.
- **Public routes run on the Edge runtime** (`export const runtime = "edge"`): `/api/lookup`, `/api/stats`, `/api/health`.
- **Admin routes run on Node**, behind auth: `/api/admin/*`.
- **Vercel KV (Upstash)** holds only cross-request state: rate limits, admin audit log.
- Functions are region-pinned to **`sin1`** (Bangladesh latency).
- Don't introduce a DB unless a backlog item explicitly calls for it; if scaling is needed, keep the API contract and swap JSON → Postgres/Neon.

## 3. Privacy & security guardrails — NON-NEGOTIABLE
No task may weaken these. If a request conflicts, stop and flag it.
- **Exact 12-digit match only.** No partial search, wildcard, prefix, autocomplete, or "did you mean".
- **No public bulk endpoint or download.** Aggregates expose **counts only — never TINs**.
- **Never log the TIN** (no app logs, no analytics, no error payloads). Lookups are `no-store`.
- **No TIN in any URL, query string, browser history, or shareable page.** The lookup is a **POST** with the TIN in the body; results render inline only.
- **Rate-limit** every lookup (Upstash sliding window; defaults 10/min, 100/day) → 429 with `Retry-After`.
- **No PII beyond the published fields** (Zone, Circle, Submission Type, Assessment Year).
- **Mask TINs** by default in admin/aggregate views (`44****7337`); unmask only on an explicit authorized export.
- **Admin is auth-gated** (Auth.js allowlist) and **all access is logged**.
- **Persistent disclaimer** on every page: unofficial tool, verify with NBR, dataset date shown.

## 4. Coding conventions
- **TypeScript `strict`** end-to-end. Shared types in `src/lib/types.ts`. No `any` on data paths.
- **Validate all external input with Zod** (`src/lib/validation.ts`). TIN = `/^\d{12}$/`.
- File/folder layout per PRD §14. Components in `src/components`, logic in `src/lib`.
- **i18n:** all user-facing strings go through next-intl (`en`/`bn`); no hardcoded copy in components.
- **Copy style:** active voice, sentence case, end-user vocabulary; errors are directive, not apologetic.
- Keep public bundles lean; never import the full record list into a client component (use `src/lib/meta.ts` for light pages).

## 5. Design system (reference — see PRD §7)
- **Concept:** "Verification Terminal" — a precise official instrument. The **signature** is the 12-cell segmented TIN input with a scan sweep → result stamp.
- **Palette (Midnight Ledger):** `--ink #0A1F1A`, `--ink-2 #0F2A22`, `--nbr-green #006A4E`, `--jade #2FBF8F`, `--stamp #F4B740`, `--paper #F5F7F4`, `--mute #8FA89C`. Amber = selected; jade = not selected/verified.
- **Type:** Space Grotesk (display) · Inter (body) · IBM Plex Mono (TIN/data) · Hind Siliguri (Bangla).
- **Motion:** restrained — page-load reveal, scan sweep on submit, stamp impression. Always honor `prefers-reduced-motion`.
- **Quality floor:** responsive to 320px, visible focus, AA contrast, full keyboard operation of the TIN input.

## 6. Commands
```bash
npm run dev        # local dev
npm run ingest     # regenerate data/*.json from /source (CSV or PDF)
npm run build      # prebuild → ingest + SEO, then next build
npm run lint       # eslint
npm run test       # vitest (unit)
npm run e2e        # playwright
```
Data regenerates automatically via `prebuild` before every build.

## 7. Definition of Done (per task)
Compiles under `strict`; inputs Zod-validated; no TIN logged; tests for the unit pass; guardrails (§3) intact; box ticked in `TASKS.md`; one-sentence entry added to the log below.

---

## 8. Technical Summary Log
*One sentence per completed task. Newest at the bottom.*

- Analyzed the source NBR PDF (`AUDIT_SELECTION_V3`): ~5,014 individual records, AY 2023-2024, 0 duplicate TINs, ~25 zones / ~580 zone-circle pairs.
- Authored the PRD and the `PLANNING.md` / `TASKS.md` / `CLAUDE.md` three-file scaffold defining a no-DB, Edge-served, privacy-first, bilingual lookup on Vercel.
- Phase 0: scaffolded the Next.js 15 + TS strict app with Tailwind v4 `@theme` tokens, four Google fonts, next-intl bn/en, `.env.example`, `vercel.json` (CSP/headers/sin1), ESLint/Prettier/Husky, and the root `[locale]` layout.
- M0: built `types.ts` + Zod `validation.ts`, a deterministic synthetic sample generator, and `ingest.ts` (parse → normalize zones/types/circles → validate+reject → dedupe → emit TIN-keyed JSON + meta + stats) with a build-failing CI gate.
- M1: implemented O(1) `data.ts`, KV/in-memory `ratelimit.ts`, POST `/api/lookup` (no-store, never logs TIN) + `/api/health`, the 12-cell segmented TIN input, result stamp, home terminal with scan-sweep motion, and full a11y/responsive bilingual flow.
- M2: added cached `/api/stats`, Recharts statistics page (counts only), about/FAQ/privacy pages, language toggle, persistent footer disclaimer, and static SEO (`robots.txt` + `sitemap.xml`).
- M3: built Auth.js v5 allowlist + password gate, gated `/admin` console with filter/sort/paginate search, CSV/XLSX export (default-masked, audited opt-in unmask), and a 90-day KV audit log.
- M4: wired Vercel Analytics + Speed Insights, 39 Vitest unit tests + 13 Playwright e2e tests (all green), region pin `sin1`, and documented KV/WAF hardening for deploy.
<!-- Add new entries below this line, one sentence each, as tasks are completed. -->
